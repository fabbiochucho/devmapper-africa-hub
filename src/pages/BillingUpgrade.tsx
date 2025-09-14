import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Crown, Shield, Zap, Users, BarChart3, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  plan_type: 'lite' | 'pro';
}

interface PricingPlan {
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

const BillingUpgrade = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isYearly, setIsYearly] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const orgId = searchParams.get('orgId');

  useEffect(() => {
    if (user && orgId) {
      fetchOrganization();
    } else if (user) {
      fetchDefaultOrganization();
    }
  }, [user, orgId]);

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      setOrganization(data as Organization);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultOrganization = async () => {
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
        // Create default organization
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert([{
            name: `${user!.email?.split('@')[0]}'s Organization`,
            created_by: user!.id
          }])
          .select()
          .single();

        if (createError) throw createError;
        setOrganization(newOrg as Organization);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const plans: PricingPlan[] = [
    {
      name: 'Lite',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started with basic project tracking',
      features: [
        'Up to 10 projects',
        'Basic reporting',
        'Community support',
        'Standard SDG tracking',
        'Basic analytics',
      ],
      current: organization?.plan_type === 'lite',
    },
    {
      name: 'Pro',
      price: { monthly: 29, yearly: 24 },
      description: 'Advanced features for organizations scaling their impact',
      features: [
        'Unlimited projects',
        'Advanced analytics & insights',
        'Priority support',
        'Custom reporting',
        'API access',
        'Team collaboration',
        'Advanced SDG mapping',
        'Export capabilities',
        'White-label options',
      ],
      popular: true,
      current: organization?.plan_type === 'pro',
    },
  ];

  const handleUpgrade = async (provider: 'flutterwave' | 'paystack', planType: 'lite' | 'pro', interval: 'monthly' | 'yearly') => {
    if (!organization) {
      toast.error('Organization not found');
      return;
    }

    if (organization.plan_type === 'pro') {
      toast.error('Already on Pro plan');
      return;
    }

    setUpgrading(`${provider}-${planType}-${interval}`);

    try {
      // Call edge function to handle payment processing
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          organizationId: organization.id,
          provider,
          planType,
          interval,
          amount: plans.find(p => p.name.toLowerCase() === planType)?.price[interval] || 0,
        },
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to payment provider
        window.location.href = data.url;
      } else {
        toast.success('Payment processed successfully!');
        // Refresh organization data
        if (orgId) {
          fetchOrganization();
        } else {
          fetchDefaultOrganization();
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const features = [
    {
      category: 'Project Management',
      lite: ['Up to 10 projects', 'Basic project tracking', 'Standard templates'],
      pro: ['Unlimited projects', 'Advanced project tracking', 'Custom templates', 'Project dependencies'],
    },
    {
      category: 'Analytics & Reporting',
      lite: ['Basic reports', 'Standard metrics', 'PDF export'],
      pro: ['Advanced analytics', 'Custom dashboards', 'Real-time insights', 'API access', 'Multiple export formats'],
    },
    {
      category: 'Collaboration',
      lite: ['Single user', 'Basic sharing'],
      pro: ['Team collaboration', 'Role-based permissions', 'Advanced sharing', 'Comment system'],
    },
    {
      category: 'Support & Integration',
      lite: ['Community support', 'Documentation'],
      pro: ['Priority support', 'Phone support', 'API integrations', 'Webhook support'],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access billing settings.</p>
            <Button asChild>
              <a href="/auth">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Crown className="w-4 h-4 mr-2" />
            Billing & Upgrade
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {organization ? `Upgrade ${organization.name} to unlock advanced features` : 'Select the perfect plan for your organization'}
          </p>
          {organization && (
            <div className="mt-4">
              <Badge variant={organization.plan_type === 'pro' ? 'default' : 'secondary'}>
                Current Plan: {organization.plan_type.charAt(0).toUpperCase() + organization.plan_type.slice(1)}
              </Badge>
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <Label htmlFor="billing-toggle" className="mr-3">Monthly</Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-toggle" className="ml-3">
            Yearly
            <Badge variant="secondary" className="ml-2">20% off</Badge>
          </Label>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {plans.map((plan) => {
            const price = isYearly ? plan.price.yearly : plan.price.monthly;
            const originalPrice = plan.price.monthly;
            
            return (
              <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''} ${plan.current ? 'bg-muted' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className="mb-4">
                    {plan.name === 'Lite' ? (
                      <Shield className="w-12 h-12 mx-auto text-blue-500" />
                    ) : (
                      <Crown className="w-12 h-12 mx-auto text-purple-500" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                    {isYearly && originalPrice > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="line-through">${originalPrice * 12}/year</span>
                        <span className="text-green-600 ml-2">Save ${(originalPrice * 12) - (price * 12)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.current ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.name === 'Pro' ? (
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleUpgrade('flutterwave', 'pro', isYearly ? 'yearly' : 'monthly')}
                        disabled={upgrading !== null}
                      >
                        {upgrading?.startsWith('flutterwave') ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8.5 5.5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none"/>
                            </svg>
                            Upgrade with Flutterwave
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUpgrade('paystack', 'pro', isYearly ? 'yearly' : 'monthly')}
                        disabled={upgrading !== null}
                      >
                        {upgrading?.startsWith('paystack') ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                            </svg>
                            Upgrade with Paystack
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Lite
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {features.map((category, categoryIndex) => (
                    <>
                      <tr key={`category-${categoryIndex}`} className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {category.category}
                        </td>
                      </tr>
                      {Math.max(category.lite.length, category.pro.length) && 
                        Array.from({ length: Math.max(category.lite.length, category.pro.length) }).map((_, index) => (
                          <tr key={`${categoryIndex}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {/* Feature name from either lite or pro */}
                              {category.lite[index] || category.pro[index] || ''}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {category.lite[index] ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {category.pro[index] ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))
                      }
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, 
                  while downgrades take effect at the end of your billing cycle.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards through Stripe (Visa, MasterCard, American Express) 
                  and local payment methods through Paystack for African customers.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial for Pro?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We offer a 14-day free trial for Pro features. No credit card required to start your trial.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingUpgrade;