import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
import { ArrowLeft, RefreshCw, Loader2, User, Brain, Mail, Shield, Gift, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LoanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: loan, isLoading } = useLoan(id ?? "");

  const emailMutation = useGenerateEmail();
  const recsMutation = useRecommendations();
  const processMutation = useProcessLoan();

  const isQueued = loan?.status === "queued" || loan?.decision === "pending";

  useEffect(() => {
    // Only auto-fetch AI data for completed loans
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loan?.id, isQueued]);

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
        <Link to="/loans"><Button variant="outline" size="sm">Back to Applications</Button></Link>
      </div>
    );
  }

  const approvalProb = ((1 - loan.riskScore) * 100).toFixed(1);
  const biasScore = emailMutation.data?.biasScore ?? 0;
  const toxicityScore = emailMutation.data?.toxicityScore ?? 0;
  const biasThreshold = 0.15;
  const toxicityThreshold = 0.10;
  const biasEmailLoading = emailMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/loans">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{loan.applicantName}</h1>
              <StatusBadge status={loan.decision} />
            </div>
            <p className="text-xs text-muted-foreground font-mono">{loan.id} · Applied {loan.applicationDate}</p>
          </div>
        </div>
        {isQueued && (
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
            {processMutation.isPending ? "Running AI Agents…" : "Run AI Analysis"}
          </Button>
        )}
      </motion.div>

      {isQueued && !processMutation.isPending && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Awaiting review.</span> This application was submitted by the customer and is queued for AI processing. Click <strong>Run AI Analysis</strong> to evaluate and issue a decision.
        </div>
      )}

      {processMutation.isPending && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span className="font-semibold">AI agents running…</span> RiskAssessor → EmailGenerator → BiasDetector → ProductRecommender
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs gap-1.5"><User className="h-3 w-3" />Overview</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs gap-1.5"><Brain className="h-3 w-3" />Risk Analysis</TabsTrigger>
          <TabsTrigger value="email" className="text-xs gap-1.5"><Mail className="h-3 w-3" />AI Email</TabsTrigger>
          <TabsTrigger value="bias" className="text-xs gap-1.5"><Shield className="h-3 w-3" />Bias Detection</TabsTrigger>
          <TabsTrigger value="offers" className="text-xs gap-1.5"><Gift className="h-3 w-3" />Next Best Offer</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Financial Profile</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Annual Income" value={`$${loan.income.toLocaleString()}`} />
                <InfoRow label="Credit Score" value={loan.creditScore.toString()} />
                <InfoRow label="Debt-to-Income" value={`${(loan.debtToIncomeRatio * 100).toFixed(0)}%`} />
                <InfoRow label="Loan Amount" value={`$${loan.loanAmount.toLocaleString()}`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Employment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Type" value={loan.employmentType} />
                <InfoRow label="Purpose" value={loan.loanPurpose} />
                <InfoRow label="Status" value={<StatusBadge status={loan.status} />} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Risk Summary</CardTitle></CardHeader>
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
              <CardHeader><CardTitle className="text-sm font-medium">Risk Assessment Summary</CardTitle></CardHeader>
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
                      {loan.confidence != null ? `${Math.round(loan.confidence * 100)}%` : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Explainability factors */}
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
                      {/* Impact bar */}
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
                <p className="text-sm text-destructive">Failed to generate email. Use the Regenerate button to retry.</p>
              ) : (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-secondary/30 rounded-lg p-4 font-sans">
                  {emailMutation.data?.email ?? ""}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Bias & Toxicity Detection</CardTitle></CardHeader>
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
                    <p className={`text-3xl font-bold ${biasScore > biasThreshold ? "text-destructive" : "text-success"}`}>
                      {(biasScore * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Threshold: {(biasThreshold * 100).toFixed(0)}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Toxicity Score</p>
                    <p className={`text-3xl font-bold ${toxicityScore > toxicityThreshold ? "text-destructive" : "text-success"}`}>
                      {(toxicityScore * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Threshold: {(toxicityThreshold * 100).toFixed(0)}%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Status</p>
                    {biasScore <= biasThreshold && toxicityScore <= toxicityThreshold ? (
                      <>
                        <Badge variant="default" className="bg-success text-success-foreground">Passed</Badge>
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
          ) : recsMutation.isError ? (
            <p className="text-sm text-destructive p-4">Failed to load recommendations.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(recsMutation.data?.recommendations ?? []).map((rec) => (
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
                    <Button variant="outline" size="sm" className="w-full mt-2 text-xs">View Details</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
