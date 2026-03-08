import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Globe, Shield, Database, Brain, Building2, Users, BarChart3,
  Lock, Satellite, Target, Award, DollarSign, TrendingUp,
  CheckCircle2, ArrowRight, Layers
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const PLATFORM_LAYERS = [
  {
    title: 'Global SDG Verification Council',
    icon: Shield,
    description: 'Provides UN SDG alignment and independent assessment. Oversees governance and certification standards.',
    details: ['UN & UNDP alignment', 'Academic expert review', 'DFI oversight', 'Standard governance'],
  },
  {
    title: 'Global SDG Registry',
    icon: Database,
    description: 'Registers all projects, maps them to SDGs, targets, and indicators. Collects baseline, output, and outcome data.',
    details: ['500+ SDG indicators', '17 SDGs, 169 targets', 'Baseline & outcome tracking', 'Public transparency'],
  },
  {
    title: 'DevMapper Verification Engine',
    icon: Brain,
    description: 'Core engine calculating SDG Impact Score (SIS). Issues certificates for verified projects.',
    details: ['AI/ML scoring', '7-dimension SIS', 'Anomaly detection', 'Certificate issuance'],
  },
  {
    title: 'National Verification Nodes',
    icon: Building2,
    description: 'Local authorities and field verifiers. National Verification Councils coordinate country-specific verification.',
    details: ['193 UN member states', 'Local compliance', 'Field auditors', 'Regulatory alignment'],
  },
  {
    title: 'Evidence & Data Flow',
    icon: Satellite,
    description: 'Projects submit evidence: documents, photos, IoT data, satellite imagery. AI validates outcomes.',
    details: ['Satellite validation', 'Document verification', 'Blockchain audit trail', 'Geospatial analysis'],
  },
];

const REVENUE_STREAMS = [
  { stream: 'Platform Subscriptions', description: 'Lite / Pro / Advanced / Enterprise tiers for organizations', icon: Layers },
  { stream: 'Certification Fees', description: 'Bronze ($500) → Platinum ($50,000) per project verification', icon: Award },
  { stream: 'API Access', description: 'ESG/SDG data feeds for impact investors and reporting platforms', icon: Database },
  { stream: 'Government Contracts', description: 'National SDG tracking and verification infrastructure', icon: Building2 },
];

const MARKET_SEGMENTS = [
  { segment: 'Governments', count: '193 UN member states', icon: Building2 },
  { segment: 'NGOs', count: '50,000+ globally', icon: Users },
  { segment: 'Development Banks', count: '$500B annual funding', icon: DollarSign },
  { segment: 'Impact Investors', count: '$21B+ ESG fund assets', icon: TrendingUp },
];

const STRATEGIC_BENEFITS = [
  { title: 'Credible & Transparent', description: 'UN-aligned governance and blockchain audit trails ensure trust.' },
  { title: 'AI-Powered Verification', description: 'Automated anomaly detection, satellite validation, and outcome prediction.' },
  { title: 'Full SDG Lifecycle', description: 'From registration to certification — the only end-to-end verification platform.' },
  { title: 'Globally Scalable', description: 'National verification nodes ensure local compliance at global scale.' },
];

const PlatformOverview = () => {
  return (
    <>
      <SEOHead
        title="Global SDG Verification Platform | DevMapper"
        description="DevMapper is the first global platform to verify, score, and certify Sustainable Development Goal projects worldwide. $100B SDG funding needs verification."
      />
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <Globe className="h-16 w-16 mx-auto text-primary" />
          <Badge variant="outline" className="text-sm">Global SDG Infrastructure</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            The First Global Platform to Verify,<br />Score, and Certify SDG Projects
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            $100B in SDG funding flows globally each year — with no universal measurement standard.
            SDG-washing is rampant. DevMapper changes that.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/certification-workflow"><Button size="lg">View Certification Process</Button></Link>
            <Link to="/pricing"><Button size="lg" variant="outline">See Pricing</Button></Link>
          </div>
        </div>

        <Separator />

        {/* Platform Architecture */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Platform Architecture</h2>
            <p className="text-muted-foreground">Five integrated layers powering global SDG verification</p>
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
                        <Badge variant="secondary" className="text-xs">{idx + 1}</Badge>
                        <h3 className="font-semibold">{layer.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{layer.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {layer.details.map((d) => (
                          <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
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

        {/* Target Market */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Global Market Opportunity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MARKET_SEGMENTS.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.segment} className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="font-bold text-sm">{m.segment}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.count}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Revenue Model */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Revenue Model</h2>
          <p className="text-center text-muted-foreground">
            Multiple revenue streams from platform subscriptions to certification fees
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {REVENUE_STREAMS.map((r) => {
              const Icon = r.icon;
              return (
                <Card key={r.stream}>
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.stream}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Impact Metrics */}
        <div className="bg-primary/5 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Global Impact Vision</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-bold text-primary">1,000+</p>
              <p className="text-xs text-muted-foreground">Verified SDG Projects</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">85/100</p>
              <p className="text-xs text-muted-foreground">Avg. Platinum Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">50+</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">$100B+</p>
              <p className="text-xs text-muted-foreground">SDG Funding Tracked</p>
            </div>
          </div>
        </div>

        {/* Core Technology */}
        <Card>
          <CardHeader>
            <CardTitle>Core Technology Stack</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2"><Database className="h-4 w-4" /> Global SDG Registry</p>
              <p className="text-xs text-muted-foreground">Unified database of all projects, SDG alignment, indicators, and verification status.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2"><Brain className="h-4 w-4" /> AI Verification Engine</p>
              <p className="text-xs text-muted-foreground">Outcome prediction, fraud detection, satellite validation, and automated scoring.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> Blockchain Audit Trail</p>
              <p className="text-xs text-muted-foreground">Immutable, transparent records for all verification events and certificate issuance.</p>
            </div>
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/certification-workflow"><Button size="lg">Certification Workflow</Button></Link>
          <Link to="/spvf-standards"><Button size="lg" variant="outline">SPVF Standards</Button></Link>
          <Link to="/sdg-indicators"><Button size="lg" variant="outline">SDG Indicator Registry</Button></Link>
          <Link to="/contact"><Button size="lg" variant="outline">Partner With Us</Button></Link>
        </div>
      </div>
    </>
  );
};

export default PlatformOverview;
