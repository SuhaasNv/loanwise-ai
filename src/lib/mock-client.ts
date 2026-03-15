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

  let items: LoanApplication[] = mockLoanApplications;
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

export async function mockInterceptor<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  await delay();

  const method = options?.method?.toUpperCase() ?? "GET";
  const path = endpoint.split("?")[0];

  // ── Loans ──────────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/loans") {
    return paginatedLoans(endpoint) as unknown as T;
  }
  if (method === "GET" && path.startsWith("/loans/")) {
    const id = path.replace("/loans/", "");
    const loan = mockLoanApplications.find((l) => l.id === id) ?? mockLoanApplications[0];
    return loan as unknown as T;
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
