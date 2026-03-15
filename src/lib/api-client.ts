import { mockInterceptor } from "@/lib/mock-client";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === "true";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Module-level token getter, injected by the auth layer (see main.tsx).
 * Keeps apiClient free of React dependencies while still supporting authenticated requests.
 */
type TokenGetter = () => Promise<string | null>;
let _tokenGetter: TokenGetter | null = null;
export function setTokenGetter(fn: TokenGetter): void {
  _tokenGetter = fn;
}

/** User context injected after Clerk loads — sent as request headers. */
interface UserContext {
  userId?: string;
  role?: string;
}
let _userContext: UserContext = {};
export function setUserContext(ctx: UserContext): void {
  _userContext = ctx;
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Mock mode: return fixture data without hitting the network.
  if (USE_MOCK) {
    const mock = await mockInterceptor<T>(endpoint, options);
    if (mock !== null) return mock;
  }

  const token = _tokenGetter ? await _tokenGetter() : null;
  const { userId, role } = _userContext;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(userId && { "X-User-Id": userId }),
      ...(role && { "X-User-Role": role }),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = await res.json();
      message = err.message || err.detail || message;
    } catch {
      // use statusText if body is not JSON
    }
    throw new ApiError(res.status, `API Error ${res.status}: ${message}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Lightweight health-check used by the offline banner.
 * Resolves true when the backend is reachable, false otherwise.
 */
export async function checkApiHealth(): Promise<boolean> {
  if (USE_MOCK) return true;
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
