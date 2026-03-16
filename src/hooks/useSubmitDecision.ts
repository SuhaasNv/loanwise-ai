import { useMutation } from "@tanstack/react-query";
import { submitDecision } from "@/lib/api/loans";
import { queryClient } from "@/lib/query-client";

export function useSubmitDecision() {
  return useMutation({
    mutationFn: ({ loanId, decision }: { loanId: string; decision: "approved" | "denied" }) =>
      submitDecision(loanId, decision),
    onSuccess: (updatedLoan) => {
      queryClient.setQueryData(["loan", updatedLoan.id], updatedLoan);
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
    },
  });
}
