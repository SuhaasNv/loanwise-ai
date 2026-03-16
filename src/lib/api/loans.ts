import { apiClient, apiFetch } from "@/lib/api-client";
import type {
  Loan,
  LoanListResponse,
  LoanPredictionRequest,
  LoanPredictionResponse,
  CreateLoanRequest,
} from "@/types/loan";

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

export interface AuditEntry {
  id: string;
  loanId: string;
  userId: string;
  action: string;
  detail: string;
  timestamp: string;
}

export function exportLoansCSV(params: { search?: string; decision?: string } = {}) {
  const qs = new URLSearchParams({ format: "csv" });
  if (params.search) qs.set("search", params.search);
  if (params.decision && params.decision !== "all") qs.set("decision", params.decision);
  return apiFetch(`/loans/export?${qs}`);
}

export function getNotifications() {
  return apiClient<Notification[]>("/notifications");
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp: string;
  loanId?: string;
}
