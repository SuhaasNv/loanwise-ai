import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, WifiOff, X, FlaskConical } from "lucide-react";
import { checkApiHealth } from "@/lib/api-client";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === "true";

type BannerState = "hidden" | "offline" | "error" | "mock";

/**
 * Sticky top banner that surfaces three conditions:
 * 1. mock mode — when VITE_USE_MOCK_DATA=true
 * 2. offline — backend health check fails on mount
 * 3. api error — any TanStack Query error state is active
 */
export function ApiBanner() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BannerState>(USE_MOCK ? "mock" : "hidden");
  const [dismissed, setDismissed] = useState(false);

  // Health check on mount (skip in mock mode)
  useEffect(() => {
    if (USE_MOCK || dismissed) return;

    checkApiHealth().then((healthy) => {
      if (!healthy) setState("offline");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch query cache for errors
  useEffect(() => {
    if (USE_MOCK || dismissed) return;

    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.query.state.status === "error") {
        setState((prev) => (prev === "offline" ? "offline" : "error"));
      }
    });
    return unsub;
  }, [queryClient, dismissed]);

  if (dismissed || state === "hidden") return null;

  const configs = {
    mock: {
      bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-300",
      icon: <FlaskConical className="h-4 w-4 shrink-0" />,
      message: "Mock mode is active — using local fixture data. Set VITE_USE_MOCK_DATA=false to connect to the real backend.",
    },
    offline: {
      bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
      icon: <WifiOff className="h-4 w-4 shrink-0" />,
      message: "Backend unreachable. Check that VITE_API_URL is correct and the server is running.",
    },
    error: {
      bg: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800",
      text: "text-red-800 dark:text-red-300",
      icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
      message: "One or more API requests failed. Some data may be unavailable.",
    },
  } as const;

  const cfg = configs[state];

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 text-xs border-b ${cfg.bg} ${cfg.text}`}
      role="alert"
    >
      {cfg.icon}
      <span className="flex-1">{cfg.message}</span>
      {state !== "mock" && (
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
