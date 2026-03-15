export interface DashboardStats {
  totalApplications: number;
  approvalRate: number;
  avgRiskScore: number;
  activeAgents: number;
}

export interface ApprovalTrendPoint {
  date: string;
  approved: number;
  denied: number;
  pending: number;
}

export interface RiskDistributionPoint {
  range: string;
  count: number;
}

export interface AgentDecisionsPoint {
  hour: string;
  decisions: number;
}

export interface RejectionReasonPoint {
  reason: string;
  count: number;
}

export interface ProductRecommendationPoint {
  product: string;
  count: number;
}
