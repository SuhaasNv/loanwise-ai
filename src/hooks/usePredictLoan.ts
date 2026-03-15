import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { predictLoan } from "@/lib/api/loans";
import type { LoanPredictionRequest } from "@/types/loan";
import { ApiError } from "@/lib/api-client";

export function usePredictLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoanPredictionRequest) => predictLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to predict loan. Please try again.";
      toast.error(message);
    },
  });
}
