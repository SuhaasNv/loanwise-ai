import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageTitle } from "@/components/PageTitle";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLoan } from "@/hooks/useLoans";
import { useGenerateEmail } from "@/hooks/useGenerateEmail";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useProcessLoan } from "@/hooks/useProcessLoan";
import { useSubmitDecision } from "@/hooks/useSubmitDecision";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskMeter } from "@/components/RiskMeter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, RefreshCw, Loader2, User, Brain, Mail,
  Shield, Gift, PlayCircle, ClipboardList, StickyNote, HelpCircle,
  CheckCircle, XCircle, TrendingUp, TrendingDown, Minus,
  Zap, BrainCircuit, AlertCircle, ThumbsUp, ThumbsDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { updateManagerNotes, getLoanAudit, type AuditEntry } from "@/lib/api/loans";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentPipelineProgress } from "@/components/ui/agent-pipeline-progress";

// ─── AI Decision Panel (shown when status = pending_review) ──────────────────

function AiDecisionPanel({
  loan,
  emailData,
  recsData,
  submitDecisionMutation,
}: {
  loan: ReturnType<typeof useLoan>["data"] & object;
  emailData?: { email?: string; biasScore?: number; toxicityScore?: number } | null;
  recsData?: { recommendations?: Array<{ productName: string; type: string; rate: string; matchScore: number; description: string }> } | null;
  submitDecisionMutation: ReturnType<typeof useSubmitDecision>;
}) {
  const isApproveRec = loan.aiRecommendation === "approved";
  const riskPct = Math.round((loan.riskScore ?? 0) * 100);
  const approvalPct = Math.round((loan.approvalProbability ?? 0) * 100);
  const confidencePct = loan.confidence != null ? Math.round(loan.confidence * 100) : null;
  const biasScore = emailData?.biasScore ?? loan.biasScore ?? 0;
  const toxicityScore = emailData?.toxicityScore ?? loan.toxicityScore ?? 0;
  const biasOk = biasScore <= 0.10 && toxicityScore <= 0.10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-50/60 to-white overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200/70 bg-amber-50/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
            <BrainCircuit className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">AI Analysis Complete — Your Decision Required</p>
            <p className="text-xs text-amber-700 mt-0.5">Review the AI findings below, then approve or deny</p>
          </div>
        </div>
        <Badge
          className={`text-sm font-semibold px-3 py-1 ${
            isApproveRec
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : "bg-red-100 text-red-800 border-red-200"
          }`}
        >
          AI Recommends: {isApproveRec ? "Approve" : "Deny"}
        </Badge>
      </div>

      <div className="p-5 space-y-5">
        {/* Key metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Risk Score",
              value: `${riskPct}%`,
              sub: riskPct < 40 ? "Low risk" : riskPct < 65 ? "Moderate" : "High risk",
              color: riskPct < 40 ? "text-emerald-600" : riskPct < 65 ? "text-amber-600" : "text-red-600",
              bg: riskPct < 40 ? "bg-emerald-50 border-emerald-100" : riskPct < 65 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100",
            },
            {
              label: "Approval Probability",
              value: `${approvalPct}%`,
              sub: approvalPct >= 65 ? "Strong" : approvalPct >= 45 ? "Borderline" : "Weak",
              color: approvalPct >= 65 ? "text-emerald-600" : approvalPct >= 45 ? "text-amber-600" : "text-red-600",
              bg: approvalPct >= 65 ? "bg-emerald-50 border-emerald-100" : approvalPct >= 45 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100",
            },
            {
              label: "Model Confidence",
              value: confidencePct != null ? `${confidencePct}%` : "—",
              sub: "AI certainty",
              color: "text-blue-600",
              bg: "bg-blue-50 border-blue-100",
            },
            {
              label: "Bias Check",
              value: biasOk ? "Passed" : "Flagged",
              sub: biasOk ? "No issues detected" : "Review email",
              color: biasOk ? "text-emerald-600" : "text-red-600",
              bg: biasOk ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100",
            },
          ].map((m) => (
            <div key={m.label} className={`rounded-xl border px-4 py-3 ${m.bg}`}>
              <p className="text-xs text-slate-500 mb-1">{m.label}</p>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Decision factors */}
        {Array.isArray(loan.factors) && loan.factors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Decision Factors
            </p>
            <div className="space-y-2">
              {loan.factors.map((f) => {
                const Icon =
                  f.impact === "positive"
                    ? TrendingDown
                    : f.impact === "negative"
                    ? TrendingUp
                    : Minus;
                return (
                  <div
                    key={f.name}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                      f.impact === "positive"
                        ? "border-emerald-100 bg-emerald-50/50"
                        : f.impact === "negative"
                        ? "border-red-100 bg-red-50/50"
                        : "border-slate-100 bg-slate-50/50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        f.impact === "positive"
                          ? "bg-emerald-100 text-emerald-600"
                          : f.impact === "negative"
                          ? "bg-red-100 text-red-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">{f.name}</span>
                        <span className="text-slate-900 font-bold shrink-0">{f.value}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{f.detail}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-mono font-semibold ${
                        f.contribution < 0
                          ? "text-emerald-600"
                          : f.contribution > 0
                          ? "text-red-600"
                          : "text-slate-400"
                      }`}
                    >
                      {f.contribution > 0 ? "+" : ""}{(f.contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Generated email preview */}
        {(emailData?.email ?? loan.generatedEmail) && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              AI-Generated Decision Letter Preview
            </p>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs leading-relaxed text-slate-700 font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
              {emailData?.email ?? loan.generatedEmail}
            </div>
            {!biasOk && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                Potential bias detected in email — review before sending.
              </p>
            )}
          </div>
        )}

        {/* Decision buttons */}
        <div className="border-t border-amber-200/60 pt-5">
          <p className="text-sm font-semibold text-slate-800 mb-3">
            Your Decision
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() =>
                submitDecisionMutation.mutate(
                  { loanId: loan.id, decision: "approved" },
                  {
                    onSuccess: () => toast.success("Loan approved"),
                    onError: () => toast.error("Failed to submit decision"),
                  }
                )
              }
              disabled={submitDecisionMutation.isPending}
              className="flex-1 h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold shadow-sm"
            >
              {submitDecisionMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ThumbsUp className="h-5 w-5" />
              )}
              Approve Loan
              {isApproveRec && (
                <Badge className="ml-1 bg-emerald-500/30 text-emerald-100 border-0 text-xs">
                  AI rec
                </Badge>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                submitDecisionMutation.mutate(
                  { loanId: loan.id, decision: "denied" },
                  {
                    onSuccess: () => toast.success("Loan denied"),
                    onError: () => toast.error("Failed to submit decision"),
                  }
                )
              }
              disabled={submitDecisionMutation.isPending}
              className="flex-1 h-12 gap-2 text-base font-semibold shadow-sm"
            >
              {submitDecisionMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ThumbsDown className="h-5 w-5" />
              )}
              Deny Loan
              {!isApproveRec && (
                <Badge className="ml-1 bg-red-400/30 text-red-100 border-0 text-xs">
                  AI rec
                </Badge>
              )}
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-400 text-center">
            Your decision overrides the AI recommendation if they differ. The decision letter will be updated accordingly.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: loan, isLoading } = useLoan(id ?? "");

  const emailMutation = useGenerateEmail();
  const recsMutation = useRecommendations();
  const processMutation = useProcessLoan();
  const submitDecisionMutation = useSubmitDecision();

  const isQueued = loan?.status === "queued" || loan?.status === "processing" || loan?.decision === "pending";
  const isPendingReview = loan?.status === "pending_review";

  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    if (loan?.managerNotes != null) setNotes(loan.managerNotes);
  }, [loan?.managerNotes]);

  // Auto-fetch AI data for completed loans and pending_review (skip when queued/processing)
  useEffect(() => {
    if (!loan || loan.status === "queued" || loan.status === "processing") return;
    // For pending_review, pipeline already provides generatedEmail; only fetch if missing
    const decisionForEmail = isPendingReview && loan.aiRecommendation ? loan.aiRecommendation : loan.decision;
    if (!emailMutation.data && !emailMutation.isPending && (decisionForEmail === "approved" || decisionForEmail === "denied") && !(isPendingReview && loan.generatedEmail)) {
      emailMutation.mutate({
        loanId: loan.id,
        decision: decisionForEmail,
        applicantName: loan.applicantName,
        loanAmount: loan.loanAmount,
      });
    }
    if (!recsMutation.data && !recsMutation.isPending) {
      recsMutation.mutate({
        loanId: loan.id,
        applicantIncome: loan.income,
        creditScore: loan.creditScore,
      });
    }
  // Intentionally limited — email/rec mutations are stable references
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan?.id, loan?.status]);

  // Poll while processing
  useQuery({
    queryKey: ["loan", id],
    queryFn: () => import("@/lib/api/loans").then((m) => m.getLoan(id!)),
    enabled: !!id && loan?.status === "processing",
    refetchInterval: 3000,
    staleTime: 0,
  });

  const saveNotesMutation = useMutation({
    mutationFn: (n: string) => updateManagerNotes(id!, n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan", id] });
      setNotesDirty(false);
      toast.success("Notes saved");
    },
    onError: () => toast.error("Failed to save notes"),
  });

  const { data: auditLogs } = useQuery<AuditEntry[]>({
    queryKey: ["audit", id],
    queryFn: () => getLoanAudit(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-muted-foreground mb-4">Application not found</p>
        <Link to="/loans">
          <Button variant="outline" size="sm">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  const approvalProb = loan.approvalProbability != null && loan.approvalProbability > 0
    ? (loan.approvalProbability * 100).toFixed(1)
    : ((1 - loan.riskScore) * 100).toFixed(1);
  const biasScore = emailMutation.data?.biasScore ?? loan.biasScore ?? 0;
  const toxicityScore = emailMutation.data?.toxicityScore ?? loan.toxicityScore ?? 0;
  const biasThreshold = 0.10;
  const biasEmailLoading = emailMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <PageTitle title={`${loan.applicantName} — ${loan.id}`} />
      <Breadcrumb items={[{ label: "Loan Applications", to: "/loans" }, { label: loan.id }]} />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Link to="/loans">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Back to applications">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{loan.applicantName}</h1>
              <StatusBadge status={isPendingReview ? "pending_review" : loan.decision} />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {loan.id} · Applied {loan.applicationDate}
            </p>
          </div>
        </div>
        {(isQueued && loan.status !== "processing" && !isPendingReview) && (
          <Button
            onClick={() => processMutation.mutate(loan.id)}
            disabled={processMutation.isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {processMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {processMutation.isPending ? "Starting…" : "Run AI Analysis"}
          </Button>
        )}
      </motion.div>

      {loan.status === "queued" && !processMutation.isPending && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Awaiting review.</span> Click{" "}
          <strong>Run AI Analysis</strong> to evaluate and issue a decision.
        </div>
      )}

      {(loan.status === "processing") && (
        <AgentPipelineProgress isRunning={loan.status === "processing"} />
      )}

      {isPendingReview && (
        <AiDecisionPanel
          loan={loan}
          emailData={emailMutation.data}
          recsData={recsMutation.data}
          submitDecisionMutation={submitDecisionMutation}
        />
      )}

      {loan.status === "withdrawn" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          This application was withdrawn by the customer.
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-9 flex-wrap">
          <TabsTrigger value="overview" className="text-xs gap-1.5">
            <User className="h-3 w-3" />Overview
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs gap-1.5">
            <Brain className="h-3 w-3" />Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="email" className="text-xs gap-1.5">
            <Mail className="h-3 w-3" />AI Email
          </TabsTrigger>
          <TabsTrigger value="bias" className="text-xs gap-1.5">
            <Shield className="h-3 w-3" />Bias Detection
          </TabsTrigger>
          <TabsTrigger value="offers" className="text-xs gap-1.5">
            <Gift className="h-3 w-3" />Next Best Offer
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs gap-1.5">
            <StickyNote className="h-3 w-3" />Notes
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1.5">
            <ClipboardList className="h-3 w-3" />Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Financial Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Annual Income" value={`$${loan.income.toLocaleString()}`} />
                <InfoRow label="Credit Score" value={loan.creditScore.toString()} />
                <InfoRow label="Debt-to-Income" value={`${(loan.debtToIncomeRatio * 100).toFixed(0)}%`} />
                <InfoRow label="Loan Amount" value={`$${loan.loanAmount.toLocaleString()}`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Employment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Type" value={loan.employmentType} />
                <InfoRow label="Purpose" value={loan.loanPurpose} />
                <InfoRow label="Status" value={<StatusBadge status={loan.status} />} />
              </CardContent>
            </Card>
              <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm font-medium">Risk Summary</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Risk Score: 0–100% probability of default. Below 40% is low risk, above 60% is high risk.
                      Approval Probability is the inverse — the higher, the better.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <RiskMeter score={loan.riskScore} size="lg" />
                <InfoRow label="Approval Probability" value={`${approvalProb}%`} />
                <InfoRow label="Decision" value={<StatusBadge status={loan.decision} />} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Risk Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Approval Probability</p>
                    <p className="text-3xl font-bold text-primary">{approvalProb}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <RiskMeter score={loan.riskScore} size="lg" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Model Confidence</p>
                    <p className="text-3xl font-bold font-mono">
                      {loan.confidence != null && loan.confidence > 0
                        ? `${Math.round(loan.confidence * 100)}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Array.isArray(loan.factors) && loan.factors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Decision Factors (Explainability)</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Each factor's contribution to the final risk score, based on industry-standard thresholds.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loan.factors.map((f) => (
                    <div key={f.name} className="rounded-lg border border-border bg-secondary/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{f.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              f.impact === "positive"
                                ? "bg-green-100 text-green-700"
                                : f.impact === "negative"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {f.impact === "positive" ? "↓ Reduces risk" : f.impact === "negative" ? "↑ Adds risk" : "Neutral"}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground mt-0.5">{f.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{f.detail}</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">Guideline: {f.threshold}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-mono font-bold ${
                            f.contribution < 0 ? "text-green-600" : f.contribution > 0 ? "text-red-600" : "text-slate-500"
                          }`}>
                            {f.contribution > 0 ? "+" : ""}{(f.contribution * 100).toFixed(1)}%
                          </span>
                          <p className="text-xs text-muted-foreground">risk delta</p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            f.impact === "positive" ? "bg-green-500" : f.impact === "negative" ? "bg-red-500" : "bg-slate-400"
                          }`}
                          style={{ width: `${Math.min(100, Math.abs(f.contribution) * 300)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">AI Generated Email</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={emailMutation.isPending}
                onClick={() =>
                  emailMutation.mutate({
                    loanId: loan.id,
                    decision: loan.decision,
                    applicantName: loan.applicantName,
                    loanAmount: loan.loanAmount,
                  })
                }
                aria-label="Regenerate email"
              >
                {emailMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {emailMutation.isPending ? "Generating…" : "Regenerate"}
              </Button>
            </CardHeader>
            <CardContent>
              {emailMutation.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : emailMutation.isError ? (
                <p className="text-sm text-destructive">Failed to generate email. Click Regenerate to retry.</p>
              ) : (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-secondary/30 rounded-lg p-4 font-sans">
                  {emailMutation.data?.email ?? loan.generatedEmail ?? "Click Regenerate to generate a decision letter."}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Bias & Toxicity Detection</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Bias Score measures discriminatory language against protected groups (race, gender, religion).
                    Toxicity Score measures harmful or offensive tone. Both should be below 10%.
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {biasEmailLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Bias Score</p>
                    <p className={`text-3xl font-bold ${biasScore > biasThreshold ? "text-destructive" : "text-emerald-600"}`}>
                      {(biasScore * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Threshold: {(biasThreshold * 100).toFixed(0)}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Toxicity Score</p>
                    <p className={`text-3xl font-bold ${toxicityScore > biasThreshold ? "text-destructive" : "text-emerald-600"}`}>
                      {(toxicityScore * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Threshold: {(biasThreshold * 100).toFixed(0)}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Status</p>
                    {biasScore <= biasThreshold && toxicityScore <= biasThreshold ? (
                      <>
                        <Badge className="bg-emerald-100 text-emerald-700">Passed</Badge>
                        <p className="text-xs text-muted-foreground mt-1">No bias or toxicity detected</p>
                      </>
                    ) : (
                      <>
                        <Badge variant="destructive">Flagged</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Review required before sending</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          {recsMutation.isPending ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2"><Skeleton className="h-4 w-36" /></CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-8 w-full mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(recsMutation.data?.recommendations ?? loan.recommendations ?? []).map((rec) => (
                <Card key={rec.productName} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{rec.productName}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{rec.matchScore}% match</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">{rec.type}</p>
                    <p className="text-lg font-bold font-mono">{rec.rate}</p>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Manager Notes</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Internal notes — not visible to the applicant.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                placeholder="Add internal notes about this application…"
                rows={6}
                className="text-sm resize-none"
              />
              <Button
                onClick={() => saveNotesMutation.mutate(notes)}
                disabled={!notesDirty || saveNotesMutation.isPending}
                size="sm"
              >
                {saveNotesMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {(auditLogs ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No audit events yet.</p>
              ) : (
                <ol className="relative border-l border-border space-y-4 pl-6">
                  {(auditLogs ?? []).map((entry) => (
                    <li key={entry.id} className="relative">
                      <div className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full bg-primary/30 ring-2 ring-background" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium capitalize">{entry.action.replace(/_/g, " ")}</p>
                          {entry.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>
                          )}
                        </div>
                        <time className="text-xs text-muted-foreground shrink-0">
                          {new Date(entry.timestamp).toLocaleString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
