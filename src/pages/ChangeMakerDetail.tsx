import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SEOHead, generateChangeMakerSchema } from '@/components/seo/SEOHead';
import {
  MapPin,
  Mail,
  Phone,
  Users,
  Heart,
  Building,
  CheckCircle,
  ArrowLeft,
  DollarSign,
  Target,
  Award,
  Loader2,
  FileText,
} from 'lucide-react';

type ChangeMaker = Database['public']['Tables']['change_makers']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Campaign = Database['public']['Tables']['fundraising_campaigns']['Row'];

const sdgColors: Record<string, string> = {
  '1': 'bg-red-600',
  '2': 'bg-yellow-500',
  '3': 'bg-green-500',
  '4': 'bg-red-500',
  '5': 'bg-orange-500',
  '6': 'bg-cyan-500',
  '7': 'bg-yellow-400',
  '8': 'bg-rose-600',
  '9': 'bg-orange-400',
  '10': 'bg-pink-500',
  '11': 'bg-amber-500',
  '12': 'bg-amber-600',
  '13': 'bg-green-600',
  '14': 'bg-blue-500',
  '15': 'bg-green-400',
  '16': 'bg-blue-600',
  '17': 'bg-blue-800',
};

const ChangeMakerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [changeMaker, setChangeMaker] = useState<ChangeMaker | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data: cm } = await supabase.from('change_makers').select('*').eq('id', id).single();
      setChangeMaker(cm);

      // Real project list + funding total come from this change maker's own
      // reports/fundraising_campaigns rows (same join pattern as
      // ChangeMakerMyAnalytics), not from a mock projects[]/totalFunding pair.
      if (cm?.user_id) {
        const [{ data: profileData }, { data: reportsData }, { data: campaignsData }] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', cm.user_id).maybeSingle(),
          supabase.from('reports').select('*').eq('user_id', cm.user_id),
          supabase.from('fundraising_campaigns').select('*').eq('created_by', cm.user_id),
        ]);
        setProfile(profileData);
        setReports(reportsData || []);
        setCampaigns(campaignsData || []);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!changeMaker) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Change Maker Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The change maker you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/change-makers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Change Makers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const totalFunding = campaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0);
  const totalBeneficiaries = reports.reduce((sum, r) => sum + (r.beneficiaries || 0), 0);
  const verifiedReports = reports.filter(r => r.is_verified).length;
  const hasContactInfo = !!(profile?.email || profile?.phone || profile?.organization);

  return (
    <>
      <SEOHead
        title={`${changeMaker.title} - Dev Mapper Change Maker`}
        description={changeMaker.description}
        keywords={['change maker', 'SDG', 'Africa', changeMaker.location, ...changeMaker.sdg_goals.map(g => `SDG ${g}`)]}
        structuredData={generateChangeMakerSchema({
          name: changeMaker.title,
          description: changeMaker.description,
          location: changeMaker.location,
        })}
      />

      <div className="container mx-auto py-8 px-4">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/change-makers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Change Makers
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={changeMaker.image_url || undefined} alt={changeMaker.title} />
                  <AvatarFallback className="text-2xl">
                    {changeMaker.title.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-2xl">{changeMaker.title}</CardTitle>
                    {changeMaker.is_verified && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {changeMaker.location}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* About (the real table only has a single description field --
                  the mock's separate short "bio" + long "description" fields
                  are collapsed into one) */}
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{changeMaker.description}</p>
                {changeMaker.impact_description && (
                  <p className="text-muted-foreground mt-2">{changeMaker.impact_description}</p>
                )}
              </div>

              <Separator />

              {/* SDG Goals */}
              <div>
                <h3 className="font-semibold mb-3">SDG Focus Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {changeMaker.sdg_goals.map((goal) => (
                    <Badge
                      key={goal}
                      className={`${sdgColors[goal] || 'bg-gray-500'} text-white`}
                    >
                      SDG {goal}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Information -- only profiles.email/phone/organization
                  are real columns. Website/social links/phone-of-members etc.
                  from the mock have no backing column, so they're dropped
                  rather than invented. */}
              {hasContactInfo && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Contact Information</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {profile?.email && (
                        <a
                          href={`mailto:${profile.email}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          {profile.email}
                        </a>
                      )}
                      {profile?.phone && (
                        <a
                          href={`tel:${profile.phone}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          {profile.phone}
                        </a>
                      )}
                      {profile?.organization && (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          {profile.organization}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Projects -- real reports submitted by this change maker */}
              {reports.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Projects</h3>
                    <div className="space-y-2">
                      {reports.map((report) => (
                        <Link
                          key={report.id}
                          to={`/project/${report.id}`}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{report.title}</div>
                              <div className="text-xs text-muted-foreground">{report.location}</div>
                            </div>
                          </div>
                          {report.is_verified && (
                            <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Verification Status -- the real table only has an is_verified
                boolean; there is no numeric verification_score or
                verifications[] log to back the mock's confirm/dispute list. */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-primary" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {changeMaker.is_verified ? (
                  <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                    <CheckCircle className="h-4 w-4 mr-1 inline" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm px-3 py-1">Not yet verified</Badge>
                )}
              </CardContent>
            </Card>

            {/* Impact Metrics -- derived from real reports, not a mock
                impactMetrics object. "Communities Served" had no real source
                anywhere in the schema and is dropped rather than estimated. */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Impact Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Beneficiaries Reported</span>
                  </div>
                  <span className="font-semibold">{totalBeneficiaries.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Verified Reports</span>
                  </div>
                  <span className="font-semibold">{verifiedReports}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Projects</span>
                  </div>
                  <span className="font-semibold">{reports.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Funding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Total Funds Raised
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-center">
                  {formatCurrency(totalFunding)}
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button className="w-full" asChild>
                  <Link to={`/fundraising?changemaker=${changeMaker.id}`}>
                    Support This Change Maker
                  </Link>
                </Button>
                {profile?.email && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${profile.email}`}>Contact</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangeMakerDetail;
