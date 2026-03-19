import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { withdrawLoan, expressInterest } from "@/lib/api/loans";
import { toast } from "sonner";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  BrainCircuit,
  Sparkles,
  Loader2,
  AlertCircle,
  Hourglass,
  TrendingUp,
  TrendingDown,
  Minus,
  HandshakeIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLoan } from "@/lib/api/loans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LoanDecision, RiskFactor } from "@/types/loan";

// ─── Decision banner ──────────────────────────────────────────────────────────

function DecisionBanner({ decision }: { decision: LoanDecision }) {
  if (decision === "approved") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Congratulations! Approved</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Your loan application has been approved. A loan officer will contact you within 2 business days.
          </p>
        </div>
      </div>
    );
  }
  if (decision === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500">
          <XCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-red-800 dark:text-red-300">Application Denied</p>
          <p className="text-sm text-red-600 dark:text-red-400">
            We were unable to approve your application at this time. See recommended alternatives below.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500">
        <Clock className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-amber-800 dark:text-amber-300">Under Review</p>
        <p className="text-sm text-amber-600 dark:text-amber-400">Your application is being processed by our AI agents.</p>
      </div>
    </div>
  );
}

// ─── Agent steps ──────────────────────────────────────────────────────────────

const AGENT_STEPS = [
  { name: "RiskAssessor", icon: BrainCircuit, desc: "Credit risk evaluation" },
  { name: "EmailGenerator", icon: Sparkles, desc: "Decision email generation" },
  { name: "BiasDetector", icon: ShieldCheck, desc: "Fairness & bias check" },
  { name: "ProductRecommender", icon: Zap, desc: "Alternative products" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplicationStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [emailExpanded, setEmailExpanded] = useState(false);

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawLoan(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan", id] });
      qc.invalidateQueries({ queryKey: ["my-loans"] });
      toast.success("Application withdrawn successfully");
      navigate("/portal");
    },
    onError: () => toast.error("Failed to withdraw application. Please try again."),
  });

  // Poll every 5 s while queued; stop once completed
  const { data: loan, isLoading, isError } = useQuery({
    queryKey: ["loan", id],
    queryFn: () => getLoan(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d || d.status !== "completed") return 5000;
      return false;
    },
    staleTime: 0,
  });

  if (isLoading && !loan) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading application…
      </div>
    );
  }

  if (isError || !loan) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center text-slate-500">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p>Application not found.</p>
        <Button variant="outline" asChild>
          <Link to="/portal">Back to My Applications</Link>
        </Button>
      </div>
    );
  }

  const isQueued = loan.status !== "completed";
  const isCompleted = loan.status === "completed";

  // ── Pending / awaiting manager review ─────────────────────────────────────
  if (isQueued) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100" asChild>
          <Link to="/portal">
            <ChevronLeft className="mr-1 h-4 w-4" />
            My Applications
          </Link>
        </Button>

        <div className="rounded-2xl border border-blue-100 dark:border-blue-900 bg-gradient-to-b from-blue-50 dark:from-blue-950/40 to-white dark:to-slate-900/40 p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/50">
            <Hourglass className="h-8 w-8 animate-pulse text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">Application Received — Thank You!</h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Your application has been submitted successfully. Our team will review it and our AI
            agents will evaluate your profile and issue a decision shortly.
          </p>
          <div className="mx-auto max-w-xs space-y-2 text-left">
            {[
              { label: "Application ID", value: loan.id },
              { label: "Loan Amount", value: `$${loan.loanAmount.toLocaleString()}` },
              { label: "Purpose", value: loan.loanPurpose },
              {
                label: "Submitted",
                value: new Date(loan.applicationDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              },
            ].map((r) => (
              <div
                key={r.label}
                className="flex justify-between rounded-lg bg-white dark:bg-slate-800/60 px-4 py-2 text-sm shadow-sm ring-1 ring-slate-100 dark:ring-slate-700/60"
              >
                <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{r.value}</span>
              </div>
            ))}
          </div>
          {/* Status timeline */}
          <div className="mt-8 w-full max-w-sm mx-auto">
            {(() => {
              const steps = [
                { label: "Submitted", desc: "Application received" },
                { label: "AI Processing", desc: "Agents evaluating profile" },
                { label: "Manager Review", desc: "Final human check" },
                { label: "Decision", desc: "Outcome issued" },
              ];
              const activeIdx =
                loan.status === "processing" ? 1
                : loan.status === "pending_review" ? 2
                : 0;
              return (
                <div className="flex flex-col gap-0">
                  {steps.map((step, i) => {
                    const isDone = i < activeIdx;
                    const isActive = i === activeIdx;
                    const isPending = i > activeIdx;
                    return (
                      <div key={step.label} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isDone
                              ? "border-emerald-500 bg-emerald-500"
                              : isActive
                              ? "border-blue-400 bg-blue-400/20"
                              : "border-slate-600 bg-transparent"
                          }`}>
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            ) : isActive ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-slate-600" />
                            )}
                          </div>
                          {i < steps.length - 1 && (
                            <div className={`w-0.5 h-8 mt-0.5 rounded-full transition-colors ${isDone ? "bg-emerald-500" : "bg-slate-700"}`} />
                          )}
                        </div>
                        <div className="pt-0.5 pb-6">
                          <p className={`text-sm font-medium ${isDone ? "text-emerald-400" : isActive ? "text-blue-300" : "text-slate-500"}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-600">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking for updates every 5 seconds…
          </div>
          <div className="mt-4 border-t border-blue-100 dark:border-blue-900 pt-4">
            <button
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              onClick={() => {
                if (confirm("Are you sure you want to withdraw this application? This cannot be undone.")) {
                  withdrawMutation.mutate();
                }
              }}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? "Withdrawing…" : "Withdraw application"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Completed — show full result ───────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100" asChild>
        <Link to="/portal">
          <ChevronLeft className="mr-1 h-4 w-4" />
          My Applications
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Reference ID</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{loan.id}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loan.loanPurpose} · ${loan.loanAmount.toLocaleString()} ·{" "}
            {new Date(loan.applicationDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">Completed</Badge>
      </div>

      {/* Decision banner */}
      <DecisionBanner decision={loan.decision} />

      {/* Explainability — why this decision was made */}
      {Array.isArray(loan.factors) && loan.factors.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Why this decision was made
            </CardTitle>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Each factor is scored against industry-standard lending guidelines.
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {(loan.factors as RiskFactor[]).map((f) => {
              const Icon = f.impact === "positive" ? TrendingDown : f.impact === "negative" ? TrendingUp : Minus;
              return (
                <div
                  key={f.name}
                  className={`rounded-xl border p-3 ${
                    f.impact === "positive"
                      ? "border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30"
                      : f.impact === "negative"
                      ? "border-red-100 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30"
                      : "border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      f.impact === "positive" ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400"
                      : f.impact === "negative" ? "bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{f.name}</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0">{f.value}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{f.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Scores */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Risk Score",
            value: `${Math.round((loan.riskScore ?? 0) * 100)}%`,
            color: (loan.riskScore ?? 0) < 0.4 ? "text-emerald-600" : "text-red-600",
          },
          {
            label: "Approval Probability",
            value: `${Math.round((loan.approvalProbability ?? 0) * 100)}%`,
            color: "text-blue-600",
          },
          {
            label: "AI Confidence",
            value: `${Math.round((loan.confidence ?? 0) * 100)}%`,
            color: "text-slate-700 dark:text-slate-300",
          },
        ].map((s) => (
          <Card key={s.label} className="border-slate-200 dark:border-slate-700 text-center">
            <CardContent className="py-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Pipeline Timeline */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Processing Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {AGENT_STEPS.map((agent) => {
            const Icon = agent.icon;
            const skip = agent.name === "ProductRecommender" && loan.decision !== "denied";
            return (
              <div key={agent.name} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    skip ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {skip ? <Icon className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${skip ? "text-slate-400 dark:text-slate-600" : "text-slate-900 dark:text-slate-100"}`}>
                    {agent.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{agent.desc}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Decision letter */}
      {loan.generatedEmail && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <button
              onClick={() => setEmailExpanded((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Decision Letter (AI Generated)
              </CardTitle>
              {emailExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              )}
            </button>
          </CardHeader>
          {emailExpanded && (
            <CardContent className="pt-0">
              <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                {loan.generatedEmail}
              </pre>
              {(loan.biasScore != null || loan.toxicityScore != null) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Bias score:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {((loan.biasScore ?? 0) * 100).toFixed(1)}%
                  </span>
                  {" · "}Toxicity:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {((loan.toxicityScore ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Product recommendations */}
      {loan.decision === "denied" &&
        Array.isArray(loan.recommendations) &&
        loan.recommendations.length > 0 && (
          <CustomerOffersList loanId={loan.id} recommendations={loan.recommendations} />
        )}

      {/* What-If Simulator — only shown for denied applications */}
      {loan.decision === "denied" && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              What-If Simulator
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Adjust the sliders to see how changes to your profile would affect your approval odds.
              No credit inquiry — instant estimate.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <WhatIfSimulator
              initialCreditScore={loan.creditScore}
              initialDti={loan.debtToIncomeRatio}
              initialLoanAmount={loan.loanAmount}
              initialIncome={loan.income}
              initialEmploymentType={loan.employmentType}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CustomerOffersList({
  loanId,
  recommendations,
}: {
  loanId: string;
  recommendations: NonNullable<import("@/types/loan").Loan["recommendations"]>;
}) {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [interestSent, setInterestSent] = useState<Set<string>>(new Set());

  const interestMutation = useMutation({
    mutationFn: ({ productName }: { productName: string }) =>
      expressInterest(loanId, productName),
    onMutate: ({ productName }) => setLoadingProduct(productName),
    onSettled: () => setLoadingProduct(null),
    onSuccess: (_, { productName }) => {
      setInterestSent((prev) => new Set(prev).add(productName));
      toast.success("Interest recorded! A loan officer will contact you shortly.");
    },
    onError: () => toast.error("Failed to record interest. Please try again."),
  });

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Alternative Products for You
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Based on your profile, these products may be a good fit.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {recommendations.map((rec) => {
          const isPreApproved = rec.matchScore >= 85;
          const mayQualify = rec.matchScore >= 70 && rec.matchScore < 85;
          const sent = interestSent.has(rec.productName);
          const isLoading = loadingProduct === rec.productName;
          return (
            <div key={rec.productName} className={`rounded-xl p-4 border ${isPreApproved ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{rec.productName}</p>
                    {isPreApproved && (
                      <Badge className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                        Pre-qualified
                      </Badge>
                    )}
                    {mayQualify && (
                      <Badge variant="secondary" className="text-[10px]">
                        May qualify
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{rec.description}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">{rec.rate}</p>
                </div>
                <Badge className="shrink-0 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                  {rec.matchScore}% match
                </Badge>
              </div>
              {rec.reason && (
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-2">{rec.reason}</p>
              )}
              <Button
                size="sm"
                variant={isPreApproved ? "default" : "outline"}
                className="w-full mt-3 text-xs gap-1.5"
                disabled={isLoading || sent}
                onClick={() => interestMutation.mutate({ productName: rec.productName })}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : sent ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <HandshakeIcon className="h-3 w-3" />
                )}
                {sent ? "Interest Sent" : "Express Interest"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
