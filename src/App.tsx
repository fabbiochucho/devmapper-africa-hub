import React, { lazy } from "react";
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
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import { withSuspense as S } from "./components/withSuspense";

// Lazy load heavy pages for better performance
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const SubmitReport = lazy(() => import("./pages/SubmitReport"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const CorporateTargets = lazy(() => import("./pages/CorporateTargets"));
const GovernmentDashboard = lazy(() => import("./pages/GovernmentDashboard"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CertificateVerification = lazy(() => import("./pages/CertificateVerification"));
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
const SdgAgenda2063Alignment = lazy(() => import("./pages/SdgAgenda2063"));
const ESG = lazy(() => import("./pages/ESG"));
const BillingUpgrade = lazy(() => import("./pages/BillingUpgrade"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
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
const SharedWithMe = lazy(() => import("./pages/SharedWithMe"));
const ErpIntegrations = lazy(() => import("./pages/ErpIntegrations"));
const FunderDashboard = lazy(() => import("./pages/FunderDashboard"));
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

const CORPORATE_ESG_ROLES = ["admin", "platform_admin", "company_representative", "ngo_member"];
const CORPORATE_TARGETS_ROLES = ["admin", "platform_admin", "company_representative"];

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <UserRoleProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    {/* Public routes */}
                    <Route path="/search" element={S(<SearchPage />)} />
                    <Route path="/certificates/:certificateNumber" element={S(<CertificateVerification />)} />
                    <Route path="/change-makers" element={S(<ChangeMakers />)} />
                    <Route path="/change-makers/:id" element={S(<ChangeMakerDetail />)} />
                    <Route path="/fundraising" element={S(<Fundraising />)} />
                    <Route path="/guidelines" element={S(<Guidelines />)} />
                    <Route path="/support" element={S(<Support />)} />
                    <Route path="/resources" element={S(<Resources />)} />
                    <Route path="/about" element={S(<About />)} />
                    <Route path="/contact" element={S(<Contact />)} />
                    <Route path="/pricing" element={S(<Pricing />)} />
                    <Route path="/sdg-agenda2063" element={S(<SdgAgenda2063Alignment />)} />
                    <Route path="/sdg-overview" element={S(<SdgOverview />)} />
                    <Route path="/connect" element={S(<Connect />)} />
                    <Route path="/spvf-standards" element={S(<SPVFStandards />)} />
                    <Route path="/dspm-methodology" element={S(<DSPMMethodology />)} />
                    <Route path="/verify/:certNumber" element={S(<VerifyCertificate />)} />
                    <Route path="/verify" element={S(<VerifyCertificate />)} />
                    <Route path="/sdg-indicators" element={S(<SDGIndicatorRegistry />)} />
                    <Route path="/certification-workflow" element={S(<CertificationWorkflow />)} />
                    <Route path="/platform-overview" element={S(<PlatformOverview />)} />
                    <Route path="/project/:id" element={S(<ProjectDetail />)} />
                    <Route path="/carbon-marketplace" element={S(<CarbonMarketplace />)} />
                    {/* Protected routes */}
                    <Route path="/analytics" element={<Guarded>{S(<Analytics />)}</Guarded>} />
                    <Route
                      path="/corporate-targets"
                      element={
                        <Guarded>
                          <RoleRoute roles={CORPORATE_TARGETS_ROLES}>{S(<CorporateTargets />)}</RoleRoute>
                        </Guarded>
                      }
                    />
                    <Route path="/settings" element={<Guarded>{S(<Settings />)}</Guarded>} />
                    <Route path="/submit-report" element={<Guarded>{S(<SubmitReport />)}</Guarded>} />
                    <Route path="/submit-change-maker" element={<Guarded>{S(<SubmitChangeMaker />)}</Guarded>} />
                    <Route path="/change-maker-analytics" element={<Guarded>{S(<ChangeMakerAnalyticsPage />)}</Guarded>} />
                    <Route path="/forum" element={<Guarded>{S(<Forum />)}</Guarded>} />
                    <Route path="/messages" element={<Guarded>{S(<Messages />)}</Guarded>} />
                    <Route path="/training" element={<Guarded>{S(<Training />)}</Guarded>} />
                    <Route
                      path="/esg"
                      element={
                        <Guarded>
                          <RoleRoute roles={CORPORATE_ESG_ROLES}>{S(<ESG />)}</RoleRoute>
                        </Guarded>
                      }
                    />
                    <Route path="/billing-upgrade" element={<Guarded>{S(<BillingUpgrade />)}</Guarded>} />
                    <Route path="/payment-callback" element={<Guarded>{S(<PaymentCallback />)}</Guarded>} />
                    <Route path="/advanced-analytics" element={<Guarded>{S(<AdvancedAnalyticsPage />)}</Guarded>} />
                    <Route path="/my-analytics" element={<Guarded>{S(<ChangeMakerMyAnalytics />)}</Guarded>} />
                    <Route path="/scholarship" element={<Guarded>{S(<Scholarship />)}</Guarded>} />
                    <Route path="/my-projects" element={<Guarded>{S(<MyProjects />)}</Guarded>} />
                    <Route path="/project-analytics" element={<Guarded>{S(<ProjectAnalytics />)}</Guarded>} />
                    <Route path="/project-management" element={<Guarded>{S(<ProjectManagement />)}</Guarded>} />
                    <Route path="/bulk-upload" element={<Guarded>{S(<BulkUpload />)}</Guarded>} />
                    <Route path="/apply-certification" element={<Guarded>{S(<ApplyCertification />)}</Guarded>} />
                    <Route path="/verifier-marketplace" element={<Guarded>{S(<VerifierMarketplace />)}</Guarded>} />
                    <Route path="/shared-with-me" element={<Guarded>{S(<SharedWithMe />)}</Guarded>} />
                    <Route
                      path="/erp-integrations"
                      element={
                        <Guarded>
                          <RoleRoute roles={CORPORATE_ESG_ROLES}>{S(<ErpIntegrations />)}</RoleRoute>
                        </Guarded>
                      }
                    />
                    <Route path="/carbon-portfolio" element={<Guarded>{S(<CarbonPortfolio />)}</Guarded>} />
                    <Route
                      path="/carbon-accounting"
                      element={
                        <Guarded>
                          <RoleRoute roles={CORPORATE_ESG_ROLES}>{S(<CarbonAccounting />)}</RoleRoute>
                        </Guarded>
                      }
                    />
                    {/* Role-protected routes */}
                    <Route path="/admin-dashboard" element={<Guarded><RoleRoute roles={["admin", "platform_admin"]}>{S(<AdminDashboard />)}</RoleRoute></Guarded>} />
                    <Route path="/admin-crm" element={<Guarded><RoleRoute roles={["admin", "platform_admin"]}>{S(<AdminCRM />)}</RoleRoute></Guarded>} />
                    <Route path="/user-management" element={<Guarded><RoleRoute roles={["admin", "platform_admin"]}>{S(<UserManagement />)}</RoleRoute></Guarded>} />
                    <Route path="/government-dashboard" element={<Guarded><RoleRoute roles={["admin", "government_official"]}>{S(<GovernmentDashboard />)}</RoleRoute></Guarded>} />
                    <Route path="/corporate-dashboard" element={<Guarded><RoleRoute roles={["admin", "company_representative"]}>{S(<CorporateDashboard />)}</RoleRoute></Guarded>} />
                    <Route path="/ngo-dashboard" element={<Guarded><RoleRoute roles={["admin", "ngo_member"]}>{S(<NgoDashboard />)}</RoleRoute></Guarded>} />
                    <Route path="/funder-dashboard" element={<Guarded><RoleRoute roles={["admin", "funder"]}>{S(<FunderDashboard />)}</RoleRoute></Guarded>} />
                    {/* 404 inside Layout */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  <Route path="/auth" element={S(<Auth />)} />
                </Routes>
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
