import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Shield, Star, Award, Users, CheckCircle, Clock, MapPin, Search, Plus, TrendingUp } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

const VerifierMarketplace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  // Form state for creating verifier profile
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    bio: "",
    organization_name: "",
    credentials: "",
    methodologies: "",
    regions: "",
  });

  const { data: verifiers, isLoading } = useQuery({
    queryKey: ["verifier-profiles", searchTerm, regionFilter],
    queryFn: async () => {
      let query = supabase.from("verifier_profiles").select("*").order("reputation_score", { ascending: false });
      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,organization_name.ilike.%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-verifier-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("verifier_profiles").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: assignments } = useQuery({
    queryKey: ["my-verification-assignments", user?.id],
    queryFn: async () => {
      if (!user || !myProfile) return [];
      const { data } = await supabase
        .from("verification_assignments")
        .select("*")
        .eq("verifier_id", myProfile.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && !!myProfile,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["verifier-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("verifier_profiles")
        .select("*")
        .eq("is_certified", true)
        .order("reputation_score", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const createProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("verifier_profiles").insert({
        user_id: user.id,
        display_name: profileForm.display_name,
        bio: profileForm.bio,
        organization_name: profileForm.organization_name || null,
        credentials: profileForm.credentials.split(",").map(s => s.trim()).filter(Boolean),
        methodologies: profileForm.methodologies.split(",").map(s => s.trim()).filter(Boolean),
        regions: profileForm.regions.split(",").map(s => s.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verifier profile created!");
      setShowCreateProfile(false);
      queryClient.invalidateQueries({ queryKey: ["verifier-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["my-verifier-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("verification_assignments")
        .update({ status, ...(status === "in_progress" ? { started_at: new Date().toISOString() } : {}), ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment updated");
      queryClient.invalidateQueries({ queryKey: ["my-verification-assignments"] });
    },
  });

  const filteredVerifiers = verifiers?.filter(v => {
    if (regionFilter !== "all" && !v.regions?.includes(regionFilter)) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title="Verifier Marketplace - DevMapper" description="Find and connect with certified verifiers for your sustainability projects." />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Verifier Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">Find certified verifiers for your sustainability and carbon projects</p>
        </div>
        {user && !myProfile && (
          <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Become a Verifier</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Verifier Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Display Name *" value={profileForm.display_name} onChange={e => setProfileForm(p => ({ ...p, display_name: e.target.value }))} />
                <Textarea placeholder="Bio / expertise description" value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} />
                <Input placeholder="Organization (optional)" value={profileForm.organization_name} onChange={e => setProfileForm(p => ({ ...p, organization_name: e.target.value }))} />
                <Input placeholder="Credentials (comma-separated)" value={profileForm.credentials} onChange={e => setProfileForm(p => ({ ...p, credentials: e.target.value }))} />
                <Input placeholder="Methodologies (e.g., Verra, Gold Standard)" value={profileForm.methodologies} onChange={e => setProfileForm(p => ({ ...p, methodologies: e.target.value }))} />
                <Input placeholder="Regions (e.g., East Africa, West Africa)" value={profileForm.regions} onChange={e => setProfileForm(p => ({ ...p, regions: e.target.value }))} />
                <Button onClick={() => createProfile.mutate()} disabled={!profileForm.display_name || createProfile.isPending} className="w-full">
                  {createProfile.isPending ? "Creating..." : "Create Profile"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Verifiers</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          {myProfile && <TabsTrigger value="assignments">My Assignments</TabsTrigger>}
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search verifiers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="East Africa">East Africa</SelectItem>
                <SelectItem value="West Africa">West Africa</SelectItem>
                <SelectItem value="Southern Africa">Southern Africa</SelectItem>
                <SelectItem value="North Africa">North Africa</SelectItem>
                <SelectItem value="Central Africa">Central Africa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading verifiers...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVerifiers?.map(v => (
                <Card key={v.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{v.display_name}</CardTitle>
                        {v.organization_name && <CardDescription>{v.organization_name}</CardDescription>}
                      </div>
                      <div className="flex items-center gap-1">
                        {v.is_certified && <Badge variant="default" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Certified</Badge>}
                        <Badge variant={v.availability_status === "available" ? "default" : "secondary"} className="text-xs">
                          {v.availability_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {v.bio && <p className="text-sm text-muted-foreground line-clamp-2">{v.bio}</p>}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{(v.reputation_score || 0).toFixed(0)}/100</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>{v.verification_count || 0} verified</span>
                      </div>
                    </div>

                    {v.methodologies && v.methodologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {v.methodologies.slice(0, 3).map((m: string) => (
                          <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    )}

                    {v.regions && v.regions.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {v.regions.join(", ")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredVerifiers?.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">No verifiers found</div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" />Top Verifiers</CardTitle>
              <CardDescription>Ranked by reputation score based on verification quality and reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Verifier</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Reputation</TableHead>
                    <TableHead>Verifications</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard?.map((v, i) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{v.display_name}</TableCell>
                      <TableCell className="text-muted-foreground">{v.organization_name || "Independent"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={v.reputation_score || 0} className="w-16 h-2" />
                          <span className="text-sm font-medium">{(v.reputation_score || 0).toFixed(0)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{v.verification_count}</TableCell>
                      <TableCell>
                        <Badge variant={v.availability_status === "available" ? "default" : "secondary"} className="text-xs">
                          {v.availability_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaderboard?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No certified verifiers yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {myProfile && (
          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />My Verification Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments && assignments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs">{a.report_id?.slice(0, 8)}...</TableCell>
                          <TableCell><Badge variant="outline">{a.stage}</Badge></TableCell>
                          <TableCell><Badge variant={a.status === "completed" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {a.status === "pending" && (
                                <Button size="sm" variant="outline" onClick={() => updateAssignment.mutate({ id: a.id, status: "accepted" })}>Accept</Button>
                              )}
                              {a.status === "accepted" && (
                                <Button size="sm" variant="outline" onClick={() => updateAssignment.mutate({ id: a.id, status: "in_progress" })}>Start</Button>
                              )}
                              {a.status === "in_progress" && (
                                <Button size="sm" onClick={() => updateAssignment.mutate({ id: a.id, status: "completed" })}>Complete</Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No assignments yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default VerifierMarketplace;
