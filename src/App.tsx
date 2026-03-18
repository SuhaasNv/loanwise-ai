import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";

// Dashboard (manager) pages
import DashboardPage from "@/pages/DashboardPage";
import LoanApplicationsPage from "@/pages/LoanApplicationsPage";
import LoanDetailsPage from "@/pages/LoanDetailsPage";
import AIDecisionsPage from "@/pages/AIDecisionsPage";
import RecommendationsPage from "@/pages/RecommendationsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AgentActivityPage from "@/pages/AgentActivityPage";
import SettingsPage from "@/pages/SettingsPage";

// Public + Customer pages
import LandingPage from "@/pages/LandingPage";
import ClaimManagerPage from "@/pages/ClaimManagerPage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import ContactPage from "@/pages/ContactPage";
import HelpPage from "@/pages/HelpPage";
import EligibilityCheckPage from "@/pages/EligibilityCheckPage";
import PortalLayout from "@/pages/portal/PortalLayout";
import CustomerHomePage from "@/pages/portal/CustomerHomePage";
import LoanApplicationFormPage from "@/pages/portal/LoanApplicationFormPage";
import ApplicationStatusPage from "@/pages/portal/ApplicationStatusPage";
import NotFound from "@/pages/NotFound";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="loanwise-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner richColors closeButton />
        <ErrorBoundary>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* ─── Public ──────────────────────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/claim-manager" element={<ClaimManagerPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/eligibility-check" element={<EligibilityCheckPage />} />
            <Route
              path="/sign-in/*"
              element={
                <div className="flex min-h-screen items-center justify-center bg-[#0A0F1C]">
                  <SignIn
                    routing="path"
                    path="/sign-in"
                    fallbackRedirectUrl="/portal"
                  />
                </div>
              }
            />
            <Route
              path="/sign-up/*"
              element={
                <div className="flex min-h-screen items-center justify-center bg-[#0A0F1C]">
                  <SignUp
                    routing="path"
                    path="/sign-up"
                    fallbackRedirectUrl="/portal"
                  />
                </div>
              }
            />

            {/* ─── Customer Portal ─────────────────────────────────────── */}
            <Route
              element={
                <RoleGuard role="customer">
                  <PortalLayout />
                </RoleGuard>
              }
            >
              <Route path="/portal" element={<CustomerHomePage />} />
              <Route path="/portal/apply" element={<LoanApplicationFormPage />} />
              <Route path="/portal/application/:id" element={<ApplicationStatusPage />} />
            </Route>

            {/* ─── Manager Dashboard ───────────────────────────────────── */}
            <Route
              element={
                <RoleGuard role="manager">
                  <DashboardLayout />
                </RoleGuard>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/loans" element={<LoanApplicationsPage />} />
              <Route path="/loans/:id" element={<LoanDetailsPage />} />
              <Route path="/ai-decisions" element={<AIDecisionsPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/agents" element={<AgentActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* ─── Catch-all ───────────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
