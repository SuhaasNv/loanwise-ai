import { apiClient } from "@/lib/api-client";
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

export function predictLoan(data: LoanPredictionRequest) {
  return apiClient<LoanPredictionResponse>("/loan/predict", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
