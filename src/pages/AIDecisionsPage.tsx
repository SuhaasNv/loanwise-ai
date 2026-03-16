import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoans } from "@/hooks/useLoans";
import { StatusBadge } from "@/components/StatusBadge";
import { Brain, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTitle } from "@/components/PageTitle";

function formatDecisionDateTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: "—", day: "—", time: "—" };
  const hasTime = dateStr.includes("T");
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    day: d.toLocaleDateString("en-US", { weekday: "long" }),
    time: hasTime ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "—",
  };
}

export default function AIDecisionsPage() {
  const { data: loans } = useLoans();
  const decided = loans?.filter((l) => l.decision === "approved" || l.decision === "denied") ?? [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageTitle title="AI Decisions" />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">AI Decisions</h1>
        <p className="text-sm text-muted-foreground mt-1">Review all AI-powered loan decisions</p>
      </motion.div>

      {decided.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <Brain className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm">No completed AI decisions yet. Process a queued loan to see results here.</p>
          <Link to="/loans" className="text-xs text-primary hover:underline">View queued applications →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decided.map((loan) => (
          <Link key={loan.id} to={`/loans/${loan.id}`}>
            <Card className="hover:shadow-md transition-all hover:border-primary/20 cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{loan.applicantName}</CardTitle>
                  <StatusBadge status={loan.decision} />
                </div>
                <p className="text-xs text-muted-foreground font-mono">{loan.id}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Risk Score</span>
                  <span className="font-mono font-medium">{(loan.riskScore * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Loan Amount</span>
                  <span className="font-mono font-medium">${loan.loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Credit Score</span>
                  <span className="font-mono font-medium">{loan.creditScore}</span>
                </div>
                {(() => {
                  const { date, day, time } = formatDecisionDateTime(loan.applicationDate);
                  return (
                    <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground border-t pt-3 mt-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>
                        {date} · {day} · {time}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-1.5 pt-1 text-xs text-primary">
                  <Brain className="h-3 w-3" />
                  <span>
                    AI confidence:{" "}
                    {loan.confidence != null && loan.confidence > 0
                      ? `${Math.round(loan.confidence * 100)}%`
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
