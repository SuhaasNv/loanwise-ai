import { useState, useMemo } from "react";
import { useAgentLogs } from "@/hooks/useAgents";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Bot, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { PageTitle } from "@/components/PageTitle";
import { Link } from "react-router-dom";
import type { AgentLog } from "@/types/agents";

export default function AgentActivityPage() {
  const { data: logs, isLoading } = useAgentLogs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AgentLog | null>(null);

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs.filter((l) => {
      const matchSearch = l.agentName.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [logs, search, statusFilter]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageTitle title="Agent Activity" />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Agent Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor AI agent decisions and actions</p>
      </motion.div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search agents or actions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Agent</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs">Timestamp</TableHead>
                <TableHead className="text-xs">Confidence</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No agent logs found</TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setSelectedLog(log)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedLog(log);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center">
                          <Bot className="h-3.5 w-3.5 text-accent" />
                        </div>
                        <span className="text-sm font-medium">{log.agentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.action}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-mono">{log.confidenceScore > 0 ? `${(log.confidenceScore * 100).toFixed(0)}%` : "—"}</TableCell>
                    <TableCell><StatusBadge status={log.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                  {selectedLog.agentName}
                </DialogTitle>
                <DialogDescription>
                  {new Date(selectedLog.timestamp).toLocaleString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Action</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {selectedLog.action}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Confidence</p>
                    <p className="text-sm font-mono">
                      {selectedLog.confidenceScore > 0
                        ? `${(selectedLog.confidenceScore * 100).toFixed(0)}%`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Status</p>
                    <StatusBadge status={selectedLog.status} />
                  </div>
                </div>
                {selectedLog.applicationId && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Application</p>
                    <Link
                      to={`/loans/${selectedLog.applicationId}`}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-mono"
                      onClick={() => setSelectedLog(null)}
                    >
                      {selectedLog.applicationId}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
