import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Shield, Zap, Building2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { errorMessageOf } from '@/lib/error-handler';
import type { LucideIcon } from "lucide-react";

type PlanId = 'lite' | 'individual' | 'pro' | 'advanced' | 'enterprise';
type Interval = 'monthly' | 'quarterly' | 'yearly';
const PLAN_ORDER = ['free', 'lite', 'individual', 'pro', 'advanced', 'enterprise'];

interface Organization {
  id: string;
  name: string;
  plan_type: string;
  scholarship_override: string | null;
  project_quota_remaining: number;
  project_cap: number;
}

const planDetails: Record<string, { name: string; icon: LucideIcon; color: string; price: { monthly: number; quarterly: number; yearly: number }; features: string[] }> = {
  lite: {
    name: 'Lite',
    icon: Shield,
    color: 'text-blue-500',
    price: { monthly: 0, quarterly: 0, yearly: 0 },
    features: ['Up to 10 projects', 'Basic SDG tracking', 'PDF export', 'Community support'],
  },
  individual: {
    name: 'Individual',
    icon: User,
    color: 'text-sky-500',
    // Provisional price; must match getPlanPrice() in supabase/functions/_shared/planQuotas.ts.
    price: { monthly: 15, quarterly: 40, yearly: 150 },
    features: ['For researchers, journalists, consultants and analysts', '20 Ndovu Akili analyses a day', 'Live-source search and investigations', 'Report and investigation exports', 'Full earth intelligence'],
  },
  pro: {
    name: 'Pro',
    icon: Zap,
    color: 'text-amber-500',
    price: { monthly: 49, quarterly: 129, yearly: 490 },
    features: ['Up to 40 projects', 'Advanced analytics', 'Team collaboration', 'API access', 'Excel/JSON export', 'Email support'],
  },
  advanced: {
    name: 'Advanced',
    icon: Crown,
    color: 'text-purple-500',
    price: { monthly: 149, quarterly: 399, yearly: 1490 },
    features: ['Up to 150 projects', 'Scenario analysis', 'Custom dashboards', 'Audit trails', 'AlphaEarth Pro', 'Priority support', 'Roles & permissions'],
  },
  enterprise: {
    name: 'Enterprise',
    icon: Building2,
    color: 'text-emerald-500',
    price: { monthly: -1, quarterly: -1, yearly: -1 },
    features: ['Unlimited projects', 'Custom integrations', 'SLA', 'Dedicated manager', 'Sovereign frameworks'],
  },
};

const BillingUpgrade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [interval, setBillingInterval] = useState<Interval>(() => {
    const i = searchParams.get('interval');
    return i === 'quarterly' || i === 'yearly' ? i : 'monthly';
  });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const selectedPlan = searchParams.get('plan') as PlanId | null;
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  const fetchOrganization = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.rpc('effective_plan').then(({ data }) => { if (typeof data === 'string') setCurrentPlan(data); });
    // An individual plan needs no organisation, so don't create one just for visiting.
    if (selectedPlan === 'individual') setLoading(false);
    else fetchOrganization();
  }, [fetchOrganization, user, selectedPlan]);

  const handleUpgrade = async (provider: 'flutterwave' | 'paystack', planType: PlanId) => {
    const isIndividual = planType === 'individual';
    if (!isIndividual && !organization) return;
    const details = planDetails[planType];
    if (!details || details.price.monthly <= 0) return;

    const currentIdx = PLAN_ORDER.indexOf(isIndividual ? currentPlan : organization!.plan_type);
    const targetIdx = PLAN_ORDER.indexOf(planType);
    if (targetIdx <= currentIdx) {
      toast.error('Cannot downgrade from this page');
      return;
    }

    setUpgrading(`${provider}-${planType}`);
    const amount = details.price[interval];

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: isIndividual
          ? { provider, planType, interval, redirect_url: `${window.location.origin}/payment-callback?type=individual_subscription` }
          : {
              organizationId: organization!.id,
              provider,
              planType,
              interval,
              amount,
              redirect_url: `${window.location.origin}/payment-callback?type=subscription&organization_id=${organization!.id}&plan_type=${planType}`,
            },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.success('Payment processed!');
        fetchOrganization();
      }
    } catch (error: unknown) {
      toast.error(errorMessageOf(error) || 'Payment failed');
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

  const effectivePlan = currentPlan;
  const plansToShow = selectedPlan ? [selectedPlan] : (['individual', 'pro', 'advanced'] as PlanId[]);

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
          {(['monthly', 'quarterly', 'yearly'] as const).map((i) => (
            <Button key={i} size="sm" variant={interval === i ? 'default' : 'outline'} onClick={() => setBillingInterval(i)}>
              {i[0].toUpperCase() + i.slice(1)}
              {i === 'quarterly' && <Badge variant="secondary" className="ml-1">~12% off</Badge>}
              {i === 'yearly' && <Badge variant="secondary" className="ml-1">~17% off</Badge>}
            </Button>
          ))}
        </div>

        {/* Plan Cards */}
        <div className={`grid gap-8 ${plansToShow.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2'}`}>
          {plansToShow.map((planId) => {
            const plan = planDetails[planId];
            const Icon = plan.icon;
            const isCurrent = effectivePlan === planId;
            const price = plan.price[interval];

            return (
              <Card key={planId} className={`${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="text-center">
                  <Icon className={`w-10 h-10 mx-auto ${plan.color}`} />
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    {price > 0 ? (
                      <>
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-muted-foreground">/{interval === 'yearly' ? 'year' : interval === 'quarterly' ? 'quarter' : 'month'}</span>
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
