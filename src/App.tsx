
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import SubmitReport from "./pages/SubmitReport";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { ThemeProvider } from "next-themes";
import UserManagement from "./pages/UserManagement";
import CorporateTargets from "./pages/CorporateTargets";
import GovernmentDashboard from "./pages/GovernmentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Sonner />
      <UserRoleProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/corporate-targets" element={<CorporateTargets />} />
              <Route path="/government-dashboard" element={<GovernmentDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/submit-report" element={<SubmitReport />} />
              <Route path="/user-management" element={<UserManagement />} />
              {/* ADD ALL CUSTOM ROUTES HERE, INSIDE THE LAYOUT */}
            </Route>
            {/* CATCH-ALL ROUTE (DOES NOT USE THE LAYOUT) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserRoleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
