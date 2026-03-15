export type AgentStatus = "success" | "failure" | "running";
export type AgentName = "RiskAssessor" | "EmailGenerator" | "BiasDetector" | "ProductRecommender";

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: AgentStatus;
  confidenceScore: number;
  applicationId: string;
}

export interface BiasCheckRequest {
  email: string;
  loanId: string;
}

export interface BiasCheckResponse {
  biasScore: number;
  toxicityScore: number;
  passed: boolean;
  details?: string;
}
