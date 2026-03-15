import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface UserRoleResponse {
  userId: string;
  role: string;
}

export function useUserRole(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-role", userId],
    queryFn: () => apiClient<UserRoleResponse>(`/user/role?userId=${userId}`),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
