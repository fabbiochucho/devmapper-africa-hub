
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, MapPin, Search, Grid, Map, BarChart3, UserPlus, Loader2 } from "lucide-react";
import { sdgGoals } from "@/lib/constants";
import LazyChangeMakerMap from "@/components/changemaker/LazyChangeMakerMap";
import ChangeMakerAnalytics from "@/components/changemaker/ChangeMakerAnalytics";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminVerification } from "@/hooks/useAdminVerification";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ChangeMaker = Database['public']['Tables']['change_makers']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Campaign = Database['public']['Tables']['fundraising_campaigns']['Row'];

const ChangeMakers = () => {
  const { profile } = useAuth();
  const { isAdmin } = useAdminVerification();
  const [showNominateDialog, setShowNominateDialog] = useState(false);
  const [nomineeData, setNomineeData] = useState({ name: '', email: '', reason: '' });
  const [nominating, setNominating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [changeMakers, setChangeMakers] = useState<ChangeMaker[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cms, error } = await supabase
        .from('change_makers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load change makers:', error);
        setLoading(false);
        return;
      }

      const list = cms || [];
      setChangeMakers(list);

      // Impact numbers (funding, projects) come from each change maker's real
      // reports/campaigns, not from a mock-only impactMetrics object.
      const userIds = list.map(cm => cm.user_id).filter((id): id is string => !!id);
      if (userIds.length > 0) {
        const [{ data: reportsData }, { data: campaignsData }] = await Promise.all([
          supabase.from('reports').select('*').in('user_id', userIds),
          supabase.from('fundraising_campaigns').select('*').in('created_by', userIds),
        ]);
        setReports(reportsData || []);
        setCampaigns(campaignsData || []);
      }
      setLoading(false);
    })();
  }, []);

  const handleNominate = async () => {
    if (!nomineeData.email || !nomineeData.name) {
      toast.error('Please fill in name and email');
      return;
    }
    setNominating(true);
    try {
      const { data, error } = await supabase.functions.invoke('nominate-changemaker', {
        body: {
          nominee_email: nomineeData.email,
          nominee_name: nomineeData.name,
          nominator_name: profile?.full_name || 'A community member',
          reason: nomineeData.reason
        }
      });
      if (error) throw error;
      toast.success(data?.message || 'Nomination sent successfully!');
      setShowNominateDialog(false);
      setNomineeData({ name: '', email: '', reason: '' });
    } catch (error: any) {
      console.error('Nomination error:', error);
      toast.error(error.message || 'Failed to send nomination');
    } finally {
      setNominating(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSDG, setFilterSDG] = useState<string>("all");

  // Note: the mock data had a "type" filter (individual/group/ngo/corporate),
  // but the real change_makers table has no equivalent column, and nothing in
  // the nomination flow captures it either -- dropped rather than faked.
  const filteredChangeMakers = changeMakers.filter(maker => {
    const matchesSearch = maker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         maker.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSDG = filterSDG === "all" || maker.sdg_goals.includes(Number(filterSDG));

    return matchesSearch && matchesSDG;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(amount);
  };

  return (
    <>
      <SEOHead
        title="Change Makers - Dev Mapper"
        description="Discover champions driving sustainable development across Africa. Connect with individuals, NGOs, and organizations making real impact on SDG goals."
        keywords={['change makers', 'SDG champions', 'Africa sustainability', 'social impact', 'development', 'NGO']}
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Change Makers</h1>
            <p className="text-muted-foreground">
              Champions driving sustainable development across Africa
            </p>
          </div>
          {isAdmin && (
            <Dialog open={showNominateDialog} onOpenChange={setShowNominateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nominate Change Maker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nominate a Change Maker</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nominee-name">Nominee Name *</Label>
                    <Input
                      id="nominee-name"
                      value={nomineeData.name}
                      onChange={(e) => setNomineeData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name of the nominee"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nominee-email">Nominee Email *</Label>
                    <Input
                      id="nominee-email"
                      type="email"
                      value={nomineeData.email}
                      onChange={(e) => setNomineeData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="nominee@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nominee-reason">Reason for Nomination</Label>
                    <Textarea
                      id="nominee-reason"
                      value={nomineeData.reason}
                      onChange={(e) => setNomineeData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Why should this person be recognized as a Change Maker?"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNominateDialog(false)}>Cancel</Button>
                    <Button onClick={handleNominate} disabled={nominating}>
                      {nominating ? 'Sending...' : 'Send Nomination'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">
            <Grid className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="mr-2 h-4 w-4" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search change makers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSDG} onValueChange={setFilterSDG}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by SDG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SDGs</SelectItem>
                {sdgGoals.map((sdg) => (
                  <SelectItem key={sdg.number} value={sdg.number.toString()}>
                    SDG {sdg.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Change Makers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChangeMakers.map((maker) => (
                  <Link key={maker.id} to={`/change-makers/${maker.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader className="text-center">
                        <img
                          src={maker.image_url || '/placeholder.svg'}
                          alt={maker.title}
                          className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                        />
                        <CardTitle className="text-lg">{maker.title}</CardTitle>
                        <div className="flex items-center justify-center gap-2">
                          {maker.is_verified && (
                            <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {maker.location}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 line-clamp-2">{maker.description}</p>

                          <div className="flex flex-wrap gap-1 justify-center">
                            {maker.sdg_goals.slice(0, 3).map((sdg) => (
                              <Badge key={sdg} variant="secondary" className="text-xs">
                                SDG {sdg}
                              </Badge>
                            ))}
                            {maker.sdg_goals.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{maker.sdg_goals.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-green-600">
                                {maker.projects_count ?? 0}
                              </div>
                              <div className="text-gray-500">Projects</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-blue-600">
                                {formatCurrency(maker.total_funding ?? 0)}
                              </div>
                              <div className="text-gray-500">Funded</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {filteredChangeMakers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No change makers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {changeMakers.length === 0
                      ? "No verified change makers have been added to the registry yet."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <LazyChangeMakerMap changeMakers={filteredChangeMakers} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <ChangeMakerAnalytics changeMakers={changeMakers} reports={reports} campaigns={campaigns} />
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
};

export default ChangeMakers;
