export type AgentStatus = "success" | "failure" | "running" | "warning";
export type AgentName =
  | "RiskAssessor"
  | "EmailGenerator"
  | "BiasDetector"
  | "ProductRecommender"
  | "DocumentVerifier"
  | "IntakeAdvisor"
  | "ManagerCopilot"
  | "ComplianceNarrator"
  | "PolicyChecker";

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: AgentStatus;
  confidenceScore: number;
  applicationId: string;
  latencyMs?: number;
  model?: string;
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
