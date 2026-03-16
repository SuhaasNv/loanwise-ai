export type LoanDecision = "approved" | "denied" | "pending" | "review";
export type LoanStatus = "completed" | "in_progress" | "queued" | "pending_review" | "processing" | "withdrawn";

export interface LoanListResponse {
  items: Loan[];
  total: number;
  page: number;
  limit: number;
}

export interface Loan {
  id: string;
  applicantName: string;
  applicantEmail?: string;
  userId?: string;
  income: number;
  creditScore: number;
  loanAmount: number;
  riskScore: number;
  decision: LoanDecision;
  status: LoanStatus;
  employmentType: string;
  loanPurpose: string;
  debtToIncomeRatio: number;
  applicationDate: string;
  managerNotes?: string;
  withdrawnAt?: string;
  // AI pipeline results
  aiRecommendation?: "approved" | "denied";
  generatedEmail?: string;
  biasScore?: number;
  toxicityScore?: number;
  approvalProbability?: number;
  confidence?: number;
  recommendations?: Recommendation[];
  factors?: RiskFactor[];
}

export interface AuditEntry {
  id: string;
  loanId: string;
  userId: string;
  action: string;
  detail: string;
  timestamp: string;
}

export interface LoanNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp: string;
  loanId?: string;
}

export interface CreateLoanRequest {
  applicantName: string;
  applicantEmail: string;
  userId: string;
  income: number;
  creditScore: number;
  loanAmount: number;
  employmentType: string;
  loanPurpose: string;
  debtToIncomeRatio: number;
}

export interface LoanPredictionRequest {
  income: number;
  creditScore: number;
  loanAmount: number;
  employmentType: string;
  loanPurpose?: string;
  debtToIncomeRatio?: number;
}

export interface LoanPredictionResponse {
  riskScore: number;
  approvalProbability: number;
  decision: LoanDecision;
  confidence: number;
}

export interface LoanEmailRequest {
  loanId: string;
  decision: LoanDecision;
  applicantName: string;
  loanAmount: number;
}

export interface LoanEmailResponse {
  email: string;
  biasScore: number;
  toxicityScore: number;
}

export interface LoanRecommendationRequest {
  loanId: string;
  applicantIncome: number;
  creditScore: number;
  rejectionReason?: string;
}

export interface RiskFactor {
  name: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
  contribution: number;
  detail: string;
  threshold: string;
}

export interface Recommendation {
  productName: string;
  type: string;
  rate: string;
  description: string;
  matchScore: number;
  reason?: string;
}

export interface LoanRecommendationResponse {
  recommendations: Recommendation[];
}

export interface ProductCatalogItem {
  productName: string;
  type: string;
  rate: string;
  description: string;
  matchScore: number;
  enabled: boolean;
}

export interface RecommendationInterestClick {
  productName: string;
  clicks: number;
}
