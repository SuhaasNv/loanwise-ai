import { apiClient } from "@/lib/api-client";
import type { AgentLog, BiasCheckRequest, BiasCheckResponse } from "@/types/agents";
import type {
  LoanEmailRequest,
  LoanEmailResponse,
  LoanRecommendationRequest,
  LoanRecommendationResponse,
  Recommendation,
} from "@/types/loan";

export function getAgentLogs() {
  return apiClient<AgentLog[]>("/agents/logs");
}

export function generateEmail(data: LoanEmailRequest) {
  return apiClient<LoanEmailResponse>("/loan/email", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function checkBias(data: BiasCheckRequest) {
  return apiClient<BiasCheckResponse>("/loan/bias-check", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAgentRecommendations(data: LoanRecommendationRequest) {
  return apiClient<LoanRecommendationResponse>("/loan/recommendation", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getProductCatalog() {
  return apiClient<Recommendation[]>("/recommendations");
}
