"""
Loanwise AI — FastAPI backend.
Implements the API spec from docs/api-spec.md.
Data is persisted in SQLite (loanwise.db) via database.py.
"""
import uuid
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import database as db
from pipeline import run_pipeline
from data import AGENT_DECISIONS, PRODUCT_RECOMMENDATIONS, RECOMMENDATIONS_CATALOG

app = FastAPI(title="Loanwise AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise DB (creates tables + seeds mock data if empty)
db.init_db()

MANAGER_SECRET = os.getenv("MANAGER_SECRET", "loanwise-manager-2026")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CreateLoanRequest(BaseModel):
    applicantName: str
    applicantEmail: str
    userId: str
    income: float
    creditScore: int
    loanAmount: float
    employmentType: str
    loanPurpose: str
    debtToIncomeRatio: float = 0.35


class LoanPredictRequest(BaseModel):
    income: float
    creditScore: int
    loanAmount: float
    employmentType: str
    loanPurpose: Optional[str] = None
    debtToIncomeRatio: Optional[float] = None


class LoanEmailRequest(BaseModel):
    loanId: str
    decision: str
    applicantName: str
    loanAmount: float


class LoanRecommendationRequest(BaseModel):
    loanId: str
    applicantIncome: float
    creditScore: int
    rejectionReason: Optional[str] = None


class BiasCheckRequest(BaseModel):
    email: str
    loanId: str


class UserSetupRequest(BaseModel):
    userId: str
    role: str  # "customer" | "manager"
    managerSecret: Optional[str] = None


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


# ─── User Setup ───────────────────────────────────────────────────────────────

@app.post("/user/setup")
def user_setup(req: UserSetupRequest):
    """
    Assign a role to a user. Role is stored in local SQLite (no Clerk Admin API needed).
    Managers must provide the correct managerSecret.
    """
    if req.role == "manager":
        if req.managerSecret != MANAGER_SECRET:
            raise HTTPException(status_code=403, detail="Invalid manager secret")
    db.upsert_user_role(req.userId, "", req.role)
    return {"userId": req.userId, "role": req.role, "success": True}


@app.get("/user/role")
def get_user_role(userId: str):
    """Return the stored role for a given Clerk userId."""
    role = db.get_user_role(userId)
    return {"userId": userId, "role": role}


@app.get("/user/setup-manager")
def setup_manager_via_url(userId: str, secret: str):
    """Convenience endpoint for local dev: grant manager role via GET."""
    if secret != MANAGER_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    db.upsert_user_role(userId, "", "manager")
    return {"userId": userId, "role": "manager", "success": True,
            "message": "Manager role granted. Refresh the app to apply."}


# ─── Loans ────────────────────────────────────────────────────────────────────

@app.post("/loans")
def create_loan(req: CreateLoanRequest):
    """
    Customer submits a loan application.
    Saves it with status='queued' and decision='pending'.
    The AI pipeline is NOT run here — the manager triggers it via POST /loans/{id}/process.
    """
    loan_id = f"LN-{uuid.uuid4().hex[:6].upper()}"
    application_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    loan = {
        "id": loan_id,
        "userId": req.userId,
        "applicantName": req.applicantName,
        "applicantEmail": req.applicantEmail,
        "income": req.income,
        "creditScore": req.creditScore,
        "loanAmount": req.loanAmount,
        "employmentType": req.employmentType,
        "loanPurpose": req.loanPurpose,
        "debtToIncomeRatio": req.debtToIncomeRatio,
        "applicationDate": application_date,
        "riskScore": 0.0,
        "decision": "pending",
        "status": "queued",
        "generatedEmail": None,
        "biasScore": 0.0,
        "toxicityScore": 0.0,
        "approvalProbability": 0.0,
        "confidence": 0.0,
        "recommendations": [],
    }

    db.insert_loan(loan)
    return loan


@app.post("/loans/{loan_id}/process")
def process_loan(loan_id: str):
    """
    Manager triggers the AI pipeline for a queued loan.
    Runs RiskAssessor → EmailGenerator → BiasDetector → ProductRecommender
    and persists the results, setting status='completed'.
    """
    loan = db.get_loan_by_id(loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan["status"] == "completed":
        return loan  # already processed, return as-is

    pipeline_result = run_pipeline(
        loan_id=loan_id,
        income=loan["income"],
        credit_score=loan["creditScore"],
        loan_amount=loan["loanAmount"],
        dti=loan["debtToIncomeRatio"],
        employment_type=loan["employmentType"],
        loan_purpose=loan["loanPurpose"],
        applicant_name=loan["applicantName"],
    )

    import json
    updates = {
        "riskScore": pipeline_result["riskScore"],
        "approvalProbability": pipeline_result["approvalProbability"],
        "decision": pipeline_result["decision"],
        "confidence": pipeline_result["confidence"],
        "generatedEmail": pipeline_result["generatedEmail"],
        "biasScore": pipeline_result["biasScore"],
        "toxicityScore": pipeline_result["toxicityScore"],
        "recommendations": json.dumps(pipeline_result["recommendations"]),
        "factors": json.dumps(pipeline_result.get("factors", [])),
        "status": "completed",
    }

    updated = db.update_loan(loan_id, updates)
    return updated


@app.get("/loans")
def list_loans(
    page: int = 1,
    limit: int = 100,
    search: Optional[str] = None,
    decision: Optional[str] = None,
    userId: Optional[str] = None,
):
    items, total = db.query_loans(
        page=page, limit=limit, search=search,
        decision=decision, user_id=userId,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@app.get("/loans/{loan_id}")
def get_loan(loan_id: str):
    loan = db.get_loan_by_id(loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


# ─── Standalone AI endpoints (used by manager dashboard detail view) ──────────

@app.post("/loan/predict")
def predict_loan(req: LoanPredictRequest):
    from pipeline import predict_risk
    dti = req.debtToIncomeRatio or 0.35
    risk, prob, decision, conf = predict_risk(
        req.income, req.creditScore, req.loanAmount,
        dti, req.employmentType,
    )
    return {
        "riskScore": risk,
        "approvalProbability": prob,
        "decision": decision,
        "confidence": conf,
    }


@app.post("/loan/email")
def generate_email(req: LoanEmailRequest):
    from pipeline import generate_email_text, check_bias_heuristic
    email = generate_email_text(req.applicantName, req.loanId, req.decision, req.loanAmount)
    bias, toxicity, _ = check_bias_heuristic(email)
    return {"email": email, "biasScore": bias, "toxicityScore": toxicity}


@app.post("/loan/bias-check")
def check_bias(req: BiasCheckRequest):
    from pipeline import check_bias_heuristic
    bias, toxicity, passed = check_bias_heuristic(req.email)
    return {
        "biasScore": bias,
        "toxicityScore": toxicity,
        "passed": passed,
        "details": "No issues detected." if passed else "Potentially biased language detected.",
    }


@app.post("/loan/recommendation")
def get_recommendations(req: LoanRecommendationRequest):
    from pipeline import get_product_recommendations
    recs = get_product_recommendations(req.applicantIncome, req.creditScore)
    return {"recommendations": recs}


# ─── Analytics ────────────────────────────────────────────────────────────────

@app.get("/analytics")
def get_analytics_bundle():
    return {
        "stats": db.compute_dashboard_stats(),
        "approvalTrend": db.compute_approval_trend(),
        "riskDistribution": db.compute_risk_distribution(),
        "agentDecisions": AGENT_DECISIONS,
        "rejectionReasons": db.compute_rejection_reasons(),
        "productRecommendations": PRODUCT_RECOMMENDATIONS,
    }


@app.get("/analytics/stats")
def get_dashboard_stats():
    return db.compute_dashboard_stats()


@app.get("/analytics/approval-rate")
def get_approval_trend():
    return db.compute_approval_trend()


@app.get("/analytics/risk-distribution")
def get_risk_distribution():
    return db.compute_risk_distribution()


@app.get("/analytics/agent-decisions")
def get_agent_decisions():
    return AGENT_DECISIONS


@app.get("/analytics/rejection-reasons")
def get_rejection_reasons():
    return db.compute_rejection_reasons()


@app.get("/analytics/product-recommendations")
def get_product_recommendation_stats():
    return PRODUCT_RECOMMENDATIONS


# ─── Agents ───────────────────────────────────────────────────────────────────

@app.get("/agents/logs")
def get_agent_logs():
    return db.get_all_agent_logs()


# ─── Recommendations catalog ──────────────────────────────────────────────────

@app.get("/recommendations")
def get_recommendations_catalog():
    return RECOMMENDATIONS_CATALOG


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
