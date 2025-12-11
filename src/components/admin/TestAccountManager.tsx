import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ALL_ROLES } from '@/contexts/UserRoleContext';
import { Copy, UserPlus, Shield, Users, Building2, Briefcase, Globe, Heart, User } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; color: string; icon: any; description: string }> = {
  citizen_reporter: { 
    label: 'Citizen Reporter', 
    color: 'bg-blue-500', 
    icon: User,
    description: 'Default role - can submit reports and verify projects'
  },
  ngo_member: { 
    label: 'NGO Member', 
    color: 'bg-green-500', 
    icon: Users,
    description: 'Access to NGO dashboard and project management'
  },
  government_official: { 
    label: 'Government Official', 
    color: 'bg-purple-500', 
    icon: Building2,
    description: 'Access to government dashboard and national data'
  },
  company_representative: { 
    label: 'Corporate Rep', 
    color: 'bg-amber-500', 
    icon: Briefcase,
    description: 'Access to corporate dashboard, ESG, and targets'
  },
  country_admin: { 
    label: 'Country Admin', 
    color: 'bg-indigo-500', 
    icon: Globe,
    description: 'Manage country-specific data and users'
  },
  platform_admin: { 
    label: 'Platform Admin', 
    color: 'bg-red-500', 
    icon: Shield,
    description: 'Full platform access and user management'
  },
  change_maker: { 
    label: 'Change Maker', 
    color: 'bg-pink-500', 
    icon: Heart,
    description: 'Verified change maker with impact profile'
  },
  admin: { 
    label: 'Admin', 
    color: 'bg-red-600', 
    icon: Shield,
    description: 'Administrative access to all features'
  },
};

// Test account templates
const testAccountTemplates = [
  {
    email: 'citizen@test.devmapper.africa',
    name: 'Test Citizen',
    roles: ['citizen_reporter'] as UserRole[],
    description: 'Basic user for testing citizen features'
  },
  {
    email: 'ngo@test.devmapper.africa',
    name: 'Test NGO User',
    roles: ['ngo_member', 'citizen_reporter'] as UserRole[],
    organization: 'Test NGO Organization',
    description: 'NGO member with project access'
  },
  {
    email: 'government@test.devmapper.africa',
    name: 'Test Government Official',
    roles: ['government_official', 'citizen_reporter'] as UserRole[],
    country: 'Kenya',
    description: 'Government official with national dashboard'
  },
  {
    email: 'corporate@test.devmapper.africa',
    name: 'Test Corporate Rep',
    roles: ['company_representative', 'citizen_reporter'] as UserRole[],
    organization: 'Test Corporation Ltd',
    description: 'Corporate user with ESG and targets access'
  },
  {
    email: 'changemaker@test.devmapper.africa',
    name: 'Test Change Maker',
    roles: ['change_maker', 'citizen_reporter'] as UserRole[],
    description: 'Verified change maker profile'
  },
  {
    email: 'admin@test.devmapper.africa',
    name: 'Test Admin',
    roles: ['admin', 'platform_admin', 'citizen_reporter'] as UserRole[],
    description: 'Full admin access for testing'
  },
];

export function TestAccountManager() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [organization, setOrganization] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  const assignRolesToUser = async () => {
    if (!selectedUserId || selectedRoles.length === 0) {
      toast.error('Please select a user and at least one role');
      return;
    }

    setLoading(true);
    try {
      for (const role of selectedRoles) {
        const { error } = await supabase.rpc('assign_test_role', {
          p_user_id: selectedUserId,
          p_role: role,
          p_organization: organization || null,
          p_country: country || null,
        });

        if (error) throw error;
      }

      toast.success('Roles assigned successfully');
      setSelectedUserId('');
      setSelectedRoles([]);
      setOrganization('');
      setCountry('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign roles');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Test Account Templates
          </CardTitle>
          <CardDescription>
            Pre-configured test accounts for each user type. Create these accounts in Supabase Auth, 
            then use the role assignment tool below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testAccountTemplates.map((template) => (
              <Card key={template.email} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{template.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(template.email)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{template.email}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.roles.map((role) => {
                        const config = roleConfig[role];
                        return (
                          <Badge key={role} className={`${config.color} text-white text-[10px]`}>
                            {config.label}
                          </Badge>
                        );
                      })}
                    </div>
                    {template.organization && (
                      <p className="text-xs text-muted-foreground">
                        Org: {template.organization}
                      </p>
                    )}
                    {template.country && (
                      <p className="text-xs text-muted-foreground">
                        Country: {template.country}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Roles to User
          </CardTitle>
          <CardDescription>
            Enter a user ID to assign roles. The user must already exist in Supabase Auth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID (UUID)</Label>
            <Input
              id="userId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Roles</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {ALL_ROLES.map((role) => {
                const config = roleConfig[role];
                const Icon = config.icon;
                return (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={role}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role]);
                        } else {
                          setSelectedRoles(selectedRoles.filter((r) => r !== role));
                        }
                      }}
                    />
                    <label
                      htmlFor={role}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization (optional)</Label>
              <Input
                id="organization"
                placeholder="Organization name"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country (optional)</Label>
              <Input
                id="country"
                placeholder="Country name"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={assignRolesToUser} disabled={loading}>
            {loading ? 'Assigning...' : 'Assign Roles'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
          <CardDescription>
            What each role can access in the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(roleConfig).map(([role, config]) => {
              const Icon = config.icon;
              return (
                <div key={role} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
