import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Crown, Shield, Zap, Building2, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';

const plans = [
  {
    id: 'lite',
    name: 'DevMapper Lite',
    tagline: 'For learning',
    icon: Shield,
    iconColor: 'text-blue-500',
    price: { monthly: 0, quarterly: 0, yearly: 0 },
    description: 'Entry-tier plan for students, NGOs, and changemakers.',
    projectLimit: 'Up to 10',
    monthlyAdd: 3,
    rollover: false,
    users: 'Up to 5',
    features: {
      project_workspace: true,
      multi_module: false,
      system_dependencies: false,
      cross_project: false,
      custom_logic: false,
      basic_reports: true,
      advanced_analytics: false,
      custom_dashboards: false,
      pdf_export: true,
      excel_csv_export: true,
      json_api_export: false,
      automated_reporting: false,
      sdg_tagging: true,
      agenda2063: 'light',
      esg_alignment: false,
      regulatory_readiness: false,
      scenario_modeling: false,
      sovereign_frameworks: false,
      team_workspaces: false,
      roles_permissions: false,
      audit_trail: false,
      approval_workflows: false,
      api_access: false,
      webhooks: false,
      csv_import: true,
      alphaearth_free: true,
      alphaearth_pro: false,
      erp_integration: false,
      custom_integrations: false,
      community_support: true,
      email_support: false,
      priority_support: false,
      sla: false,
      dedicated_manager: false,
    },
  },
  {
    id: 'pro',
    name: 'DevMapper Pro',
    tagline: 'For building',
    icon: Zap,
    iconColor: 'text-amber-500',
    price: { monthly: 49, quarterly: 129, yearly: 490 },
    description: 'For builders, consultants, and small organizations.',
    projectLimit: 'Up to 40',
    monthlyAdd: 5,
    rollover: true,
    users: 'Up to 25',
    popular: true,
    features: {
      project_workspace: true,
      multi_module: true,
      system_dependencies: true,
      cross_project: false,
      custom_logic: false,
      basic_reports: true,
      advanced_analytics: true,
      custom_dashboards: false,
      pdf_export: true,
      excel_csv_export: true,
      json_api_export: true,
      automated_reporting: false,
      sdg_tagging: true,
      agenda2063: true,
      esg_alignment: 'basic',
      regulatory_readiness: false,
      scenario_modeling: false,
      sovereign_frameworks: false,
      team_workspaces: true,
      roles_permissions: false,
      audit_trail: false,
      approval_workflows: false,
      api_access: true,
      webhooks: false,
      csv_import: true,
      alphaearth_free: true,
      alphaearth_pro: false,
      erp_integration: false,
      custom_integrations: false,
      community_support: true,
      email_support: true,
      priority_support: false,
      sla: false,
      dedicated_manager: false,
    },
  },
  {
    id: 'advanced',
    name: 'DevMapper Advanced',
    tagline: 'For governing',
    icon: Crown,
    iconColor: 'text-purple-500',
    price: { monthly: 149, quarterly: 399, yearly: 1490 },
    description: 'Institutional & government-grade plan.',
    projectLimit: 'Up to 150',
    monthlyAdd: 15,
    rollover: true,
    users: 'Unlimited',
    features: {
      project_workspace: true,
      multi_module: true,
      system_dependencies: true,
      cross_project: true,
      custom_logic: false,
      basic_reports: true,
      advanced_analytics: true,
      custom_dashboards: true,
      pdf_export: true,
      excel_csv_export: true,
      json_api_export: true,
      automated_reporting: true,
      sdg_tagging: true,
      agenda2063: true,
      esg_alignment: true,
      regulatory_readiness: true,
      scenario_modeling: true,
      sovereign_frameworks: false,
      team_workspaces: true,
      roles_permissions: true,
      audit_trail: true,
      approval_workflows: false,
      api_access: true,
      webhooks: true,
      csv_import: true,
      alphaearth_free: false,
      alphaearth_pro: true,
      erp_integration: false,
      custom_integrations: false,
      community_support: true,
      email_support: true,
      priority_support: true,
      sla: false,
      dedicated_manager: false,
    },
  },
  {
    id: 'enterprise',
    name: 'DevMapper Enterprise',
    tagline: 'For shaping systems',
    icon: Building2,
    iconColor: 'text-emerald-500',
    price: { monthly: -1, quarterly: -1, yearly: -1 },
    description: 'Custom plan for large institutions or sovereign entities.',
    projectLimit: 'Unlimited',
    monthlyAdd: 'Custom',
    rollover: true,
    users: 'Unlimited',
    features: {
      project_workspace: true,
      multi_module: true,
      system_dependencies: true,
      cross_project: true,
      custom_logic: true,
      basic_reports: true,
      advanced_analytics: true,
      custom_dashboards: true,
      pdf_export: true,
      excel_csv_export: true,
      json_api_export: true,
      automated_reporting: true,
      sdg_tagging: true,
      agenda2063: true,
      esg_alignment: true,
      regulatory_readiness: true,
      scenario_modeling: true,
      sovereign_frameworks: true,
      team_workspaces: true,
      roles_permissions: true,
      audit_trail: true,
      approval_workflows: true,
      api_access: true,
      webhooks: true,
      csv_import: true,
      alphaearth_free: false,
      alphaearth_pro: true,
      erp_integration: true,
      custom_integrations: true,
      community_support: true,
      email_support: true,
      priority_support: true,
      sla: true,
      dedicated_manager: true,
    },
  },
];

const featureCategories = [
  {
    name: 'Project & System Architecture',
    features: [
      { key: 'project_workspace', label: 'Project workspace' },
      { key: 'multi_module', label: 'Multi-module projects' },
      { key: 'system_dependencies', label: 'System dependencies' },
      { key: 'cross_project', label: 'Cross-project portfolios' },
      { key: 'custom_logic', label: 'Custom system logic' },
    ],
  },
  {
    name: 'Analytics, Reporting & Exports',
    features: [
      { key: 'basic_reports', label: 'Basic reports' },
      { key: 'advanced_analytics', label: 'Advanced analytics' },
      { key: 'custom_dashboards', label: 'Custom dashboards' },
      { key: 'pdf_export', label: 'PDF export' },
      { key: 'excel_csv_export', label: 'Excel / CSV export' },
      { key: 'json_api_export', label: 'JSON / API exports' },
      { key: 'automated_reporting', label: 'Automated reporting' },
    ],
  },
  {
    name: 'SDG, ESG & Policy Intelligence',
    features: [
      { key: 'sdg_tagging', label: 'SDG tagging & progress' },
      { key: 'agenda2063', label: 'Agenda 2063 mapping' },
      { key: 'esg_alignment', label: 'ESG alignment' },
      { key: 'regulatory_readiness', label: 'Regulatory readiness' },
      { key: 'scenario_modeling', label: 'Scenario modeling' },
      { key: 'sovereign_frameworks', label: 'Sovereign frameworks' },
    ],
  },
  {
    name: 'Collaboration & Governance',
    features: [
      { key: 'team_workspaces', label: 'Team workspaces' },
      { key: 'roles_permissions', label: 'Roles & permissions' },
      { key: 'audit_trail', label: 'Audit trail' },
      { key: 'approval_workflows', label: 'Approval workflows' },
    ],
  },
  {
    name: 'API, Integrations & Automation',
    features: [
      { key: 'api_access', label: 'API access' },
      { key: 'webhooks', label: 'Webhooks' },
      { key: 'csv_import', label: 'CSV bulk import' },
      { key: 'alphaearth_free', label: 'AlphaEarth Free tier' },
      { key: 'alphaearth_pro', label: 'AlphaEarth Pro tier' },
      { key: 'erp_integration', label: 'ERP / Utility APIs' },
      { key: 'custom_integrations', label: 'Custom integrations' },
    ],
  },
  {
    name: 'Support & Commercial Terms',
    features: [
      { key: 'community_support', label: 'Community support' },
      { key: 'email_support', label: 'Email support' },
      { key: 'priority_support', label: 'Priority support' },
      { key: 'sla', label: 'SLA' },
      { key: 'dedicated_manager', label: 'Dedicated manager' },
    ],
  },
];

type BillingPeriod = 'monthly' | 'quarterly' | 'yearly';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  const getPrice = (plan: typeof plans[0]) => {
    const price = plan.price[billingPeriod];
    if (price === -1) return 'Custom';
    if (price === 0) return 'Free';
    return `$${price}`;
  };

  const getPeriodLabel = () => {
    switch (billingPeriod) {
      case 'monthly': return '/mo';
      case 'quarterly': return '/quarter';
      case 'yearly': return '/year';
    }
  };

  const getDiscount = (plan: typeof plans[0]) => {
    if (plan.price.monthly <= 0) return null;
    if (billingPeriod === 'yearly') return '~17% off';
    if (billingPeriod === 'quarterly') return '~12% off';
    return null;
  };

  const renderFeatureCell = (value: boolean | string) => {
    if (value === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    if (value === false) return <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />;
    return <span className="text-xs text-muted-foreground">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pricing — DevMapper Africa"
        description="Choose the right DevMapper plan for your organization. From free Lite tier to Enterprise-grade governance tools."
      />

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            DevMapper Lite is for learning. Pro is for building. Advanced is for governing. Enterprise is for shaping systems.
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {(['monthly', 'quarterly', 'yearly'] as BillingPeriod[]).map((period) => (
            <Button
              key={period}
              variant={billingPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
              {period === 'yearly' && <Badge variant="secondary" className="ml-2 text-xs">Save ~17%</Badge>}
            </Button>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <Icon className={`w-10 h-10 mx-auto mb-2 ${plan.iconColor}`} />
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground italic">{plan.tagline}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{getPrice(plan)}</span>
                    {plan.price[billingPeriod] > 0 && (
                      <span className="text-muted-foreground">{getPeriodLabel()}</span>
                    )}
                    {getDiscount(plan) && (
                      <Badge variant="secondary" className="ml-2 text-xs">{getDiscount(plan)}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 text-sm mb-6 flex-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projects</span>
                      <span className="font-medium">{plan.projectLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly add</span>
                      <span className="font-medium">+{plan.monthlyAdd}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rollover</span>
                      <span className="font-medium">{plan.rollover ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Users</span>
                      <span className="font-medium">{plan.users}</span>
                    </div>
                  </div>

                  {plan.id === 'enterprise' ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/contact')}
                    >
                      Contact Sales
                    </Button>
                  ) : plan.id === 'lite' ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => user ? navigate('/settings') : navigate('/auth')}
                    >
                      {user ? 'Current Plan' : 'Get Started Free'}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/billing-upgrade?plan=${plan.id}`)}
                    >
                      Upgrade to {plan.name.split(' ')[1]}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Scholarship CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 text-center mb-16">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">DevMapper Fellowship / Access Grant</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-4">
            Are you an NGO, changemaker, journalist, citizen reporter, or public interest lab?
            Apply for time-bound Pro or Advanced access at no cost.
          </p>
          <Button onClick={() => navigate('/scholarship')}>
            Apply for Fellowship
          </Button>
        </div>

        {/* SDG Certification Services */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-3">SDG Certification Services</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Earn credibility with verified SDG impact. DevMapper issues globally-recognized certifications under the <strong>SDG-PVS 1000</strong> standard.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <CardTitle className="text-lg">Self-Assessment</CardTitle>
                <p className="text-2xl font-bold mt-2">Free</p>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>• Access SPVF 7-stage workflow</p>
                <p>• Self-reported evidence upload</p>
                <p>• Automated SIS scoring</p>
                <p>• No certificate issued</p>
                <p className="text-xs pt-2 italic">Included in all plans</p>
              </CardContent>
            </Card>
            <Card className="ring-2 ring-primary relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
              <CardHeader className="text-center">
                <Award className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <CardTitle className="text-lg">Standard Certification</CardTitle>
                <p className="text-2xl font-bold mt-2">$299<span className="text-sm font-normal text-muted-foreground">/project</span></p>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>• Full 7-stage verification</p>
                <p>• Independent verifier review</p>
                <p>• Digital SDG certificate</p>
                <p>• Public verification page</p>
                <p>• Valid for 2 years</p>
                <p>• Bronze / Silver / Gold ratings</p>
                <Button className="w-full mt-4" onClick={() => navigate('/contact')}>
                  Request Certification
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <Crown className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                <CardTitle className="text-lg">Platinum Certification</CardTitle>
                <p className="text-2xl font-bold mt-2">$999<span className="text-sm font-normal text-muted-foreground">/project</span></p>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>• Everything in Standard</p>
                <p>• On-site verification audit</p>
                <p>• Satellite/geospatial validation</p>
                <p>• Platinum-eligible rating</p>
                <p>• Priority processing (14 days)</p>
                <p>• Certification badge & API embed</p>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/contact')}>
                  Request Platinum Review
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-6 space-x-4">
            <Button variant="link" onClick={() => navigate('/spvf-standards')}>
              View SPVF Standards →
            </Button>
            <Button variant="link" onClick={() => navigate('/verify')}>
              Verify a Certificate →
            </Button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Detailed Feature Comparison</h2>
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-1/5">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="px-4 py-3 text-center font-medium">
                        {plan.name.split(' ')[1]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureCategories.map((cat) => (
                    <>
                      <tr key={cat.name} className="bg-muted/30">
                        <td colSpan={5} className="px-4 py-2 font-semibold text-foreground">
                          {cat.name}
                        </td>
                      </tr>
                      {cat.features.map((feat) => (
                        <tr key={feat.key} className="border-b hover:bg-muted/20">
                          <td className="px-4 py-2 text-muted-foreground">{feat.label}</td>
                          {plans.map((plan) => (
                            <td key={plan.id} className="px-4 py-2 text-center">
                              {renderFeatureCell((plan.features as any)[feat.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quota Explanation */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">How Quotas Work</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Monthly Addition</h3>
                <p className="text-muted-foreground">
                  Each month, your available project slots increase by your plan's monthly addition amount.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Project Cap</h3>
                <p className="text-muted-foreground">
                  Total projects can never exceed your plan's cap, even with rollover.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Rollover</h3>
                <p className="text-muted-foreground">
                  Paid plans roll unused monthly additions forward. Free/Lite resets each month.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
