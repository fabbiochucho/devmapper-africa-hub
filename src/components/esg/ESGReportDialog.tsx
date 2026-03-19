import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader2, Download, Globe, Building, BarChart3, Users, TrendingDown, Target, Leaf, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ESGReportDialogProps {
  organizationName: string;
  organizationId: string;
  indicators: any[];
  suppliers: any[];
  scenarios: any[];
  benchmark: any;
  planType: 'free' | 'lite' | 'pro';
}

type ReportStandard = 'gri' | 'sdg' | 'tcfd' | 'cdp' | 'ifrs_sds' | 'country';

interface StandardConfig {
  id: ReportStandard;
  name: string;
  fullName: string;
  icon: React.ReactNode;
  description: string;
  proOnly?: boolean;
  sections: { id: string; label: string; description: string }[];
}

const COUNTRY_STANDARDS = [
  { code: 'NG', name: 'Nigeria FRC IFRS SDS / SRG1 2026' },
  { code: 'ZA', name: 'South Africa King IV / JSE Sustainability' },
  { code: 'KE', name: 'Kenya CMA ESG Reporting' },
  { code: 'GH', name: 'Ghana Stock Exchange ESG' },
  { code: 'EG', name: 'Egypt EGX ESG Guidelines' },
  { code: 'MA', name: 'Morocco AMMC ESG Framework' },
  { code: 'TZ', name: 'Tanzania DSE Sustainability' },
  { code: 'RW', name: 'Rwanda Green Growth Strategy' },
];

const STANDARDS: StandardConfig[] = [
  {
    id: 'gri',
    name: 'GRI',
    fullName: 'Global Reporting Initiative',
    icon: <Globe className="w-4 h-4" />,
    description: 'Comprehensive sustainability reporting following GRI Universal Standards 2021',
    sections: [
      { id: 'gri_general', label: 'GRI 2: General Disclosures', description: 'Organization profile, strategy, governance' },
      { id: 'gri_material', label: 'GRI 3: Material Topics', description: 'Material topic identification and management' },
      { id: 'gri_environmental', label: 'GRI 300: Environmental', description: 'Energy, water, emissions, waste, biodiversity' },
      { id: 'gri_social', label: 'GRI 400: Social', description: 'Employment, health & safety, diversity, human rights' },
      { id: 'gri_economic', label: 'GRI 200: Economic', description: 'Economic performance, procurement, anti-corruption' },
    ],
  },
  {
    id: 'sdg',
    name: 'SDG',
    fullName: 'UN Sustainable Development Goals',
    icon: <Target className="w-4 h-4" />,
    description: 'Report on contributions to the 17 SDGs and Agenda 2063 alignment',
    sections: [
      { id: 'sdg_mapping', label: 'SDG Impact Mapping', description: 'Map activities to specific SDG targets' },
      { id: 'sdg_indicators', label: 'SDG Indicators', description: 'Track measurable indicators per goal' },
      { id: 'sdg_agenda2063', label: 'Agenda 2063 Alignment', description: 'African Union alignment analysis' },
      { id: 'sdg_progress', label: 'Progress Dashboard', description: 'Year-over-year SDG contribution tracking' },
    ],
  },
  {
    id: 'tcfd',
    name: 'TCFD',
    fullName: 'Task Force on Climate-Related Financial Disclosures',
    icon: <Leaf className="w-4 h-4" />,
    description: 'Climate risk and opportunity disclosures for financial stakeholders',
    proOnly: true,
    sections: [
      { id: 'tcfd_governance', label: 'Governance', description: 'Board oversight and management role in climate risks' },
      { id: 'tcfd_strategy', label: 'Strategy', description: 'Climate risks, opportunities, and scenario analysis' },
      { id: 'tcfd_risk', label: 'Risk Management', description: 'Processes for identifying and managing climate risks' },
      { id: 'tcfd_metrics', label: 'Metrics & Targets', description: 'GHG emissions (Scope 1-3) and climate targets' },
    ],
  },
  {
    id: 'cdp',
    name: 'CDP',
    fullName: 'Carbon Disclosure Project',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Environmental disclosure for investors, companies, and cities',
    proOnly: true,
    sections: [
      { id: 'cdp_climate', label: 'Climate Change', description: 'GHG emissions, energy use, climate strategy' },
      { id: 'cdp_water', label: 'Water Security', description: 'Water accounting, risks, governance' },
      { id: 'cdp_forests', label: 'Forests', description: 'Deforestation risk and land use' },
      { id: 'cdp_supply', label: 'Supply Chain', description: 'Supplier engagement and Scope 3' },
    ],
  },
  {
    id: 'country',
    name: 'Country',
    fullName: 'Country-Specific Standards',
    icon: <Shield className="w-4 h-4" />,
    description: 'Comply with African country-specific ESG reporting requirements',
    sections: [
      { id: 'country_governance', label: 'Corporate Governance', description: 'Board composition, ethics, risk management' },
      { id: 'country_environmental', label: 'Environmental Compliance', description: 'Local environmental regulations and performance' },
      { id: 'country_social', label: 'Social Impact', description: 'Community development, employment, local procurement' },
      { id: 'country_economic', label: 'Economic Contribution', description: 'Tax, jobs, local economic development' },
    ],
  },
];

export default function ESGReportDialog({
  organizationName, organizationId, indicators, suppliers, scenarios, benchmark, planType,
}: ESGReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<ReportStandard>('gri');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [outputFormat, setOutputFormat] = useState<'html' | 'print'>('html');
  const [countryStandard, setCountryStandard] = useState('NG');

  const currentStandard = STANDARDS.find(s => s.id === selectedStandard)!;

  const toggleSection = (id: string) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAllSections = () => {
    setSelectedSections(currentStandard.sections.map(s => s.id));
  };

  const canAccess = (standard: StandardConfig) => {
    if (!standard.proOnly) return true;
    return planType === 'pro';
  };

  const generateReport = async () => {
    if (selectedSections.length === 0) {
      toast.error('Please select at least one section');
      return;
    }
    setGenerating(true);

    try {
      const latestIndicators = indicators[0];
      const totalEmissions = latestIndicators
        ? (latestIndicators.carbon_scope1_tonnes || 0) + (latestIndicators.carbon_scope2_tonnes || 0) + (latestIndicators.carbon_scope3_tonnes || 0)
        : 0;

      const html = buildReport({
        standard: currentStandard,
        org: organizationName,
        year: reportYear,
        indicators: latestIndicators,
        totalEmissions,
        suppliers,
        scenarios,
        benchmark,
        sections: selectedSections,
        countryStandard: selectedStandard === 'country' ? COUNTRY_STANDARDS.find(c => c.code === countryStandard)?.name || '' : '',
      });

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        if (outputFormat === 'print') {
          setTimeout(() => win.print(), 600);
        }
      }
      toast.success(`${currentStandard.name} report generated`);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="w-4 h-4" />
          Generate ESG Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate ESG Report
          </DialogTitle>
          <DialogDescription>
            Choose a reporting standard and customize sections for {organizationName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Standard Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Reporting Standard</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STANDARDS.map(std => {
                const accessible = canAccess(std);
                return (
                  <button
                    key={std.id}
                    onClick={() => {
                      if (accessible) {
                        setSelectedStandard(std.id);
                        setSelectedSections([]);
                      }
                    }}
                    disabled={!accessible}
                    className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center ${
                      selectedStandard === std.id
                        ? 'border-primary bg-primary/5'
                        : accessible
                        ? 'border-border hover:border-primary/50'
                        : 'border-border opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {std.icon}
                    <span className="text-sm font-medium">{std.name}</span>
                    {std.proOnly && (
                      <Badge variant="secondary" className="text-[10px] absolute -top-2 -right-2">PRO</Badge>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">{currentStandard.fullName} — {currentStandard.description}</p>
          </div>

          <Separator />

          {/* Config Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Report Year</Label>
              <Select value={reportYear} onValueChange={setReportYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2026, 2025, 2024, 2023, 2022].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Output</Label>
              <Select value={outputFormat} onValueChange={(v: 'html' | 'print') => setOutputFormat(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="html">View in Browser</SelectItem>
                  <SelectItem value="print">Print / PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedStandard === 'country' && (
              <div className="space-y-2">
                <Label>Country Standard</Label>
                <Select value={countryStandard} onValueChange={setCountryStandard}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRY_STANDARDS.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Section Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Report Sections</Label>
              <Button variant="ghost" size="sm" onClick={selectAllSections}>Select All</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentStandard.sections.map(section => (
                <div
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSections.includes(section.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                  }`}
                >
                  <Checkbox checked={selectedSections.includes(section.id)} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{section.label}</div>
                    <div className="text-xs text-muted-foreground">{section.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={generateReport} disabled={generating || selectedSections.length === 0} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildReport(opts: {
  standard: StandardConfig;
  org: string;
  year: string;
  indicators: any;
  totalEmissions: number;
  suppliers: any[];
  scenarios: any[];
  benchmark: any;
  sections: string[];
  countryStandard: string;
}) {
  const { standard, org, year, indicators, totalEmissions, suppliers, scenarios, benchmark, sections, countryStandard } = opts;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const standardLabel = standard.id === 'country' ? countryStandard : standard.fullName;

  const sectionHTML = sections.map(sId => {
    const sec = standard.sections.find(s => s.id === sId);
    if (!sec) return '';

    let content = '';

    // Environment-related sections
    if (sId.includes('environmental') || sId.includes('emissions') || sId.includes('climate') || sId.includes('metrics')) {
      content = `
        <table class="data-table">
          <thead><tr><th>Metric</th><th>Value</th><th>Unit</th></tr></thead>
          <tbody>
            <tr><td>Scope 1 Emissions (Direct)</td><td>${(indicators?.carbon_scope1_tonnes || 0).toLocaleString()}</td><td>tCO2e</td></tr>
            <tr><td>Scope 2 Emissions (Indirect)</td><td>${(indicators?.carbon_scope2_tonnes || 0).toLocaleString()}</td><td>tCO2e</td></tr>
            <tr><td>Scope 3 Emissions (Value Chain)</td><td>${(indicators?.carbon_scope3_tonnes || 0).toLocaleString()}</td><td>tCO2e</td></tr>
            <tr class="total-row"><td><strong>Total GHG Emissions</strong></td><td><strong>${totalEmissions.toLocaleString()}</strong></td><td>tCO2e</td></tr>
            <tr><td>Energy Consumption</td><td>${(indicators?.energy_consumption_kwh || 0).toLocaleString()}</td><td>kWh</td></tr>
            <tr><td>Water Consumption</td><td>${(indicators?.water_consumption_m3 || 0).toLocaleString()}</td><td>m³</td></tr>
            <tr><td>Waste Generated</td><td>${(indicators?.waste_generated_tonnes || 0).toLocaleString()}</td><td>tonnes</td></tr>
            <tr><td>Renewable Energy</td><td>${(indicators?.renewable_energy_percentage || 0).toFixed(1)}</td><td>%</td></tr>
          </tbody>
        </table>`;
    }
    // Supplier / supply chain sections
    else if (sId.includes('supply') || sId.includes('supplier')) {
      const rows = suppliers.slice(0, 10).map(s =>
        `<tr><td>${s.name}</td><td>${s.sector || '-'}</td><td>${s.country_code || '-'}</td><td>$${(s.annual_spend || 0).toLocaleString()}</td></tr>`
      ).join('');
      content = `<p>${suppliers.length} suppliers tracked.</p>
        <table class="data-table"><thead><tr><th>Supplier</th><th>Sector</th><th>Country</th><th>Annual Spend</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    // Scenario / strategy sections
    else if (sId.includes('scenario') || sId.includes('strategy') || sId.includes('pathway')) {
      if (scenarios.length > 0) {
        const rows = scenarios.map(s =>
          `<tr><td>${s.name}</td><td>${s.baseline_year}→${s.target_year}</td><td>${s.status || 'draft'}</td></tr>`
        ).join('');
        content = `<table class="data-table"><thead><tr><th>Scenario</th><th>Timeline</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
      } else {
        content = '<p>No scenarios modeled yet.</p>';
      }
    }
    // Benchmark sections
    else if (sId.includes('benchmark') || sId.includes('risk')) {
      if (benchmark) {
        content = `<div class="metrics-grid">
          <div class="metric-card"><div class="metric-value">${benchmark.avg_carbon_intensity || 'N/A'}</div><div class="metric-label">Industry Avg (tCO2e)</div></div>
          <div class="metric-card"><div class="metric-value">${totalEmissions.toLocaleString()}</div><div class="metric-label">Your Performance</div></div>
        </div><p class="source">Source: ${benchmark.source || 'AlphaEarth'}</p>`;
      } else {
        content = '<p>Benchmark data not available.</p>';
      }
    }
    // General / governance / mapping / progress sections
    else {
      content = `
        <div class="metrics-grid">
          <div class="metric-card"><div class="metric-value">${totalEmissions.toLocaleString()}</div><div class="metric-label">Total Emissions (tCO2e)</div></div>
          <div class="metric-card"><div class="metric-value">${(indicators?.esg_score || 0).toFixed(0)}</div><div class="metric-label">ESG Score</div></div>
          <div class="metric-card"><div class="metric-value">${suppliers.length}</div><div class="metric-label">Suppliers</div></div>
          <div class="metric-card"><div class="metric-value">${(indicators?.renewable_energy_percentage || 0).toFixed(0)}%</div><div class="metric-label">Renewable %</div></div>
        </div>`;
    }

    return `<section class="section"><h2>${sec.label}</h2><p class="section-desc">${sec.description}</p>${content}</section>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${org} — ${standard.name} Report ${year}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;line-height:1.6;color:#1a1a1a;max-width:900px;margin:0 auto;padding:40px}
.header{text-align:center;margin-bottom:40px;padding-bottom:20px;border-bottom:3px solid #10b981}
.header h1{font-size:28px;color:#065f46;margin-bottom:4px}
.header .standard-badge{display:inline-block;background:#10b981;color:white;padding:4px 16px;border-radius:20px;font-size:13px;margin:8px 0}
.header .subtitle{color:#6b7280;font-size:13px}
.section{margin-bottom:36px}
.section h2{font-size:18px;color:#065f46;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #d1fae5}
.section-desc{font-size:13px;color:#6b7280;margin-bottom:12px}
.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.metric-card{background:#f0fdf4;padding:14px;border-radius:8px;text-align:center}
.metric-value{font-size:22px;font-weight:bold;color:#065f46}
.metric-label{font-size:11px;color:#6b7280;margin-top:2px}
.data-table{width:100%;border-collapse:collapse;margin:12px 0}
.data-table th,.data-table td{padding:10px;text-align:left;border-bottom:1px solid #e5e7eb}
.data-table th{background:#f9fafb;font-weight:600;color:#374151;font-size:13px}
.data-table .total-row{background:#f0fdf4}
.source{font-size:11px;color:#6b7280;margin-top:12px}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#6b7280}
@media print{body{padding:20px}.section{page-break-inside:avoid}}
</style></head><body>
<div class="header">
  <h1>${org}</h1>
  <div class="standard-badge">${standardLabel}</div>
  <div class="subtitle">ESG Report — Reporting Year ${year} • Generated ${date}</div>
</div>
${sectionHTML}
<div class="footer">
  <p>Report generated by SDG DevMapper ESG Module • ${standardLabel} Standard</p>
  <p>Data verification status may vary. This is an automatically generated report.</p>
</div>
</body></html>`;
}
