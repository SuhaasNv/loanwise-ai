import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
}

export function ErrorMessage({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className,
  compact = false,
}: ErrorMessageProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive", className)}>
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-3 w-3" />
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="shrink-0 gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
