import { useMutation } from "@tanstack/react-query";
import { createLoan } from "@/lib/api/loans";
import type { CreateLoanRequest } from "@/types/loan";
import { queryClient } from "@/lib/query-client";

export function useCreateLoan() {
  return useMutation({
    mutationFn: (data: CreateLoanRequest) => createLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}
