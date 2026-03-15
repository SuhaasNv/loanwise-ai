import { useQuery } from "@tanstack/react-query";
import { getAgentLogs } from "@/lib/api/agents";

export function useAgentLogs() {
  return useQuery({
    queryKey: ["agent-logs"],
    queryFn: getAgentLogs,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
