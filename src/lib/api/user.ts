import { apiClient } from "@/lib/api-client";

export interface UserRoleResponse {
  userId: string;
  role: "customer" | "manager";
}

export interface UserSetupResponse {
  userId: string;
  role: string;
  success: boolean;
}

export function getUserRole(userId: string) {
  return apiClient<UserRoleResponse>(`/user/role?userId=${encodeURIComponent(userId)}`);
}

export function setupUser(userId: string, role: string, managerSecret?: string) {
  return apiClient<UserSetupResponse>("/user/setup", {
    method: "POST",
    body: JSON.stringify({ userId, role, ...(managerSecret && { managerSecret }) }),
  });
}
