import { Link, NavLink, Outlet } from "react-router-dom";
import { BrainCircuit, FileText, PlusCircle, HelpCircle, Sun, Moon } from "lucide-react";
import { UserButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { ApiBanner } from "@/components/ApiBanner";

export default function PortalLayout() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-90"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <BrainCircuit className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                LoanWise AI
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/portal"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }`
                }
              >
                <FileText className="h-3.5 w-3.5" />
                My Applications
              </NavLink>
              <Link
                to="/about"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Help
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Link to="/portal/apply">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Apply for Loan
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <ApiBanner />

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
