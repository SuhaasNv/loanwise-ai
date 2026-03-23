import { apiClient, apiFetch } from "@/lib/api-client";
import type {
  Loan,
  LoanListResponse,
  LoanPredictionRequest,
  LoanPredictionResponse,
  CreateLoanRequest,
  AuditEntry,
  LoanNotification,
} from "@/types/loan";

export type { AuditEntry, LoanNotification };

export interface LoanQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  decision?: string;
  userId?: string;
}

export function getLoans(params: LoanQueryParams = {}) {
  const { page = 1, limit = 100, search, decision, userId } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) qs.set("search", search);
  if (decision && decision !== "all") qs.set("decision", decision);
  if (userId) qs.set("userId", userId);
  return apiClient<LoanListResponse>(`/loans?${qs}`);
}

export function getLoan(id: string) {
  return apiClient<Loan>(`/loans/${id}`);
}

export function createLoan(data: CreateLoanRequest) {
  return apiClient<Loan>("/loans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyLoans(userId: string) {
  return getLoans({ userId });
}

export function processLoan(id: string) {
  return apiClient<Loan>(`/loans/${id}/process`, { method: "POST" });
}

export function submitDecision(id: string, decision: "approved" | "denied") {
  return apiClient<Loan>(`/loans/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export function predictLoan(data: LoanPredictionRequest) {
  return apiClient<LoanPredictionResponse>("/loan/predict", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function withdrawLoan(id: string) {
  return apiClient<Loan>(`/loans/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "withdrawn" }),
  });
}

export function updateManagerNotes(id: string, notes: string) {
  return apiClient<Loan>(`/loans/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ managerNotes: notes }),
  });
}

export function getLoanAudit(id: string) {
  return apiClient<AuditEntry[]>(`/loans/${id}/audit`);
}

export function exportLoansCSV(params: { search?: string; decision?: string } = {}) {
  const qs = new URLSearchParams({ format: "csv" });
  if (params.search) qs.set("search", params.search);
  if (params.decision && params.decision !== "all") qs.set("decision", params.decision);
  return apiFetch(`/loans/export?${qs}`);
}

export function getNotifications() {
  return apiClient<LoanNotification[]>("/notifications");
}

export function expressInterest(loanId: string, productName: string) {
  return apiClient<{ success: boolean; message: string }>("/recommendations/express-interest", {
    method: "POST",
    body: JSON.stringify({ loanId, productName }),
  });
}

// LoanListResponse now includes pagination metadata
export interface PaginatedLoanListResponse extends LoanListResponse {
  totalPages: number;
  hasNext: boolean;
}

// ─── Intake Review ────────────────────────────────────────────────────────────

export interface IntakeFlag {
  type: "inconsistency" | "warning" | "tip";
  field: string;
  message: string;
}

export interface IntakeReviewResponse {
  readinessScore: number;
  flags: IntakeFlag[];
  suggestions: string[];
  summary: string;
}

export function intakeReview(data: {
  applicantName: string;
  income: number;
  creditScore: number;
  loanAmount: number;
  debtToIncomeRatio: number;
  employmentType: string;
  loanPurpose: string;
  loanId?: string;
}) {
  return apiClient<IntakeReviewResponse>("/loan/intake-review", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Manager Copilot Brief ────────────────────────────────────────────────────

export interface ManagerBriefResponse {
  bullets: string[];
  suggestedDecision: "approve" | "deny" | "escalate";
  confidence: number;
  checklist: { item: string; passed: boolean | null }[];
  questions: string[];
  summary: string;
}

export function getManagerBrief(loanId: string) {
  return apiClient<ManagerBriefResponse>(`/loans/${loanId}/manager-brief`, {
    method: "POST",
  });
}

// ─── Compliance Narrative ─────────────────────────────────────────────────────

export interface NarrativeResponse {
  regulatorNarrative: string;
  customerFaq: { q: string; a: string }[];
  generatedAt: string;
}

export function getLoanNarrative(loanId: string) {
  return apiClient<NarrativeResponse>(`/loans/${loanId}/narrative`, {
    method: "POST",
  });
}
