import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageTitle } from "@/components/PageTitle";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLoan } from "@/hooks/useLoans";
import { useGenerateEmail } from "@/hooks/useGenerateEmail";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useProcessLoan } from "@/hooks/useProcessLoan";
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

export default function LoanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: loan, isLoading } = useLoan(id ?? "");

  const emailMutation = useGenerateEmail();
  const recsMutation = useRecommendations();
  const processMutation = useProcessLoan();

  const isQueued = loan?.status === "queued" || loan?.status === "processing" || loan?.decision === "pending";

  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    if (loan?.managerNotes != null) setNotes(loan.managerNotes);
  }, [loan?.managerNotes]);

  // Auto-fetch AI data for completed loans
  useEffect(() => {
    if (!loan || isQueued) return;
    if (!emailMutation.data && !emailMutation.isPending) {
      emailMutation.mutate({
        loanId: loan.id,
        decision: loan.decision,
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
              <StatusBadge status={loan.decision} />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {loan.id} · Applied {loan.applicationDate}
            </p>
          </div>
        </div>
        {(isQueued && loan.status !== "processing") && (
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

      {loan.status === "processing" && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>
            <span className="font-semibold">AI agents running…</span>{" "}
            RiskAssessor → EmailGenerator → BiasDetector → ProductRecommender
          </span>
        </div>
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
