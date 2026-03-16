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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/StatCard";
import { useMyLoans } from "@/hooks/useMyLoans";
import type { Loan, LoanDecision, LoanStatus } from "@/types/loan";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const COLORS = {
  approved: "hsl(142 76% 36%)",
  denied: "hsl(0 84% 60%)",
  pending: "hsl(38 92% 50%)",
  processing: "hsl(217 91% 60%)",
  withdrawn: "hsl(215 16% 47%)",
};

function decisionBadge(decision: LoanDecision) {
  switch (decision) {
    case "approved":
      return (
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
        </Badge>
      );
    case "denied":
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700">
          <XCircle className="mr-1 h-3 w-3" /> Denied
        </Badge>
      );
    default:
      return (
        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
  }
}

function statusLabel(status: LoanStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
    case "processing":
      return "Processing";
    case "pending_review":
      return "Awaiting Decision";
    case "withdrawn":
      return "Withdrawn";
    default:
      return "Queued";
  }
}

function LoanCard({ loan, index }: { loan: Loan; index: number }) {
  const isPending =
    loan.status === "queued" ||
    loan.status === "processing" ||
    loan.status === "pending_review" ||
    loan.status === "in_progress";
  const isApproved = loan.decision === "approved" && loan.status === "completed";
  const isDenied = loan.decision === "denied" && loan.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/portal/application/${loan.id}`}>
        <Card className="group cursor-pointer border-slate-200 transition-all hover:shadow-lg hover:border-blue-200/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 min-w-0 flex-1">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900 text-lg">
                      ${loan.loanAmount.toLocaleString()}
                    </p>
                    <span className="text-slate-400">·</span>
                    <p className="text-slate-600 font-medium">{loan.loanPurpose}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {loan.id} ·{" "}
                    {new Date(loan.applicationDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {isPending && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {statusLabel(loan.status)}
                      </div>
                      <Progress
                        value={loan.status === "queued" ? 20 : loan.status === "processing" ? 60 : 85}
                        className="h-1.5"
                      />
                    </div>
                  )}
                  {isApproved && (
                    <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Next: Contact us to finalize your loan
                    </p>
                  )}
                  {isDenied && (
                    <p className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      View alternative products
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {decisionBadge(loan.decision)}
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function CustomerHomePage() {
  const { user } = useUser();
  const { data, isLoading, isError, refetch } = useMyLoans(user?.id);

  const loans = data?.items ?? [];
  const firstName = user?.firstName ?? "there";

  // Derive stats from user's loans
  const totalLoans = loans.length;
  const approvedCount = loans.filter(
    (l) => l.decision === "approved" && l.status === "completed"
  ).length;
  const pendingCount = loans.filter(
    (l) =>
      l.status === "queued" ||
      l.status === "processing" ||
      l.status === "pending_review" ||
      l.status === "in_progress"
  ).length;
  const deniedCount = loans.filter(
    (l) => l.decision === "denied" && l.status === "completed"
  ).length;

  const chartData = [
    { name: "Approved", value: approvedCount, color: COLORS.approved },
    { name: "Pending", value: pendingCount, color: COLORS.pending },
    { name: "Denied", value: deniedCount, color: COLORS.denied },
  ].filter((d) => d.value > 0);

  const approvalRate =
    totalLoans > 0 ? Math.round((approvedCount / totalLoans) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageTitle title="My Applications" />
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track and manage your loan applications. Get AI-powered decisions in
          minutes.
        </p>
      </motion.div>

      {isLoading && (
        <LoadingSpinner size="lg" label="Loading your applications…" className="py-20" />
      )}

      {isError && (
        <motion.div {...fadeIn}>
          <ErrorMessage
            message="Failed to load your applications."
            onRetry={() => refetch()}
          />
        </motion.div>
      )}

      {!isLoading && !isError && loans.length === 0 && (
        <motion.div
          {...fadeIn}
          className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-24 text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50">
            <Sparkles className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-800">
            No applications yet
          </h2>
          <p className="mb-8 max-w-md text-slate-500">
            You haven't submitted any loan applications. Apply now and get an
            AI-powered decision in seconds. Our intelligent system evaluates
            your profile fairly and transparently.
          </p>
          <Link to="/portal/apply">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Apply for a Loan
            </Button>
          </Link>
          <div className="mt-10 flex gap-8 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" /> AI-powered decisions
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Minutes, not days
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Transparent process
            </span>
          </div>
        </motion.div>
      )}

      {!isLoading && loans.length > 0 && (
        <>
          {/* Stat cards */}
          <motion.div
            {...fadeIn}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard
              title="Total Applications"
              value={totalLoans}
              icon={FileText}
              subtitle="all time"
              isLoading={false}
            />
            <StatCard
              title="Approved"
              value={approvedCount}
              icon={CheckCircle2}
              subtitle={
                totalLoans > 0 ? `${approvalRate}% of ${totalLoans} total` : "—"
              }
              isLoading={false}
            />
            <StatCard
              title="Pending"
              value={pendingCount}
              icon={Hourglass}
              subtitle="in progress"
              isLoading={false}
            />
            <StatCard
              title="Total Requested"
              value={`$${loans
                .reduce((sum, l) => sum + l.loanAmount, 0)
                .toLocaleString()}`}
              icon={DollarSign}
              subtitle="across all applications"
              isLoading={false}
            />
          </motion.div>

          {/* Chart + Quick action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Your Application Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                          >
                            {chartData.map((entry, i) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 8,
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--card))",
                              fontSize: 12,
                            }}
                            formatter={(value: number) => [value, "Applications"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Submit applications to see your overview
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Quick Action
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center">
                  <Link to="/portal/apply">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Application
                    </Button>
                  </Link>
                  <p className="mt-3 text-xs text-muted-foreground text-center">
                    Start a new loan application. Our AI will evaluate your
                    profile in minutes.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Loan list */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Your Applications
              </h2>
              <Link
                to="/portal/apply"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + New
              </Link>
            </div>
            <div className="space-y-3">
              {loans.map((loan, i) => (
                <LoanCard key={loan.id} loan={loan} index={i} />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
