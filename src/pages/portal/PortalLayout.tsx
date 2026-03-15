import { Link, NavLink, Outlet } from "react-router-dom";
import { BrainCircuit, FileText, PlusCircle, ArrowLeft } from "lucide-react";
import { UserButton } from "@clerk/react";
import { Button } from "@/components/ui/button";

export default function PortalLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                <BrainCircuit className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900">LoanWise AI</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/portal"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <FileText className="h-3.5 w-3.5" />
                My Applications
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/portal/apply">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Apply for Loan
              </Button>
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
