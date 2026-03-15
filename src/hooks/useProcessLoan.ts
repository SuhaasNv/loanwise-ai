import { useMutation } from "@tanstack/react-query";
import { processLoan } from "@/lib/api/loans";
import { queryClient } from "@/lib/query-client";

export function useProcessLoan() {
  return useMutation({
    mutationFn: (loanId: string) => processLoan(loanId),
    onSuccess: (updatedLoan) => {
      // Refresh the individual loan and the loans list
      queryClient.setQueryData(["loan", updatedLoan.id], updatedLoan);
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
    },
  });
}
