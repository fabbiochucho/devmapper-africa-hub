import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Shield,
  Upload,
  BarChart3,
  Award,
  Eye,
  Globe,
  ArrowRight,
  CheckCircle2,
  FileText,
  Bot,
  UserCheck,
  Building2,
  Lock,
  DollarSign,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Project Submission',
    icon: Upload,
    description: 'Organizations submit SDG projects via the web portal or mobile app.',
    details: [
      'Project description, budget, SDG alignment, baseline indicators, expected outcomes',
      'Automatic SDG target and indicator mapping',
    ],
  },
  {
    step: 2,
    title: 'Evidence Upload & Baseline Verification',
    icon: FileText,
    description: 'Implementers upload documents, photos, satellite imagery, financial reports, and surveys.',
    details: [
      'Initial baseline verification (automated + human)',
      'Evidence stored securely with a tamper-evident hash-chain audit trail',
      'Minimum 3 evidence forms per claim required',
    ],
  },
  {
    step: 3,
    title: 'Automated Verification (AI/ML)',
    icon: Bot,
    description: 'AI/ML models verify impact, detect anomalies, and validate outcomes.',
    details: [
      'Outcome prediction based on historical projects',
      'Anomaly detection flags unusual reporting',
      'Satellite/geospatial validation of physical outputs',
      'Initial SIS scoring feeds into human review',
    ],
  },
  {
    step: 4,
    title: 'Human Verification',
    icon: UserCheck,
    description: 'Field auditors and verification nodes perform manual checks.',
    details: [
      'Site inspections and physical verification',
      'Document verification and cross-referencing',
      'Beneficiary interviews and community validation',
      'Verification events written to the hash-chain audit trail',
    ],
  },
  {
    step: 5,
    title: 'SDG Impact Score (SIS) Calculation',
    icon: BarChart3,
    description: 'Combines AI predictions and human verification into composite SIS (0–100).',
    details: [
      'SDG Alignment (15%) + Evidence Strength (20%)',
      'Implementation Integrity (15%) + Output Delivery (15%)',
      'Outcome Achievement (20%) + Sustainability (10%)',
      'Community Validation (5%)',
    ],
  },
  {
    step: 6,
    title: 'Certification Decision',
    icon: Award,
    description: 'Based on SIS score and governance approval, projects receive a rating.',
    details: [
      'Platinum: SIS 90–100 (Transformational global impact)',
      'Gold: SIS 80–89 (Strong impact, multi-stakeholder)',
      'Silver: SIS 65–79 (Measurable outcomes)',
      'Bronze: SIS 50–64 (Verified outputs)',
    ],
  },
  {
    step: 7,
    title: 'Governance & Approval',
    icon: Building2,
    description: 'Global SDG Verification Council and national nodes ensure credibility.',
    details: [
      'UN, UNDP, academic experts, DFI oversight',
      'National Verification Nodes for local compliance',
      'Transparent and UN-recognizable governance',
    ],
  },
  {
    step: 8,
    title: 'Transparency & Public Dashboard',
    icon: Eye,
    description: 'Certified projects displayed globally on interactive dashboards.',
    details: [
      'Real-time SDG impact scores and funding flows',
      'Public verification pages for each certificate',
      'API integration for ESG reporting and DFI pipelines',
    ],
  },
];

const CERTIFICATION_TIERS = [
  {
    tier: 'Platinum',
    sisRange: '90–100',
    fee: '$15,000 – $50,000',
    iconBgClassName: 'bg-primary',
    iconFgClassName: 'text-primary-foreground',
    complexity: 'Large-scale, multi-country, full AI/ML + satellite verification, government approval',
  },
  {
    tier: 'Gold',
    sisRange: '80–89',
    fee: '$5,000 – $15,000',
    iconBgClassName: 'bg-accent',
    iconFgClassName: 'text-accent-foreground',
    complexity: 'High impact, cross-sector, full SDG alignment, multi-stakeholder verification',
  },
  {
    tier: 'Silver',
    sisRange: '65–79',
    fee: '$1,500 – $5,000',
    iconBgClassName: 'bg-secondary',
    iconFgClassName: 'text-secondary-foreground',
    complexity: 'Medium complexity, outcome/benefit focus, independent auditing',
  },
  {
    tier: 'Bronze',
    sisRange: '50–64',
    fee: '$500 – $1,500',
    iconBgClassName: 'bg-muted',
    iconFgClassName: 'text-foreground',
    complexity: 'Small NGO/local projects, output verification, field visit sampling',
  },
];

const BENCHMARKS = [
  { standard: 'Gold Standard', fees: '$3,000 – $15,000', notes: 'Climate/SDG outcome-based, small/medium projects' },
  { standard: 'Verra (VCS)', fees: '$5,000 – $20,000', notes: 'Carbon & impact, larger scale' },
  { standard: 'MSCI ESG Ratings', fees: '$20,000 – $50,000', notes: 'Portfolio-based, recurring data subscription' },
  { standard: 'DevMapper SDG Certification', fees: '$500 – $50,000', notes: 'Flexible tiered model, all project scales' },
];

const CertificationWorkflow = () => {
  return (
    <>
      <SEOHead
        title="SDG Certification Workflow | DevMapper"
        description="The 8-step DevMapper SDG Certification process — from submission through AI verification and human auditing to certification and public transparency."
      />

      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <Shield className="h-14 w-14 mx-auto text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">SDG Certification Workflow</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            DevMapper's 8-step verification and certification process combines AI-powered scoring, human auditing,
            tamper-evident hash-chain transparency, and governance approval to issue globally-recognized SDG certificates.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline">AI/ML Verification</Badge>
            <Badge variant="outline">Hash-Chain Audit Trail</Badge>
            <Badge variant="outline">UN-Aligned Governance</Badge>
            <Badge variant="outline">Public Transparency</Badge>
          </div>
        </div>

        {/* 8-Step Workflow */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">The 8-Step Process</h2>
          <div className="space-y-3">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Card key={step.step} className="overflow-hidden">
                  <div className="flex">
                    <div className="bg-primary w-16 flex-shrink-0 flex flex-col items-center justify-center text-primary-foreground">
                      <span className="text-2xl font-bold">{step.step}</span>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-5 w-5 text-foreground" />
                        <h3 className="font-semibold text-base">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                      <ul className="space-y-1">
                        {step.details.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <div className="flex justify-center -mb-2 pb-0">
                      <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Certification Tiers */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Certification Tiers & Pricing</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Fees scale with project size, geographic scope, and verification complexity. AI/ML verification reduces costs
            compared to fully manual audits.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CERTIFICATION_TIERS.map((t) => (
              <Card key={t.tier} className="text-center">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${t.iconBgClassName}`}>
                    <Award className={`h-5 w-5 ${t.iconFgClassName}`} />
                  </div>
                  <CardTitle className="text-lg mt-2">{t.tier}</CardTitle>
                  <p className="font-mono text-sm">SIS {t.sisRange}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xl font-bold text-primary">{t.fee}</p>
                  <p className="text-xs text-muted-foreground">{t.complexity}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Benchmarking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Benchmarking Against Global Standards
            </CardTitle>
            <CardDescription>DevMapper pricing is competitive with leading verification and ESG rating platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Standard / Platform</TableHead>
                  <TableHead>Typical Fees</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BENCHMARKS.map((b) => (
                  <TableRow key={b.standard} className={b.standard.includes('DevMapper') ? 'bg-primary/5 font-medium' : ''}>
                    <TableCell className="font-semibold">{b.standard}</TableCell>
                    <TableCell className="font-mono text-sm">{b.fees}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Governance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Governance & Trust Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <p className="font-semibold text-sm">Global SDG Verification Council</p>
              </div>
              <p className="text-xs text-muted-foreground">
                UN, UNDP, academic experts, development finance institutions. Provides oversight, governance, and standard alignment.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <p className="font-semibold text-sm">National Verification Nodes</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Country-specific authorities and accredited field verifiers. Ensures local regulatory compliance.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <p className="font-semibold text-sm">Hash-Chain Audit Trail</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Tamper-evident records for every verification step using cryptographic hash-chaining of events (stored in Postgres).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/apply-certification">
            <Button size="lg">Apply for Certification</Button>
          </Link>
          <Link to="/spvf-standards">
            <Button variant="outline">View SPVF Standards</Button>
          </Link>
          <Link to="/verify">
            <Button variant="outline">Verify a Certificate</Button>
          </Link>
          <Link to="/pricing">
            <Button variant="outline">View Pricing</Button>
          </Link>
          <Link to="/sdg-indicators">
            <Button variant="outline">SDG Indicator Registry</Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default CertificationWorkflow;
