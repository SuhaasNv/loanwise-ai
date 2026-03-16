"""
Loanwise AI — FastAPI backend.
Implements the API spec from docs/api-spec.md.
Data is persisted in SQLite (loanwise.db) via database.py.
"""
import csv
import io
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Optional

import jwt as pyjwt
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

import database as db
from pipeline import run_pipeline
from data import AGENT_DECISIONS, PRODUCT_RECOMMENDATIONS, RECOMMENDATIONS_CATALOG

# ─── Rate limiter ──────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
app = FastAPI(title="Loanwise AI API", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────

_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
_origins = (
    [o.strip() for o in _allowed_origins_env.split(",") if o.strip()]
    if _allowed_origins_env
    else ["http://localhost:8080", "http://localhost:5173"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Init ─────────────────────────────────────────────────────────────────────

db.init_db()

MANAGER_SECRET = os.getenv("MANAGER_SECRET", "loanwise-manager-2026")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")

# Clerk JWKS URL for JWT verification.
# Set to: https://<your-frontend-api>.clerk.accounts.dev/.well-known/jwks.json
# When unset, the backend runs in dev mode and trusts X-User-Id / X-User-Role headers.
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")

_jwks_client: Optional[pyjwt.PyJWKClient] = None


def _get_jwks_client() -> Optional[pyjwt.PyJWKClient]:
    global _jwks_client
    if not CLERK_JWKS_URL:
        return None
    if _jwks_client is None:
        _jwks_client = pyjwt.PyJWKClient(CLERK_JWKS_URL, cache_jwk_set=True, lifespan=300)
    return _jwks_client


@app.on_event("startup")
async def startup_checks() -> None:
    if MANAGER_SECRET == "loanwise-manager-2026":
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env == "production":
            print(
                "[ERROR] MANAGER_SECRET is using the default value in production. "
                "Set a strong secret via the MANAGER_SECRET environment variable.",
                file=sys.stderr,
            )
            sys.exit(1)
        else:
            print(
                "[WARNING] MANAGER_SECRET is using the default value. "
                "Set MANAGER_SECRET before deploying to production."
            )
    if not CLERK_JWKS_URL:
        print(
            "[WARNING] CLERK_JWKS_URL is not set. JWT verification is disabled. "
            "The API trusts client-provided X-User-Id and X-User-Role headers. "
            "Set CLERK_JWKS_URL in production."
        )


# ─── Auth dependency ──────────────────────────────────────────────────────────

def get_verified_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    """
    Verify Clerk JWT when CLERK_JWKS_URL is configured.
    Returns the verified user_id (sub claim) on success.
    Returns None when CLERK_JWKS_URL is not set (dev mode — no JWT verification).
    Raises 401 when CLERK_JWKS_URL is set but the token is missing or invalid.
    """
    client = _get_jwks_client()
    if not client:
        return None  # dev mode: JWT verification disabled

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization[7:]
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        payload = pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload.get("sub")
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")


def get_user_id(
    verified_id: Optional[str] = Depends(get_verified_user_id),
    x_user_id: Optional[str] = Header(default=None),
) -> Optional[str]:
    """Return verified user ID from JWT (production) or X-User-Id header (dev mode)."""
    return verified_id or x_user_id


def get_user_role(
    verified_id: Optional[str] = Depends(get_verified_user_id),
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None),
) -> str:
    """
    When JWT is verified, derive role from DB (never trust client header).
    In dev mode, fall back to X-User-Role header.
    """
    user_id = verified_id or x_user_id
    if verified_id and user_id:
        return db.get_user_role(user_id)
    return x_user_role or "customer"


def require_manager(
    verified_id: Optional[str] = Depends(get_verified_user_id),
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None),
) -> str:
    """
    Require manager role.
    When JWT is verified: always checks DB — never trusts X-User-Role header.
    In dev mode: accepts X-User-Role: manager header or falls back to DB lookup.
    """
    user_id = verified_id or x_user_id

    if verified_id:
        # Production path: JWT was verified — derive role from DB only
        role = db.get_user_role(verified_id)
        if role == "manager":
            return "manager"
        raise HTTPException(status_code=403, detail="Manager access required")

    # Dev mode path: JWT verification is disabled — trust headers
    if x_user_role == "manager":
        return "manager"
    if user_id:
        role = db.get_user_role(user_id)
        if role == "manager":
            return "manager"

    raise HTTPException(status_code=403, detail="Manager access required")


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


class PatchLoanRequest(BaseModel):
    status: Optional[str] = None
    managerNotes: Optional[str] = None


class SubmitDecisionRequest(BaseModel):
    decision: str  # "approved" | "denied"


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


class SettingsUpdateRequest(BaseModel):
    settings: dict


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ─── User Setup ───────────────────────────────────────────────────────────────

@app.post("/user/setup")
def user_setup(req: UserSetupRequest):
    """
    Assign a role to a user. Role is stored in local SQLite.
    Managers must provide the correct managerSecret.
    """
    if req.role == "manager":
        if req.managerSecret != MANAGER_SECRET:
            raise HTTPException(status_code=403, detail="Invalid manager secret")
    db.upsert_user_role(req.userId, "", req.role)
    return {"userId": req.userId, "role": req.role, "success": True}


@app.get("/user/role")
def get_user_role_endpoint(userId: str):
    """Return the stored role for a given Clerk userId."""
    role = db.get_user_role(userId)
    return {"userId": userId, "role": role}


@app.get("/user/setup-manager")
def setup_manager_via_url(userId: str, secret: str):
    """Dev-only: grant manager role via GET."""
    if secret != MANAGER_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    db.upsert_user_role(userId, "", "manager")
    return {"userId": userId, "role": "manager", "success": True,
            "message": "Manager role granted. Refresh the app to apply."}


# ─── Settings ─────────────────────────────────────────────────────────────────

@app.get("/settings")
def get_settings(_role: str = Depends(require_manager)):
    return db.get_settings()


@app.put("/settings")
def update_settings(req: SettingsUpdateRequest, _role: str = Depends(require_manager)):
    return db.save_settings(req.settings)


# ─── Notifications ────────────────────────────────────────────────────────────

@app.get("/notifications")
def get_notifications(_role: str = Depends(require_manager)):
    """Return recent activity for the manager notification center."""
    logs = db.get_all_agent_logs()
    recent_loans_raw, _ = db.query_loans(page=1, limit=5)
    notifications = []
    # New applications queued
    for loan in recent_loans_raw:
        if loan["status"] == "queued":
            notifications.append({
                "id": f"notif-{loan['id']}",
                "type": "new_application",
                "title": "New Application",
                "body": f"{loan['applicantName']} applied for ${loan['loanAmount']:,.0f}",
                "timestamp": loan["applicationDate"],
                "loanId": loan["id"],
            })
    # Recently completed
    for loan in recent_loans_raw:
        if loan["status"] == "completed":
            notifications.append({
                "id": f"notif-done-{loan['id']}",
                "type": "decision_made",
                "title": f"Loan {loan['decision'].title()}",
                "body": f"{loan['applicantName']}'s application was {loan['decision']}",
                "timestamp": loan["applicationDate"],
                "loanId": loan["id"],
            })
    return notifications[:10]


# ─── Loans ────────────────────────────────────────────────────────────────────

@app.post("/loans")
@limiter.limit("20/minute")
def create_loan(req: CreateLoanRequest, request: Request):
    """
    Customer submits a loan application.
    Saves with status='queued' and decision='pending'.
    The AI pipeline is triggered by the manager via POST /loans/{id}/process.
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
        "managerNotes": "",
    }

    db.insert_loan(loan)
    db.insert_audit_log(loan_id, req.userId, "submitted", f"Application submitted for ${req.loanAmount:,.0f}")
    return loan


@app.patch("/loans/{loan_id}")
def patch_loan(
    loan_id: str,
    req: PatchLoanRequest,
    user_id: Optional[str] = Depends(get_user_id),
    role: str = Depends(get_user_role),
):
    """
    Partial update: withdrawal (customers) or manager notes (managers).
    """
    loan = db.get_loan_by_id(loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    updates = {}
    if req.status == "withdrawn":
        # Customers can only withdraw their own queued loans
        if role != "manager" and loan.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Not your application")
        if loan["status"] == "completed":
            raise HTTPException(status_code=400, detail="Cannot withdraw a completed application")
        updates["status"] = "withdrawn"
        updates["withdrawnAt"] = datetime.now(timezone.utc).isoformat()
        db.insert_audit_log(loan_id, user_id or "", "withdrawn", "Application withdrawn by user")

    if req.managerNotes is not None:
        if role != "manager":
            raise HTTPException(status_code=403, detail="Manager access required")
        updates["managerNotes"] = req.managerNotes
        db.insert_audit_log(loan_id, user_id or "", "notes_updated", "Manager notes updated")

    if not updates:
        return loan

    return db.update_loan(loan_id, updates)


def _run_pipeline_bg(loan_id: str, loan: dict, user_id: str) -> None:
    """Background task: runs AI pipeline and persists results.
    After analysis, status becomes 'pending_review' — manager must approve or deny.
    """
    try:
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
        ai_rec = pipeline_result["decision"]
        updates = {
            "riskScore": pipeline_result["riskScore"],
            "approvalProbability": pipeline_result["approvalProbability"],
            "aiRecommendation": ai_rec,
            "decision": "pending",
            "confidence": pipeline_result["confidence"],
            "generatedEmail": pipeline_result["generatedEmail"],
            "biasScore": pipeline_result["biasScore"],
            "toxicityScore": pipeline_result["toxicityScore"],
            "recommendations": json.dumps(pipeline_result["recommendations"]),
            "factors": json.dumps(pipeline_result.get("factors", [])),
            "status": "pending_review",
        }
        db.update_loan(loan_id, updates)
        db.insert_audit_log(
            loan_id, user_id, "processed",
            f"AI analysis complete: recommends {ai_rec} (risk={pipeline_result['riskScore']:.2f}). Awaiting manager decision."
        )
    except Exception as e:
        print(f"[bg_pipeline] Error processing {loan_id}: {e}")
        db.update_loan(loan_id, {"status": "error"})


@app.post("/loans/{loan_id}/process")
def process_loan(
    loan_id: str,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Depends(get_user_id),
    _role: str = Depends(require_manager),
):
    """
    Manager triggers the AI pipeline for a queued loan.
    Returns immediately with status='processing'; pipeline runs in background.
    Frontend polls /loans/{id} for completion.
    """
    loan = db.get_loan_by_id(loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan["status"] == "completed":
        return loan
    if loan["status"] == "pending_review":
        return loan  # Already analysed; manager must use POST /loans/{id}/decision
    if loan["status"] == "withdrawn":
        raise HTTPException(status_code=400, detail="Cannot process a withdrawn application")

    # Mark as processing immediately
    db.update_loan(loan_id, {"status": "processing"})
    db.insert_audit_log(loan_id, user_id or "", "processing_started", "Manager started AI pipeline")

    # Run pipeline in background — returns 202 immediately
    background_tasks.add_task(_run_pipeline_bg, loan_id, loan, user_id or "")

    loan_in_progress = db.get_loan_by_id(loan_id)
    return loan_in_progress


@app.post("/loans/{loan_id}/decision")
def submit_decision(
    loan_id: str,
    req: SubmitDecisionRequest,
    user_id: Optional[str] = Depends(get_user_id),
    _role: str = Depends(require_manager),
):
    """
    Manager approves or denies a loan after reviewing AI analysis.
    Only available when status is 'pending_review'.
    """
    decision = req.decision.lower()
    if decision not in ("approved", "denied"):
        raise HTTPException(status_code=400, detail="decision must be 'approved' or 'denied'")

    loan = db.get_loan_by_id(loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan["status"] != "pending_review":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit decision: loan status is '{loan['status']}', expected 'pending_review'",
        )

    updates = {"decision": decision, "status": "completed"}
    ai_rec = loan.get("aiRecommendation", "").lower()

    # Regenerate email if manager's decision differs from AI recommendation
    if ai_rec and decision != ai_rec:
        from pipeline import generate_email_text
        new_email = generate_email_text(
            loan["applicantName"], loan_id, decision, loan["loanAmount"]
        )
        updates["generatedEmail"] = new_email

    db.update_loan(loan_id, updates)
    db.insert_audit_log(
        loan_id, user_id or "", "decision_submitted",
        f"Manager {'approved' if decision == 'approved' else 'denied'} "
        f"(AI recommended {ai_rec or 'N/A'})"
    )
    return db.get_loan_by_id(loan_id)


@app.get("/loans/export")
def export_loans(
    search: Optional[str] = None,
    decision: Optional[str] = None,
    format: str = Query(default="csv"),
    _role: str = Depends(require_manager),
):
    """Export all loans to CSV."""
    items, _ = db.query_loans(page=1, limit=10000, search=search, decision=decision)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "applicantName", "applicantEmail", "income", "creditScore",
        "loanAmount", "loanPurpose", "employmentType", "debtToIncomeRatio",
        "applicationDate", "decision", "status", "riskScore",
        "approvalProbability", "confidence", "biasScore", "toxicityScore",
    ])
    writer.writeheader()
    for loan in items:
        writer.writerow({k: loan.get(k, "") for k in writer.fieldnames})
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=loanwise-export.csv"},
    )


@app.get("/loans")
def list_loans(
    page: int = 1,
    limit: int = Query(default=20, le=500),
    search: Optional[str] = None,
    decision: Optional[str] = None,
    userId: Optional[str] = None,
):
    items, total = db.query_loans(
        page=page, limit=limit, search=search,
        decision=decision, user_id=userId,
    )
    return {"items": items, "total": total, "page": page, "limit": limit}


@app.get("/loans/{loan_id}/audit")
def get_loan_audit(loan_id: str, _role: str = Depends(require_manager)):
    """Return audit trail for a specific loan."""
    return db.get_audit_logs(loan_id)


@app.get("/loans/{loan_id}")
def get_loan(loan_id: str):
    loan = db.get_loan_by_id(loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


# ─── Standalone AI endpoints ──────────────────────────────────────────────────

@app.post("/loan/predict")
@limiter.limit("30/minute")
def predict_loan(req: LoanPredictRequest, request: Request):
    from pipeline import predict_risk
    dti = req.debtToIncomeRatio or 0.35
    risk, prob, decision, conf = predict_risk(
        req.income, req.creditScore, req.loanAmount,
        dti, req.employmentType,
    )
    return {"riskScore": risk, "approvalProbability": prob, "decision": decision, "confidence": conf}


@app.post("/loan/email")
def generate_email_endpoint(req: LoanEmailRequest):
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
def get_recommendations_endpoint(req: LoanRecommendationRequest):
    from pipeline import get_product_recommendations
    recs = get_product_recommendations(req.applicantIncome, req.creditScore)
    return {"recommendations": recs}


# ─── Analytics ────────────────────────────────────────────────────────────────

@app.get("/analytics")
def get_analytics_bundle(_role: str = Depends(require_manager)):
    rec_analytics = db.compute_recommendation_analytics()
    return {
        "stats": db.compute_dashboard_stats(),
        "approvalTrend": db.compute_approval_trend(),
        "riskDistribution": db.compute_risk_distribution(),
        "agentDecisions": AGENT_DECISIONS,
        "rejectionReasons": db.compute_rejection_reasons(),
        "productRecommendations": PRODUCT_RECOMMENDATIONS,
        "recommendationAnalytics": rec_analytics,
    }


@app.get("/analytics/stats")
def get_dashboard_stats(_role: str = Depends(require_manager)):
    return db.compute_dashboard_stats()


@app.get("/analytics/approval-rate")
def get_approval_trend(_role: str = Depends(require_manager)):
    return db.compute_approval_trend()


@app.get("/analytics/risk-distribution")
def get_risk_distribution(_role: str = Depends(require_manager)):
    return db.compute_risk_distribution()


@app.get("/analytics/agent-decisions")
def get_agent_decisions(_role: str = Depends(require_manager)):
    return AGENT_DECISIONS


@app.get("/analytics/rejection-reasons")
def get_rejection_reasons(_role: str = Depends(require_manager)):
    return db.compute_rejection_reasons()


@app.get("/analytics/product-recommendations")
def get_product_recommendation_stats(_role: str = Depends(require_manager)):
    return PRODUCT_RECOMMENDATIONS


@app.get("/analytics/recommendation-metrics")
def get_recommendation_metrics(_role: str = Depends(require_manager)):
    return db.compute_recommendation_analytics()


# ─── Agents ───────────────────────────────────────────────────────────────────

@app.get("/agents/logs")
def get_agent_logs(_role: str = Depends(require_manager)):
    return db.get_all_agent_logs()


# ─── Recommendations catalog ──────────────────────────────────────────────────

@app.get("/recommendations")
def get_recommendations_catalog():
    return RECOMMENDATIONS_CATALOG


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
