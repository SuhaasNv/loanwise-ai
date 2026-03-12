import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  isLoading?: boolean;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, isLoading, className }: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(subtitle || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={cn("font-medium mr-1", trend.value >= 0 ? "text-success" : "text-destructive")}>
                {trend.value >= 0 ? "+" : ""}{trend.value}%
              </span>
            )}
            {subtitle || trend?.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
