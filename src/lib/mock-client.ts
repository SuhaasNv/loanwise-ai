/**
 * Mock interceptor — returns local fixture data when VITE_USE_MOCK_DATA=true.
 * Matches route prefixes to mock responses so development can proceed without
 * a live backend.
 */
import {
  mockLoanApplications,
  mockAgentLogs,
  mockDashboardStats,
  mockApprovalTrend,
  mockRiskDistribution,
  mockAgentDecisionsPerHour,
  mockRecommendations,
  mockGeneratedEmail,
  mockRejectionReasons,
  mockProductRecommendationStats,
  type LoanApplication,
} from "@/lib/mock-data";

function delay(ms = 400): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function paginatedLoans(url: string) {
  const qs = new URL(url, "http://x").searchParams;
  const page = Math.max(1, Number(qs.get("page") ?? 1));
  const limit = Math.max(1, Number(qs.get("limit") ?? 20));
  const search = (qs.get("search") ?? "").toLowerCase();
  const decision = qs.get("decision") ?? "";
  const userId = qs.get("userId") ?? "";

  let items: LoanApplication[] = mockLoanApplications;

  if (userId) {
    items = items.filter((l) => l.userId === userId);
  }
  if (search) {
    items = items.filter(
      (l) =>
        l.applicantName.toLowerCase().includes(search) ||
        l.id.toLowerCase().includes(search)
    );
  }
  if (decision && decision !== "all") {
    items = items.filter((l) => l.decision === decision);
  }

  const total = items.length;
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total, page, limit };
}

/** Fixture audit entries returned for any loan in mock mode. */
function mockAuditEntries(loanId: string) {
  return [
    {
      id: "AUD-001",
      loanId,
      userId: "mock-customer",
      action: "submitted",
      detail: `Application submitted for mock loan ${loanId}`,
      timestamp: "2026-03-08T10:00:00Z",
    },
    {
      id: "AUD-002",
      loanId,
      userId: "mock-manager",
      action: "processing_started",
      detail: "Manager started AI pipeline",
      timestamp: "2026-03-08T10:05:00Z",
    },
    {
      id: "AUD-003",
      loanId,
      userId: "mock-manager",
      action: "processed",
      detail: "AI analysis complete: recommends approved (risk=0.23). Awaiting manager decision.",
      timestamp: "2026-03-08T10:05:30Z",
    },
    {
      id: "AUD-004",
      loanId,
      userId: "mock-manager",
      action: "decision_submitted",
      detail: "Manager approved (AI recommended approved)",
      timestamp: "2026-03-08T10:10:00Z",
    },
  ];
}

/** Mock settings fixture. */
const mockSettings: Record<string, unknown> = {
  autoProcessLoans: false,
  notificationsEnabled: true,
  riskThreshold: 0.5,
  maxLoanAmount: 1000000,
};

/** Mock notifications fixture. */
const mockNotifications = [
  {
    id: "notif-LN-009",
    type: "new_application",
    title: "New Application",
    body: "Fatima Hassan applied for $200,000",
    timestamp: "2026-03-08",
    loanId: "LN-009",
  },
];

export async function mockInterceptor<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  await delay();

  const method = options?.method?.toUpperCase() ?? "GET";
  const path = endpoint.split("?")[0];

  // ── User / auth ────────────────────────────────────────────────────────────
  if (method === "POST" && path === "/user/setup") {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    return { userId: body.userId ?? "mock-user", role: body.role ?? "customer", success: true } as unknown as T;
  }
  if (method === "GET" && path === "/user/role") {
    const userId = new URL(endpoint, "http://x").searchParams.get("userId") ?? "";
    return { userId, role: "customer" } as unknown as T;
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/settings") {
    return mockSettings as unknown as T;
  }
  if (method === "PUT" && path === "/settings") {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    Object.assign(mockSettings, body.settings ?? {});
    return mockSettings as unknown as T;
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  if (method === "GET" && path === "/notifications") {
    return mockNotifications as unknown as T;
  }

  // ── Loans ──────────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/loans") {
    return paginatedLoans(endpoint) as unknown as T;
  }

  // Audit — must be checked before generic /loans/{id}
  if (method === "GET" && path.match(/^\/loans\/[^/]+\/audit$/)) {
    const loanId = path.replace("/loans/", "").replace("/audit", "");
    return mockAuditEntries(loanId) as unknown as T;
  }

  if (method === "GET" && path.startsWith("/loans/")) {
    const id = path.replace("/loans/", "").split("/")[0];
    const loan = mockLoanApplications.find((l) => l.id === id) ?? mockLoanApplications[0];
    return loan as unknown as T;
  }

  if (method === "POST" && path === "/loans") {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const newId = `LN-M${String(mockLoanApplications.length + 1).padStart(3, "0")}`;
    const newLoan: LoanApplication = {
      id: newId,
      applicantName: body.applicantName ?? "Mock Applicant",
      applicantEmail: body.applicantEmail ?? "",
      userId: body.userId ?? "",
      income: body.income ?? 0,
      creditScore: body.creditScore ?? 0,
      loanAmount: body.loanAmount ?? 0,
      riskScore: 0,
      decision: "pending",
      status: "queued",
      employmentType: body.employmentType ?? "Full-time",
      loanPurpose: body.loanPurpose ?? "Personal",
      debtToIncomeRatio: body.debtToIncomeRatio ?? 0.35,
      applicationDate: new Date().toISOString().split("T")[0],
    };
    mockLoanApplications.push(newLoan);
    return newLoan as unknown as T;
  }

  if (method === "PATCH" && path.match(/^\/loans\/[^/]+$/)) {
    const id = path.replace("/loans/", "");
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const idx = mockLoanApplications.findIndex((l) => l.id === id);
    if (idx >= 0) Object.assign(mockLoanApplications[idx], body);
    return (mockLoanApplications[idx] ?? mockLoanApplications[0]) as unknown as T;
  }

  if (method === "POST" && path.match(/^\/loans\/[^/]+\/process$/)) {
    const id = path.replace("/loans/", "").replace("/process", "");
    const loan = mockLoanApplications.find((l) => l.id === id) ?? mockLoanApplications[0];
    const updated = {
      ...loan,
      status: "pending_review" as const,
      decision: "pending" as const,
      aiRecommendation: "approved" as const,
      riskScore: 0.35,
      approvalProbability: 0.65,
      confidence: 0.91,
      biasScore: 0.02,
      toxicityScore: 0.01,
      generatedEmail: mockGeneratedEmail,
    };
    const idx = mockLoanApplications.findIndex((l) => l.id === id);
    if (idx >= 0) Object.assign(mockLoanApplications[idx], updated);
    return updated as unknown as T;
  }

  if (method === "POST" && path.match(/^\/loans\/[^/]+\/decision$/)) {
    const id = path.replace("/loans/", "").replace("/decision", "");
    const body = options?.body ? (typeof options.body === "string" ? JSON.parse(options.body) : {}) : {};
    const decision = (body.decision ?? "approved").toLowerCase();
    if (decision !== "approved" && decision !== "denied") return null;
    const loan = mockLoanApplications.find((l) => l.id === id) ?? mockLoanApplications[0];
    const updated = { ...loan, status: "completed" as const, decision: decision as "approved" | "denied" };
    const idx = mockLoanApplications.findIndex((l) => l.id === id);
    if (idx >= 0) Object.assign(mockLoanApplications[idx], updated);
    return updated as unknown as T;
  }

  if (method === "POST" && path === "/loan/predict") {
    return {
      riskScore: 0.28,
      approvalProbability: 0.72,
      decision: "approved",
      confidence: 0.91,
    } as unknown as T;
  }
  if (method === "POST" && path === "/loan/email") {
    return {
      email: mockGeneratedEmail,
      biasScore: 0.03,
      toxicityScore: 0.01,
    } as unknown as T;
  }
  if (method === "POST" && path === "/loan/bias-check") {
    return {
      biasScore: 0.03,
      toxicityScore: 0.01,
      passed: true,
      details: "No issues detected.",
    } as unknown as T;
  }
  if (method === "POST" && path === "/loan/recommendation") {
    return {
      recommendations: mockRecommendations,
    } as unknown as T;
  }

  // ── Analytics ──────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/analytics") {
    return {
      stats: mockDashboardStats,
      approvalTrend: mockApprovalTrend,
      riskDistribution: mockRiskDistribution,
      agentDecisions: mockAgentDecisionsPerHour,
      rejectionReasons: mockRejectionReasons,
      productRecommendations: mockProductRecommendationStats,
      recommendationAnalytics: { totalRecommendations: 45, avgMatchScore: 85 },
    } as unknown as T;
  }
  if (method === "GET" && path === "/analytics/stats") {
    return mockDashboardStats as unknown as T;
  }
  if (method === "GET" && path === "/analytics/approval-rate") {
    return mockApprovalTrend as unknown as T;
  }
  if (method === "GET" && path === "/analytics/risk-distribution") {
    return mockRiskDistribution as unknown as T;
  }
  if (method === "GET" && path === "/analytics/agent-decisions") {
    return mockAgentDecisionsPerHour as unknown as T;
  }
  if (method === "GET" && path === "/analytics/rejection-reasons") {
    return mockRejectionReasons as unknown as T;
  }
  if (method === "GET" && path === "/analytics/product-recommendations") {
    return mockProductRecommendationStats as unknown as T;
  }
  if (method === "GET" && path === "/analytics/recommendation-metrics") {
    return { totalRecommendations: 45, avgMatchScore: 85 } as unknown as T;
  }

  // ── Agents ─────────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/agents/logs") {
    return mockAgentLogs as unknown as T;
  }

  // ── Recommendations catalog ────────────────────────────────────────────────
  if (method === "GET" && path === "/recommendations") {
    return mockRecommendations as unknown as T;
  }

  // Unknown route — fall through to real fetch
  return null;
}

/**
 * Mock handler for apiFetch (raw Response) calls.
 * Currently handles CSV export only.
 */
export async function mockApiFetch(
  endpoint: string,
  _options?: RequestInit
): Promise<Response | null> {
  await delay(200);

  const path = endpoint.split("?")[0];
  const qs = new URL(endpoint, "http://x").searchParams;

  if (path === "/loans/export") {
    const search = (qs.get("search") ?? "").toLowerCase();
    const decision = qs.get("decision") ?? "";

    let items = mockLoanApplications;
    if (search) {
      items = items.filter(
        (l) =>
          l.applicantName.toLowerCase().includes(search) ||
          l.id.toLowerCase().includes(search)
      );
    }
    if (decision && decision !== "all") {
      items = items.filter((l) => l.decision === decision);
    }

    const header = "id,applicantName,applicantEmail,income,creditScore,loanAmount,loanPurpose,employmentType,debtToIncomeRatio,applicationDate,decision,status";
    const rows = items.map((l) =>
      [
        l.id,
        `"${l.applicantName}"`,
        l.applicantEmail ?? "",
        l.income,
        l.creditScore,
        l.loanAmount,
        l.loanPurpose,
        l.employmentType,
        l.debtToIncomeRatio,
        l.applicationDate,
        l.decision,
        l.status,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename=loanwise-export.csv',
      },
    });
  }

  return null;
}
