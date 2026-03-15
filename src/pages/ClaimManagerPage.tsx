import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { BrainCircuit, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

export default function ClaimManagerPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      await apiClient("/user/setup", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          role: "manager",
          managerSecret: secret,
        }),
      });
      // Invalidate the cached role so RoleGuard refetches
      await queryClient.invalidateQueries({ queryKey: ["user-role", user.id] });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid secret or server error."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500">You must be signed in to claim manager access.</p>
          <Button className="mt-4" onClick={() => navigate("/sign-in")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Manager Access</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the manager secret to claim dashboard access.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="font-semibold text-emerald-800">Manager role granted!</p>
            <p className="text-sm text-emerald-600">Redirecting to dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="font-medium text-slate-900">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="secret">Manager Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter secret key…"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || !secret}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {loading ? "Verifying…" : "Claim Manager Access"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
