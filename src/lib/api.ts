// API hooks structured for FastAPI backend integration
// Currently returns mock data — replace baseURL and remove mocks to connect

const API_BASE = "/api";

export async function fetchWithAuth(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      // Add auth header here when integrating
      // "Authorization": `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

// Endpoint structures matching FastAPI backend
export const api = {
  loans: {
    predict: (data: unknown) => fetchWithAuth("/loan/predict", { method: "POST", body: JSON.stringify(data) }),
    email: (data: unknown) => fetchWithAuth("/loan/email", { method: "POST", body: JSON.stringify(data) }),
    recommendation: (data: unknown) => fetchWithAuth("/loan/recommendation", { method: "POST", body: JSON.stringify(data) }),
  },
  analytics: {
    get: () => fetchWithAuth("/analytics"),
  },
  agents: {
    logs: () => fetchWithAuth("/agents/logs"),
  },
};
