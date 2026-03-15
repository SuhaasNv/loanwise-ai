import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkBias } from "@/lib/api/agents";
import type { BiasCheckRequest } from "@/types/agents";
import { ApiError } from "@/lib/api-client";

export function useBiasCheck() {
  return useMutation({
    mutationFn: (data: BiasCheckRequest) => checkBias(data),
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Bias check failed. Please try again.";
      toast.error(message);
    },
  });
}
