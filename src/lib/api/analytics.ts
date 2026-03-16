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
  recommendationAnalytics?: RecommendationMetrics;
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

export interface RecommendationMetrics {
  totalRecommendations: number;
  avgMatchScore: number;
}

export function getRecommendationMetrics() {
  return apiClient<RecommendationMetrics>("/analytics/recommendation-metrics");
}

export function getSettings() {
  return apiClient<Record<string, unknown>>("/settings");
}

export function saveSettings(settings: Record<string, unknown>) {
  return apiClient<Record<string, unknown>>("/settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}
