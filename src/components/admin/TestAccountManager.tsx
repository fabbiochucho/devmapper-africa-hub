import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/contexts/UserRoleContext';
import { ALL_ROLES } from '@/lib/roles';
import { Copy, UserPlus, Shield, Users, Building2, Briefcase, Globe, Heart, User } from 'lucide-react';

// role keys below are stored UserRole values (used for DB rpc calls, checkbox ids) - never translate the keys.
// label/description text is resolved via translation inside the component (see roleConfig below).
export function TestAccountManager() {
  const { t } = useTranslation();

  const roleConfig: Record<UserRole, { label: string; color: string; icon: any; description: string }> = {
    citizen_reporter: {
      label: t('admin.testAccounts.role.citizenReporterLabel'),
      color: 'bg-blue-500',
      icon: User,
      description: t('admin.testAccounts.role.citizenReporterDescription')
    },
    ngo_member: {
      label: t('admin.testAccounts.role.ngoMemberLabel'),
      color: 'bg-green-500',
      icon: Users,
      description: t('admin.testAccounts.role.ngoMemberDescription')
    },
    government_official: {
      label: t('admin.testAccounts.role.governmentOfficialLabel'),
      color: 'bg-purple-500',
      icon: Building2,
      description: t('admin.testAccounts.role.governmentOfficialDescription')
    },
    company_representative: {
      label: t('admin.testAccounts.role.companyRepresentativeLabel'),
      color: 'bg-amber-500',
      icon: Briefcase,
      description: t('admin.testAccounts.role.companyRepresentativeDescription')
    },
    country_admin: {
      label: t('admin.testAccounts.role.countryAdminLabel'),
      color: 'bg-indigo-500',
      icon: Globe,
      description: t('admin.testAccounts.role.countryAdminDescription')
    },
    platform_admin: {
      label: t('admin.testAccounts.role.platformAdminLabel'),
      color: 'bg-red-500',
      icon: Shield,
      description: t('admin.testAccounts.role.platformAdminDescription')
    },
    change_maker: {
      label: t('admin.testAccounts.role.changeMakerLabel'),
      color: 'bg-pink-500',
      icon: Heart,
      description: t('admin.testAccounts.role.changeMakerDescription')
    },
    admin: {
      label: t('admin.testAccounts.role.adminLabel'),
      color: 'bg-red-600',
      icon: Shield,
      description: t('admin.testAccounts.role.adminDescription')
    },
    funder: {
      label: t('admin.testAccounts.role.funderLabel'),
      color: 'bg-emerald-600',
      icon: Heart,
      description: t('admin.testAccounts.role.funderDescription')
    },
  };

  // Test account templates - email addresses are fixed test data, never translated.
  const testAccountTemplates = [
    {
      email: 'citizen@test.devmapper.africa',
      name: t('admin.testAccounts.template.citizenName'),
      roles: ['citizen_reporter'] as UserRole[],
      description: t('admin.testAccounts.template.citizenDescription')
    },
    {
      email: 'ngo@test.devmapper.africa',
      name: t('admin.testAccounts.template.ngoName'),
      roles: ['ngo_member', 'citizen_reporter'] as UserRole[],
      organization: t('admin.testAccounts.template.ngoOrganization'),
      description: t('admin.testAccounts.template.ngoDescription')
    },
    {
      email: 'government@test.devmapper.africa',
      name: t('admin.testAccounts.template.governmentName'),
      roles: ['government_official', 'citizen_reporter'] as UserRole[],
      country: t('admin.testAccounts.template.governmentCountry'),
      description: t('admin.testAccounts.template.governmentDescription')
    },
    {
      email: 'corporate@test.devmapper.africa',
      name: t('admin.testAccounts.template.corporateName'),
      roles: ['company_representative', 'citizen_reporter'] as UserRole[],
      organization: t('admin.testAccounts.template.corporateOrganization'),
      description: t('admin.testAccounts.template.corporateDescription')
    },
    {
      email: 'changemaker@test.devmapper.africa',
      name: t('admin.testAccounts.template.changeMakerName'),
      roles: ['change_maker', 'citizen_reporter'] as UserRole[],
      description: t('admin.testAccounts.template.changeMakerDescription')
    },
    {
      email: 'admin@test.devmapper.africa',
      name: t('admin.testAccounts.template.adminName'),
      roles: ['admin', 'platform_admin', 'citizen_reporter'] as UserRole[],
      description: t('admin.testAccounts.template.adminDescription')
    },
  ];

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [organization, setOrganization] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  const assignRolesToUser = async () => {
    if (!selectedUserId || selectedRoles.length === 0) {
      toast.error(t('admin.testAccounts.selectUserAndRoleError'));
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

      toast.success(t('admin.testAccounts.assignSuccess'));
      setSelectedUserId('');
      setSelectedRoles([]);
      setOrganization('');
      setCountry('');
    } catch (error: any) {
      toast.error(error.message || t('admin.testAccounts.assignError'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('admin.testAccounts.copiedToClipboard'));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('admin.testAccounts.templatesTitle')}
          </CardTitle>
          <CardDescription>
            {t('admin.testAccounts.templatesDescription')}
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
                        {t('admin.testAccounts.orgLabel', { organization: template.organization })}
                      </p>
                    )}
                    {template.country && (
                      <p className="text-xs text-muted-foreground">
                        {t('admin.testAccounts.countryLabel', { country: template.country })}
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
            {t('admin.testAccounts.assignRolesTitle')}
          </CardTitle>
          <CardDescription>
            {t('admin.testAccounts.assignRolesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">{t('admin.testAccounts.userIdLabel')}</Label>
            <Input
              id="userId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.testAccounts.selectRolesLabel')}</Label>
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
              <Label htmlFor="organization">{t('admin.testAccounts.organizationOptionalLabel')}</Label>
              <Input
                id="organization"
                placeholder={t('admin.testAccounts.organizationPlaceholder')}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('admin.testAccounts.countryOptionalLabel')}</Label>
              <Input
                id="country"
                placeholder={t('admin.testAccounts.countryPlaceholder')}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={assignRolesToUser} disabled={loading}>
            {loading ? t('admin.testAccounts.assigningLabel') : t('admin.testAccounts.assignRolesButton')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.testAccounts.roleDescriptionsTitle')}</CardTitle>
          <CardDescription>
            {t('admin.testAccounts.roleDescriptionsSubtitle')}
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
