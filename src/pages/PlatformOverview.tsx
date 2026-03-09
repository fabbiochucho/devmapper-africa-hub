import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Globe,
  Shield,
  Database,
  Brain,
  Building2,
  Lock,
  Satellite,
  CheckCircle2,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const PLATFORM_LAYERS = [
  {
    title: 'Global SDG Verification Council',
    icon: Shield,
    description:
      'Provides UN SDG alignment and independent assessment. Oversees governance and certification standards.',
    details: ['UN & UNDP alignment', 'Academic expert review', 'DFI oversight', 'Standard governance'],
  },
  {
    title: 'Global SDG Registry',
    icon: Database,
    description:
      'Registers projects and maps them to SDGs, targets, and indicators. Collects baseline, output, and outcome data.',
    details: ['500+ SDG indicators', '17 SDGs, 169 targets', 'Baseline & outcome tracking', 'Public transparency'],
  },
  {
    title: 'DevMapper Verification Engine',
    icon: Brain,
    description: 'Calculates SDG Impact Score (SIS) and issues certificates for verified projects.',
    details: ['AI/ML scoring', '7-dimension SIS', 'Anomaly detection', 'Certificate issuance'],
  },
  {
    title: 'National Verification Nodes',
    icon: Building2,
    description:
      'Local authorities and field verifiers. National Verification Councils coordinate country-specific verification.',
    details: ['Local compliance', 'Field auditors', 'Regulatory alignment', 'Community validation'],
  },
  {
    title: 'Evidence & Data Flow',
    icon: Satellite,
    description: 'Projects submit evidence (docs, photos, IoT, satellite imagery). AI validates reported outcomes.',
    details: ['Satellite validation', 'Document verification', 'Hash-chain audit trail', 'Geospatial analysis'],
  },
];

const STRATEGIC_BENEFITS = [
  {
    title: 'Credible & Transparent',
    description: 'UN-aligned governance and cryptographic hash-chain audit trails ensure trust.',
  },
  {
    title: 'AI-Powered Verification',
    description: 'Automated anomaly detection, satellite validation, and outcome prediction.',
  },
  {
    title: 'Full SDG Lifecycle',
    description: 'From registration to certification — an end-to-end verification platform.',
  },
  {
    title: 'Globally Scalable',
    description: 'National verification nodes enable local compliance at global scale.',
  },
];

const PlatformOverview = () => {
  return (
    <>
      <SEOHead
        title="Global SDG Verification Platform | DevMapper"
        description="DevMapper verifies, scores, and certifies Sustainable Development Goal projects with UN-aligned governance and tamper-evident audit trails."
      />

      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <Globe className="h-16 w-16 mx-auto text-primary" />
          <Badge variant="outline" className="text-sm">
            Global SDG Infrastructure
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            The Platform to Verify,<br />Score, and Certify SDG Projects
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            SDG funding flows at scale — but measurement and trust are fragmented.
            DevMapper standardizes evidence, scoring, and certification.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/certification-workflow">
              <Button size="lg">View Certification Process</Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                See Pricing
              </Button>
            </Link>
          </div>
        </div>

        <Separator />

        {/* Platform Architecture */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Platform Architecture</h2>
            <p className="text-muted-foreground">Five integrated layers powering SDG verification</p>
          </div>
          <div className="space-y-4">
            {PLATFORM_LAYERS.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <Card key={layer.title}>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {idx + 1}
                        </Badge>
                        <h3 className="font-semibold">{layer.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{layer.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {layer.details.map((d) => (
                          <Badge key={d} variant="outline" className="text-xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Strategic Benefits */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Strategic Advantages</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {STRATEGIC_BENEFITS.map((b) => (
              <Card key={b.title}>
                <CardContent className="pt-6 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-sm text-muted-foreground">{b.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Core Technology */}
        <Card>
          <CardHeader>
            <CardTitle>Core Technology Approach</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Database className="h-4 w-4" /> Global SDG Registry
              </p>
              <p className="text-xs text-muted-foreground">
                Unified project registry with SDG alignment, indicators, verification states, and public transparency views.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" /> AI Verification Engine
              </p>
              <p className="text-xs text-muted-foreground">
                Outcome prediction, fraud/anomaly detection, satellite validation signals, and automated SIS scoring.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" /> Hash-Chain Audit Trail
              </p>
              <p className="text-xs text-muted-foreground">
                Tamper-evident verification ledger using cryptographic hash-chaining of events (prev_hash → hash) stored in Postgres — a practical alternative to blockchain.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/certification-workflow">
            <Button size="lg">Certification Workflow</Button>
          </Link>
          <Link to="/spvf-standards">
            <Button size="lg" variant="outline">
              SPVF Standards
            </Button>
          </Link>
          <Link to="/sdg-indicators">
            <Button size="lg" variant="outline">
              SDG Indicator Registry
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline">
              Partner With Us
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default PlatformOverview;
