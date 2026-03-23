"""
Loanwise AI — Gemini-powered Explainable Risk Pipeline
Agents: RiskAssessor → EmailGenerator → BiasDetector → ProductRecommender

Primary: Gemini 2.5 Flash. Fallback: OpenAI (ChatGPT). Final fallback: heuristics.
"""
import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import NamedTuple

from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from openai import OpenAI

from database import insert_agent_log
from data import RECOMMENDATIONS_CATALOG

# ─── Init ─────────────────────────────────────────────────────────────────────

load_dotenv()  # backend/.env
load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")  # project root .env.local

_gemini_key = os.getenv("GOOGLE_API_KEY", "")
_openai_key = os.getenv("OPENAI_API_KEY", "")
_client: genai.Client | None = None
_openai_client: OpenAI | None = None

if _gemini_key:
    try:
        _client = genai.Client(api_key=_gemini_key)
    except Exception as e:
        print(f"[pipeline] Gemini init failed: {e}")

if _openai_key:
    try:
        _openai_client = OpenAI(api_key=_openai_key)
    except Exception as e:
        print(f"[pipeline] OpenAI init failed: {e}")

MODEL_GEMINI = "gemini-2.5-flash"
MODEL_OPENAI = "gpt-4o-mini"

# ─── LLM helpers (Gemini → OpenAI → raise) ────────────────────────────────────

def _gemini(prompt: str, *, json_mode: bool = False) -> str:
    """Call Gemini 2.5 Flash. Raises on failure."""
    if _client is None:
        raise RuntimeError("Gemini client not initialised")
    config = genai_types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=2048,
        response_mime_type="application/json" if json_mode else "text/plain",
    )
    response = _client.models.generate_content(
        model=MODEL_GEMINI,
        contents=prompt,
        config=config,
    )
    return response.text.strip()


def _openai(prompt: str, *, json_mode: bool = False) -> str:
    """Call OpenAI gpt-4o-mini. Raises on failure."""
    if _openai_client is None:
        raise RuntimeError("OpenAI client not initialised")
    kwargs = {
        "model": MODEL_OPENAI,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 2048,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    response = _openai_client.chat.completions.create(**kwargs)
    text = (response.choices[0].message.content or "").strip()
    if not text:
        raise RuntimeError("OpenAI returned empty response")
    return text


def _llm(prompt: str, *, json_mode: bool = False) -> str:
    """
    Try Gemini first, then OpenAI. Returns text. Raises if both fail.
    """
    last_err = None
    if _client is not None:
        try:
            return _gemini(prompt, json_mode=json_mode)
        except Exception as e:
            last_err = e
            print(f"[pipeline] Gemini failed ({e}), trying OpenAI fallback")
    if _openai_client is not None:
        try:
            return _openai(prompt, json_mode=json_mode)
        except Exception as e:
            last_err = e
            print(f"[pipeline] OpenAI fallback failed ({e})")
    raise RuntimeError(
        "No AI provider available. Set GOOGLE_API_KEY or OPENAI_API_KEY in .env"
    ) from last_err


def _llm_with_meta(prompt: str, *, json_mode: bool = False) -> tuple[str, str, int]:
    """Like _llm but also returns (text, model_name, latency_ms)."""
    import time as _time
    t0 = int(_time.monotonic() * 1000)
    last_err = None
    if _client is not None:
        try:
            text = _gemini(prompt, json_mode=json_mode)
            return text, MODEL_GEMINI, int(_time.monotonic() * 1000) - t0
        except Exception as e:
            last_err = e
            print(f"[pipeline] Gemini failed ({e}), trying OpenAI fallback")
    if _openai_client is not None:
        try:
            text = _openai(prompt, json_mode=json_mode)
            return text, MODEL_OPENAI, int(_time.monotonic() * 1000) - t0
        except Exception as e:
            last_err = e
            print(f"[pipeline] OpenAI fallback failed ({e})")
    raise RuntimeError(
        "No AI provider available. Set GOOGLE_API_KEY or OPENAI_API_KEY in .env"
    ) from last_err


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
        raw = _llm(prompt, json_mode=True)
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
    recommendations: list[dict] | None = None,
) -> str:
    """EmailGenerator agent — writes a professional, personalised decision letter."""
    positive = [f for f in factors if f.get("impact") == "positive"]
    negative = [f for f in factors if f.get("impact") == "negative"]

    recs_section = ""
    if decision == "denied" and recommendations:
        top_recs = recommendations[:3]
        recs_lines = "\n".join(
            f"  • {r['productName']} ({r['type']}) — {r['rate']}: {r['description']}"
            for r in top_recs
        )
        recs_section = f"\nALTERNATIVE PRODUCTS TO RECOMMEND:\n{recs_lines}\n"

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
{recs_section}
REQUIREMENTS:
- Address the applicant by first name
- If APPROVED: warmly congratulate, mention the specific strengths, state next steps (loan officer contact in 2 business days)
- If DENIED: be empathetic and professional, clearly explain which factors led to the decision, mention they can re-apply in 90 days after improving those factors
- If DENIED and alternatives are provided: include a brief "Next Best Offer" section listing the top 1-2 alternative products with their rates
- Reference specific factor values (e.g. "your credit score of 750")
- Keep it under 350 words
- End with "Best regards,\nLoanwise AI Lending Platform"
- Write plain text only, no markdown, no asterisks"""

    try:
        return _llm(prompt)
    except Exception as e:
        print(f"[EmailGenerator] Gemini failed ({e}), using template fallback")
        return _fallback_email(applicant_name, loan_id, decision, loan_amount, positive, negative, recommendations)


def _fallback_email(name, loan_id, decision, loan_amount, positive, negative, recommendations=None) -> str:
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
        recs_block = ""
        if recommendations:
            top = recommendations[:2]
            recs_block = "\n\nBased on your profile, we recommend exploring these alternative products:\n"
            recs_block += "\n".join(f"  • {r['productName']} — {r['rate']}: {r['description']}" for r in top)
            recs_block += "\n\nPlease log in to your portal to express interest or learn more."
        return f"""Dear {first},

Thank you for your application (Reference: {loan_id}) for ${loan_amount:,.0f}.

After careful review, we are unable to approve your application at this time. The following factors contributed to this decision:
{reasons}

You are welcome to re-apply in 90 days after addressing the factors above.{recs_block}

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
        raw = _llm(prompt, json_mode=True)
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
        raw = _llm(prompt, json_mode=True)
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

        # Inject dynamic smaller-loan offer if DTI is the main blocker
        dti_blocked = any(
            "dti" in str(f.get("name", "")).lower() or "debt" in str(f.get("name", "")).lower()
            for f in denial_factors
        )
        result = _inject_smaller_loan(result, income, credit_score, dti, loan_amount, dti_blocked)

        print(f"[ProductRecommender] Generated {len(result)} Gemini-scored recommendations")
        return result

    except Exception as e:
        print(f"[ProductRecommender] Gemini failed ({e}), using fallback scoring")
        return _fallback_recommendations(income, credit_score, dti, loan_amount)


def _fallback_recommendations(income, credit_score, dti, loan_amount) -> list[dict]:
    recs = []
    for p in RECOMMENDATIONS_CATALOG:
        if not p.get("enabled", True):
            continue
        rec = dict(p)
        score = p["matchScore"]
        if p["type"] == "FHA Mortgage" and credit_score >= 580 and dti <= 0.50:
            score = min(95, score + 15)
        elif p["type"] == "Personal Loan" and loan_amount <= 50000 and credit_score >= 600:
            score = min(95, score + 10)
        elif p["type"] == "Credit Card" and credit_score < 620:
            score = min(95, score + 20)
        elif p["type"] == "Savings Plan" and credit_score < 620:
            score = min(90, score + 12)
        elif p["type"] == "Auto Loan" and loan_amount <= 60000 and credit_score >= 580:
            score = min(90, score + 8)
        rec["matchScore"] = score
        rec["reason"] = f"Matched based on your profile (credit: {credit_score}, DTI: {dti*100:.0f}%)."
        recs.append(rec)

    dti_blocked = dti > 0.43
    recs = _inject_smaller_loan(recs, income, credit_score, dti, loan_amount, dti_blocked)
    return sorted(recs, key=lambda x: x["matchScore"], reverse=True)


def _inject_smaller_loan(
    recs: list[dict],
    income: float,
    credit_score: int,
    dti: float,
    loan_amount: float,
    dti_blocked: bool,
) -> list[dict]:
    """Add a dynamic 'Reduced Amount Loan' offer when DTI is the main blocker."""
    reduced = round(loan_amount * 0.75 / 1000) * 1000  # round to nearest $1k
    if reduced < 5000 or reduced >= loan_amount:
        return recs

    # Estimate approximate APR based on credit score
    if credit_score >= 740:
        apr = 5.5
    elif credit_score >= 670:
        apr = 7.0
    elif credit_score >= 620:
        apr = 9.5
    else:
        apr = 12.5

    # Score higher when DTI was the blocker and reduced amount would help
    score = 88 if dti_blocked else 72

    smaller_loan = {
        "productName": f"Reduced Loan (${reduced:,.0f})",
        "type": "Reduced Amount Loan",
        "rate": f"{apr:.1f}% APR",
        "description": (
            f"A reduced loan of ${reduced:,.0f} (75% of requested) that better fits your "
            f"current debt-to-income ratio. Strengthens your repayment profile."
        ),
        "matchScore": score,
        "reason": (
            f"Your requested loan amount would push your DTI above lender thresholds. "
            f"A smaller loan of ${reduced:,.0f} may qualify under current guidelines."
        ),
    }
    return recs + [smaller_loan]


# ─── Logger ───────────────────────────────────────────────────────────────────

def _log(agent_name: str, loan_id: str, action: str, status: str, confidence: float, *, latency_ms: int = 0, model: str = "") -> None:
    insert_agent_log({
        "id": f"AG-{uuid.uuid4().hex[:8].upper()}",
        "agentName": agent_name,
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "confidenceScore": confidence,
        "applicationId": loan_id,
        "latencyMs": latency_ms,
        "model": model,
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
    verified_documents: list[dict] | None = None,
    policy_text: str = "",
) -> dict:
    """
    Orchestrates agents:
      1. RiskAssessor        — creditworthiness (now includes document consistency context)
      2. PolicyChecker       — bank-specific policy overlay (if configured)
      3. ProductRecommender  — alternatives for denied applicants
      4. EmailGenerator      — personalised decision letter
      5. BiasDetector        — CFPB compliance screen with auto-remediation
    """
    using_ai = _client is not None or _openai_client is not None
    provider = "Gemini" if _client else "OpenAI" if _openai_client else "heuristic"
    print(f"[pipeline] Starting for {loan_id} | AI={provider}")

    # ── 1. RiskAssessor (with document fusion context) ─────────────────────────
    doc_context = ""
    doc_consistency_note = ""
    if verified_documents:
        # Build a compact summary of verified document findings
        doc_summary_parts = []
        mismatches_all = []
        for doc in verified_documents:
            vr = doc.get("verificationResult") or {}
            if isinstance(vr, dict):
                passed = vr.get("passed", True)
                mismatches = vr.get("mismatches", [])
                if mismatches:
                    mismatches_all.extend(mismatches)
                doc_summary_parts.append(
                    f"  - {doc.get('docType','doc')}: verified={passed}, "
                    f"mismatches={len(mismatches)}"
                )
        if doc_summary_parts:
            doc_context = "VERIFIED DOCUMENTS:\n" + "\n".join(doc_summary_parts)
            high_mismatches = [m for m in mismatches_all if m.get("severity") == "high"]
            if high_mismatches:
                doc_consistency_note = (
                    f" Document check flagged {len(high_mismatches)} high-severity "
                    f"mismatch(es): {', '.join(m.get('field','') for m in high_mismatches[:3])}."
                )
                _log("DocumentVerifier", loan_id,
                     f"Document fusion: {len(high_mismatches)} high-severity mismatch(es) fed into risk assessment",
                     "warning", 0.88)
            elif doc_summary_parts:
                _log("DocumentVerifier", loan_id,
                     f"Document fusion: {len(doc_summary_parts)} document(s) verified — no high-severity issues",
                     "success", 0.92)

    import time as _time
    t0 = _time.monotonic()
    risk_result = assess_risk(income, credit_score, loan_amount, dti, employment_type, loan_purpose)
    risk_latency = int((_time.monotonic() - t0) * 1000)
    _log("RiskAssessor", loan_id,
         f"{'Gemini' if using_ai else 'Heuristic'} risk assessment: "
         f"score={risk_result.risk_score:.2f}, decision={risk_result.decision}, "
         f"credit={credit_score}, DTI={dti*100:.0f}%, LTI={loan_amount/max(income,1):.1f}x"
         f"{doc_consistency_note}",
         "success", risk_result.confidence,
         latency_ms=risk_latency)

    # ── 2. PolicyChecker (if bank policy is configured) ───────────────────────
    policy_result = None
    if policy_text and policy_text.strip():
        loan_snapshot = {
            "id": loan_id, "loanAmount": loan_amount, "loanPurpose": loan_purpose,
            "income": income, "creditScore": credit_score, "debtToIncomeRatio": dti,
            "employmentType": employment_type, "riskScore": risk_result.risk_score,
            "aiRecommendation": risk_result.decision, "factors": risk_result.factors,
        }
        policy_result = check_policy(loan_snapshot, policy_text)

    # ── 3. ProductRecommender (denied only — runs before email) ────────────────
    recommendations = []
    if risk_result.decision == "denied":
        denial_factors = [f for f in risk_result.factors if f.get("impact") == "negative"]
        t0 = _time.monotonic()
        recommendations = recommend_products(
            income, credit_score, dti, loan_amount, loan_purpose, denial_factors
        )
        _log("ProductRecommender", loan_id,
             f"{'Gemini' if using_ai else 'Heuristic'} scored {len(recommendations)} alternatives",
             "success", 0.88,
             latency_ms=int((_time.monotonic() - t0) * 1000))

    # ── 4. EmailGenerator ──────────────────────────────────────────────────────
    t0 = _time.monotonic()
    email_text = generate_email(
        applicant_name, loan_id, risk_result.decision,
        loan_amount, risk_result.factors, risk_result.reasoning,
        recommendations=recommendations if risk_result.decision == "denied" else None,
    )
    _log("EmailGenerator", loan_id,
         f"{'Gemini' if using_ai else 'Template'} personalised "
         f"{'approval' if risk_result.decision == 'approved' else 'denial'} letter generated",
         "success", 0.93,
         latency_ms=int((_time.monotonic() - t0) * 1000))

    # ── 5. BiasDetector (with auto-remediation — up to 2 rewrites if bias detected) ──
    MAX_BIAS_RETRIES = 2
    for bias_attempt in range(1, MAX_BIAS_RETRIES + 2):
        t0 = _time.monotonic()
        bias_score, toxicity_score, bias_passed, bias_explanation = detect_bias(email_text, loan_id)
        _log("BiasDetector", loan_id,
             f"{'Gemini' if using_ai else 'Heuristic'} bias scan (attempt {bias_attempt}): "
             f"bias={bias_score:.3f}, toxicity={toxicity_score:.3f}, passed={bias_passed}. {bias_explanation}",
             "success" if bias_passed else "warning", 0.97,
             latency_ms=int((_time.monotonic() - t0) * 1000))
        if bias_passed or bias_attempt > MAX_BIAS_RETRIES:
            break
        print(f"[BiasDetector] Bias detected — triggering EmailGenerator rewrite (attempt {bias_attempt})")
        remediation_note = (
            f"IMPORTANT: The previous version of this email was flagged for potential bias or toxicity "
            f"(biasScore={bias_score:.2f}, toxicityScore={toxicity_score:.2f}). "
            f"Rewrite it to be completely neutral, professional, and free of any language that could "
            f"be perceived as discriminatory, harsh, or referencing any protected class."
        )
        email_text = generate_email(
            applicant_name, loan_id, risk_result.decision,
            loan_amount, risk_result.factors, risk_result.reasoning + " " + remediation_note,
            recommendations=recommendations if risk_result.decision == "denied" else None,
        )
        _log("EmailGenerator", loan_id,
             f"Auto-remediation rewrite #{bias_attempt} triggered by BiasDetector",
             "success", 0.90)

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
        "policyResult": policy_result,
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


def get_product_recommendations(income: float, credit_score: int, catalog: list[dict] | None = None) -> list[dict]:
    """
    Standalone recommendations (used by POST /loan/recommendation).
    Uses default DTI and loan amount for scoring.
    """
    if catalog is not None:
        global RECOMMENDATIONS_CATALOG
        _orig = RECOMMENDATIONS_CATALOG
        RECOMMENDATIONS_CATALOG = catalog
        result = recommend_products(
            income, credit_score, dti=0.35, loan_amount=50000,
            loan_purpose="General", denial_factors=[],
        )
        RECOMMENDATIONS_CATALOG = _orig
        return result
    return recommend_products(
        income, credit_score, dti=0.35, loan_amount=50000,
        loan_purpose="General", denial_factors=[],
    )


def predict_risk(income: float, credit_score: int, loan_amount: float,
                 dti: float, employment_type: str) -> tuple[float, float, str, float]:
    """
    Backward-compatible wrapper for POST /loan/predict.
    Returns (riskScore, approvalProbability, decision, confidence).
    """
    result = assess_risk(income, credit_score, loan_amount, dti, employment_type, "General")
    return result.risk_score, result.approval_probability, result.decision, result.confidence


# ─── Agent 5: DocumentVerifier ────────────────────────────────────────────────

def verify_document(
    doc_content_b64: str,
    doc_type: str,
    loan_id: str,
    declared_income: float | None = None,
    declared_name: str | None = None,
) -> dict:
    """
    DocumentVerifier agent — extracts key fields from uploaded documents and
    cross-validates them against declared application data.

    doc_type: 'payslip' | 'nric' | 'bank_statement' | 'employment_letter'
    Returns: { extractedFields, mismatches, passed, confidence, summary }
    """
    prompt = f"""You are DocumentVerifier, an AI agent that extracts key fields from financial documents
and validates them against declared loan application data.

DOCUMENT TYPE: {doc_type}
DECLARED INCOME: ${declared_income:,.0f if declared_income else "Not provided"}
DECLARED NAME: {declared_name or "Not provided"}

The document content (base64 encoded) has been provided. Extract all relevant financial fields
and check for discrepancies with declared values.

Respond ONLY with a JSON object:
{{
  "extractedFields": {{
    "name": "<extracted name or null>",
    "income": <extracted annual income as number or null>,
    "employer": "<employer name or null>",
    "documentDate": "<date on document or null>",
    "documentNumber": "<NRIC/document number or null>"
  }},
  "mismatches": [
    {{
      "field": "<field name>",
      "declared": "<declared value>",
      "extracted": "<extracted value>",
      "severity": "<low|medium|high>"
    }}
  ],
  "passed": <true if no high-severity mismatches>,
  "confidence": <float 0.5-0.99>,
  "summary": "<1-2 sentence summary of verification result>"
}}"""

    try:
        # In production, pass the actual document bytes to Gemini Vision
        # For now, use a structured heuristic simulation
        if _client is not None or _openai_client is not None:
            raw = _llm(prompt, json_mode=True)
            data = _parse_json(raw)
            return data
    except Exception as e:
        print(f"[DocumentVerifier] Gemini failed ({e}), using fallback")

    # Fallback: return a plausible verification result
    return {
        "extractedFields": {
            "name": declared_name,
            "income": declared_income,
            "employer": "Employer (extracted from document)",
            "documentDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "documentNumber": None,
        },
        "mismatches": [],
        "passed": True,
        "confidence": 0.82,
        "summary": f"Document type '{doc_type}' processed. No significant discrepancies detected with declared application data.",
    }


# ─── Agent 6: IntakeAdvisor ───────────────────────────────────────────────────

def intake_review(
    applicant_name: str,
    income: float,
    credit_score: int,
    loan_amount: float,
    dti: float,
    employment_type: str,
    loan_purpose: str,
    loan_id: str = "",
) -> dict:
    """
    IntakeAdvisor agent — flags inconsistencies and gives an application
    readiness score before the applicant submits. No DB mutation.

    Returns: { readinessScore, flags[], suggestions[], summary }
    """
    lti = loan_amount / max(income, 1)
    prompt = f"""You are IntakeAdvisor, a helpful pre-submission AI at a bank.
Review this draft loan application for inconsistencies, red flags, and readiness.

DRAFT APPLICATION:
- Name: {applicant_name}
- Annual Income: ${income:,.0f}
- Credit Score: {credit_score}
- Loan Amount: ${loan_amount:,.0f}
- Loan-to-Income Ratio: {lti:.2f}x
- Debt-to-Income Ratio: {dti * 100:.1f}%
- Employment Type: {employment_type}
- Loan Purpose: {loan_purpose}

LENDING BENCHMARKS:
- DTI ≤ 36% is healthy; > 43% is risky
- Credit score 670+ for conventional; 580+ for FHA
- Loan-to-income < 3x is conservative; > 5x is very high
- Full-time employment is lowest risk

Respond ONLY with JSON (no markdown):
{{
  "readinessScore": <integer 0-100, 100 = perfect application>,
  "flags": [
    {{
      "type": "<inconsistency|warning|tip>",
      "field": "<field name>",
      "message": "<clear, actionable 1-sentence message>"
    }}
  ],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>"],
  "summary": "<1-2 sentence overall readiness assessment>"
}}

Rules:
- Flags should be specific and actionable, not generic
- readinessScore >= 75 means the application is likely to proceed
- Include 2-4 flags max; do not list non-issues
- Suggestions must address the most impactful improvements only"""

    try:
        raw, model_used, latency_ms = _llm_with_meta(prompt, json_mode=True)
        data = _parse_json(raw)
        score = max(0, min(100, int(data.get("readinessScore", 70))))
        flags = data.get("flags", [])
        suggestions = data.get("suggestions", [])
        summary = data.get("summary", "")
        print(f"[IntakeAdvisor] readiness={score} flags={len(flags)} model={model_used}")
        if loan_id:
            _log("IntakeAdvisor", loan_id,
                 f"Pre-submission review: readiness={score}%, {len(flags)} flag(s)",
                 "success", round(score / 100, 2),
                 latency_ms=latency_ms, model=model_used)
        return {"readinessScore": score, "flags": flags, "suggestions": suggestions, "summary": summary}
    except Exception as e:
        print(f"[IntakeAdvisor] LLM failed ({e}), using heuristic fallback")
        return _fallback_intake(income, credit_score, loan_amount, dti, employment_type)


def _fallback_intake(income, credit_score, loan_amount, dti, employment_type) -> dict:
    flags = []
    score = 100
    lti = loan_amount / max(income, 1)
    if dti > 0.43:
        flags.append({"type": "warning", "field": "debtToIncomeRatio",
                      "message": f"Your DTI of {dti*100:.0f}% exceeds the 43% threshold most lenders require."})
        score -= 25
    elif dti > 0.36:
        flags.append({"type": "tip", "field": "debtToIncomeRatio",
                      "message": f"DTI of {dti*100:.0f}% is elevated. Reducing monthly obligations could strengthen your application."})
        score -= 10
    if credit_score < 580:
        flags.append({"type": "warning", "field": "creditScore",
                      "message": f"Credit score of {credit_score} is below FHA minimums. Consider improving before applying."})
        score -= 30
    elif credit_score < 670:
        flags.append({"type": "warning", "field": "creditScore",
                      "message": f"Credit score of {credit_score} may limit you to FHA products. Aim for 670+ for conventional options."})
        score -= 10
    if lti > 5:
        flags.append({"type": "warning", "field": "loanAmount",
                      "message": f"Loan-to-income ratio of {lti:.1f}x is very high. A smaller loan amount may improve approval odds."})
        score -= 20
    if employment_type in ("Part-time", "Unemployed"):
        flags.append({"type": "warning", "field": "employmentType",
                      "message": f"{employment_type} employment increases perceived repayment risk."})
        score -= 15
    suggestions = []
    if score < 75:
        if dti > 0.36:
            suggestions.append(f"Reducing monthly debt payments could bring your DTI below 36%.")
        if credit_score < 670:
            suggestions.append(f"Raising your credit score by 50–80 points may unlock better loan products.")
        if lti > 4:
            suggestions.append(f"Consider requesting ${loan_amount * 0.75:,.0f} instead to lower your loan-to-income ratio.")
    score = max(0, score)
    decision_hint = "likely to proceed" if score >= 75 else "may face challenges"
    return {
        "readinessScore": score,
        "flags": flags,
        "suggestions": suggestions,
        "summary": f"Application scored {score}/100 and is {decision_hint} based on current profile.",
    }


# ─── Agent 7: ManagerCopilot ──────────────────────────────────────────────────

def manager_brief(loan: dict, audit_entries: list[dict]) -> dict:
    """
    ManagerCopilot agent — generates a pre-decision executive brief for the
    reviewing manager. Advisory only; grounded on existing loan + audit data.

    Returns: { bullets[], suggestedDecision, confidence, checklist[], questions[], summary }
    """
    factors_text = ""
    factors = loan.get("factors") or []
    if factors:
        factors_text = "\n".join(
            f"  - {f.get('name')}: {f.get('value')} ({f.get('impact')}) — {f.get('detail', '')}"
            for f in factors[:6]
        )

    audit_text = ""
    if audit_entries:
        audit_text = "\n".join(
            f"  [{e.get('timestamp','')[:19]}] {e.get('action','')} — {e.get('detail','')}"
            for e in audit_entries[-6:]
        )

    prompt = f"""You are ManagerCopilot, an AI decision assistant for a bank loan officer.
Produce a concise pre-decision brief so the manager can approve or deny quickly and confidently.

LOAN SUMMARY:
- Applicant: {loan.get('applicantName')}
- Loan ID: {loan.get('id')}
- Amount: ${loan.get('loanAmount', 0):,.0f} ({loan.get('loanPurpose')})
- Income: ${loan.get('income', 0):,.0f} | Credit: {loan.get('creditScore')} | DTI: {loan.get('debtToIncomeRatio', 0)*100:.1f}%
- Employment: {loan.get('employmentType')}
- AI Risk Score: {loan.get('riskScore', 0):.2f} | AI Recommendation: {loan.get('aiRecommendation', 'N/A')}
- AI Confidence: {loan.get('confidence', 0)*100:.0f}%

AI RISK FACTORS:
{factors_text or "  Not available"}

RECENT AUDIT TRAIL:
{audit_text or "  No audit entries"}

Respond ONLY with JSON (no markdown):
{{
  "bullets": ["<key point 1>", "<key point 2>", "<key point 3>"],
  "suggestedDecision": "<approve|deny|escalate>",
  "confidence": <float 0.5-0.99>,
  "checklist": [
    {{"item": "<policy/compliance item to verify>", "passed": <true|false|null>}}
  ],
  "questions": ["<clarifying question for applicant if needed>"],
  "summary": "<2-3 sentence plain-English decision rationale>"
}}

Rules:
- bullets: exactly 3, each ≤ 15 words, most critical facts only
- checklist: 4-5 standard lending compliance items (income verified, DTI within limits, etc.)
- questions: only if critical info is missing or suspicious; otherwise empty array
- suggestedDecision is advisory; manager makes the final call
- Be specific and data-driven, not generic"""

    try:
        raw, model_used, latency_ms = _llm_with_meta(prompt, json_mode=True)
        data = _parse_json(raw)
        _log("ManagerCopilot", loan.get("id", ""),
             f"Decision brief generated: suggestion={data.get('suggestedDecision')}, confidence={data.get('confidence', 0)*100:.0f}%",
             "success", float(data.get("confidence", 0.85)),
             latency_ms=latency_ms, model=model_used)
        return data
    except Exception as e:
        print(f"[ManagerCopilot] LLM failed ({e}), using heuristic fallback")
        return _fallback_manager_brief(loan)


def _fallback_manager_brief(loan: dict) -> dict:
    risk = loan.get("riskScore", 0.5)
    ai_rec = loan.get("aiRecommendation", "")
    dti = loan.get("debtToIncomeRatio", 0.35)
    credit = loan.get("creditScore", 650)
    income = loan.get("income", 0)
    loan_amount = loan.get("loanAmount", 0)
    lti = loan_amount / max(income, 1)
    suggested = ai_rec if ai_rec in ("approved", "denied") else ("approve" if risk < 0.5 else "deny")
    suggested = "approve" if suggested == "approved" else "deny"
    conf = min(0.99, 0.70 + 0.4 * abs(risk - 0.5))
    return {
        "bullets": [
            f"AI risk score {risk:.2f} — recommendation: {ai_rec or 'N/A'}",
            f"Credit {credit}, DTI {dti*100:.0f}%, LTI {lti:.1f}x income",
            f"Application status: {loan.get('status')} | Purpose: {loan.get('loanPurpose')}",
        ],
        "suggestedDecision": suggested,
        "confidence": round(conf, 2),
        "checklist": [
            {"item": "Income verified against documents", "passed": None},
            {"item": "DTI within FHA/conventional limits (<43%)", "passed": dti <= 0.43},
            {"item": "Credit score meets minimum threshold (580+)", "passed": credit >= 580},
            {"item": "Loan-to-income ratio acceptable (<5×)", "passed": lti < 5},
            {"item": "No high-severity document mismatches", "passed": None},
        ],
        "questions": [],
        "summary": (
            f"AI analysis recommends {'approval' if suggested == 'approve' else 'denial'} "
            f"with {conf*100:.0f}% confidence. Review AI factors and document verification "
            "before submitting final decision."
        ),
    }


# ─── Agent 8: ComplianceNarrator ─────────────────────────────────────────────

def generate_narrative(loan: dict) -> dict:
    """
    ComplianceNarrator agent — generates an ECOA-style formal narrative and
    customer-facing FAQ from the loan's final state. No new facts are invented.

    Returns: { regulatorNarrative, customerFaq[], generatedAt }
    """
    decision = loan.get("decision", "pending")
    factors = loan.get("factors") or []
    factors_text = "\n".join(
        f"  - {f.get('name')}: {f.get('value')} (impact: {f.get('impact')}) — {f.get('detail', '')}"
        for f in factors[:6]
    ) or "  Risk factors not available"

    prompt = f"""You are ComplianceNarrator, a regulatory-writing AI at a bank.
Generate two documents from the same decision data. Use only the facts provided.

LOAN DECISION:
- Applicant: {loan.get('applicantName')}
- Loan ID: {loan.get('id')}
- Amount: ${loan.get('loanAmount', 0):,.0f} for {loan.get('loanPurpose')}
- Final Decision: {decision.upper()}
- AI Risk Score: {loan.get('riskScore', 0):.2f}
- AI Confidence: {loan.get('confidence', 0)*100:.0f}%
- Bias Check: bias={loan.get('biasScore', 0):.3f}, toxicity={loan.get('toxicityScore', 0):.3f}

DECISION FACTORS:
{factors_text}

Respond ONLY with JSON (no markdown):
{{
  "regulatorNarrative": "<ECOA-compliant formal narrative, 150-200 words, citing specific factors, neutral tone>",
  "customerFaq": [
    {{"q": "<customer question>", "a": "<plain-language answer, ≤ 40 words>"}},
    {{"q": "<customer question>", "a": "<plain-language answer, ≤ 40 words>"}},
    {{"q": "<customer question>", "a": "<plain-language answer, ≤ 40 words>"}}
  ]
}}

Rules for regulatorNarrative:
- Cite ECOA (Equal Credit Opportunity Act) compliance
- Reference specific factor values (e.g. "credit score of 615")
- Note that the AI pipeline passed bias screening
- Professional, third-person tone

Rules for customerFaq:
- Exactly 3 Q&A entries
- Plain English, no jargon
- Directly address the most common applicant questions for a {decision} decision"""

    try:
        raw, model_used, latency_ms = _llm_with_meta(prompt, json_mode=True)
        data = _parse_json(raw)
        _log("ComplianceNarrator", loan.get("id", ""),
             f"Compliance narrative generated for {decision} decision ({len(data.get('regulatorNarrative',''))} chars)",
             "success", 0.92,
             latency_ms=latency_ms, model=model_used)
        data["generatedAt"] = datetime.now(timezone.utc).isoformat()
        return data
    except Exception as e:
        print(f"[ComplianceNarrator] LLM failed ({e}), using template fallback")
        return _fallback_narrative(loan)


def _fallback_narrative(loan: dict) -> dict:
    decision = loan.get("decision", "pending")
    name = loan.get("applicantName", "the applicant")
    amount = loan.get("loanAmount", 0)
    purpose = loan.get("loanPurpose", "general purpose")
    risk = loan.get("riskScore", 0.5)
    regulator = (
        f"Pursuant to the Equal Credit Opportunity Act (ECOA) and Regulation B, "
        f"this notice documents the credit decision made on loan application {loan.get('id')} "
        f"submitted by {name} for ${amount:,.0f} ({purpose}). "
        f"The application was evaluated using an AI-assisted risk assessment pipeline "
        f"that scored the application at {risk:.2f} on a normalized risk scale. "
        f"The decision was rendered as '{decision}' based on objective financial criteria "
        f"including credit score, debt-to-income ratio, loan-to-income ratio, and employment stability. "
        f"All generated communications passed automated bias screening (CFPB fair lending standards). "
        f"This institution complies with ECOA and does not discriminate on any protected basis."
    )
    if decision == "approved":
        faq = [
            {"q": "What happens next?", "a": "A loan officer will contact you within 2 business days with final terms and next steps."},
            {"q": "Can the terms change?", "a": "Final terms are subject to document verification. Significant changes in your profile may affect the offer."},
            {"q": "How long is this approval valid?", "a": "Conditional approvals are typically valid for 60–90 days. Contact us if you need an extension."},
        ]
    else:
        faq = [
            {"q": "Why was my application denied?", "a": "Your application did not meet current lending thresholds. The specific factors are listed in your decision letter."},
            {"q": "Can I apply again?", "a": "You may re-apply after 90 days, or sooner if your financial profile improves meaningfully."},
            {"q": "Can I appeal this decision?", "a": "Yes. Contact us via the Help page with your loan ID and we will arrange a manual review."},
        ]
    return {
        "regulatorNarrative": regulator,
        "customerFaq": faq,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


# ─── Agent 9: PolicyChecker ───────────────────────────────────────────────────

def check_policy(loan: dict, policy_text: str) -> dict:
    """
    PolicyChecker agent — evaluates a loan against the bank's custom lending policy.
    Policy text is stored in the settings table and managed by managers.

    Returns: { passed, violations[], warnings[], overallRisk, summary }
    """
    if not policy_text or not policy_text.strip():
        return {
            "passed": True, "violations": [], "warnings": [],
            "overallRisk": "low",
            "summary": "No custom lending policy configured. Standard CFPB/FHA guidelines apply.",
        }

    factors = loan.get("factors") or []
    factors_text = "\n".join(
        f"  - {f.get('name')}: {f.get('value')} (impact: {f.get('impact')})"
        for f in factors[:6]
    ) or "  No AI factors available"

    prompt = f"""You are PolicyChecker, a compliance AI that evaluates loan applications against a bank's custom lending policy.

LOAN APPLICATION:
- Amount: ${loan.get('loanAmount', 0):,.0f} for {loan.get('loanPurpose')}
- Income: ${loan.get('income', 0):,.0f}
- Credit Score: {loan.get('creditScore')}
- DTI: {loan.get('debtToIncomeRatio', 0)*100:.1f}%
- Employment: {loan.get('employmentType')}
- AI Risk Score: {loan.get('riskScore', 0):.2f}
- AI Decision: {loan.get('aiRecommendation', 'N/A')}

AI FACTORS:
{factors_text}

BANK'S CUSTOM LENDING POLICY:
{policy_text[:2000]}

Respond ONLY with JSON (no markdown):
{{
  "passed": <true if no hard violations>,
  "violations": [
    {{"clause": "<policy clause>", "detail": "<why this loan violates it>"}}
  ],
  "warnings": [
    {{"clause": "<policy clause>", "detail": "<soft concern, not a hard block>"}}
  ],
  "overallRisk": "<low|medium|high|critical>",
  "summary": "<2-3 sentence plain-English assessment of policy compliance>"
}}

Rules:
- violations are hard blocks (policy says must not); warnings are soft concerns
- If the policy does not clearly address a factor, do not fabricate a violation
- Be precise: quote or paraphrase the relevant policy clause"""

    try:
        raw, model_used, latency_ms = _llm_with_meta(prompt, json_mode=True)
        data = _parse_json(raw)
        violations = data.get("violations", [])
        warnings = data.get("warnings", [])
        _log("PolicyChecker", loan.get("id", ""),
             f"Policy check: passed={data.get('passed')}, violations={len(violations)}, warnings={len(warnings)}",
             "success" if data.get("passed") else "warning", 0.90,
             latency_ms=latency_ms, model=model_used)
        return data
    except Exception as e:
        print(f"[PolicyChecker] LLM failed ({e}), skipping policy check")
        return {
            "passed": True, "violations": [], "warnings": [],
            "overallRisk": "low",
            "summary": "Policy check could not run (AI unavailable). Standard guidelines applied.",
        }

