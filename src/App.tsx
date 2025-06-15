
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UserRoleProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/submit-report" element={<SubmitReport />} />
              {/* ADD ALL CUSTOM ROUTES HERE, INSIDE THE LAYOUT */}
            </Route>
            {/* CATCH-ALL ROUTE (DOES NOT USE THE LAYOUT) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserRoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
