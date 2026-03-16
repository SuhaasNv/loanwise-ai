import { useState } from "react";
import { usePaginatedLoans } from "@/hooks/useLoans";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskMeter } from "@/components/RiskMeter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { exportLoansCSV } from "@/lib/api/loans";
import { toast } from "sonner";
import { PageTitle } from "@/components/PageTitle";

const PAGE_SIZE = 8;

export default function LoanApplicationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = usePaginatedLoans({
    page: page + 1,
    limit: PAGE_SIZE,
    search: search || undefined,
    decision: decisionFilter !== "all" ? decisionFilter : undefined,
  });

  const paged = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageTitle title="Loan Applications" />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loan Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage all loan applications</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs shrink-0"
          onClick={async () => {
            try {
              const res = await exportLoansCSV({ search: search || undefined, decision: decisionFilter !== "all" ? decisionFilter : undefined });
              if (!res.ok) throw new Error("Export failed");
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "loanwise-export.csv";
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Export downloaded");
            } catch {
              toast.error("Export failed — please try again");
            }
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </motion.div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-8 h-9 text-sm" />
            </div>
            <Select value={decisionFilter} onValueChange={(v) => { setDecisionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="All Decisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Decisions</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Applicant</TableHead>
                <TableHead className="text-xs">Income</TableHead>
                <TableHead className="text-xs">Credit Score</TableHead>
                <TableHead className="text-xs">Loan Amount</TableHead>
                <TableHead className="text-xs">Risk Score</TableHead>
                <TableHead className="text-xs">Decision</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No applications found</TableCell>
                </TableRow>
              ) : (
                paged.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className="cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => navigate(`/loans/${loan.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/loans/${loan.id}`);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                          {loan.applicantName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{loan.applicantName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{loan.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">${loan.income.toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-mono">{loan.creditScore}</TableCell>
                    <TableCell className="text-sm font-mono">${loan.loanAmount.toLocaleString()}</TableCell>
                    <TableCell className="w-32"><RiskMeter score={loan.riskScore} size="sm" showLabel={false} /><span className="text-xs font-mono text-muted-foreground">{(loan.riskScore * 100).toFixed(0)}%</span></TableCell>
                    <TableCell><StatusBadge status={loan.decision} /></TableCell>
                    <TableCell><StatusBadge status={loan.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">{data?.total ?? 0} results</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">{page + 1} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
