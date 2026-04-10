import React, { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/ui/loading-skeleton";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

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
const MyProjects = lazy(() => import("./pages/MyProjects"));
const ProjectAnalytics = lazy(() => import("./pages/ProjectAnalytics"));
const ProjectManagement = lazy(() => import("./pages/ProjectManagement"));
const SdgOverview = lazy(() => import("./pages/SdgOverview"));
const BulkUpload = lazy(() => import("./pages/BulkUpload"));
const SPVFStandards = lazy(() => import("./pages/SPVFStandards"));
const DSPMMethodology = lazy(() => import("./pages/DSPMMethodology"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const SDGIndicatorRegistry = lazy(() => import("./pages/SDGIndicatorRegistry"));
const CertificationWorkflow = lazy(() => import("./pages/CertificationWorkflow"));
const PlatformOverview = lazy(() => import("./pages/PlatformOverview"));
const ApplyCertification = lazy(() => import("./pages/ApplyCertification"));
const AdminCRM = lazy(() => import("./pages/AdminCRM"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const VerifierMarketplace = lazy(() => import("./pages/VerifierMarketplace"));
const CarbonMarketplace = lazy(() => import("./pages/CarbonMarketplace"));
const CarbonPortfolio = lazy(() => import("./pages/CarbonPortfolio"));
const CarbonAccounting = lazy(() => import("./pages/CarbonAccounting"));

// Optimized QueryClient with proper caching and GC settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const Guarded = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <UserRoleProvider>
              <BrowserRouter>
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route path="/" element={<Index />} />
                      {/* Public routes */}
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/change-makers" element={<ChangeMakers />} />
                      <Route path="/change-makers/:id" element={<ChangeMakerDetail />} />
                      <Route path="/fundraising" element={<Fundraising />} />
                      <Route path="/guidelines" element={<Guidelines />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/sdg-agenda2063" element={<SdgAgenda2063Alignment />} />
                      <Route path="/sdg-overview" element={<SdgOverview />} />
                      <Route path="/connect" element={<Connect />} />
                      <Route path="/spvf-standards" element={<SPVFStandards />} />
                      <Route path="/dspm-methodology" element={<DSPMMethodology />} />
                      <Route path="/verify/:certNumber" element={<VerifyCertificate />} />
                      <Route path="/verify" element={<VerifyCertificate />} />
                      <Route path="/sdg-indicators" element={<SDGIndicatorRegistry />} />
                      <Route path="/certification-workflow" element={<CertificationWorkflow />} />
                      <Route path="/platform-overview" element={<PlatformOverview />} />
                      <Route path="/project/:id" element={<ProjectDetail />} />
                      {/* Protected routes */}
                      <Route path="/analytics" element={<Guarded><Analytics /></Guarded>} />
                      <Route path="/corporate-targets" element={<Guarded><CorporateTargets /></Guarded>} />
                      <Route path="/settings" element={<Guarded><Settings /></Guarded>} />
                      <Route path="/submit-report" element={<Guarded><SubmitReport /></Guarded>} />
                      <Route path="/submit-change-maker" element={<Guarded><SubmitChangeMaker /></Guarded>} />
                      <Route path="/change-maker-analytics" element={<Guarded><ChangeMakerAnalyticsPage /></Guarded>} />
                      <Route path="/forum" element={<Guarded><Forum /></Guarded>} />
                      <Route path="/messages" element={<Guarded><Messages /></Guarded>} />
                      <Route path="/training" element={<Guarded><Training /></Guarded>} />
                      <Route path="/esg" element={<Guarded><ESG /></Guarded>} />
                      <Route path="/billing-upgrade" element={<Guarded><BillingUpgrade /></Guarded>} />
                      <Route path="/advanced-analytics" element={<Guarded><AdvancedAnalyticsPage /></Guarded>} />
                      <Route path="/my-analytics" element={<Guarded><ChangeMakerMyAnalytics /></Guarded>} />
                      <Route path="/scholarship" element={<Guarded><Scholarship /></Guarded>} />
                      <Route path="/my-projects" element={<Guarded><MyProjects /></Guarded>} />
                      <Route path="/project-analytics" element={<Guarded><ProjectAnalytics /></Guarded>} />
                      <Route path="/project-management" element={<Guarded><ProjectManagement /></Guarded>} />
                      <Route path="/bulk-upload" element={<Guarded><BulkUpload /></Guarded>} />
                      <Route path="/apply-certification" element={<Guarded><ApplyCertification /></Guarded>} />
                      <Route path="/verifier-marketplace" element={<Guarded><VerifierMarketplace /></Guarded>} />
                      <Route path="/carbon-marketplace" element={<CarbonMarketplace />} />
                      <Route path="/carbon-portfolio" element={<Guarded><CarbonPortfolio /></Guarded>} />
                      <Route path="/carbon-accounting" element={<Guarded><CarbonAccounting /></Guarded>} />
                      {/* Role-protected routes */}
                      <Route path="/admin-dashboard" element={<Guarded><RoleRoute roles={["admin", "platform_admin"]}><AdminDashboard /></RoleRoute></Guarded>} />
                      <Route path="/admin-crm" element={<Guarded><RoleRoute roles={["admin", "platform_admin"]}><AdminCRM /></RoleRoute></Guarded>} />
                      <Route path="/user-management" element={<Guarded><RoleRoute roles={["admin", "platform_admin"]}><UserManagement /></RoleRoute></Guarded>} />
                      <Route path="/government-dashboard" element={<Guarded><RoleRoute roles={["admin", "government_official"]}><GovernmentDashboard /></RoleRoute></Guarded>} />
                      <Route path="/corporate-dashboard" element={<Guarded><RoleRoute roles={["admin", "company_representative"]}><CorporateDashboard /></RoleRoute></Guarded>} />
                      <Route path="/ngo-dashboard" element={<Guarded><RoleRoute roles={["admin", "ngo_member"]}><NgoDashboard /></RoleRoute></Guarded>} />
                      {/* 404 inside Layout */}
                      <Route path="*" element={<NotFound />} />
                    </Route>
                    <Route path="/auth" element={<Auth />} />
                  </Routes>
                </Suspense>
                <Sonner />
              </BrowserRouter>
            </UserRoleProvider>
          </AuthProvider>
        </ThemeProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
