import React, { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/ui/loading-skeleton";

// Lazy load heavy pages for better performance
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const SubmitReport = lazy(() => import("./pages/SubmitReport"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const CorporateTargets = lazy(() => import("./pages/CorporateTargets"));
const GovernmentDashboard = lazy(() => import("./pages/GovernmentDashboard"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Forum = lazy(() => import("./pages/Forum"));
const Messages = lazy(() => import("./pages/Messages"));
const Guidelines = lazy(() => import("./pages/Guidelines"));
const Support = lazy(() => import("./pages/Support"));
const Training = lazy(() => import("./pages/Training"));
const Resources = lazy(() => import("./pages/Resources"));
const Connect = lazy(() => import("./pages/Connect"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const SubmitChangeMaker = lazy(() => import("./pages/SubmitChangeMaker"));
const ChangeMakers = lazy(() => import("./pages/ChangeMakers"));
const ChangeMakerAnalyticsPage = lazy(() => import("./pages/ChangeMakerAnalyticsPage"));
const ChangeMakerDetail = lazy(() => import("./pages/ChangeMakerDetail"));
const Fundraising = lazy(() => import("./pages/Fundraising"));
const Auth = lazy(() => import("./pages/Auth"));
const CorporateDashboard = lazy(() => import("./pages/CorporateDashboard"));
const NgoDashboard = lazy(() => import("./pages/NgoDashboard"));
const SdgAgenda2063Alignment = lazy(() => import("./components/SdgAgenda2063Alignment"));
const ESG = lazy(() => import("./pages/ESG"));
const BillingUpgrade = lazy(() => import("./pages/BillingUpgrade"));
const AdvancedAnalyticsPage = lazy(() => import("./pages/AdvancedAnalyticsPage"));
const ChangeMakerMyAnalytics = lazy(() => import("./pages/ChangeMakerMyAnalytics"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Scholarship = lazy(() => import("./pages/Scholarship"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Sonner />
        <AuthProvider>
          <UserRoleProvider>
            <BrowserRouter>
              <Suspense fallback={<PageSkeleton />}>
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
                    <Route path="/change-makers/:id" element={<ChangeMakerDetail />} />
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
                    <Route path="/corporate-dashboard" element={<CorporateDashboard />} />
                    <Route path="/ngo-dashboard" element={<NgoDashboard />} />
                    <Route path="/sdg-agenda2063" element={<SdgAgenda2063Alignment />} />
                    <Route path="/my-analytics" element={<ChangeMakerMyAnalytics />} />
                  </Route>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </UserRoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
