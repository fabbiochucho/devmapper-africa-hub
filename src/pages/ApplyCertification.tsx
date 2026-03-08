import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Upload, Award, CheckCircle2, AlertTriangle, ArrowRight, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { appendToLedger } from '@/lib/verification-ledger';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';

const SDG_GOALS = Array.from({ length: 17 }, (_, i) => ({
  id: i + 1,
  label: `SDG ${i + 1}`,
}));

const TIER_INFO = {
  bronze: { label: 'Bronze', sisRange: '50–64', fee: '$500 – $1,500', color: 'hsl(30, 60%, 50%)' },
  silver: { label: 'Silver', sisRange: '65–79', fee: '$1,500 – $5,000', color: 'hsl(0, 0%, 65%)' },
  gold: { label: 'Gold', sisRange: '80–89', fee: '$5,000 – $15,000', color: 'hsl(45, 93%, 47%)' },
  platinum: { label: 'Platinum', sisRange: '90–100', fee: '$15,000 – $50,000', color: 'hsl(var(--primary))' },
};

interface UserReport {
  id: string;
  title: string;
  sdg_goal: number;
  project_status: string;
  country_code: string | null;
}

const ApplyCertification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [existingApps, setExistingApps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedReport, setSelectedReport] = useState('');
  const [requestedTier, setRequestedTier] = useState('bronze');
  const [projectDescription, setProjectDescription] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [budgetUsd, setBudgetUsd] = useState('');
  const [geographicScope, setGeographicScope] = useState('');
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);
  const [evidenceSummary, setEvidenceSummary] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [reportsRes, appsRes] = await Promise.all([
      supabase.from('reports').select('id, title, sdg_goal, project_status, country_code').eq('user_id', user!.id).order('submitted_at', { ascending: false }),
      (supabase as any).from('certification_applications').select('report_id').eq('applicant_id', user!.id),
    ]);
    if (reportsRes.data) setReports(reportsRes.data);
    if (appsRes.data) setExistingApps((appsRes.data as any[]).map((a: any) => a.report_id));
    setLoading(false);
  };

  const eligibleReports = reports.filter(r => !existingApps.includes(r.id));

  const handleSubmit = async () => {
    if (!user || !selectedReport || !agreed) return;
    setSubmitting(true);

    const { data, error } = await (supabase as any).from('certification_applications').insert({
      report_id: selectedReport,
      applicant_id: user.id,
      requested_tier: requestedTier,
      project_description: projectDescription,
      expected_outcomes: expectedOutcomes,
      budget_usd: budgetUsd ? parseFloat(budgetUsd) : null,
      geographic_scope: geographicScope,
      sdg_goals: selectedSdgs,
      evidence_summary: evidenceSummary,
      status: 'submitted',
    }).select().single();

    if (error) {
      toast.error('Failed to submit application: ' + error.message);
      setSubmitting(false);
      return;
    }

    await appendToLedger(selectedReport, 'application_submitted', {
      application_id: data.id,
      requested_tier: requestedTier,
      sdg_goals: selectedSdgs,
      budget_usd: budgetUsd ? parseFloat(budgetUsd) : null,
      geographic_scope: geographicScope,
    });

    toast.success('Certification application submitted! Workflow stages initialized.');
    navigate('/my-projects');
  };

  const toggleSdg = (sdgId: number) => {
    setSelectedSdgs(prev =>
      prev.includes(sdgId) ? prev.filter(s => s !== sdgId) : [...prev, sdgId]
    );
  };

  const tierInfo = TIER_INFO[requestedTier as keyof typeof TIER_INFO];

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Apply for SDG Certification | DevMapper"
        description="Submit your SDG project for verification and certification through DevMapper's 8-step SPVF process."
      />
      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Apply for SDG Certification</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Submit your project for verification through the 8-step SDG-PVS 1000 process.
            Upon approval, your project receives a globally-recognized SDG Impact Certificate.
          </p>
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>What happens after submission?</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>1. Your application is reviewed and 7 verification stages are initialized</p>
            <p>2. AI/ML + human auditors verify evidence and outcomes</p>
            <p>3. SDG Impact Score (SIS) is calculated across 7 dimensions</p>
            <p>4. Governance approval leads to certification issuance</p>
            <p>Every step is recorded on an <strong>immutable hash-chain audit trail</strong> for full transparency.</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Certification Application
            </CardTitle>
            <CardDescription>Select a project and provide details for the verification team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Project *</Label>
              {eligibleReports.length === 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No eligible projects found. Submit a report first or all your projects already have applications.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger><SelectValue placeholder="Choose a project..." /></SelectTrigger>
                  <SelectContent>
                    {eligibleReports.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title} — SDG {r.sdg_goal} ({r.project_status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Requested Certification Tier *</Label>
              <Select value={requestedTier} onValueChange={setRequestedTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIER_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label} (SIS {info.sisRange}) — {info.fee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 mt-1">
                <Badge style={{ backgroundColor: tierInfo.color, color: '#fff' }}>{tierInfo.label}</Badge>
                <span className="text-xs text-muted-foreground">Fee range: {tierInfo.fee}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>SDG Goals Targeted *</Label>
              <div className="flex flex-wrap gap-2">
                {SDG_GOALS.map(sdg => (
                  <Badge
                    key={sdg.id}
                    variant={selectedSdgs.includes(sdg.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleSdg(sdg.id)}
                  >
                    {sdg.label}
                  </Badge>
                ))}
              </div>
              {selectedSdgs.length === 0 && (
                <p className="text-xs text-muted-foreground">Select at least one SDG goal</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Project Description *</Label>
              <Textarea
                placeholder="Describe the project's objectives, implementation approach, and target beneficiaries..."
                value={projectDescription}
                onChange={e => setProjectDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Outcomes</Label>
              <Textarea
                placeholder="Describe measurable outcomes: indicators, targets, and expected impact..."
                value={expectedOutcomes}
                onChange={e => setExpectedOutcomes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Budget (USD)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={budgetUsd}
                  onChange={e => setBudgetUsd(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Geographic Scope</Label>
                <Select value={geographicScope} onValueChange={setGeographicScope}>
                  <SelectTrigger><SelectValue placeholder="Select scope..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local / Community</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="regional">Regional / Multi-country</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Evidence Summary</Label>
              <Textarea
                placeholder="List key evidence types you can provide: documents, satellite data, financial reports, beneficiary surveys..."
                value={evidenceSummary}
                onChange={e => setEvidenceSummary(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I confirm that the information provided is accurate and I agree to DevMapper's
                SDG certification terms. I understand that all verification steps are recorded on an
                immutable audit trail and that false claims may result in certification revocation.
              </label>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedReport || !agreed || selectedSdgs.length === 0 || !projectDescription || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting...' : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Submit Certification Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {existingApps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Your Existing Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExistingApplicationsList userId={user!.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

function ExistingApplicationsList({ userId }: { userId: string }) {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    (supabase as any)
      .from('certification_applications')
      .select('id, report_id, requested_tier, status, submitted_at')
      .eq('applicant_id', userId)
      .order('submitted_at', { ascending: false })
      .then(({ data }: any) => {
        if (data) setApps(data);
      });
  }, [userId]);

  if (apps.length === 0) return <p className="text-sm text-muted-foreground">No applications found.</p>;

  return (
    <div className="space-y-2">
      {apps.map((app: any) => (
        <div key={app.id} className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="text-sm font-medium">Application #{app.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">
              Submitted {new Date(app.submitted_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{app.requested_tier}</Badge>
            <Badge variant="secondary" className="capitalize">
              {app.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ApplyCertification;
