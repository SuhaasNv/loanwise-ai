import { cn } from "@/lib/utils";

interface RiskMeterProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getRiskColor(score: number) {
  if (score <= 0.3) return "text-success";
  if (score <= 0.6) return "text-warning";
  return "text-destructive";
}

function getRiskBg(score: number) {
  if (score <= 0.3) return "bg-success";
  if (score <= 0.6) return "bg-warning";
  return "bg-destructive";
}

function getRiskLabel(score: number) {
  if (score <= 0.3) return "Low Risk";
  if (score <= 0.6) return "Medium Risk";
  return "High Risk";
}

export function RiskMeter({ score, size = "md", showLabel = true, className }: RiskMeterProps) {
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn("text-sm font-medium", getRiskColor(score))}>
            {getRiskLabel(score)}
          </span>
          <span className="text-sm font-mono text-muted-foreground">
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      )}
      <div className={cn("w-full bg-secondary rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", getRiskBg(score))}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );
}
