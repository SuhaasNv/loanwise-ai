import { Link } from "react-router-dom";
import { useUser } from "@clerk/react";
import { PageTitle } from "@/components/PageTitle";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
  DollarSign,
  Hourglass,
  Sparkles,
  ArrowRight,
  Zap,
  TrendingUp,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMyLoans } from "@/hooks/useMyLoans";
import type { Loan, LoanDecision, LoanStatus } from "@/types/loan";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  approved: "hsl(142 76% 36%)",
  denied:   "hsl(0 84% 60%)",
  pending:  "hsl(38 92% 50%)",
};

function decisionBadge(decision: LoanDecision) {
  switch (decision) {
    case "approved":
      return (
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
        </Badge>
      );
    case "denied":
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-400">
          <XCircle className="mr-1 h-3 w-3" /> Denied
        </Badge>
      );
    default:
      return (
        <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
  }
}

function statusLabel(status: LoanStatus) {
  switch (status) {
    case "completed":     return "Completed";
    case "in_progress":
    case "processing":    return "Processing";
    case "pending_review":return "Awaiting Decision";
    case "withdrawn":     return "Withdrawn";
    default:              return "Queued";
  }
}

function LoanRow({ loan, index }: { loan: Loan; index: number }) {
  const isPending =
    loan.status === "queued" ||
    loan.status === "processing" ||
    loan.status === "pending_review" ||
    loan.status === "in_progress";
  const isApproved = loan.decision === "approved" && loan.status === "completed";
  const isDenied   = loan.decision === "denied"   && loan.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <Link to={`/portal/application/${loan.id}`}>
        <div className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
            <FileText className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                ${loan.loanAmount.toLocaleString()}
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm">{loan.loanPurpose}</span>
            </div>
            {isPending ? (
              <div className="mt-1.5 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                <span className="text-xs text-slate-400 dark:text-slate-500">{statusLabel(loan.status)}</span>
                <Progress
                  value={loan.status === "queued" ? 20 : loan.status === "processing" ? 60 : 85}
                  className="h-1 w-20"
                />
              </div>
            ) : isApproved ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <ArrowRight className="h-3 w-3" /> Contact us to finalize
              </p>
            ) : isDenied ? (
              <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                <Zap className="h-3 w-3" /> View alternatives
              </p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {loan.id} · {new Date(loan.applicationDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {decisionBadge(loan.decision)}
            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CustomerHomePage() {
  const { user } = useUser();
  const { data, isLoading, isError, refetch } = useMyLoans(user?.id);

  const loans = data?.items ?? [];
  const firstName = user?.firstName ?? "there";

  const totalLoans    = loans.length;
  const approvedCount = loans.filter(l => l.decision === "approved" && l.status === "completed").length;
  const pendingCount  = loans.filter(l => ["queued","processing","pending_review","in_progress"].includes(l.status)).length;
  const deniedCount   = loans.filter(l => l.decision === "denied" && l.status === "completed").length;
  const totalAmount   = loans.reduce((sum, l) => sum + l.loanAmount, 0);
  const approvalRate  = totalLoans > 0 ? Math.round((approvedCount / totalLoans) * 100) : 0;

  const chartData = [
    { name: "Approved", value: approvedCount, color: COLORS.approved },
    { name: "Pending",  value: pendingCount,  color: COLORS.pending  },
    { name: "Denied",   value: deniedCount,   color: COLORS.denied   },
  ].filter(d => d.value > 0);

  const recentLoans = loans.slice(0, 4);

  return (
    <div className="h-full flex flex-col gap-4">
      <PageTitle title="My Applications" />

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-7 text-white shadow-lg"
      >
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 right-20 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-1">Customer Portal</p>
            <h1 className="text-2xl font-bold">Welcome back, {firstName} 👋</h1>
            <p className="text-blue-200 text-sm mt-1">
              {totalLoans > 0
                ? `${totalLoans} application${totalLoans > 1 ? "s" : ""} · ${approvalRate}% approval rate`
                : "AI-powered decisions in minutes"}
            </p>
          </div>
          <Link to="/portal/apply">
            <Button size="default" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm shrink-0 px-5">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Apply Now
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Loading / Error ──────────────────────────────────────────────── */}
      {isLoading && (
        <LoadingSpinner size="lg" label="Loading your applications…" className="py-12" />
      )}
      {isError && (
        <ErrorMessage message="Failed to load your applications." onRetry={() => refetch()} />
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!isLoading && !isError && loans.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center flex-1 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-16 text-center"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/60 dark:to-blue-900/40">
            <Sparkles className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="mb-1.5 text-lg font-bold text-slate-800 dark:text-slate-100">No applications yet</h2>
          <p className="mb-6 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Apply now and get an AI-powered decision in seconds — fair, transparent, and fast.
          </p>
          <Link to="/portal/apply">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-md">
              <PlusCircle className="mr-2 h-4 w-4" />
              Apply for a Loan
            </Button>
          </Link>
          <div className="mt-8 flex gap-6 text-xs text-slate-400 dark:text-slate-500">
            {[
              { icon: Zap, label: "AI decisions" },
              { icon: Clock, label: "Minutes, not days" },
              { icon: CheckCircle2, label: "Transparent" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {label}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      {!isLoading && loans.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col gap-4 flex-1"
        >
          {/* Stat chips */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Total",
                value: totalLoans,
                icon: FileText,
                sub: "applications",
                color: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-50 dark:bg-blue-950/40",
              },
              {
                label: "Approved",
                value: approvedCount,
                icon: CheckCircle2,
                sub: `${approvalRate}% rate`,
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-50 dark:bg-emerald-950/40",
              },
              {
                label: "Pending",
                value: pendingCount,
                icon: Hourglass,
                sub: "in progress",
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-50 dark:bg-amber-950/40",
              },
              {
                label: "Requested",
                value: `$${(totalAmount / 1000).toFixed(0)}k`,
                icon: DollarSign,
                sub: "total amount",
                color: "text-violet-600 dark:text-violet-400",
                bg: "bg-violet-50 dark:bg-violet-950/40",
              },
            ].map(({ label, value, icon: Icon, sub, color, bg }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 p-4 flex items-center gap-4"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart + Loan list */}
          <div className="grid grid-cols-5 gap-4 flex-1 min-h-0">

            {/* Donut chart */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 p-5 flex flex-col"
            >
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Overview</p>
              <div className="flex-1 min-h-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="48%"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          fontSize: 11,
                        }}
                        formatter={(value: number) => [value, "Applications"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No data yet
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 justify-center">
                {[
                  { label: "Approved", color: COLORS.approved, count: approvedCount },
                  { label: "Pending",  color: COLORS.pending,  count: pendingCount  },
                  { label: "Denied",   color: COLORS.denied,   count: deniedCount   },
                ].map(({ label, color, count }) => count > 0 && (
                  <div key={label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{label} <span className="font-semibold text-slate-700 dark:text-slate-300">{count}</span></span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent applications */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="col-span-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 p-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Recent Applications</p>
                <Link
                  to="/portal/apply"
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> New
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 -mr-1">
                {recentLoans.map((loan, i) => (
                  <LoanRow key={loan.id} loan={loan} index={i} />
                ))}
                {loans.length > 4 && (
                  <div className="pt-2 text-center">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      +{loans.length - 4} more · scroll to see all
                    </span>
                  </div>
                )}
              </div>

              {/* AI badge */}
              <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40 px-4 py-2.5">
                <Bot className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  AI agents evaluate every application within minutes — fair and fully explainable.
                </p>
                <TrendingUp className="h-4 w-4 text-blue-400 dark:text-blue-500 shrink-0 ml-auto" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
