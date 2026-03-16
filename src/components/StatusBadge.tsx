import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Approved", variant: "default" },
  denied: { label: "Denied", variant: "destructive" },
  pending: { label: "Pending", variant: "secondary" },
  review: { label: "In Review", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  queued: { label: "Queued", variant: "outline" },
  processing: { label: "Processing", variant: "secondary" },
  pending_review: { label: "Awaiting Decision", variant: "secondary" },
  success: { label: "Success", variant: "default" },
  failure: { label: "Failed", variant: "destructive" },
  running: { label: "Running", variant: "secondary" },
  pass: { label: "Pass", variant: "default" },
  warning: { label: "Warning", variant: "secondary" },
  fail: { label: "Fail", variant: "destructive" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return (
    <Badge variant={config.variant} className={cn("text-xs font-medium", className)}>
      {config.label}
    </Badge>
  );
}
