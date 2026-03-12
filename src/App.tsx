import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import LoanApplicationsPage from "@/pages/LoanApplicationsPage";
import LoanDetailsPage from "@/pages/LoanDetailsPage";
import AIDecisionsPage from "@/pages/AIDecisionsPage";
import RecommendationsPage from "@/pages/RecommendationsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AgentActivityPage from "@/pages/AgentActivityPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/loans" element={<LoanApplicationsPage />} />
            <Route path="/loans/:id" element={<LoanDetailsPage />} />
            <Route path="/ai-decisions" element={<AIDecisionsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/agents" element={<AgentActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
