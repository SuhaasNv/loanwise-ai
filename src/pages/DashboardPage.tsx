import { FileText, TrendingUp, Activity, Bot } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskMeter } from "@/components/RiskMeter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats, useApprovalTrend, useRiskDistribution, useAgentDecisionsPerHour, useLoans } from "@/hooks/useLoans";
import { useAgentLogs } from "@/hooks/useAgents";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: trend } = useApprovalTrend();
  const { data: riskDist } = useRiskDistribution();
  const { data: agentHour } = useAgentDecisionsPerHour();
  const { data: loans } = useLoans();
  const { data: agents } = useAgentLogs();

  const recentLoans = loans?.slice(0, 5) ?? [];
  const recentAgents = agents?.slice(0, 4) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your loan intelligence platform</p>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applications Today" value={stats?.totalApplications ?? 0} icon={FileText} trend={{ value: 12.5, label: "vs yesterday" }} isLoading={statsLoading} />
        <StatCard title="Approval Rate" value={`${stats?.approvalRate ?? 0}%`} icon={TrendingUp} trend={{ value: 3.2, label: "vs last week" }} isLoading={statsLoading} />
        <StatCard title="Avg Risk Score" value={((stats?.avgRiskScore ?? 0) * 100).toFixed(0) + "%"} icon={Activity} subtitle="across all applications" isLoading={statsLoading} />
        <StatCard title="Active Agents" value={stats?.activeAgents ?? 0} icon={Bot} subtitle="processing in real-time" isLoading={statsLoading} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend ?? []}>
                    <defs>
                      <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                    <Area type="monotone" dataKey="approved" stroke="hsl(var(--primary))" fill="url(#approvedGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="denied" stroke="hsl(var(--destructive))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDist ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Agent Decisions / Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentHour ?? []}>
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                    <Bar dataKey="decisions" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Decisions</CardTitle>
              <Link to="/loans" className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLoans.map((loan) => (
                  <Link key={loan.id} to={`/loans/${loan.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {loan.applicantName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{loan.applicantName}</p>
                        <p className="text-xs text-muted-foreground">${loan.loanAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <StatusBadge status={loan.decision} />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">AI Agent Activity</CardTitle>
            <Link to="/agents" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAgents.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm"><span className="font-medium">{log.agentName}</span> <span className="text-muted-foreground">·</span> <span className="text-muted-foreground">{log.action}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{log.confidenceScore > 0 ? `${(log.confidenceScore * 100).toFixed(0)}%` : "—"}</span>
                    <StatusBadge status={log.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
