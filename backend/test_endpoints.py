"""
Verify all API endpoints work after security hardening.
Run: cd backend && python test_endpoints.py
"""
import os
import sys

# Load env before importing main
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()
load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Test user IDs (dev mode uses X-User-Id header)
CUSTOMER_ID = "user_test_customer_123"
MANAGER_ID = "user_test_manager_456"
MANAGER_SECRET = os.getenv("MANAGER_SECRET", "loanwise-manager-2026")

# Ensure manager exists for tests
import database as db
db.upsert_user_role(MANAGER_ID, "", "manager")
db.upsert_user_role(CUSTOMER_ID, "", "customer")

# Get a real loan ID for path-based tests
items, _ = db.query_loans(1, 1)
LOAN_ID = items[0]["id"] if items else "LN-DEMO01"

def ok(status: int) -> bool:
    return 200 <= status < 300

def run_tests():
    results = []
    
    # ─── Public (no auth) ─────────────────────────────────────────────────
    r = client.get("/health")
    results.append(("GET /health", r.status_code, ok(r.status_code)))
    
    r = client.get("/user/role", params={"userId": CUSTOMER_ID}, headers={"X-User-Id": CUSTOMER_ID})
    results.append(("GET /user/role (dev)", r.status_code, ok(r.status_code)))
    
    r = client.get("/user/setup-manager", params={"userId": CUSTOMER_ID, "secret": MANAGER_SECRET})
    results.append(("GET /user/setup-manager", r.status_code, ok(r.status_code)))
    
    r = client.post("/loan/eligibility-check", json={
        "income": 60000, "creditScore": 720, "loanAmount": 50000,
        "employmentType": "Full-time", "debtToIncomeRatio": 0.30, "loanPurpose": "Personal"
    })
    results.append(("POST /loan/eligibility-check", r.status_code, ok(r.status_code)))
    
    r = client.get("/recommendations")
    results.append(("GET /recommendations", r.status_code, ok(r.status_code)))
    
    r = client.post("/contact", json={
        "name": "Test", "email": "test@example.com", "subject": "Test", "message": "Test"
    })
    results.append(("POST /contact", r.status_code, ok(r.status_code)))
    
    # ─── Customer auth (X-User-Id) ────────────────────────────────────────
    h = {"X-User-Id": CUSTOMER_ID, "X-User-Role": "customer"}
    
    r = client.post("/user/setup", json={"userId": CUSTOMER_ID, "role": "customer"}, headers=h)
    results.append(("POST /user/setup", r.status_code, ok(r.status_code)))
    
    r = client.get("/loans", params={"page": 1, "limit": 20}, headers=h)
    results.append(("GET /loans (customer)", r.status_code, ok(r.status_code)))
    
    r = client.get(f"/loans/{LOAN_ID}", headers=h)
    results.append(("GET /loans/:id (customer)", r.status_code, r.status_code in (200, 404)))
    
    r = client.post("/loan/predict", json={
        "income": 60000, "creditScore": 720, "loanAmount": 50000,
        "employmentType": "Full-time", "loanPurpose": "Personal"
    }, headers=h)
    results.append(("POST /loan/predict", r.status_code, ok(r.status_code)))
    
    r = client.post("/loan/email", json={
        "loanId": LOAN_ID, "decision": "approved", "applicantName": "Test", "loanAmount": 50000
    }, headers=h)
    results.append(("POST /loan/email", r.status_code, ok(r.status_code)))
    
    r = client.post("/loan/bias-check", json={"email": "Dear applicant...", "loanId": LOAN_ID}, headers=h)
    results.append(("POST /loan/bias-check", r.status_code, ok(r.status_code)))
    
    r = client.post("/loan/recommendation", json={
        "loanId": LOAN_ID, "applicantIncome": 50000, "creditScore": 600, "rejectionReason": "DTI"
    }, headers=h)
    results.append(("POST /loan/recommendation", r.status_code, ok(r.status_code)))
    
    # ─── Manager auth ─────────────────────────────────────────────────────
    mh = {"X-User-Id": MANAGER_ID, "X-User-Role": "manager"}
    
    r = client.get("/settings", headers=mh)
    results.append(("GET /settings", r.status_code, ok(r.status_code)))
    
    r = client.put("/settings", json={"settings": {"autoProcessLoans": False}}, headers=mh)
    results.append(("PUT /settings", r.status_code, ok(r.status_code)))
    
    r = client.get("/notifications", headers=mh)
    results.append(("GET /notifications", r.status_code, ok(r.status_code)))
    
    r = client.get("/loans", params={"page": 1, "limit": 20}, headers=mh)
    results.append(("GET /loans (manager)", r.status_code, ok(r.status_code)))
    
    r = client.get(f"/loans/{LOAN_ID}", headers=mh)
    results.append(("GET /loans/:id (manager)", r.status_code, ok(r.status_code)))
    
    r = client.get(f"/loans/{LOAN_ID}/audit", headers=mh)
    results.append(("GET /loans/:id/audit", r.status_code, ok(r.status_code)))
    
    r = client.patch(f"/loans/{LOAN_ID}", json={"managerNotes": "E2E test note"}, headers=mh)
    results.append(("PATCH /loans/:id (manager)", r.status_code, ok(r.status_code)))
    
    r = client.post(f"/loans/{LOAN_ID}/process", headers=mh)
    results.append(("POST /loans/:id/process", r.status_code, r.status_code in (200, 400)))
    
    r = client.get("/loans/export", headers=mh)
    results.append(("GET /loans/export", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics", headers=mh)
    results.append(("GET /analytics", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics/stats", headers=mh)
    results.append(("GET /analytics/stats", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics/approval-rate", headers=mh)
    results.append(("GET /analytics/approval-rate", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics/risk-distribution", headers=mh)
    results.append(("GET /analytics/risk-distribution", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics/agent-decisions", headers=mh)
    results.append(("GET /analytics/agent-decisions", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics/rejection-reasons", headers=mh)
    results.append(("GET /analytics/rejection-reasons", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics/product-recommendations", headers=mh)
    results.append(("GET /analytics/product-recommendations", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics/recommendation-metrics", headers=mh)
    results.append(("GET /analytics/recommendation-metrics", r.status_code, ok(r.status_code)))
    
    r = client.get("/analytics/recommendation-clicks", headers=mh)
    results.append(("GET /analytics/recommendation-clicks", r.status_code, ok(r.status_code)))
    
    r = client.get("/agents/logs", headers=mh)
    results.append(("GET /agents/logs", r.status_code, ok(r.status_code)))
    
    r = client.get("/settings/product-catalog", headers=mh)
    results.append(("GET /settings/product-catalog", r.status_code, ok(r.status_code)))
    
    catalog = db.get_product_catalog()
    r = client.put("/settings/product-catalog", json=catalog[:3], headers=mh)
    results.append(("PUT /settings/product-catalog", r.status_code, ok(r.status_code)))
    
    # ─── POST /loans (create) ────────────────────────────────────────────
    r = client.post("/loans", json={
        "applicantName": "E2E Test", "applicantEmail": "e2e@test.com", "userId": CUSTOMER_ID,
        "income": 70000, "creditScore": 750, "loanAmount": 30000,
        "employmentType": "Full-time", "loanPurpose": "Personal", "debtToIncomeRatio": 0.28
    }, headers=h)
    results.append(("POST /loans", r.status_code, ok(r.status_code)))
    created_loan_id = r.json().get("id") if ok(r.status_code) and r.json() else None
    
    # ─── Documents (need loan owned by customer for customer test) ─────────
    r = client.get(f"/loans/{LOAN_ID}/documents", headers=mh)
    results.append(("GET /loans/:id/documents", r.status_code, ok(r.status_code)))
    
    r = client.post(f"/loans/{LOAN_ID}/documents", json={
        "loanId": LOAN_ID, "docType": "payslip", "filename": "test.pdf"
    }, headers=mh)
    results.append(("POST /loans/:id/documents", r.status_code, ok(r.status_code)))
    
    # ─── Express interest (use loan owned by customer) ────────────────────
    interest_loan_id = created_loan_id or LOAN_ID
    r = client.post("/recommendations/express-interest", json={
        "loanId": interest_loan_id, "productName": "Personal Loan"
    }, headers=h)
    results.append(("POST /recommendations/express-interest", r.status_code, r.status_code in (200, 404)))
    
    # ─── Summary ─────────────────────────────────────────────────────────
    passed = sum(1 for _, _, p in results if p)
    total = len(results)
    
    print("\n" + "=" * 60)
    print("ENDPOINT VERIFICATION (post security hardening)")
    print("=" * 60)
    for name, status, ok_flag in results:
        sym = "[OK]" if ok_flag else "[FAIL]"
        print(f"  {sym} {name}: {status}")
    print("=" * 60)
    print(f"  {passed}/{total} passed")
    print("=" * 60 + "\n")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    try:
        sys.exit(run_tests())
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
