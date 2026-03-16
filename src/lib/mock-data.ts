// Mock data for the loan intelligence platform

export interface LoanApplication {
  id: string;
  applicantName: string;
  applicantEmail?: string;
  userId?: string;
  income: number;
  creditScore: number;
  loanAmount: number;
  riskScore: number;
  decision: "approved" | "denied" | "pending" | "review";
  status: "completed" | "in_progress" | "queued" | "processing" | "pending_review" | "withdrawn";
  aiRecommendation?: "approved" | "denied";
  employmentType: string;
  loanPurpose: string;
  debtToIncomeRatio: number;
  applicationDate: string;
  generatedEmail?: string;
  biasScore?: number;
  toxicityScore?: number;
  approvalProbability?: number;
  confidence?: number;
  recommendations?: unknown[];
  factors?: unknown[];
  managerNotes?: string;
}

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: "success" | "failure" | "running";
  confidenceScore: number;
  applicationId: string;
}

export interface BiasDetection {
  biasScore: number;
  toxicityScore: number;
  status: "pass" | "warning" | "fail";
  details: string;
}

export interface Recommendation {
  productName: string;
  type: string;
  rate: string;
  description: string;
  matchScore: number;
}

export const mockLoanApplications: LoanApplication[] = [
  { id: "LN-001", applicantName: "Sarah Chen", income: 95000, creditScore: 742, loanAmount: 250000, riskScore: 0.23, decision: "approved", status: "completed", employmentType: "Full-time", loanPurpose: "Home Purchase", debtToIncomeRatio: 0.28, applicationDate: "2026-03-12" },
  { id: "LN-002", applicantName: "Marcus Johnson", income: 68000, creditScore: 615, loanAmount: 180000, riskScore: 0.67, decision: "denied", status: "completed", employmentType: "Contract", loanPurpose: "Refinance", debtToIncomeRatio: 0.45, applicationDate: "2026-03-12" },
  { id: "LN-003", applicantName: "Elena Rodriguez", income: 120000, creditScore: 798, loanAmount: 450000, riskScore: 0.12, decision: "approved", status: "completed", employmentType: "Full-time", loanPurpose: "Home Purchase", debtToIncomeRatio: 0.22, applicationDate: "2026-03-11" },
  { id: "LN-004", applicantName: "David Kim", income: 55000, creditScore: 680, loanAmount: 120000, riskScore: 0.45, decision: "pending", status: "in_progress", employmentType: "Self-employed", loanPurpose: "Business", debtToIncomeRatio: 0.35, applicationDate: "2026-03-11" },
  { id: "LN-005", applicantName: "Aisha Patel", income: 145000, creditScore: 810, loanAmount: 600000, riskScore: 0.08, decision: "approved", status: "completed", employmentType: "Full-time", loanPurpose: "Home Purchase", debtToIncomeRatio: 0.19, applicationDate: "2026-03-10" },
  { id: "LN-006", applicantName: "James Wilson", income: 42000, creditScore: 560, loanAmount: 80000, riskScore: 0.82, decision: "denied", status: "completed", employmentType: "Part-time", loanPurpose: "Personal", debtToIncomeRatio: 0.52, applicationDate: "2026-03-10" },
  { id: "LN-007", applicantName: "Mei-Lin Wang", income: 88000, creditScore: 725, loanAmount: 300000, riskScore: 0.31, decision: "review", status: "in_progress", employmentType: "Full-time", loanPurpose: "Refinance", debtToIncomeRatio: 0.33, applicationDate: "2026-03-09" },
  { id: "LN-008", applicantName: "Robert Taylor", income: 105000, creditScore: 755, loanAmount: 350000, riskScore: 0.19, decision: "approved", status: "completed", employmentType: "Full-time", loanPurpose: "Home Purchase", debtToIncomeRatio: 0.25, applicationDate: "2026-03-09" },
  { id: "LN-009", applicantName: "Fatima Hassan", income: 72000, creditScore: 690, loanAmount: 200000, riskScore: 0.41, decision: "pending", status: "queued", employmentType: "Full-time", loanPurpose: "Auto", debtToIncomeRatio: 0.38, applicationDate: "2026-03-08" },
  { id: "LN-010", applicantName: "Carlos Mendez", income: 160000, creditScore: 820, loanAmount: 750000, riskScore: 0.06, decision: "approved", status: "completed", employmentType: "Full-time", loanPurpose: "Home Purchase", debtToIncomeRatio: 0.17, applicationDate: "2026-03-08" },
];

export const mockAgentLogs: AgentLog[] = [
  { id: "AG-001", agentName: "RiskAssessor", action: "Evaluated credit risk for LN-001", timestamp: "2026-03-12T14:32:00Z", status: "success", confidenceScore: 0.94, applicationId: "LN-001" },
  { id: "AG-002", agentName: "EmailGenerator", action: "Generated approval email for LN-001", timestamp: "2026-03-12T14:33:00Z", status: "success", confidenceScore: 0.91, applicationId: "LN-001" },
  { id: "AG-003", agentName: "BiasDetector", action: "Scanned email for bias — LN-001", timestamp: "2026-03-12T14:33:30Z", status: "success", confidenceScore: 0.97, applicationId: "LN-001" },
  { id: "AG-004", agentName: "RiskAssessor", action: "Evaluated credit risk for LN-002", timestamp: "2026-03-12T14:35:00Z", status: "success", confidenceScore: 0.88, applicationId: "LN-002" },
  { id: "AG-005", agentName: "ProductRecommender", action: "Generated alternatives for LN-002", timestamp: "2026-03-12T14:36:00Z", status: "success", confidenceScore: 0.85, applicationId: "LN-002" },
  { id: "AG-006", agentName: "EmailGenerator", action: "Generated denial email for LN-002", timestamp: "2026-03-12T14:36:30Z", status: "failure", confidenceScore: 0.42, applicationId: "LN-002" },
  { id: "AG-007", agentName: "RiskAssessor", action: "Evaluating credit risk for LN-004", timestamp: "2026-03-12T14:40:00Z", status: "running", confidenceScore: 0.0, applicationId: "LN-004" },
  { id: "AG-008", agentName: "BiasDetector", action: "Scanned email for bias — LN-005", timestamp: "2026-03-12T13:20:00Z", status: "success", confidenceScore: 0.99, applicationId: "LN-005" },
  { id: "AG-009", agentName: "ProductRecommender", action: "Generated alternatives for LN-006", timestamp: "2026-03-12T12:15:00Z", status: "success", confidenceScore: 0.92, applicationId: "LN-006" },
  { id: "AG-010", agentName: "EmailGenerator", action: "Retrying email generation for LN-002", timestamp: "2026-03-12T14:38:00Z", status: "success", confidenceScore: 0.87, applicationId: "LN-002" },
];

export const mockDashboardStats = {
  totalApplications: 47,
  approvalRate: 68.3,
  avgRiskScore: 0.34,
  activeAgents: 4,
};

export const mockApprovalTrend = [
  { date: "Mar 1", approved: 12, denied: 5, pending: 3 },
  { date: "Mar 2", approved: 15, denied: 4, pending: 2 },
  { date: "Mar 3", approved: 10, denied: 7, pending: 4 },
  { date: "Mar 4", approved: 18, denied: 3, pending: 1 },
  { date: "Mar 5", approved: 14, denied: 6, pending: 5 },
  { date: "Mar 6", approved: 20, denied: 4, pending: 2 },
  { date: "Mar 7", approved: 16, denied: 5, pending: 3 },
  { date: "Mar 8", approved: 22, denied: 3, pending: 4 },
  { date: "Mar 9", approved: 19, denied: 6, pending: 2 },
  { date: "Mar 10", approved: 25, denied: 4, pending: 1 },
  { date: "Mar 11", approved: 21, denied: 5, pending: 3 },
  { date: "Mar 12", approved: 32, denied: 9, pending: 6 },
];

export const mockRiskDistribution = [
  { range: "0-0.2", count: 18 },
  { range: "0.2-0.4", count: 24 },
  { range: "0.4-0.6", count: 15 },
  { range: "0.6-0.8", count: 8 },
  { range: "0.8-1.0", count: 3 },
];

export const mockAgentDecisionsPerHour = [
  { hour: "8AM", decisions: 5 },
  { hour: "9AM", decisions: 12 },
  { hour: "10AM", decisions: 18 },
  { hour: "11AM", decisions: 22 },
  { hour: "12PM", decisions: 15 },
  { hour: "1PM", decisions: 20 },
  { hour: "2PM", decisions: 28 },
  { hour: "3PM", decisions: 25 },
  { hour: "4PM", decisions: 19 },
  { hour: "5PM", decisions: 10 },
];

export const mockRecommendations: Recommendation[] = [
  { productName: "SecureLine Personal Loan", type: "Personal Loan", rate: "7.5% APR", description: "Unsecured personal loan with flexible terms up to 60 months.", matchScore: 92 },
  { productName: "HomeStart FHA Loan", type: "FHA Mortgage", rate: "5.8% APR", description: "Lower down payment requirement with government backing.", matchScore: 85 },
  { productName: "CreditBuilder Card", type: "Credit Card", rate: "19.9% APR", description: "Build credit history with responsible usage and automatic reporting.", matchScore: 78 },
];

export const mockGeneratedEmail = `Dear Sarah,

Thank you for your loan application (Reference: LN-001). We are pleased to inform you that your application for a home purchase loan of $250,000 has been approved.

Based on our assessment of your financial profile, including your strong credit history and stable employment, we are confident in extending this offer.

Key Details:
• Loan Amount: $250,000
• Estimated Rate: 5.2% APR
• Term: 30 years
• Monthly Payment: ~$1,372

Please review the attached documentation and contact us within 10 business days to finalize the terms.

Best regards,
Agentic Loan Intelligence Platform`;

export const mockRejectionReasons = [
  { reason: "Low Credit Score", count: 28 },
  { reason: "High DTI Ratio", count: 22 },
  { reason: "Insufficient Income", count: 18 },
  { reason: "Employment History", count: 12 },
  { reason: "Collateral Issues", count: 8 },
];

export const mockProductRecommendationStats = [
  { product: "Personal Loan", count: 35 },
  { product: "FHA Mortgage", count: 28 },
  { product: "Credit Card", count: 22 },
  { product: "Auto Loan", count: 15 },
  { product: "HELOC", count: 10 },
];
