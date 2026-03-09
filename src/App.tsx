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
import ProtectedRoute from "./components/ProtectedRoute";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <ErrorBoundary>
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
                    {/* Protected routes */}
                    <Route path="/analytics" element={<P><Analytics /></P>} />
                    <Route path="/corporate-targets" element={<P><CorporateTargets /></P>} />
                    <Route path="/government-dashboard" element={<P><GovernmentDashboard /></P>} />
                    <Route path="/settings" element={<P><Settings /></P>} />
                    <Route path="/submit-report" element={<P><SubmitReport /></P>} />
                    <Route path="/submit-change-maker" element={<P><SubmitChangeMaker /></P>} />
                    <Route path="/change-maker-analytics" element={<P><ChangeMakerAnalyticsPage /></P>} />
                    <Route path="/user-management" element={<P><UserManagement /></P>} />
                    <Route path="/admin-dashboard" element={<P><AdminDashboard /></P>} />
                    <Route path="/forum" element={<P><Forum /></P>} />
                    <Route path="/messages" element={<P><Messages /></P>} />
                    <Route path="/training" element={<P><Training /></P>} />
                    <Route path="/esg" element={<P><ESG /></P>} />
                    <Route path="/billing-upgrade" element={<P><BillingUpgrade /></P>} />
                    <Route path="/advanced-analytics" element={<P><AdvancedAnalyticsPage /></P>} />
                    <Route path="/corporate-dashboard" element={<P><CorporateDashboard /></P>} />
                    <Route path="/ngo-dashboard" element={<P><NgoDashboard /></P>} />
                    <Route path="/my-analytics" element={<P><ChangeMakerMyAnalytics /></P>} />
                    <Route path="/scholarship" element={<P><Scholarship /></P>} />
                    <Route path="/my-projects" element={<P><MyProjects /></P>} />
                    <Route path="/project-analytics" element={<P><ProjectAnalytics /></P>} />
                    <Route path="/project-management" element={<P><ProjectManagement /></P>} />
                    <Route path="/bulk-upload" element={<P><BulkUpload /></P>} />
                    <Route path="/apply-certification" element={<P><ApplyCertification /></P>} />
                  </Route>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Sonner />
            </BrowserRouter>
          </UserRoleProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
