import { useQuery } from "@tanstack/react-query";
import { getMyLoans } from "@/lib/api/loans";

export function useMyLoans(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-loans", userId],
    queryFn: () => getMyLoans(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
