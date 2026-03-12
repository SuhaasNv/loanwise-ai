import { useParams, Link } from "react-router-dom";
import { useLoan } from "@/hooks/useLoans";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskMeter } from "@/components/RiskMeter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, User, Brain, Mail, Shield, Gift } from "lucide-react";
import { mockGeneratedEmail, mockRecommendations } from "@/lib/mock-data";
import { motion } from "framer-motion";

export default function LoanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: loan, isLoading } = useLoan(id ?? "");

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
  const biasScore = 0.08;
  const toxicityScore = 0.03;

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
      </motion.div>

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
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">ML Risk Prediction</CardTitle></CardHeader>
            <CardContent className="space-y-6">
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
                  <p className="text-3xl font-bold font-mono">94%</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Feature Importance</p>
                <div className="space-y-2">
                  {[
                    { feature: "Credit Score", importance: 0.35 },
                    { feature: "Debt-to-Income Ratio", importance: 0.25 },
                    { feature: "Income", importance: 0.20 },
                    { feature: "Employment History", importance: 0.12 },
                    { feature: "Loan Amount", importance: 0.08 },
                  ].map((f) => (
                    <div key={f.feature} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-40 shrink-0">{f.feature}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-full" style={{ width: `${f.importance * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{(f.importance * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">AI Generated Email</CardTitle>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" /> Regenerate
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-secondary/30 rounded-lg p-4 font-sans">{mockGeneratedEmail}</pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Bias & Toxicity Detection</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Bias Score</p>
                  <p className="text-3xl font-bold text-success">{(biasScore * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Below threshold (15%)</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Toxicity Score</p>
                  <p className="text-3xl font-bold text-success">{(toxicityScore * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Below threshold (10%)</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="default" className="bg-success text-success-foreground">Passed</Badge>
                  <p className="text-xs text-muted-foreground mt-1">No bias or toxicity detected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockRecommendations.map((rec) => (
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
