import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell, LogOut, Save, CreditCard, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { africanCountries } from "@/data/countries";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { user, profile, signOut, updateProfile, updatePassword } = useAuth();
  const { currentRole, roles, setCurrentRole } = useUserRole();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [organization, setOrganization] = useState(profile?.organization || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);

  // Entity enrichment fields
  const [legalCapacity, setLegalCapacity] = useState((profile as any)?.legal_capacity || "");
  const [sectorClassification, setSectorClassification] = useState((profile as any)?.sector_classification || "");
  const [verificationTier, setVerificationTier] = useState((profile as any)?.verification_tier || "");
  const [impactArea, setImpactArea] = useState((profile as any)?.impact_area || "");
  const [savingEnrichment, setSavingEnrichment] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      country,
      organization,
      bio,
      phone,
    });
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    await updatePassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    setChangingPassword(false);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentRole("citizen_reporter");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    toast.error("Account deletion requires admin assistance. Please contact support@devmapper.africa");
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      citizen_reporter: "Citizen Reporter",
      ngo_member: "NGO Member",
      government_official: "Government Official",
      company_representative: "Company Representative",
      country_admin: "Country Admin",
      platform_admin: "Platform Admin",
      change_maker: "Change Maker",
      admin: "Administrator",
    };
    return roleMap[role] || role;
  };

  return (
    <div className="container mx-auto py-4 sm:py-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, security, and preferences</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-1" /> Profile</TabsTrigger>
          <TabsTrigger value="enrichment"><Briefcase className="w-4 h-4 mr-1" /> Entity</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" /> Security</TabsTrigger>
          <TabsTrigger value="roles"><Bell className="w-4 h-4 mr-1" /> Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details visible to the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-green-500 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{profile?.full_name || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant={profile?.is_verified ? "default" : "outline"} className="mt-1">
                    {profile?.is_verified ? "✓ Verified" : "Pending Verification"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {africanCountries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell the community about yourself..." />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing & Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/billing-upgrade")}>
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Plan & Billing
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrichment" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Classification</CardTitle>
              <CardDescription>Regulatory & governance attributes for compliance assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalCapacity">Legal Capacity</Label>
                  <Select value={legalCapacity} onValueChange={setLegalCapacity}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="llc">LLC / Limited Liability</SelectItem>
                      <SelectItem value="corporation">Corporation / PLC</SelectItem>
                      <SelectItem value="ngo_registered">Registered NGO</SelectItem>
                      <SelectItem value="government_body">Government Body</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sectorClassification">Sector Classification</Label>
                  <Select value={sectorClassification} onValueChange={setSectorClassification}>
                    <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agriculture">Agriculture & Agribusiness</SelectItem>
                      <SelectItem value="energy">Energy & Utilities</SelectItem>
                      <SelectItem value="finance">Financial Services</SelectItem>
                      <SelectItem value="healthcare">Healthcare & Pharma</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="technology">Technology & ICT</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="mining">Mining & Extractives</SelectItem>
                      <SelectItem value="construction">Construction & Real Estate</SelectItem>
                      <SelectItem value="transport">Transport & Logistics</SelectItem>
                      <SelectItem value="water_sanitation">Water & Sanitation</SelectItem>
                      <SelectItem value="environment">Environment & Conservation</SelectItem>
                      <SelectItem value="governance">Governance & Public Admin</SelectItem>
                      <SelectItem value="social_services">Social Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verificationTier">Verification Tier</Label>
                  <Select value={verificationTier} onValueChange={setVerificationTier}>
                    <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="self_declared">Self-Declared</SelectItem>
                      <SelectItem value="peer_verified">Peer Verified</SelectItem>
                      <SelectItem value="institution_verified">Institution Verified</SelectItem>
                      <SelectItem value="audit_verified">Audit Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impactArea">Impact Area</Label>
                  <Select value={impactArea} onValueChange={setImpactArea}>
                    <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="climate">Climate & Environment</SelectItem>
                      <SelectItem value="health">Health & Wellbeing</SelectItem>
                      <SelectItem value="education">Education & Skills</SelectItem>
                      <SelectItem value="economic">Economic Development</SelectItem>
                      <SelectItem value="governance">Governance & Institutions</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="gender">Gender Equality</SelectItem>
                      <SelectItem value="food_security">Food Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveEnrichment} disabled={savingEnrichment}>
                <Save className="w-4 h-4 mr-2" />
                {savingEnrichment ? "Saving..." : "Save Entity Details"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Roles</CardTitle>
              <CardDescription>Roles determine what features and dashboards you can access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {roles.map((r) => (
                  <Badge key={r.role} variant={r.role === currentRole ? "default" : "secondary"}>
                    {getRoleDisplayName(r.role)}
                    {r.role === currentRole && " (active)"}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Need a different role? Contact support or apply through the relevant dashboard.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
