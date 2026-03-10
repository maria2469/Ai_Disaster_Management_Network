import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import EmergencyReport from "./pages/EmergencyReport";
import EmergencyAlert from "./pages/EmergencyAlert";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import EmergencyPage from "./pages/EmergencyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>

              {/* PUBLIC ROUTES */}
              <Route path="/" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* USER DASHBOARD */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* REPORT EMERGENCY */}
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <EmergencyReport />
                  </ProtectedRoute>
                }
              />

              {/* USER ALERTS */}
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <EmergencyAlert />
                  </ProtectedRoute>
                }
              />

              {/* AUTHORITY DASHBOARD */}
              <Route
                path="/authority"
                element={
                  <ProtectedRoute>
                    <AuthorityDashboard />
                  </ProtectedRoute>
                }
              />

              {/* VOLUNTEER EMERGENCY PAGE (OPEN FROM WHATSAPP LINK) */}
              <Route path="/emergency/:id" element={<EmergencyPage />} />

              {/* FALLBACK */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </BrowserRouter>

        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;