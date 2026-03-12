import { useQuery } from "@tanstack/react-query";
import {
  mockLoanApplications,
  mockDashboardStats,
  mockApprovalTrend,
  mockRiskDistribution,
  mockAgentDecisionsPerHour,
  mockRejectionReasons,
  mockProductRecommendationStats,
  type LoanApplication,
} from "@/lib/mock-data";

export function useLoans() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: async (): Promise<LoanApplication[]> => {
      // Replace with: api.loans.getAll()
      await new Promise((r) => setTimeout(r, 500));
      return mockLoanApplications;
    },
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ["loan", id],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return mockLoanApplications.find((l) => l.id === id) ?? null;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockDashboardStats;
    },
  });
}

export function useApprovalTrend() {
  return useQuery({
    queryKey: ["approval-trend"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockApprovalTrend;
    },
  });
}

export function useRiskDistribution() {
  return useQuery({
    queryKey: ["risk-distribution"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockRiskDistribution;
    },
  });
}

export function useAgentDecisionsPerHour() {
  return useQuery({
    queryKey: ["agent-decisions-hour"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockAgentDecisionsPerHour;
    },
  });
}

export function useRejectionReasons() {
  return useQuery({
    queryKey: ["rejection-reasons"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockRejectionReasons;
    },
  });
}

export function useProductRecommendationStats() {
  return useQuery({
    queryKey: ["product-recommendations"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockProductRecommendationStats;
    },
  });
}
