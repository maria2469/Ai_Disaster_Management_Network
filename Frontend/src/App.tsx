import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import EmergencyReport from "./pages/EmergencyReport";
import EmergencyAlert from "./pages/EmergencyAlert";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import EmergencyPage from "./pages/EmergencyPage";
import AnalyticsPage from "./pages/AnalyticsPage"; // ⭐ NEW PAGE
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>

            {/* DEFAULT ROUTE */}
            <Route path="/" element={<Dashboard />} />

            {/* USER DASHBOARD */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* REPORT EMERGENCY */}
            <Route path="/report" element={<EmergencyReport />} />

            {/* USER ALERTS */}
            <Route path="/alerts" element={<EmergencyAlert />} />

            {/* AUTHORITY DASHBOARD */}
            <Route path="/authority" element={<AuthorityDashboard />} />

            {/* ⭐ NEW: BIG DATA ANALYTICS DASHBOARD */}
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* VOLUNTEER EMERGENCY PAGE */}
            <Route path="/emergency/:id" element={<EmergencyPage />} />

            {/* FALLBACK */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>

      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;