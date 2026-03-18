import { Link } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { type ReactNode } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useUserRole } from "@/hooks/useUserRole";

interface PublicPageLayoutProps {
  children: ReactNode;
}

/**
 * Shared shell for public-facing pages (About, Privacy, Terms, Contact).
 * Uses the same dark branding as the landing page for consistency.
 */
export function PublicPageLayout({ children }: PublicPageLayoutProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { data: roleData } = useUserRole(isSignedIn ? user?.id : undefined);
  const role = (roleData?.role as "manager" | "customer" | undefined) ?? "customer";
  const backTo =
    isSignedIn ? (role === "manager" ? "/dashboard" : "/portal") : "/";

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-200">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0F1C]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to={backTo} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 ring-1 ring-cyan-500/50">
              <BrainCircuit className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <span className="font-bold text-white">LoanWise AI</span>
          </Link>
          <Link
            to={backTo}
            className="text-sm text-slate-400 transition-colors hover:text-cyan-400"
          >
            ← Back to Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">{children}</main>
    </div>
  );
}
