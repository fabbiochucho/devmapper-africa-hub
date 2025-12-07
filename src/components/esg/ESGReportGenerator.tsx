import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle,
  BarChart3,
  Users,
  Target,
  TrendingDown,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

interface ESGReportGeneratorProps {
  organizationName: string;
  organizationId: string;
  indicators: any[];
  suppliers: any[];
  scenarios: any[];
  benchmark: any;
  planType: 'free' | 'lite' | 'pro';
}

type ReportFormat = 'summary' | 'detailed' | 'executive';

interface ReportSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  proOnly?: boolean;
}

const reportSections: ReportSection[] = [
  { id: 'overview', label: 'Executive Overview', icon: <Building className="w-4 h-4" />, description: 'High-level ESG performance summary' },
  { id: 'emissions', label: 'Emissions Analysis', icon: <BarChart3 className="w-4 h-4" />, description: 'Scope 1, 2, 3 breakdown and trends' },
  { id: 'suppliers', label: 'Supply Chain', icon: <Users className="w-4 h-4" />, description: 'Supplier emissions and Scope 3 data' },
  { id: 'scenarios', label: 'Decarbonization Pathways', icon: <TrendingDown className="w-4 h-4" />, description: 'Scenario modeling results', proOnly: true },
  { id: 'benchmarks', label: 'Industry Benchmarks', icon: <Target className="w-4 h-4" />, description: 'Comparison against peers', proOnly: true },
];

export default function ESGReportGenerator({
  organizationName,
  organizationId,
  indicators,
  suppliers,
  scenarios,
  benchmark,
  planType
}: ESGReportGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [reportFormat, setReportFormat] = useState<ReportFormat>('summary');
  const [selectedSections, setSelectedSections] = useState<string[]>(['overview', 'emissions']);
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const canAccessSection = (section: ReportSection) => {
    if (!section.proOnly) return true;
    return planType === 'pro';
  };

  const generateReport = async () => {
    if (selectedSections.length === 0) {
      toast.error('Please select at least one section');
      return;
    }

    setGenerating(true);
    
    try {
      // Build report content
      const reportData = buildReportData();
      const htmlContent = generateHTMLReport(reportData);
      
      // Open in new window for printing/saving
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Auto-trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const buildReportData = () => {
    const latestIndicators = indicators[0];
    const totalEmissions = latestIndicators
      ? (latestIndicators.carbon_scope1_tonnes || 0) +
        (latestIndicators.carbon_scope2_tonnes || 0) +
        (latestIndicators.carbon_scope3_tonnes || 0)
      : 0;

    return {
      organization: organizationName,
      reportYear,
      generatedAt: new Date().toISOString(),
      sections: selectedSections,
      format: reportFormat,
      data: {
        indicators: latestIndicators,
        totalEmissions,
        suppliers,
        scenarios,
        benchmark,
        historicalData: indicators
      }
    };
  };

  const generateHTMLReport = (reportData: any) => {
    const { organization, reportYear, generatedAt, data } = reportData;
    const date = new Date(generatedAt).toLocaleDateString();

    let sectionsHTML = '';

    if (selectedSections.includes('overview')) {
      sectionsHTML += `
        <section class="section">
          <h2>Executive Overview</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${data.totalEmissions.toLocaleString()}</div>
              <div class="metric-label">Total Emissions (tCO2e)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${(data.indicators?.esg_score || 0).toFixed(0)}</div>
              <div class="metric-label">ESG Score</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${suppliers.length}</div>
              <div class="metric-label">Tracked Suppliers</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${(data.indicators?.renewable_energy_percentage || 0).toFixed(0)}%</div>
              <div class="metric-label">Renewable Energy</div>
            </div>
          </div>
        </section>
      `;
    }

    if (selectedSections.includes('emissions')) {
      sectionsHTML += `
        <section class="section">
          <h2>Emissions Analysis</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Scope</th>
                <th>Emissions (tCO2e)</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Scope 1 (Direct)</td>
                <td>${(data.indicators?.carbon_scope1_tonnes || 0).toLocaleString()}</td>
                <td>${data.totalEmissions > 0 ? ((data.indicators?.carbon_scope1_tonnes || 0) / data.totalEmissions * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td>Scope 2 (Indirect - Energy)</td>
                <td>${(data.indicators?.carbon_scope2_tonnes || 0).toLocaleString()}</td>
                <td>${data.totalEmissions > 0 ? ((data.indicators?.carbon_scope2_tonnes || 0) / data.totalEmissions * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td>Scope 3 (Value Chain)</td>
                <td>${(data.indicators?.carbon_scope3_tonnes || 0).toLocaleString()}</td>
                <td>${data.totalEmissions > 0 ? ((data.indicators?.carbon_scope3_tonnes || 0) / data.totalEmissions * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total</strong></td>
                <td><strong>${data.totalEmissions.toLocaleString()}</strong></td>
                <td><strong>100%</strong></td>
              </tr>
            </tbody>
          </table>
          <div class="additional-metrics">
            <h3>Resource Consumption</h3>
            <ul>
              <li>Energy Consumption: ${(data.indicators?.energy_consumption_kwh || 0).toLocaleString()} kWh</li>
              <li>Water Consumption: ${(data.indicators?.water_consumption_m3 || 0).toLocaleString()} m³</li>
              <li>Waste Generated: ${(data.indicators?.waste_generated_tonnes || 0).toLocaleString()} tonnes</li>
            </ul>
          </div>
        </section>
      `;
    }

    if (selectedSections.includes('suppliers') && suppliers.length > 0) {
      const supplierRows = suppliers.slice(0, 10).map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.sector || '-'}</td>
          <td>${s.country_code || '-'}</td>
          <td>$${(s.annual_spend || 0).toLocaleString()}</td>
        </tr>
      `).join('');

      sectionsHTML += `
        <section class="section">
          <h2>Supply Chain Analysis</h2>
          <p>Total tracked suppliers: ${suppliers.length}</p>
          <table class="data-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Sector</th>
                <th>Country</th>
                <th>Annual Spend</th>
              </tr>
            </thead>
            <tbody>
              ${supplierRows}
            </tbody>
          </table>
          ${suppliers.length > 10 ? `<p class="note">Showing top 10 of ${suppliers.length} suppliers</p>` : ''}
        </section>
      `;
    }

    if (selectedSections.includes('scenarios') && scenarios.length > 0) {
      const scenarioRows = scenarios.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.baseline_year} → ${s.target_year}</td>
          <td>$${(s.results?.cost_savings || 0).toLocaleString()}</td>
          <td>${s.results?.roi_years || '-'} years</td>
        </tr>
      `).join('');

      sectionsHTML += `
        <section class="section">
          <h2>Decarbonization Pathways</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Timeline</th>
                <th>Projected Savings</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              ${scenarioRows}
            </tbody>
          </table>
        </section>
      `;
    }

    if (selectedSections.includes('benchmarks') && benchmark) {
      sectionsHTML += `
        <section class="section">
          <h2>Industry Benchmarks</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${benchmark.avg_carbon_intensity || '-'}</div>
              <div class="metric-label">Industry Average (tCO2e)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${data.totalEmissions.toLocaleString()}</div>
              <div class="metric-label">Your Performance</div>
            </div>
            <div class="metric-card ${data.totalEmissions < (benchmark.avg_carbon_intensity || 0) ? 'positive' : 'negative'}">
              <div class="metric-value">${benchmark.avg_carbon_intensity ? Math.abs(((data.totalEmissions - benchmark.avg_carbon_intensity) / benchmark.avg_carbon_intensity) * 100).toFixed(0) : '-'}%</div>
              <div class="metric-label">${data.totalEmissions < (benchmark.avg_carbon_intensity || 0) ? 'Below' : 'Above'} Industry Average</div>
            </div>
          </div>
          <p class="source">Source: ${benchmark.source || 'AlphaEarth'}</p>
        </section>
      `;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${organization} - ESG Report ${reportYear}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            line-height: 1.6; 
            color: #1a1a1a;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
          }
          .header h1 { font-size: 28px; color: #065f46; margin-bottom: 8px; }
          .header .subtitle { color: #6b7280; font-size: 14px; }
          .section { margin-bottom: 40px; }
          .section h2 { 
            font-size: 20px; 
            color: #065f46; 
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #d1fae5;
          }
          .section h3 { font-size: 16px; margin: 16px 0 8px; }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 20px;
          }
          .metric-card {
            background: #f0fdf4;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          }
          .metric-card.positive { background: #dcfce7; }
          .metric-card.negative { background: #fef2f2; }
          .metric-value { font-size: 24px; font-weight: bold; color: #065f46; }
          .metric-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 16px 0;
          }
          .data-table th, .data-table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #e5e7eb;
          }
          .data-table th { 
            background: #f9fafb; 
            font-weight: 600; 
            color: #374151;
          }
          .data-table .total-row { background: #f0fdf4; font-weight: 600; }
          .additional-metrics ul { padding-left: 20px; margin-top: 8px; }
          .additional-metrics li { margin-bottom: 4px; }
          .note { font-size: 12px; color: #6b7280; font-style: italic; }
          .source { font-size: 12px; color: #6b7280; margin-top: 16px; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${organization}</h1>
          <div class="subtitle">Environmental, Social & Governance Report - ${reportYear}</div>
          <div class="subtitle">Generated: ${date}</div>
        </div>
        ${sectionsHTML}
        <div class="footer">
          <p>This report was generated automatically. Data verification status may vary.</p>
          <p>Powered by SDG DevMapper ESG Module</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate ESG Report
        </CardTitle>
        <CardDescription>
          Create professional ESG reports for stakeholders, investors, and regulatory compliance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Report Year</Label>
            <Select value={reportYear} onValueChange={setReportYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2023, 2022, 2021].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Report Format</Label>
            <Select value={reportFormat} onValueChange={(v: ReportFormat) => setReportFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="executive">Executive Brief</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Section Selection */}
        <div className="space-y-3">
          <Label>Include Sections</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportSections.map(section => {
              const isAccessible = canAccessSection(section);
              const isSelected = selectedSections.includes(section.id);
              
              return (
                <div
                  key={section.id}
                  className={`
                    flex items-start gap-3 p-3 border rounded-lg transition-colors
                    ${isAccessible ? 'cursor-pointer hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'}
                    ${isSelected && isAccessible ? 'border-primary bg-primary/5' : ''}
                  `}
                  onClick={() => isAccessible && toggleSection(section.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={!isAccessible}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {section.icon}
                      <span className="font-medium text-sm">{section.label}</span>
                      {section.proOnly && (
                        <Badge variant="secondary" className="text-xs">Pro</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Generate Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''} selected
          </div>
          <Button 
            onClick={generateReport} 
            disabled={generating || selectedSections.length === 0}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}