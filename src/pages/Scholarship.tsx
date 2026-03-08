import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';

const Scholarship = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    organization_name: '',
    role: '',
    country: '',
    use_case: '',
    requested_plan: 'pro',
    duration_months: '6',
    justification: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to apply');
      return;
    }
    if (!form.justification.trim()) {
      toast.error('Please provide a justification');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('scholarships').insert([{
        user_id: user.id,
        organization_name: form.organization_name,
        role: form.role,
        country: form.country,
        use_case: form.use_case,
        requested_plan: form.requested_plan,
        duration_months: parseInt(form.duration_months),
        justification: form.justification,
      }]);

      if (error) throw error;
      setSubmitted(true);
      toast.success('Fellowship application submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting scholarship:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-4">DevMapper Fellowship</h1>
        <p className="text-muted-foreground mb-6">Please sign in to apply for the fellowship program.</p>
        <Button asChild><a href="/auth">Sign In</a></Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
        <p className="text-muted-foreground mb-6">
          Your DevMapper Fellowship application has been received. Our team will review it and respond within 5-10 business days.
        </p>
        <Button variant="outline" asChild><a href="/">Back to Home</a></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <SEOHead
        title="Apply for Fellowship — DevMapper Africa"
        description="Apply for time-bound Pro or Advanced access to DevMapper for NGOs, changemakers, journalists, and public interest labs."
      />

      <div className="text-center mb-8">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Apply for DevMapper Fellowship</h1>
        <p className="text-muted-foreground">
          Time-bound Pro or Advanced access for NGOs, changemakers, journalists, citizen reporters, and public interest labs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fellowship Application</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org_name">Organization Name</Label>
                <Input
                  id="org_name"
                  value={form.organization_name}
                  onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                  placeholder="Your organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ngo_staff">NGO Staff</SelectItem>
                    <SelectItem value="changemaker">Changemaker</SelectItem>
                    <SelectItem value="journalist">Journalist</SelectItem>
                    <SelectItem value="citizen_reporter">Citizen Reporter</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="public_interest">Public Interest Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="e.g. Nigeria"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requested_plan">Requested Plan</Label>
                <Select value={form.requested_plan} onValueChange={(v) => setForm({ ...form, requested_plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro ($49/mo value)</SelectItem>
                    <SelectItem value="advanced">Advanced ($149/mo value)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Requested Duration</Label>
                <Select value={form.duration_months} onValueChange={(v) => setForm({ ...form, duration_months: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="use_case">Primary Use Case</Label>
                <Input
                  id="use_case"
                  value={form.use_case}
                  onChange={(e) => setForm({ ...form, use_case: e.target.value })}
                  placeholder="e.g. SDG monitoring for rural communities"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Why should you receive this fellowship? *</Label>
              <Textarea
                id="justification"
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                placeholder="Describe your work, impact, and how DevMapper will help your mission..."
                rows={5}
                required
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Our team reviews applications within 5-10 business days</li>
                <li>Approved fellows receive a time-bound plan override</li>
                <li>Access automatically reverts after the fellowship period</li>
                <li>No credit card required for fellowship access</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Fellowship Application'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scholarship;
