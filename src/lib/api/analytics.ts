import { apiClient } from "@/lib/api-client";
import type {
  DashboardStats,
  ApprovalTrendPoint,
  RiskDistributionPoint,
  AgentDecisionsPoint,
  RejectionReasonPoint,
  ProductRecommendationPoint,
} from "@/types/analytics";

export interface AnalyticsBundle {
  stats: DashboardStats;
  approvalTrend: ApprovalTrendPoint[];
  riskDistribution: RiskDistributionPoint[];
  agentDecisions: AgentDecisionsPoint[];
  rejectionReasons: RejectionReasonPoint[];
  productRecommendations: ProductRecommendationPoint[];
}

export function getAnalytics() {
  return apiClient<AnalyticsBundle>("/analytics");
}

export function getDashboardStats() {
  return apiClient<DashboardStats>("/analytics/stats");
}

export function getApprovalTrend() {
  return apiClient<ApprovalTrendPoint[]>("/analytics/approval-rate");
}

export function getRiskDistribution() {
  return apiClient<RiskDistributionPoint[]>("/analytics/risk-distribution");
}

export function getAgentDecisionsPerHour() {
  return apiClient<AgentDecisionsPoint[]>("/analytics/agent-decisions");
}

export function getRejectionReasons() {
  return apiClient<RejectionReasonPoint[]>("/analytics/rejection-reasons");
}

export function getProductRecommendationStats() {
  return apiClient<ProductRecommendationPoint[]>("/analytics/product-recommendations");
}
