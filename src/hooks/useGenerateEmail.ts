import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateEmail } from "@/lib/api/agents";
import type { LoanEmailRequest } from "@/types/loan";
import { ApiError } from "@/lib/api-client";

export function useGenerateEmail() {
  return useMutation({
    mutationFn: (data: LoanEmailRequest) => generateEmail(data),
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to generate email. Please try again.";
      toast.error(message);
    },
  });
}
