import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAgentRecommendations } from "@/lib/api/agents";
import type { LoanRecommendationRequest } from "@/types/loan";
import { ApiError } from "@/lib/api-client";

export function useRecommendations() {
  return useMutation({
    mutationFn: (data: LoanRecommendationRequest) => getAgentRecommendations(data),
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to load recommendations. Please try again.";
      toast.error(message);
    },
  });
}
