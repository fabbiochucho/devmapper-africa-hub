import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Share2, Copy, ExternalLink, Users, DollarSign, Target, TrendingUp,
  MapPin, CheckCircle, Heart, Globe, Loader2, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import SocialShareButton from '@/components/social/SocialShareButton';

const SDG_COLORS = [
  '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', '#26BDE2',
  '#FCC30B', '#A21942', '#FD6925', '#DD1367', '#FD9D24', '#BF8B2E',
  '#3F7E44', '#0A97D9', '#56C02B', '#00689D', '#19486A',
];

const ChangeMakerMyAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, changeMakerRes, reportsRes, campaignsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
        supabase.from('change_makers').select('*').eq('user_id', user!.id).single(),
        supabase.from('reports').select('*').eq('user_id', user!.id),
        supabase.from('fundraising_campaigns').select('*').eq('created_by', user!.id),
      ]);

      setUserProfile(profileRes.data);
      setProfile(changeMakerRes.data);
      setReports(reportsRes.data || []);
      setCampaigns(campaignsRes.data || []);

      // Load donations for user's campaigns
      if (campaignsRes.data && campaignsRes.data.length > 0) {
        const ids = campaignsRes.data.map(c => c.id);
        const { data: donationData } = await supabase
          .from('campaign_donations')
          .select('*')
          .in('campaign_id', ids)
          .eq('status', 'completed');
        setDonations(donationData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = `${window.location.origin}/change-makers/${profile?.id || ''}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
        <p className="text-muted-foreground">Please sign in to view your analytics dashboard.</p>
        <Button className="mt-4" asChild><a href="/auth">Sign In</a></Button>
      </div>
    );
  }

  // Compute analytics
  const totalReports = reports.length;
  const verifiedReports = reports.filter(r => r.is_verified).length;
  const totalBeneficiaries = reports.reduce((s, r) => s + (r.beneficiaries || 0), 0);
  const totalCost = reports.reduce((s, r) => s + (r.cost || 0), 0);
  const totalRaised = campaigns.reduce((s, c) => s + (c.raised_amount || 0), 0);
  const totalDonors = donations.length;

  // SDG distribution
  const sdgCounts: Record<number, number> = {};
  reports.forEach(r => {
    sdgCounts[r.sdg_goal] = (sdgCounts[r.sdg_goal] || 0) + 1;
  });
  const sdgData = Object.entries(sdgCounts).map(([sdg, count]) => ({
    sdg: `SDG ${sdg}`,
    count,
    fill: SDG_COLORS[parseInt(sdg) - 1] || '#666',
  })).sort((a, b) => b.count - a.count);

  // Reports by status
  const statusCounts: Record<string, number> = {};
  reports.forEach(r => {
    statusCounts[r.project_status] = (statusCounts[r.project_status] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

  // Country distribution
  const countryCounts: Record<string, number> = {};
  reports.forEach(r => {
    if (r.country_code) countryCounts[r.country_code] = (countryCounts[r.country_code] || 0) + 1;
  });
  const countryData = Object.entries(countryCounts).map(([code, count]) => ({ country: code, count }));

  return (
    <>
      <SEOHead
        title="My Analytics — DevMapper Change Maker Dashboard"
        description={`Impact analytics for ${userProfile?.full_name || 'Change Maker'} on DevMapper`}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="text-xl">{(userProfile?.full_name || 'U')[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                My Impact Analytics
                {profile?.is_verified && <CheckCircle className="w-5 h-5 text-green-500" />}
              </h1>
              <p className="text-muted-foreground">
                {userProfile?.full_name || user.email} • {userProfile?.country || 'Africa'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
            {profile && (
              <SocialShareButton
                title={`${userProfile?.full_name}'s Impact on DevMapper`}
                description={`${totalReports} projects, ${totalBeneficiaries.toLocaleString()} beneficiaries, ${verifiedReports} verified`}
                url={shareUrl}
                data={{ totalReports, totalBeneficiaries, verifiedReports }}
                type="analytics"
              />
            )}
            {profile && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={`/change-makers/${profile.id}`} target="_blank">
                  <ExternalLink className="w-4 h-4" />
                  Public Profile
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Projects', value: totalReports, icon: <BarChart3 className="w-4 h-4" />, color: 'text-blue-600' },
            { label: 'Verified', value: verifiedReports, icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' },
            { label: 'Beneficiaries', value: totalBeneficiaries.toLocaleString(), icon: <Users className="w-4 h-4" />, color: 'text-purple-600' },
            { label: 'Investment', value: `$${(totalCost / 1000).toFixed(0)}K`, icon: <DollarSign className="w-4 h-4" />, color: 'text-amber-600' },
            { label: 'Funds Raised', value: `$${(totalRaised / 1000).toFixed(0)}K`, icon: <Heart className="w-4 h-4" />, color: 'text-red-600' },
            { label: 'Donors', value: totalDonors, icon: <TrendingUp className="w-4 h-4" />, color: 'text-indigo-600' },
          ].map(m => (
            <Card key={m.label}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className={`flex items-center gap-1 mb-1 ${m.color}`}>{m.icon}<span className="text-xs font-medium">{m.label}</span></div>
                <div className="text-xl font-bold">{m.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SDG Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">SDG Focus Areas</CardTitle></CardHeader>
            <CardContent>
              {sdgData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sdgData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sdg" fontSize={11} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Projects">
                      {sdgData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No projects yet</p>
              )}
            </CardContent>
          </Card>

          {/* Project Status */}
          <Card>
            <CardHeader><CardTitle className="text-base">Project Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data</p>
              )}
            </CardContent>
          </Card>

          {/* Countries */}
          {countryData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Countries of Impact</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={countryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Fundraising */}
          {campaigns.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Fundraising Campaigns</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.map(c => {
                    const pct = c.target_amount > 0 ? (c.raised_amount / c.target_amount) * 100 : 0;
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{c.title}</div>
                          <div className="text-xs text-muted-foreground">{c.location}</div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-bold">${c.raised_amount?.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">of ${c.target_amount?.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Shareable Mini-Website Card */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col md:flex-row items-center gap-4 py-6">
            <Globe className="w-10 h-10 text-primary shrink-0" />
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-semibold">Share Your Impact</h3>
              <p className="text-sm text-muted-foreground">
                Share your public analytics page with donors, partners, and the community.
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block break-all">{shareUrl}</code>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyShareLink} variant="outline" size="sm" className="gap-2">
                <Copy className="w-4 h-4" /> Copy
              </Button>
              {profile && (
                <Button asChild size="sm" className="gap-2">
                  <a href={`/change-makers/${profile.id}`} target="_blank">
                    <ExternalLink className="w-4 h-4" /> View
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChangeMakerMyAnalytics;
