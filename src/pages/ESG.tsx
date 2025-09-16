import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  Factory,
  Users,
  Target,
  BarChart3,
  FileText,
  Settings,
  Crown,
  Shield
} from 'lucide-react';
import ESGDashboard from '@/components/esg/ESGDashboard';
import SupplierCSVImporter from '@/components/esg/SupplierCSVImporter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ESGPage = () => {
  const { user } = useAuth();
  const { currentRole } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrganizations(data || []);
      
      // Auto-select first organization or create one
      if (data && data.length > 0) {
        setSelectedOrgId(data[0].id);
        setSelectedOrg(data[0]);
      } else {
        // Create default organization if none exists
        await createDefaultOrganization();
      }
      
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: `${user!.email?.split('@')[0]}'s Organization`,
          created_by: user!.id,
          esg_enabled: false,
          plan_type: 'lite'
        }])
        .select()
        .single();

      if (error) throw error;

      setOrganizations([data]);
      setSelectedOrgId(data.id);
      setSelectedOrg(data);
      
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    }
  };

  const handleOrgChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    setSelectedOrgId(orgId);
    setSelectedOrg(org);
  };

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
            <p className="text-muted-foreground mb-4">Please sign in to access ESG features.</p>
            <Button asChild>
              <a href="/auth">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">ESG Management</h1>
                <p className="text-muted-foreground">
                  Environmental, Social & Governance tracking integrated with your SDG initiatives
                </p>
              </div>
            </div>
            
            {/* Organization Selector */}
            {organizations.length > 1 && (
              <div className="flex items-center gap-2">
                <select 
                  value={selectedOrgId || ''} 
                  onChange={(e) => handleOrgChange(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Organization Info */}
          {selectedOrg && (
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="flex-1">
                <h2 className="font-semibold">{selectedOrg.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedOrg.primary_sector || 'No sector specified'} • 
                  Reporting Year: {selectedOrg.reporting_year || new Date().getFullYear()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedOrg.plan_type === 'pro' ? 'default' : 'secondary'}>
                  {selectedOrg.plan_type === 'pro' ? (
                    <Crown className="w-3 h-3 mr-1" />
                  ) : (
                    <Shield className="w-3 h-3 mr-1" />
                  )}
                  {selectedOrg.plan_type} Plan
                </Badge>
                {selectedOrg.esg_enabled ? (
                  <Badge variant="default" className="bg-green-500">
                    ESG Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    ESG Disabled
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {selectedOrgId ? (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Suppliers
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Scenarios
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <ESGDashboard organizationId={selectedOrgId} />
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SupplierCSVImporter 
                    organizationId={selectedOrgId}
                    onImportComplete={() => {
                      // Refresh data or show success message
                      toast.success('Supplier data imported successfully!');
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Users className="w-4 h-4 mr-2" />
                          View All Suppliers
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Factory className="w-4 h-4 mr-2" />
                          Add Manual Entry
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Scope 3 Analysis
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">Integration</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>AlphaEarth API Connected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>SDG Alignment Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Auto-enrichment {selectedOrg?.plan_type === 'pro' ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Scenario Modeling</h3>
                  <p className="text-muted-foreground mb-4">
                    Create what-if scenarios to model your ESG performance under different conditions.
                  </p>
                  <Button>Create First Scenario</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">ESG Reports</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate comprehensive ESG reports for stakeholders and compliance.
                  </p>
                  <Button>Generate Report</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">ESG Module Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable ESG Tracking</p>
                        <p className="text-sm text-muted-foreground">
                          Activate comprehensive ESG data collection and reporting
                        </p>
                      </div>
                      <Button 
                        variant={selectedOrg?.esg_enabled ? 'destructive' : 'default'}
                        onClick={async () => {
                          try {
                            await supabase
                              .from('organizations')
                              .update({ esg_enabled: !selectedOrg?.esg_enabled })
                              .eq('id', selectedOrgId);
                            
                            await loadOrganizations();
                            toast.success('ESG settings updated');
                          } catch (error) {
                            toast.error('Failed to update settings');
                          }
                        }}
                      >
                        {selectedOrg?.esg_enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
              <p className="text-muted-foreground">
                Please create or select an organization to access ESG features.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ESGPage;