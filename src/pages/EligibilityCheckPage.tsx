import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ShieldCheck,
  BarChart3,
  Info,
} from "lucide-react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  income: z.coerce.number().min(1000, "Must be at least $1,000"),
  creditScore: z.coerce.number().min(300).max(850, "300–850"),
  loanAmount: z.coerce.number().min(1000, "Must be at least $1,000"),
  debtToIncomeRatio: z.coerce.number().min(0).max(1, "0–100%"),
  employmentType: z.string().min(1, "Required"),
  loanPurpose: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

interface EligibilityResult {
  riskScore: number;
  approvalProbability: number;
  decision: "approved" | "denied";
  confidence: number;
  factors: Array<{
    name: string;
    value: string;
    impact: "positive" | "negative" | "neutral";
    contribution: number;
    detail: string;
    threshold: string;
  }>;
  blockers: Array<{ name: string; value: string; detail: string }>;
  suggestions: string[];
  suggestedLoanAmount: number | null;
  message: string;
}

export default function EligibilityCheckPage() {
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Eligibility Check — LoanWise AI";
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      debtToIncomeRatio: 0.3,
      employmentType: "Full-time",
      loanPurpose: "Home Purchase",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient<EligibilityResult>("/loan/eligibility-check", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setResult(res);
    } catch {
      setError("Unable to check eligibility right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const approvalPct = result ? Math.round(result.approvalProbability * 100) : 0;

  return (
    <PublicPageLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
            No sign-in required
          </Badge>
          <h1 className="text-4xl font-extrabold text-white">
            Check Your Eligibility
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Know your approval odds in 30 seconds — before you apply. Our AI
            model gives you an instant, honest assessment of your loan profile.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Annual Income */}
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-300">Annual Income (SGD)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 80000"
                  {...register("income")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                />
                {errors.income && (
                  <p className="text-xs text-red-400">{errors.income.message}</p>
                )}
              </div>

              {/* Credit Score */}
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-300">Credit Score (300–850)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 720"
                  {...register("creditScore")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                />
                {errors.creditScore && (
                  <p className="text-xs text-red-400">{errors.creditScore.message}</p>
                )}
              </div>

              {/* Loan Amount */}
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-300">Loan Amount (SGD)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 250000"
                  {...register("loanAmount")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                />
                {errors.loanAmount && (
                  <p className="text-xs text-red-400">{errors.loanAmount.message}</p>
                )}
              </div>

              {/* DTI */}
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-300">
                  Debt-to-Income Ratio
                  <span className="ml-1 text-slate-500">(0–100%)</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 0.30 for 30%"
                    {...register("debtToIncomeRatio")}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                  />
                </div>
                {errors.debtToIncomeRatio && (
                  <p className="text-xs text-red-400">{errors.debtToIncomeRatio.message}</p>
                )}
                <p className="text-xs text-slate-500">Enter as decimal: 0.30 = 30%</p>
              </div>

              {/* Employment Type */}
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-300">Employment Type</Label>
                <Select
                  defaultValue="Full-time"
                  onValueChange={(v) => setValue("employmentType", v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Full-time", "Part-time", "Self-employed", "Contract", "Unemployed", "Retired", "Student"].map(
                      (opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Loan Purpose */}
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-300">Loan Purpose</Label>
                <Select
                  defaultValue="Home Purchase"
                  onValueChange={(v) => setValue("loanPurpose", v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Home Purchase",
                      "Refinance",
                      "Auto",
                      "Personal",
                      "Business",
                      "Education",
                      "Medical",
                      "Debt Consolidation",
                      "Other",
                    ].map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-400">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                This check uses our AI heuristic model for an instant estimate. Final decisions may
                differ based on full verification. No credit inquiry is made.
              </span>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-500 text-[#0A0F1C] hover:bg-cyan-400 font-semibold h-11 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  Check My Eligibility <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Decision banner */}
              <div
                className={`flex items-start gap-4 rounded-2xl border p-6 ${
                  result.decision === "approved"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                    result.decision === "approved" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  {result.decision === "approved" ? (
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  ) : (
                    <XCircle className="h-7 w-7 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-xl font-bold ${
                      result.decision === "approved" ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {result.decision === "approved"
                      ? "Likely to Qualify"
                      : "Profile Needs Improvement"}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{result.message}</p>
                </div>
              </div>

              {/* Score cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Approval Probability */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                  <BarChart3 className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-3xl font-extrabold text-white">{approvalPct}%</p>
                  <p className="text-xs text-slate-400 mt-1">Approval Probability</p>
                  {/* Mini progress bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        approvalPct >= 60
                          ? "bg-emerald-400"
                          : approvalPct >= 40
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${approvalPct}%` }}
                    />
                  </div>
                </div>

                {/* Risk Score */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                  <ShieldCheck className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-3xl font-extrabold text-white">
                    {(result.riskScore * 100).toFixed(0)}
                    <span className="text-lg font-normal text-slate-400">/100</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Risk Score (lower = better)</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        result.riskScore < 0.4
                          ? "bg-emerald-400"
                          : result.riskScore < 0.6
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${result.riskScore * 100}%` }}
                    />
                  </div>
                </div>

                {/* Confidence */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                  <TrendingUp className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-3xl font-extrabold text-white">
                    {(result.confidence * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Model Confidence</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Factors */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Factor Breakdown
                </h2>
                <div className="space-y-2.5">
                  {result.factors.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
                    >
                      <div className="mt-0.5">
                        {f.impact === "positive" ? (
                          <TrendingDown className="h-4 w-4 text-emerald-400" />
                        ) : f.impact === "negative" ? (
                          <TrendingUp className="h-4 w-4 text-red-400" />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{f.name}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              f.impact === "positive"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : f.impact === "negative"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-slate-500/20 text-slate-400"
                            }`}
                          >
                            {f.value}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{f.detail}</p>
                        <p className="text-xs text-slate-600 mt-0.5">Guideline: {f.threshold}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-400" />
                    <h2 className="text-sm font-semibold text-white">Recommendations to Improve</h2>
                  </div>
                  <ul className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div>
                  <p className="font-semibold text-white">
                    {result.decision === "approved"
                      ? "Ready to apply? Submit your full application."
                      : "Work on your profile, then apply when ready."}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Full application includes a complete AI review with personalised recommendations.
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5" asChild>
                    <Link to="/contact">Get Help</Link>
                  </Button>
                  <Button className="bg-cyan-500 text-[#0A0F1C] hover:bg-cyan-400" asChild>
                    <Link to="/sign-up">
                      Apply Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicPageLayout>
  );
}
