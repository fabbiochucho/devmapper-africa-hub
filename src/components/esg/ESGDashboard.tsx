import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Leaf, 
  Factory, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Target,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getBenchmarkForOrg } from '@/lib/alphaearth';
import ESGScenarioAnalysis from './ESGScenarioAnalysis';
import ESGReportGenerator from './ESGReportGenerator';
import ESGReportDialog from './ESGReportDialog';
import ESGDataVerification from './ESGDataVerification';
import SupplierCSVImporter from './SupplierCSVImporter';
import EmissionsManager from './EmissionsManager';
import ExportManager from '@/components/export/ExportManager';
import IFRSReadinessAssessment from './IFRSReadinessAssessment';
import FrameworkGapAnalysis from './FrameworkGapAnalysis';

interface ESGIndicators {
  id: string;
  reporting_year: number;
  carbon_scope1_tonnes: number;
  carbon_scope2_tonnes: number;
  carbon_scope3_tonnes: number;
  energy_consumption_kwh: number;
  water_consumption_m3: number;
  waste_generated_tonnes: number;
  renewable_energy_percentage: number;
  esg_score: number;
  verification_status: string;
}

interface Organization {
  id: string;
  name: string;
  plan_type: string;
  esg_enabled: boolean;
  primary_sector: string;
  reporting_year: number;
  esg_suppliers_limit: number;
  esg_scenarios_limit: number;
  alphaearth_api_calls_limit: number;
}

const ESGDashboard = ({ organizationId }: { organizationId: string }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [indicators, setIndicators] = useState<ESGIndicators[]>([]);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    if (organizationId) {
      loadESGData();
    }
  }, [organizationId]);

  const loadESGData = async () => {
    try {
      setLoading(true);

      // Load organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      if (!orgData.esg_enabled) {
        return; // ESG not enabled
      }

      // Load ESG indicators
      const { data: indicatorsData } = await supabase
        .from('esg_indicators')
        .select('*')
        .eq('organization_id', organizationId)
        .order('reporting_year', { ascending: false });

      setIndicators(indicatorsData || []);

      // Load suppliers count
      const { data: suppliersData } = await supabase
        .from('esg_suppliers')
        .select('*')
        .eq('organization_id', organizationId);

      setSuppliers(suppliersData || []);

      // Load scenarios
      const { data: scenariosData } = await supabase
        .from('esg_scenarios')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      setScenarios(scenariosData || []);

      // Try to load benchmark data
      if (orgData.primary_sector) {
        try {
          const benchmarkData = await getBenchmarkForOrg(
            orgData.plan_type,
            'US', // Default country
            orgData.primary_sector,
            orgData.reporting_year,
            organizationId
          );
          setBenchmark(benchmarkData);
        } catch (benchmarkError) {
          console.warn('Could not load benchmark data:', benchmarkError);
        }
      }

    } catch (error) {
      console.error('Error loading ESG data:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableESG = async () => {
    try {
      await supabase
        .from('organizations')
        .update({ esg_enabled: true })
        .eq('id', organizationId);

      await loadESGData();
    } catch (error) {
      console.error('Error enabling ESG:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization?.esg_enabled) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <Leaf className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Enable ESG Tracking</h2>
          <p className="text-muted-foreground mb-6">
            Track your environmental, social, and governance impact alongside your SDG initiatives.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-500" />
              <span>Carbon Footprint Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>AlphaEarth Benchmarking</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <span>Scenario Modeling</span>
            </div>
          </div>
          <Button onClick={enableESG}>
            Enable ESG Module
          </Button>
        </CardContent>
      </Card>
    );
  }

  const latestIndicators = indicators[0];
  const totalEmissions = latestIndicators ? 
    (latestIndicators.carbon_scope1_tonnes || 0) + 
    (latestIndicators.carbon_scope2_tonnes || 0) + 
    (latestIndicators.carbon_scope3_tonnes || 0) : 0;

  const emissionsData = indicators.map(ind => ({
    year: ind.reporting_year,
    scope1: ind.carbon_scope1_tonnes || 0,
    scope2: ind.carbon_scope2_tonnes || 0,
    scope3: ind.carbon_scope3_tonnes || 0,
    total: (ind.carbon_scope1_tonnes || 0) + (ind.carbon_scope2_tonnes || 0) + (ind.carbon_scope3_tonnes || 0)
  })).reverse();

  const scopeBreakdown = latestIndicators ? [
    { name: 'Scope 1', value: latestIndicators.carbon_scope1_tonnes || 0, color: '#ef4444' },
    { name: 'Scope 2', value: latestIndicators.carbon_scope2_tonnes || 0, color: '#f97316' },
    { name: 'Scope 3', value: latestIndicators.carbon_scope3_tonnes || 0, color: '#eab308' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ESG Dashboard</h1>
          <p className="text-muted-foreground">
            Environmental, Social & Governance tracking for {organization.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ESGReportDialog
            organizationName={organization.name}
            organizationId={organizationId}
            indicators={indicators}
            suppliers={suppliers}
            scenarios={scenarios}
            benchmark={benchmark}
            planType={organization.plan_type as 'free' | 'lite' | 'pro'}
          />
          <Badge variant={organization.plan_type === 'pro' ? 'default' : 'secondary'}>
            {organization.plan_type} Plan
          </Badge>
          {latestIndicators?.verification_status === 'verified' ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Unverified
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emissions</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">tonnes CO2e</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Use</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(latestIndicators?.energy_consumption_kwh || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">kWh</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">
              of {organization.esg_suppliers_limit > 0 ? organization.esg_suppliers_limit : '∞'} limit
            </p>
            {organization.esg_suppliers_limit > 0 && (
              <Progress 
                value={(suppliers.length / organization.esg_suppliers_limit) * 100} 
                className="mt-2" 
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ESG Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestIndicators?.esg_score ? Math.round(latestIndicators.esg_score) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Manager in header */}
      <ExportManager
        organizationName={organization.name}
        planType={organization.plan_type as 'free' | 'lite' | 'pro'}
        availableData={[
          { type: 'esg_indicators', label: 'ESG Indicators', data: indicators },
          { type: 'esg_suppliers', label: 'Suppliers', data: suppliers },
          { type: 'esg_scenarios', label: 'Scenarios', data: scenarios }
        ]}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emissions">Emissions</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="ifrs">IFRS S1/S2</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Emissions Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Emissions Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={emissionsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Scope Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Current Year Emissions Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scopeBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {scopeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarks</CardTitle>
              <p className="text-sm text-muted-foreground">
                Powered by {organization.plan_type === 'pro' ? 'AlphaEarth Commercial API' : 'AlphaEarth Foundations (GEE)'}
              </p>
            </CardHeader>
            <CardContent>
              {benchmark ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{benchmark.avg_carbon_intensity}</div>
                      <div className="text-sm text-muted-foreground">Industry Average</div>
                      <div className="text-xs text-muted-foreground">tonnes CO2e</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {totalEmissions > 0 ? totalEmissions.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Your Performance</div>
                      <div className="text-xs text-muted-foreground">tonnes CO2e</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold flex items-center justify-center">
                        {totalEmissions > 0 && benchmark.avg_carbon_intensity > 0 ? (
                          <>
                            {totalEmissions < benchmark.avg_carbon_intensity ? (
                              <TrendingDown className="w-6 h-6 text-green-500 mr-2" />
                            ) : (
                              <TrendingUp className="w-6 h-6 text-red-500 mr-2" />
                            )}
                            {Math.abs(((totalEmissions - benchmark.avg_carbon_intensity) / benchmark.avg_carbon_intensity) * 100).toFixed(0)}%
                          </>
                        ) : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">vs Industry</div>
                      <div className="text-xs text-muted-foreground">
                        {totalEmissions < benchmark.avg_carbon_intensity ? 'Better' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Source: {benchmark.source} • Fetched: {new Date().toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No benchmark data available. Configure your organization sector to see industry benchmarks.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios">
          <ESGScenarioAnalysis 
            organizationId={organizationId}
            currentEmissions={{
              scope1: latestIndicators?.carbon_scope1_tonnes || 0,
              scope2: latestIndicators?.carbon_scope2_tonnes || 0,
              scope3: latestIndicators?.carbon_scope3_tonnes || 0
            }}
            scenariosLimit={organization.esg_scenarios_limit || 0}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          {/* CSV Importer */}
          <SupplierCSVImporter 
            organizationId={organizationId}
            onImportComplete={() => loadESGData()}
          />

          {/* Supplier List */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Emissions</CardTitle>
            </CardHeader>
            <CardContent>
              {suppliers.length > 0 ? (
                <div className="space-y-4">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.sector} • {supplier.country_code}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(supplier.annual_spend || 0).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Annual Spend</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No suppliers added yet. Use the importer above or add suppliers manually.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emissions">
          <EmissionsManager
            organizationId={organizationId}
            indicators={indicators}
            onDataChange={loadESGData}
          />
        </TabsContent>

        <TabsContent value="verification">
          <ESGDataVerification
            organizationId={organizationId}
            indicatorId={latestIndicators?.id}
            currentStatus={(latestIndicators?.verification_status as 'unverified' | 'pending' | 'verified' | 'rejected') || 'unverified'}
            onStatusChange={() => loadESGData()}
          />
        </TabsContent>

        <TabsContent value="ifrs">
          <IFRSReadinessAssessment
            organizationId={organizationId}
            organizationName={organization.name}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ESGReportGenerator
            organizationName={organization.name}
            organizationId={organizationId}
            indicators={indicators}
            suppliers={suppliers}
            scenarios={scenarios}
            benchmark={benchmark}
            planType={organization.plan_type as 'free' | 'lite' | 'pro'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ESGDashboard;
