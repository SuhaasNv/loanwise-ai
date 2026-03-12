import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoans } from "@/hooks/useLoans";
import { StatusBadge } from "@/components/StatusBadge";
import { Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AIDecisionsPage() {
  const { data: loans } = useLoans();
  const decided = loans?.filter((l) => l.decision === "approved" || l.decision === "denied") ?? [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">AI Decisions</h1>
        <p className="text-sm text-muted-foreground mt-1">Review all AI-powered loan decisions</p>
      </motion.div>

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
                <div className="flex items-center gap-1.5 pt-1 text-xs text-primary">
                  <Brain className="h-3 w-3" />
                  <span>AI confidence: {loan.riskScore < 0.3 ? "94%" : loan.riskScore < 0.6 ? "82%" : "76%"}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
