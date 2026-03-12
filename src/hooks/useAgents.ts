import { useQuery } from "@tanstack/react-query";
import { mockAgentLogs, type AgentLog } from "@/lib/mock-data";

export function useAgentLogs() {
  return useQuery({
    queryKey: ["agent-logs"],
    queryFn: async (): Promise<AgentLog[]> => {
      await new Promise((r) => setTimeout(r, 500));
      return mockAgentLogs;
    },
  });
}
