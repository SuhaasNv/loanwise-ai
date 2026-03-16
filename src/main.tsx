import { createRoot } from "react-dom/client";
import { Component, useEffect, type ReactNode } from "react";
import {
  ClerkProvider,
  useAuth,
  useUser,
} from "@clerk/react";
import { Loader2 } from "lucide-react";
import { setTokenGetter, setUserContext, API_BASE } from "@/lib/api-client";
import App from "./App.tsx";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const devSkipAuth = import.meta.env.VITE_DEV_SKIP_AUTH === "true";

// Public paths that never require auth
const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up"];

function isPublicPath(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

// ─── Error Boundary ─────────────────────────────────────────────────────────

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "#fef2f2",
            color: "#7f1d1d",
            fontFamily: "monospace",
            fontSize: "0.875rem",
          }}
        >
          <strong style={{ fontSize: "1rem", marginBottom: "1rem" }}>
            App Error
          </strong>
          <pre style={{ whiteSpace: "pre-wrap", maxWidth: "640px" }}>
            {this.state.error.message}
          </pre>
          <pre
            style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              opacity: 0.7,
              whiteSpace: "pre-wrap",
              maxWidth: "640px",
            }}
          >
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Auth helpers ────────────────────────────────────────────────────────────

/** Registers Clerk's getToken, user ID, and role with apiClient. */
function AuthTokenSync() {
  const { getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    if (!user) return;

    // Set user ID immediately so API calls can fire
    setUserContext({ userId: user.id });

    // Fetch the backend role and inject it into every subsequent request
    fetch(`${API_BASE}/user/role?userId=${user.id}`)
      .then((r) => r.json())
      .then((data: { role?: string }) => {
        if (data.role) {
          setUserContext({ userId: user.id, role: data.role });
        }
      })
      .catch(() => {/* non-blocking */});
  }, [user]);

  return null;
}

/**
 * Post-login redirect: after Clerk sign-in/sign-up, read the user's role
 * from publicMetadata and navigate to the correct home page.
 */
function PostLoginRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const path = window.location.pathname;
    // Only redirect when the user is on sign-in / sign-up pages
    if (!path.startsWith("/sign-in") && !path.startsWith("/sign-up")) return;

    const role = (user.publicMetadata?.role as string | undefined) ?? "customer";
    const target = role === "manager" ? "/dashboard" : "/portal";
    window.location.replace(target);
  }, [isLoaded, isSignedIn, user]);

  return null;
}

/**
 * Auth wrapper: shows a spinner while Clerk loads; then renders the app.
 * Protected routes handle their own auth requirements via RoleGuard.
 * Public routes (/ /sign-in /sign-up) are always rendered without redirect.
 */
function AuthWrapper() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show a minimal spinner while Clerk initialises (only for non-public paths)
  if (!isLoaded && !isPublicPath(window.location.pathname)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          style={{ width: 24, height: 24, animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  return (
    <>
      {isSignedIn && <AuthTokenSync />}
      <PostLoginRedirect />
      <App />
    </>
  );
}

// ─── Root render ─────────────────────────────────────────────────────────────

function Root() {
  if (!publishableKey) {
    throw new Error(
      "Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to your .env.local file. See .env.example for reference."
    );
  }

  // ClerkProvider is always required — SignIn/SignUp components need it.
  // devSkipAuth only skips the auth redirect; we still load Clerk.
  // Fallback redirects: after sign-in/sign-up, go to /portal (RoleGuard sends managers to /dashboard).
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInFallbackRedirectUrl="/portal"
      signUpFallbackRedirectUrl="/portal"
    >
      {devSkipAuth ? (
        <>
          <AuthTokenSync />
          <PostLoginRedirect />
          <App />
        </>
      ) : (
        <AuthWrapper />
      )}
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Root />
  </ErrorBoundary>
);
