import { useQuery } from "@tanstack/react-query";
import { getLoans, getLoan, type LoanQueryParams } from "@/lib/api/loans";
import {
  getDashboardStats,
  getApprovalTrend,
  getRiskDistribution,
  getAgentDecisionsPerHour,
  getRejectionReasons,
  getProductRecommendationStats,
} from "@/lib/api/analytics";

/** Returns a flat Loan[] — used by Dashboard and AI Decisions pages. */
export function useLoans() {
  return useQuery({
    queryKey: ["loans", "all"],
    queryFn: () => getLoans({ page: 1, limit: 200 }),
    select: (data) => data.items,
    staleTime: 30 * 1000,
  });
}

/**
 * Server-side paginated loan query.
 * Returns the full LoanListResponse so callers have access to total count.
 */
export function usePaginatedLoans(params: LoanQueryParams) {
  const { page = 1, limit = 20, search, decision } = params;
  return useQuery({
    queryKey: ["loans", "paginated", page, limit, search ?? "", decision ?? "all"],
    queryFn: () => getLoans({ page, limit, search, decision }),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ["loan", id],
    queryFn: () => getLoan(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000,
  });
}

export function useApprovalTrend() {
  return useQuery({
    queryKey: ["approval-trend"],
    queryFn: getApprovalTrend,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRiskDistribution() {
  return useQuery({
    queryKey: ["risk-distribution"],
    queryFn: getRiskDistribution,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAgentDecisionsPerHour() {
  return useQuery({
    queryKey: ["agent-decisions-hour"],
    queryFn: getAgentDecisionsPerHour,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRejectionReasons() {
  return useQuery({
    queryKey: ["rejection-reasons"],
    queryFn: getRejectionReasons,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductRecommendationStats() {
  return useQuery({
    queryKey: ["product-recommendation-stats"],
    queryFn: getProductRecommendationStats,
    staleTime: 5 * 60 * 1000,
  });
}
