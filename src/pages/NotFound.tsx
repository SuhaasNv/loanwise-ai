import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "404 — Page Not Found | LoanWise AI";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
      <p className="text-lg text-muted-foreground">Page not found</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page <code className="rounded bg-muted px-1 py-0.5 text-xs">{location.pathname}</code> doesn't exist.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
