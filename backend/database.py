"""
SQLite persistence layer for Loanwise AI.
Uses Python's built-in sqlite3 — no extra dependencies.
"""
import sqlite3
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone

from data import LOANS, AGENT_LOGS, RECOMMENDATIONS_CATALOG

DB_PATH = Path(__file__).parent / "loanwise.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    for field in ("recommendations", "factors"):
        if field in d and d[field]:
            try:
                d[field] = json.loads(d[field])
            except Exception:
                d[field] = []
    return d


def init_db() -> None:
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            userId  TEXT PRIMARY KEY,
            email   TEXT,
            role    TEXT NOT NULL DEFAULT 'customer'
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS loans (
            id                  TEXT PRIMARY KEY,
            userId              TEXT,
            applicantName       TEXT NOT NULL,
            applicantEmail      TEXT,
            income              REAL NOT NULL,
            creditScore         INTEGER NOT NULL,
            loanAmount          REAL NOT NULL,
            riskScore           REAL DEFAULT 0,
            decision            TEXT DEFAULT 'pending',
            status              TEXT DEFAULT 'queued',
            employmentType      TEXT NOT NULL,
            loanPurpose         TEXT NOT NULL,
            debtToIncomeRatio   REAL DEFAULT 0.35,
            applicationDate     TEXT NOT NULL,
            generatedEmail      TEXT,
            biasScore           REAL DEFAULT 0,
            toxicityScore       REAL DEFAULT 0,
            approvalProbability REAL DEFAULT 0,
            confidence          REAL DEFAULT 0,
            recommendations     TEXT DEFAULT '[]',
            factors             TEXT DEFAULT '[]',
            managerNotes        TEXT DEFAULT '',
            withdrawnAt         TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_logs (
            id              TEXT PRIMARY KEY,
            agentName       TEXT NOT NULL,
            action          TEXT NOT NULL,
            timestamp       TEXT NOT NULL,
            status          TEXT NOT NULL,
            confidenceScore REAL DEFAULT 0,
            applicationId   TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id          TEXT PRIMARY KEY,
            loanId      TEXT NOT NULL,
            userId      TEXT,
            action      TEXT NOT NULL,
            detail      TEXT,
            timestamp   TEXT NOT NULL
        )
    """)
    conn.commit()
    # Add columns that may not exist on older DB files
    _migrate(conn)

    # Seed mock loans if table is empty
    count = conn.execute("SELECT COUNT(*) FROM loans").fetchone()[0]
    if count == 0:
        _seed(conn)

    conn.close()


def _migrate(conn: sqlite3.Connection) -> None:
    """Add columns introduced after initial schema creation."""
    cols = {r[1] for r in conn.execute("PRAGMA table_info(loans)").fetchall()}
    if "managerNotes" not in cols:
        conn.execute("ALTER TABLE loans ADD COLUMN managerNotes TEXT DEFAULT ''")
    if "withdrawnAt" not in cols:
        conn.execute("ALTER TABLE loans ADD COLUMN withdrawnAt TEXT")
    conn.commit()


def _seed(conn: sqlite3.Connection) -> None:
    for loan in LOANS:
        conn.execute("""
            INSERT OR IGNORE INTO loans
              (id, userId, applicantName, applicantEmail, income, creditScore, loanAmount,
               riskScore, decision, status, employmentType, loanPurpose, debtToIncomeRatio,
               applicationDate, generatedEmail, biasScore, toxicityScore,
               approvalProbability, confidence, recommendations)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            loan["id"], "seed", loan["applicantName"], "demo@example.com",
            loan["income"], loan["creditScore"], loan["loanAmount"],
            loan["riskScore"], loan["decision"], loan["status"],
            loan["employmentType"], loan["loanPurpose"], loan["debtToIncomeRatio"],
            loan["applicationDate"], None, 0.02, 0.01,
            round(1 - loan["riskScore"], 2), 0.91,
            json.dumps(RECOMMENDATIONS_CATALOG if loan["decision"] == "denied" else []),
        ))
    for log in AGENT_LOGS:
        conn.execute("""
            INSERT OR IGNORE INTO agent_logs
              (id, agentName, action, timestamp, status, confidenceScore, applicationId)
            VALUES (?,?,?,?,?,?,?)
        """, (
            log["id"], log["agentName"], log["action"], log["timestamp"],
            log["status"], log["confidenceScore"], log["applicationId"],
        ))
    conn.commit()


# ─── Loan CRUD ────────────────────────────────────────────────────────────────

def update_loan(loan_id: str, updates: dict) -> dict | None:
    """Apply a partial update to a loan row and return the full updated loan."""
    if not updates:
        return get_loan_by_id(loan_id)
    set_clauses = ", ".join(f"{k}=?" for k in updates)
    values = list(updates.values()) + [loan_id]
    conn = get_db()
    conn.execute(f"UPDATE loans SET {set_clauses} WHERE id=?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM loans WHERE id=?", (loan_id,)).fetchone()
    conn.close()
    return _row_to_dict(row) if row else None


def insert_loan(loan: dict) -> dict:
    conn = get_db()
    conn.execute("""
        INSERT INTO loans
          (id, userId, applicantName, applicantEmail, income, creditScore, loanAmount,
           riskScore, decision, status, employmentType, loanPurpose, debtToIncomeRatio,
           applicationDate, generatedEmail, biasScore, toxicityScore,
           approvalProbability, confidence, recommendations, factors)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        loan["id"], loan.get("userId"), loan["applicantName"], loan.get("applicantEmail"),
        loan["income"], loan["creditScore"], loan["loanAmount"],
        loan["riskScore"], loan["decision"], loan["status"],
        loan["employmentType"], loan["loanPurpose"], loan["debtToIncomeRatio"],
        loan["applicationDate"], loan.get("generatedEmail"),
        loan.get("biasScore", 0), loan.get("toxicityScore", 0),
        loan.get("approvalProbability", 0), loan.get("confidence", 0),
        json.dumps(loan.get("recommendations", [])),
        json.dumps(loan.get("factors", [])),
    ))
    conn.commit()
    conn.close()
    return loan


def get_loan_by_id(loan_id: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM loans WHERE id=?", (loan_id,)).fetchone()
    conn.close()
    return _row_to_dict(row) if row else None


def query_loans(
    page: int = 1,
    limit: int = 100,
    search: str | None = None,
    decision: str | None = None,
    user_id: str | None = None,
) -> tuple[list[dict], int]:
    conn = get_db()
    clauses, params = [], []

    if search:
        clauses.append("(LOWER(applicantName) LIKE ? OR LOWER(id) LIKE ?)")
        params += [f"%{search.lower()}%", f"%{search.lower()}%"]
    if decision and decision != "all":
        clauses.append("decision=?")
        params.append(decision)
    if user_id:
        clauses.append("userId=?")
        params.append(user_id)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    total = conn.execute(f"SELECT COUNT(*) FROM loans {where}", params).fetchone()[0]
    offset = (page - 1) * limit
    rows = conn.execute(
        f"SELECT * FROM loans {where} ORDER BY applicationDate DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows], total


# ─── Agent log CRUD ───────────────────────────────────────────────────────────

def insert_agent_log(log: dict) -> None:
    conn = get_db()
    conn.execute("""
        INSERT INTO agent_logs
          (id, agentName, action, timestamp, status, confidenceScore, applicationId)
        VALUES (?,?,?,?,?,?,?)
    """, (
        log["id"], log["agentName"], log["action"], log["timestamp"],
        log["status"], log["confidenceScore"], log["applicationId"],
    ))
    conn.commit()
    conn.close()


def get_all_agent_logs() -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM agent_logs ORDER BY timestamp DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_logs_for_loan(loan_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM agent_logs WHERE applicationId=? ORDER BY timestamp",
        (loan_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── Analytics helpers ────────────────────────────────────────────────────────

def compute_dashboard_stats() -> dict:
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM loans").fetchone()[0]
    approved = conn.execute("SELECT COUNT(*) FROM loans WHERE decision='approved'").fetchone()[0]
    avg_risk = conn.execute("SELECT AVG(riskScore) FROM loans").fetchone()[0] or 0
    running_agents = conn.execute(
        "SELECT COUNT(DISTINCT agentName) FROM agent_logs WHERE status='running'"
    ).fetchone()[0]
    conn.close()
    approval_rate = round((approved / total) * 100, 1) if total > 0 else 0
    return {
        "totalApplications": total,
        "approvalRate": approval_rate,
        "avgRiskScore": round(avg_risk, 2),
        "activeAgents": max(running_agents, 4),  # show at least 4 for demo
    }


def compute_approval_trend() -> list[dict]:
    conn = get_db()
    rows = conn.execute("""
        SELECT
            applicationDate AS date,
            SUM(CASE WHEN decision='approved' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN decision='denied'   THEN 1 ELSE 0 END) AS denied,
            SUM(CASE WHEN decision NOT IN ('approved','denied') THEN 1 ELSE 0 END) AS pending
        FROM loans
        GROUP BY applicationDate
        ORDER BY applicationDate
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def compute_risk_distribution() -> list[dict]:
    conn = get_db()
    buckets = [
        ("0-0.2", 0.0, 0.2), ("0.2-0.4", 0.2, 0.4),
        ("0.4-0.6", 0.4, 0.6), ("0.6-0.8", 0.6, 0.8),
        ("0.8-1.0", 0.8, 1.0),
    ]
    result = []
    for label, lo, hi in buckets:
        count = conn.execute(
            "SELECT COUNT(*) FROM loans WHERE riskScore >= ? AND riskScore < ?",
            (lo, hi + 0.001),
        ).fetchone()[0]
        result.append({"range": label, "count": count})
    conn.close()
    return result


def compute_rejection_reasons() -> list[dict]:
    conn = get_db()
    low_credit = conn.execute(
        "SELECT COUNT(*) FROM loans WHERE decision='denied' AND creditScore < 620"
    ).fetchone()[0]
    high_dti = conn.execute(
        "SELECT COUNT(*) FROM loans WHERE decision='denied' AND debtToIncomeRatio > 0.43"
    ).fetchone()[0]
    low_income = conn.execute(
        "SELECT COUNT(*) FROM loans WHERE decision='denied' AND income < 40000"
    ).fetchone()[0]
    other = conn.execute(
        "SELECT COUNT(*) FROM loans WHERE decision='denied'"
    ).fetchone()[0] - low_credit - high_dti - low_income
    conn.close()
    return [
        {"reason": "Low Credit Score", "count": max(low_credit, 0)},
        {"reason": "High DTI Ratio", "count": max(high_dti, 0)},
        {"reason": "Insufficient Income", "count": max(low_income, 0)},
        {"reason": "Employment History", "count": max(other // 2, 0)},
        {"reason": "Other", "count": max(other - other // 2, 0)},
    ]


# ─── Settings helpers ─────────────────────────────────────────────────────────

def get_settings() -> dict:
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    result = {}
    for row in rows:
        try:
            result[row["key"]] = json.loads(row["value"])
        except Exception:
            result[row["key"]] = row["value"]
    return result


def save_settings(partial: dict) -> dict:
    conn = get_db()
    for key, value in partial.items():
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, json.dumps(value)),
        )
    conn.commit()
    conn.close()
    return get_settings()


# ─── Audit log helpers ────────────────────────────────────────────────────────

def insert_audit_log(loan_id: str, user_id: str, action: str, detail: str = "") -> None:
    conn = get_db()
    conn.execute("""
        INSERT INTO audit_logs (id, loanId, userId, action, detail, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        f"AUD-{uuid.uuid4().hex[:8].upper()}",
        loan_id, user_id, action, detail,
        datetime.now(timezone.utc).isoformat(),
    ))
    conn.commit()
    conn.close()


def get_audit_logs(loan_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM audit_logs WHERE loanId=? ORDER BY timestamp DESC",
        (loan_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── Recommendation analytics ─────────────────────────────────────────────────

def compute_recommendation_analytics() -> dict:
    """Compute avg match score and total recs from completed denied loans."""
    conn = get_db()
    rows = conn.execute(
        "SELECT recommendations FROM loans WHERE decision='denied' AND recommendations != '[]'"
    ).fetchall()
    conn.close()
    total = 0
    scores = []
    for row in rows:
        try:
            recs = json.loads(row[0]) if isinstance(row[0], str) else row[0]
            for r in recs:
                total += 1
                scores.append(r.get("matchScore", 0))
        except Exception:
            pass
    avg = round(sum(scores) / len(scores), 1) if scores else 0
    return {"totalRecommendations": total, "avgMatchScore": avg}


# ─── User / role helpers ──────────────────────────────────────────────────────

def upsert_user_role(user_id: str, email: str, role: str) -> dict:
    conn = get_db()
    conn.execute("""
        INSERT INTO users (userId, email, role) VALUES (?, ?, ?)
        ON CONFLICT(userId) DO UPDATE SET role=excluded.role, email=excluded.email
    """, (user_id, email, role))
    conn.commit()
    conn.close()
    return {"userId": user_id, "email": email, "role": role}


def get_user_role(user_id: str) -> str:
    conn = get_db()
    row = conn.execute("SELECT role FROM users WHERE userId=?", (user_id,)).fetchone()
    conn.close()
    return row["role"] if row else "customer"
