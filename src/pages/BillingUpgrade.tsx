import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Crown, Shield, Zap, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PlanId = 'lite' | 'pro' | 'advanced' | 'enterprise';

interface Organization {
  id: string;
  name: string;
  plan_type: string;
  scholarship_override: string | null;
  project_quota_remaining: number;
  project_cap: number;
}

const planDetails: Record<string, { name: string; icon: any; color: string; price: { monthly: number; yearly: number }; features: string[] }> = {
  lite: {
    name: 'Lite',
    icon: Shield,
    color: 'text-blue-500',
    price: { monthly: 0, yearly: 0 },
    features: ['Up to 10 projects', 'Basic SDG tracking', 'PDF export', 'Community support'],
  },
  pro: {
    name: 'Pro',
    icon: Zap,
    color: 'text-amber-500',
    price: { monthly: 49, yearly: 490 },
    features: ['Up to 40 projects', 'Advanced analytics', 'Team collaboration', 'API access', 'Excel/JSON export', 'Email support'],
  },
  advanced: {
    name: 'Advanced',
    icon: Crown,
    color: 'text-purple-500',
    price: { monthly: 149, yearly: 1490 },
    features: ['Up to 150 projects', 'Scenario analysis', 'Custom dashboards', 'Audit trails', 'AlphaEarth Pro', 'Priority support', 'Roles & permissions'],
  },
  enterprise: {
    name: 'Enterprise',
    icon: Building2,
    color: 'text-emerald-500',
    price: { monthly: -1, yearly: -1 },
    features: ['Unlimited projects', 'Custom integrations', 'SLA', 'Dedicated manager', 'Sovereign frameworks'],
  },
};

const BillingUpgrade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isYearly, setIsYearly] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const selectedPlan = searchParams.get('plan') as PlanId | null;

  useEffect(() => {
    if (user) fetchOrganization();
  }, [user]);

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', user!.id)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setOrganization(data as Organization);
      } else {
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert([{ name: `${user!.email?.split('@')[0]}'s Organization`, created_by: user!.id }])
          .select()
          .single();
        if (createError) throw createError;
        setOrganization(newOrg as Organization);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (provider: 'flutterwave' | 'paystack', planType: PlanId) => {
    if (!organization) return;
    const details = planDetails[planType];
    if (!details || details.price.monthly <= 0) return;

    const currentPlanOrder = ['lite', 'pro', 'advanced', 'enterprise'];
    const currentIdx = currentPlanOrder.indexOf(organization.plan_type);
    const targetIdx = currentPlanOrder.indexOf(planType);
    if (targetIdx <= currentIdx) {
      toast.error('Cannot downgrade from this page');
      return;
    }

    setUpgrading(`${provider}-${planType}`);
    const interval = isYearly ? 'yearly' : 'monthly';
    const amount = isYearly ? details.price.yearly : details.price.monthly;

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          organizationId: organization.id,
          provider,
          planType,
          interval,
          amount,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.success('Payment processed!');
        fetchOrganization();
      }
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <Button asChild><a href="/auth">Sign In</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const effectivePlan = organization?.scholarship_override || organization?.plan_type || 'lite';
  const plansToShow = selectedPlan ? [selectedPlan] : (['pro', 'advanced'] as PlanId[]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade Your Plan</h1>
          {organization && (
            <div className="flex items-center justify-center gap-3">
              <Badge variant="secondary">Current: {effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1)}</Badge>
              {organization.scholarship_override && (
                <Badge variant="outline" className="text-green-600">Fellowship Active</Badge>
              )}
              <Badge variant="outline">
                Quota: {organization.project_quota_remaining}/{organization.project_cap} projects
              </Badge>
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-10 gap-3">
          <Label>Monthly</Label>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <Label>Yearly <Badge variant="secondary" className="ml-1">~17% off</Badge></Label>
        </div>

        {/* Plan Cards */}
        <div className={`grid gap-8 ${plansToShow.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2'}`}>
          {plansToShow.map((planId) => {
            const plan = planDetails[planId];
            const Icon = plan.icon;
            const isCurrent = effectivePlan === planId;
            const price = isYearly ? plan.price.yearly : plan.price.monthly;

            return (
              <Card key={planId} className={`${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="text-center">
                  <Icon className={`w-10 h-10 mx-auto ${plan.color}`} />
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    {price > 0 ? (
                      <>
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold">Custom</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button className="w-full" disabled>Current Plan</Button>
                  ) : planId === 'enterprise' ? (
                    <Button className="w-full" variant="outline" onClick={() => navigate('/contact')}>
                      Contact Sales
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade('flutterwave', planId)}
                        disabled={upgrading !== null}
                      >
                        {upgrading === `flutterwave-${planId}` ? 'Processing...' : 'Pay with Flutterwave'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUpgrade('paystack', planId)}
                        disabled={upgrading !== null}
                      >
                        {upgrading === `paystack-${planId}` ? 'Processing...' : 'Pay with Paystack'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button variant="link" onClick={() => navigate('/pricing')}>
            View full feature comparison →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillingUpgrade;
