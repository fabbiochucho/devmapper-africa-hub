
import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import SubmitReport from "./pages/SubmitReport";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import UserManagement from "./pages/UserManagement";
import CorporateTargets from "./pages/CorporateTargets";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import SearchPage from "./pages/SearchPage";
import AdminDashboard from "./pages/AdminDashboard";
import Forum from "./pages/Forum";
import Messages from "./pages/Messages";
import Guidelines from "./pages/Guidelines";
import Support from "./pages/Support";
import Training from "./pages/Training";
import Resources from "./pages/Resources";
import Connect from "./pages/Connect";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SubmitChangeMaker from "./pages/SubmitChangeMaker";
import ChangeMakers from "./pages/ChangeMakers";
import ChangeMakerAnalyticsPage from "./pages/ChangeMakerAnalyticsPage";
import Fundraising from "./pages/Fundraising";
import Auth from "./pages/Auth";
import CorporateDashboard from "./pages/CorporateDashboard";
import NgoDashboard from "./pages/NgoDashboard";
import SdgAgenda2063Alignment from "./components/SdgAgenda2063Alignment";
import ESG from "./pages/ESG";
import BillingUpgrade from "./pages/BillingUpgrade";
import AdvancedAnalyticsPage from "./pages/AdvancedAnalyticsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Sonner />
      <AuthProvider>
        <UserRoleProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/corporate-targets" element={<CorporateTargets />} />
                <Route path="/government-dashboard" element={<GovernmentDashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/submit-report" element={<SubmitReport />} />
                <Route path="/submit-change-maker" element={<SubmitChangeMaker />} />
                <Route path="/change-makers" element={<ChangeMakers />} />
                <Route path="/change-maker-analytics" element={<ChangeMakerAnalyticsPage />} />
                <Route path="/fundraising" element={<Fundraising />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/guidelines" element={<Guidelines />} />
                <Route path="/support" element={<Support />} />
                <Route path="/training" element={<Training />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/connect" element={<Connect />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/esg" element={<ESG />} />
                <Route path="/billing-upgrade" element={<BillingUpgrade />} />
                <Route path="/advanced-analytics" element={<AdvancedAnalyticsPage />} />
              </Route>
              <Route path="/auth" element={<Auth />} />
              <Route path="/corporate-dashboard" element={<CorporateDashboard />} />
              <Route path="/ngo-dashboard" element={<NgoDashboard />} />
              <Route path="/sdg-agenda2063" element={<SdgAgenda2063Alignment />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UserRoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
