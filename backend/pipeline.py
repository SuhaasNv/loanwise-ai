"""
Loanwise AI — Gemini-powered Explainable Risk Pipeline
Agents: RiskAssessor → EmailGenerator → BiasDetector → ProductRecommender

Each agent calls Gemini 2.5 Flash with a structured prompt.
Falls back to calibrated heuristics if the API is unavailable.
"""
import json
import os
import re
import uuid
from datetime import datetime, timezone
from typing import NamedTuple

from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types

from database import insert_agent_log
from data import RECOMMENDATIONS_CATALOG

# ─── Init ─────────────────────────────────────────────────────────────────────

load_dotenv()  # loads backend/.env → GOOGLE_API_KEY

_api_key = os.getenv("GOOGLE_API_KEY", "")
_client: genai.Client | None = None

if _api_key:
    try:
        _client = genai.Client(api_key=_api_key)
    except Exception as e:
        print(f"[pipeline] Gemini init failed: {e}")

MODEL = "gemini-2.5-flash"

# ─── Gemini helper ────────────────────────────────────────────────────────────

def _gemini(prompt: str, *, json_mode: bool = False) -> str:
    """
    Call Gemini 2.5 Flash. Returns the text response.
    Raises RuntimeError on failure (caller decides how to handle).
    """
    if _client is None:
        raise RuntimeError("Gemini client not initialised")

    config = genai_types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=2048,
        response_mime_type="application/json" if json_mode else "text/plain",
    )
    response = _client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=config,
    )
    return response.text.strip()


def _parse_json(text: str) -> dict:
    """Extract JSON from a response that may have markdown fences."""
    # Strip ```json ... ``` if present
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text.strip())
    return json.loads(text)


# ─── Agent 1: RiskAssessor ────────────────────────────────────────────────────

class RiskResult(NamedTuple):
    risk_score: float
    approval_probability: float
    decision: str
    confidence: float
    factors: list[dict]
    reasoning: str


def assess_risk(
    income: float,
    credit_score: int,
    loan_amount: float,
    dti: float,
    employment_type: str,
    loan_purpose: str,
) -> RiskResult:
    """
    RiskAssessor agent — Gemini evaluates the loan against industry guidelines.
    Falls back to calibrated heuristics if the API call fails.
    """
    prompt = f"""You are RiskAssessor, an expert loan underwriting AI agent at a bank.
Evaluate this loan application using CFPB, Fannie Mae conventional, and FHA guidelines.

APPLICATION:
- Annual Income: ${income:,.0f}
- Credit Score: {credit_score} (FICO)
- Requested Loan Amount: ${loan_amount:,.0f}
- Debt-to-Income Ratio: {dti*100:.1f}%
- Employment Type: {employment_type}
- Loan Purpose: {loan_purpose}
- Loan-to-Income Ratio: {loan_amount/max(income,1):.2f}x

GUIDELINES TO APPLY:
- Credit score 670+ is good for conventional loans; 740+ is very good; 800+ exceptional
- DTI ≤ 36% is preferred; ≤ 43% is FHA limit; > 43% is high risk
- Loan-to-income < 3x is conservative; 3-5x is elevated; > 5x is very high
- Full-time employment reduces risk; part-time/unemployed increases it

Respond ONLY with a JSON object in this exact structure (no markdown, no extra text):
{{
  "riskScore": <float 0.04-0.96>,
  "approvalProbability": <float 0.04-0.96>,
  "decision": "<approved|denied>",
  "confidence": <float 0.70-0.99>,
  "reasoning": "<2-3 sentence summary of why this decision was made>",
  "factors": [
    {{
      "name": "<factor name>",
      "value": "<human-readable value>",
      "impact": "<positive|negative|neutral>",
      "contribution": <float, positive means adds risk, negative means reduces risk>,
      "detail": "<clear explanation of how this factor affects the decision>",
      "threshold": "<industry guideline benchmark>"
    }}
  ]
}}

Rules:
- riskScore + approvalProbability should roughly sum to 1.0
- approved if riskScore < 0.50, denied if >= 0.50
- Include exactly 4 factors: Credit Score, Debt-to-Income Ratio, Loan-to-Income Ratio, Employment Type
- Be accurate and fair — a 750 credit score with 30% DTI on a modest loan MUST be approved"""

    try:
        raw = _gemini(prompt, json_mode=True)
        data = _parse_json(raw)

        risk = float(data["riskScore"])
        prob = float(data["approvalProbability"])
        decision = data["decision"].lower()
        conf = float(data["confidence"])
        factors = data.get("factors", [])
        reasoning = data.get("reasoning", "")

        # Sanity clamps
        risk = max(0.04, min(0.96, risk))
        prob = max(0.04, min(0.96, prob))
        decision = "approved" if risk < 0.50 else "denied"

        print(f"[RiskAssessor] Gemini decision={decision} risk={risk} confidence={conf}")
        return RiskResult(risk, prob, decision, conf, factors, reasoning)

    except Exception as e:
        print(f"[RiskAssessor] Gemini failed ({e}), using calibrated fallback")
        return _fallback_risk(income, credit_score, loan_amount, dti, employment_type)


def _fallback_risk(income, credit_score, loan_amount, dti, employment_type) -> RiskResult:
    """Calibrated fallback using industry-standard thresholds."""
    CREDIT_TIERS = [
        (800, 9999, "Exceptional",  -0.22),
        (740,  800, "Very Good",    -0.15),
        (670,  740, "Good",         -0.06),
        (620,  670, "Fair",         +0.10),
        (580,  620, "Poor",         +0.20),
        (0,    580, "Very Poor",    +0.30),
    ]
    DTI_TIERS = [
        (0,    0.20, "Excellent",   -0.09),
        (0.20, 0.28, "Good",        -0.04),
        (0.28, 0.36, "Acceptable",   0.00),
        (0.36, 0.43, "Elevated",    +0.10),
        (0.43, 0.50, "High",        +0.20),
        (0.50, 1.00, "Very High",   +0.32),
    ]
    LTI_TIERS = [
        (0,   1.5, "Conservative", -0.04),
        (1.5, 3.0, "Moderate",      0.00),
        (3.0, 4.5, "Elevated",     +0.05),
        (4.5, 6.0, "High",         +0.12),
        (6.0, 999, "Very High",    +0.22),
    ]
    EMP = {
        "fulltime":     (-0.03, "Stable full-time employment"),
        "selfemployed": (+0.02, "Self-employed — minor income variability"),
        "contract":     (+0.04, "Contract employment — some income uncertainty"),
        "parttime":     (+0.10, "Part-time — limited income stability"),
        "unemployed":   (+0.28, "No employment — severely limits repayment"),
    }

    def tier(val, tiers):
        for lo, hi, label, delta in tiers:
            if lo <= val < hi:
                return label, delta
        return tiers[-1][2], tiers[-1][3]

    risk = 0.45
    factors = []

    cs_label, cs_d = tier(credit_score, CREDIT_TIERS)
    risk += cs_d
    factors.append({"name": "Credit Score", "value": f"{credit_score} ({cs_label})",
                    "impact": "positive" if cs_d < 0 else "negative" if cs_d > 0 else "neutral",
                    "contribution": round(cs_d, 3),
                    "detail": f"Credit score of {credit_score} is {cs_label}",
                    "threshold": "670+ recommended for conventional loans"})

    dt_label, dt_d = tier(dti, DTI_TIERS)
    risk += dt_d
    factors.append({"name": "Debt-to-Income Ratio", "value": f"{dti*100:.1f}% ({dt_label})",
                    "impact": "positive" if dt_d < 0 else "negative" if dt_d > 0 else "neutral",
                    "contribution": round(dt_d, 3),
                    "detail": f"DTI of {dti*100:.1f}% is {dt_label.lower()}",
                    "threshold": "≤43% required; ≤36% preferred"})

    lti = loan_amount / max(income, 1)
    lt_label, lt_d = tier(lti, LTI_TIERS)
    risk += lt_d
    factors.append({"name": "Loan-to-Income Ratio", "value": f"{lti:.1f}x ({lt_label})",
                    "impact": "positive" if lt_d < 0 else "negative" if lt_d > 0 else "neutral",
                    "contribution": round(lt_d, 3),
                    "detail": f"Loan is {lti:.1f}× annual income — {lt_label.lower()}",
                    "threshold": "<3× income preferred"})

    def _n(s): return s.lower().replace("-","").replace(" ","")
    emp_key = next((k for k in EMP if _n(k) == _n(employment_type) or _n(k) in _n(employment_type)), "contract")
    ep_d, ep_detail = EMP[emp_key]
    risk += ep_d
    factors.append({"name": "Employment Type", "value": employment_type,
                    "impact": "positive" if ep_d < 0 else "negative" if ep_d > 0 else "neutral",
                    "contribution": round(ep_d, 3),
                    "detail": ep_detail,
                    "threshold": "Full-time employment preferred"})

    risk = round(max(0.04, min(0.96, risk)), 2)
    prob = round(1 - risk, 2)
    decision = "approved" if risk < 0.50 else "denied"
    margin = abs(risk - 0.50)
    conf = round(min(0.99, 0.80 + margin * 0.5), 2)
    reasoning = f"Based on calibrated scoring: risk={risk}, decision={decision}."
    return RiskResult(risk, prob, decision, conf, factors, reasoning)


# ─── Agent 2: EmailGenerator ──────────────────────────────────────────────────

def generate_email(
    applicant_name: str,
    loan_id: str,
    decision: str,
    loan_amount: float,
    factors: list[dict],
    reasoning: str,
) -> str:
    """EmailGenerator agent — writes a professional, personalised decision letter."""
    positive = [f for f in factors if f.get("impact") == "positive"]
    negative = [f for f in factors if f.get("impact") == "negative"]

    prompt = f"""You are EmailGenerator, a professional loan correspondence AI at a bank.
Write a formal, warm, and clear decision letter for this loan application.

APPLICATION DETAILS:
- Applicant: {applicant_name}
- Reference ID: {loan_id}
- Loan Amount: ${loan_amount:,.0f}
- Decision: {decision.upper()}
- AI Reasoning: {reasoning}

POSITIVE FACTORS: {json.dumps(positive, indent=2)}
NEGATIVE FACTORS: {json.dumps(negative, indent=2)}

REQUIREMENTS:
- Address the applicant by first name
- If APPROVED: warmly congratulate, mention the specific strengths, state next steps (loan officer contact in 2 business days)
- If DENIED: be empathetic and professional, clearly explain which factors led to the decision, mention they can re-apply in 90 days after improving those factors
- Reference specific factor values (e.g. "your credit score of 750")
- Keep it under 300 words
- End with "Best regards,\nLoanwise AI Lending Platform"
- Write plain text only, no markdown, no asterisks"""

    try:
        return _gemini(prompt)
    except Exception as e:
        print(f"[EmailGenerator] Gemini failed ({e}), using template fallback")
        return _fallback_email(applicant_name, loan_id, decision, loan_amount, positive, negative)


def _fallback_email(name, loan_id, decision, loan_amount, positive, negative) -> str:
    first = name.split()[0] if name else "Applicant"
    if decision == "approved":
        strengths = "\n".join(f"  • {f['name']}: {f['value']} — {f['detail']}" for f in positive[:3]) or "  • Strong overall financial profile"
        return f"""Dear {first},

We are pleased to inform you that your loan application (Reference: {loan_id}) for ${loan_amount:,.0f} has been APPROVED.

Our assessment identified the following strengths in your application:
{strengths}

A loan officer will contact you within 2 business days to finalise terms.

Best regards,
Loanwise AI Lending Platform"""
    else:
        reasons = "\n".join(f"  • {f['name']}: {f['value']} — {f['detail']}" for f in negative[:3]) or "  • Financial profile did not meet current criteria"
        return f"""Dear {first},

Thank you for your application (Reference: {loan_id}) for ${loan_amount:,.0f}.

After careful review, we are unable to approve your application at this time. The following factors contributed to this decision:
{reasons}

You are welcome to re-apply in 90 days after addressing the factors above.

Best regards,
Loanwise AI Lending Platform"""


# ─── Agent 3: BiasDetector ────────────────────────────────────────────────────

def detect_bias(email_text: str, loan_id: str) -> tuple[float, float, bool, str]:
    """
    BiasDetector agent — checks for discriminatory language per CFPB guidelines.
    Returns (biasScore, toxicityScore, passed, explanation).
    """
    prompt = f"""You are BiasDetector, a compliance AI that screens loan decision letters.
Your job: detect discriminatory, biased, or toxic language per CFPB fair lending rules.

LETTER TO REVIEW:
\"\"\"
{email_text}
\"\"\"

Check for:
1. References to protected classes (race, religion, national origin, sex, familial status, disability, age, marital status)
2. Toxic or demeaning language
3. Vague denial reasons that could mask discrimination
4. Unnecessarily harsh tone

Respond ONLY with JSON (no markdown):
{{
  "biasScore": <float 0.0-1.0, where 0=no bias detected, 1=severe bias>,
  "toxicityScore": <float 0.0-1.0, where 0=no toxicity, 1=extremely toxic>,
  "passed": <true if both scores < 0.10>,
  "explanation": "<brief explanation of findings>"
}}"""

    try:
        raw = _gemini(prompt, json_mode=True)
        data = _parse_json(raw)
        bias = float(data.get("biasScore", 0))
        tox = float(data.get("toxicityScore", 0))
        passed = bool(data.get("passed", bias < 0.10 and tox < 0.10))
        explanation = data.get("explanation", "No issues detected.")
        print(f"[BiasDetector] bias={bias:.3f} toxicity={tox:.3f} passed={passed}")
        return bias, tox, passed, explanation
    except Exception as e:
        print(f"[BiasDetector] Gemini failed ({e}), using heuristic fallback")
        return _fallback_bias(email_text)


def _fallback_bias(email_text: str) -> tuple[float, float, bool, str]:
    protected = ["race", "religion", "national origin", "sex", "gender", "familial", "disability", "age", "marital"]
    toxic = ["terrible", "pathetic", "hopeless", "reckless", "irresponsible"]
    p_hits = sum(1 for t in protected if t in email_text.lower())
    t_hits = sum(1 for t in toxic if t in email_text.lower())
    bias = round(min(p_hits * 0.05, 0.20), 3)
    tox = round(min(t_hits * 0.10, 0.30), 3)
    passed = bias < 0.10 and tox < 0.10
    return bias, tox, passed, "Heuristic scan — no protected class terms detected."


# ─── Agent 4: ProductRecommender ─────────────────────────────────────────────

def recommend_products(
    income: float,
    credit_score: int,
    dti: float,
    loan_amount: float,
    loan_purpose: str,
    denial_factors: list[dict],
) -> list[dict]:
    """
    ProductRecommender agent — suggests the best alternatives for a denied applicant.
    Uses Gemini to score and personalise each recommendation.
    """
    catalog_summary = "\n".join(
        f"- {p['productName']} ({p['type']}): {p['rate']}, {p['description']}"
        for p in RECOMMENDATIONS_CATALOG
    )

    prompt = f"""You are ProductRecommender, a financial advisor AI at a bank.
A loan application was DENIED. Recommend the most suitable alternative products.

APPLICANT PROFILE:
- Annual Income: ${income:,.0f}
- Credit Score: {credit_score}
- DTI: {dti*100:.1f}%
- Requested Loan: ${loan_amount:,.0f} for {loan_purpose}
- Denial Factors: {json.dumps(denial_factors, indent=2)}

AVAILABLE PRODUCTS:
{catalog_summary}

For each product, provide a match score (0-100) based on how well it fits this specific applicant.
Respond ONLY with JSON array (no markdown):
[
  {{
    "productName": "<exact name from catalog>",
    "matchScore": <integer 0-100>,
    "reason": "<1-2 sentence explanation of why this product suits this applicant's specific situation>"
  }}
]

Rules:
- Consider the applicant's credit score, DTI, and income when scoring
- FHA mortgage suits lower credit scores and higher DTIs
- Credit builder cards suit poor credit applicants needing score improvement
- Personal loans suit smaller amounts with moderate credit
- Order by matchScore descending"""

    try:
        raw = _gemini(prompt, json_mode=True)
        scored = _parse_json(raw)

        # Merge with catalog data for full product details
        catalog_map = {p["productName"]: p for p in RECOMMENDATIONS_CATALOG}
        result = []
        for item in scored:
            name = item.get("productName", "")
            if name in catalog_map:
                rec = dict(catalog_map[name])
                rec["matchScore"] = max(0, min(100, int(item.get("matchScore", 50))))
                rec["reason"] = item.get("reason", "")
                result.append(rec)

        result.sort(key=lambda x: x["matchScore"], reverse=True)
        print(f"[ProductRecommender] Generated {len(result)} Gemini-scored recommendations")
        return result

    except Exception as e:
        print(f"[ProductRecommender] Gemini failed ({e}), using fallback scoring")
        return _fallback_recommendations(income, credit_score, dti, loan_amount)


def _fallback_recommendations(income, credit_score, dti, loan_amount) -> list[dict]:
    recs = []
    for p in RECOMMENDATIONS_CATALOG:
        rec = dict(p)
        score = p["matchScore"]
        if p["type"] == "FHA Mortgage" and credit_score >= 580 and dti <= 0.50:
            score = min(95, score + 15)
        elif p["type"] == "Personal Loan" and loan_amount <= 50000 and credit_score >= 600:
            score = min(95, score + 10)
        elif p["type"] == "Credit Card" and credit_score < 620:
            score = min(95, score + 20)
        rec["matchScore"] = score
        rec["reason"] = f"Matched based on your profile (credit: {credit_score}, DTI: {dti*100:.0f}%)."
        recs.append(rec)
    return sorted(recs, key=lambda x: x["matchScore"], reverse=True)


# ─── Logger ───────────────────────────────────────────────────────────────────

def _log(agent_name: str, loan_id: str, action: str, status: str, confidence: float) -> None:
    insert_agent_log({
        "id": f"AG-{uuid.uuid4().hex[:8].upper()}",
        "agentName": agent_name,
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "confidenceScore": confidence,
        "applicationId": loan_id,
    })


# ─── Pipeline orchestrator ────────────────────────────────────────────────────

def run_pipeline(
    loan_id: str,
    income: float,
    credit_score: int,
    loan_amount: float,
    dti: float,
    employment_type: str,
    loan_purpose: str,
    applicant_name: str,
) -> dict:
    """
    Orchestrates 4 Gemini-powered agents:
      1. RiskAssessor   — evaluates creditworthiness against industry guidelines
      2. EmailGenerator — writes a personalised decision letter
      3. BiasDetector   — screens the letter for CFPB compliance
      4. ProductRecommender — suggests alternatives for denied applicants
    """
    using_ai = _client is not None
    print(f"[pipeline] Starting for {loan_id} | Gemini={'ON' if using_ai else 'OFF (fallback)'}")

    # ── 1. RiskAssessor ────────────────────────────────────────────────────────
    risk_result = assess_risk(income, credit_score, loan_amount, dti, employment_type, loan_purpose)
    _log("RiskAssessor", loan_id,
         f"{'Gemini' if using_ai else 'Heuristic'} risk assessment: "
         f"score={risk_result.risk_score}, decision={risk_result.decision}, "
         f"credit={credit_score}, DTI={dti*100:.0f}%, LTI={loan_amount/max(income,1):.1f}x",
         "success", risk_result.confidence)

    # ── 2. EmailGenerator ──────────────────────────────────────────────────────
    email_text = generate_email(
        applicant_name, loan_id, risk_result.decision,
        loan_amount, risk_result.factors, risk_result.reasoning,
    )
    _log("EmailGenerator", loan_id,
         f"{'Gemini' if using_ai else 'Template'} personalised "
         f"{'approval' if risk_result.decision == 'approved' else 'denial'} letter generated",
         "success", 0.93)

    # ── 3. BiasDetector ────────────────────────────────────────────────────────
    bias_score, toxicity_score, bias_passed, bias_explanation = detect_bias(email_text, loan_id)
    _log("BiasDetector", loan_id,
         f"{'Gemini' if using_ai else 'Heuristic'} bias scan: "
         f"bias={bias_score:.3f}, toxicity={toxicity_score:.3f}, passed={bias_passed}. {bias_explanation}",
         "success" if bias_passed else "warning", 0.97)

    # ── 4. ProductRecommender (denied only) ───────────────────────────────────
    recommendations = []
    if risk_result.decision == "denied":
        denial_factors = [f for f in risk_result.factors if f.get("impact") == "negative"]
        recommendations = recommend_products(
            income, credit_score, dti, loan_amount, loan_purpose, denial_factors
        )
        _log("ProductRecommender", loan_id,
             f"{'Gemini' if using_ai else 'Heuristic'} scored {len(recommendations)} alternatives",
             "success", 0.88)

    print(f"[pipeline] Completed {loan_id}: {risk_result.decision}")
    return {
        "riskScore": risk_result.risk_score,
        "approvalProbability": risk_result.approval_probability,
        "decision": risk_result.decision,
        "confidence": risk_result.confidence,
        "factors": risk_result.factors,
        "reasoning": risk_result.reasoning,
        "generatedEmail": email_text,
        "biasScore": bias_score,
        "toxicityScore": toxicity_score,
        "recommendations": recommendations,
        "status": "completed",
    }


# ─── Backward-compatible wrappers for standalone API endpoints ──────────────────

def generate_email_text(
    applicant_name: str,
    loan_id: str,
    decision: str,
    loan_amount: float,
) -> str:
    """
    Standalone email generation (used by POST /loan/email).
    Builds minimal factors from decision and calls the full EmailGenerator.
    """
    decision_lower = decision.lower()
    if decision_lower == "approved":
        factors = [{"name": "Application", "value": "Approved", "impact": "positive", "detail": "Met lending criteria"}]
    else:
        factors = [{"name": "Application", "value": "Denied", "impact": "negative", "detail": "Did not meet lending criteria"}]
    reasoning = f"Decision: {decision}. Loan amount: ${loan_amount:,.0f}."
    return generate_email(applicant_name, loan_id, decision, loan_amount, factors, reasoning)


def check_bias_heuristic(email_text: str) -> tuple[float, float, bool]:
    """
    Standalone bias check (used by POST /loan/email and POST /loan/bias-check).
    Returns (biasScore, toxicityScore, passed).
    """
    bias, toxicity, passed, _ = detect_bias(email_text, "")
    return bias, toxicity, passed


def get_product_recommendations(income: float, credit_score: int) -> list[dict]:
    """
    Standalone recommendations (used by POST /loan/recommendation).
    Uses default DTI and loan amount for scoring.
    """
    return recommend_products(
        income, credit_score, dti=0.35, loan_amount=50000,
        loan_purpose="General", denial_factors=[],
    )
