import { Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";

type Role = "manager" | "customer";

interface Props {
  role: Role;
  children: ReactNode;
}

export function RoleGuard({ role, children }: Props) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  // Fetch the role from our backend (stored in SQLite)
  const { data: roleData, isLoading: roleLoading } = useUserRole(
    authLoaded && isSignedIn ? user?.id : undefined
  );

  if (!authLoaded || !userLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Not signed in — send to Clerk sign-in
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Still loading role from backend
  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const userRole = (roleData?.role as Role | undefined) ?? "customer";

  if (userRole !== role) {
    return <Navigate to={userRole === "manager" ? "/dashboard" : "/portal"} replace />;
  }

  return <>{children}</>;
}
