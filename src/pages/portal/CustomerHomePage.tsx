import { Link } from "react-router-dom";
import { useUser } from "@clerk/react";
import { PageTitle } from "@/components/PageTitle";
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMyLoans } from "@/hooks/useMyLoans";
import type { Loan, LoanDecision, LoanStatus } from "@/types/loan";

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
      return "In Progress";
    default:
      return "Queued";
  }
}

function LoanCard({ loan }: { loan: Loan }) {
  return (
    <Link to={`/portal/application/${loan.id}`}>
      <Card className="cursor-pointer border-slate-200 transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                ${loan.loanAmount.toLocaleString()} — {loan.loanPurpose}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                {new Date(loan.applicationDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {" · "}
                {statusLabel(loan.status)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {decisionBadge(loan.decision)}
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CustomerHomePage() {
  const { user } = useUser();
  const { data, isLoading, isError } = useMyLoans(user?.id);

  const loans = data?.items ?? [];
  const firstName = user?.firstName ?? "there";

  return (
    <div>
      <PageTitle title="My Applications" />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}</h1>
          <p className="mt-1 text-slate-500">Track and manage your loan applications.</p>
        </div>
        <Link to="/portal/apply">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading your applications…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          Failed to load applications. Please try refreshing.
        </div>
      )}

      {!isLoading && !isError && loans.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-slate-800">No applications yet</h2>
          <p className="mb-6 max-w-sm text-sm text-slate-500">
            You haven't submitted any loan applications. Apply now and get an AI-powered decision
            in seconds.
          </p>
          <Link to="/portal/apply">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Apply for a Loan
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && loans.length > 0 && (
        <div className="space-y-3">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </div>
  );
}
