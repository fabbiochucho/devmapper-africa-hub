import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Users, Shield, MessageCircle, Flag, FileText, Eye, Globe, Scale, Heart, Lock, Camera, MapPin, BarChart3 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Guidelines = () => {
  const coreGuidelines = [
    {
      icon: <Users className="w-5 h-5" />,
      title: "Community Respect & Inclusion",
      description: "Treat all community members with respect and dignity",
      rules: [
        "Use inclusive language and avoid discriminatory content based on race, gender, religion, nationality, or ethnicity",
        "Respect different perspectives, cultural backgrounds, and local customs across Africa's diverse communities",
        "No harassment, bullying, doxxing, or personal attacks — online or offline",
        "Constructive criticism is welcome, but keep it professional and solution-oriented",
        "Celebrate the contributions of change makers, community reporters, and grassroots validators",
        "Communicate in any of DevMapper's supported languages (English, French, Portuguese, Swahili, Arabic) with mutual respect"
      ]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Data Integrity & Accuracy",
      description: "Maintain the highest standards for data accuracy and project verification",
      rules: [
        "Provide accurate GPS coordinates, location data, and project information — falsified locations undermine the entire platform",
        "Include credible sources, photos, and documentation to support project reports",
        "Flag suspicious, fabricated, or potentially misleading information using the Report button",
        "Correct mistakes promptly when identified — the platform rewards honesty over perfection",
        "Do not submit duplicate reports for the same project to inflate statistics",
        "Respect the 5-level verification system: Self-Report → Citizen → NGO → Government → Platform Audit",
        "Only verify projects you have direct knowledge of or have physically visited"
      ]
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Project Reporting Standards",
      description: "Guidelines for submitting high-quality, actionable project reports",
      rules: [
        "Write clear, descriptive project titles that accurately reflect the initiative's scope",
        "Align projects to the correct UN Sustainable Development Goals (SDGs 1–17) — don't over-tag",
        "Include specific beneficiary numbers, budget figures, and measurable outcomes wherever possible",
        "Provide photo evidence taken at the project site — stock photos are not accepted for verification",
        "Update project milestones regularly to maintain a living record of progress",
        "Link projects to AU Agenda 2063 aspirations when applicable",
        "Disclose all funding sources and organizational affiliations transparently"
      ]
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Verification & Trust",
      description: "Guidelines for the multi-tier community verification system",
      rules: [
        "Citizen Verification: You must have firsthand knowledge — hearsay is not sufficient",
        "NGO Verification: Requires organizational credentials and site visit documentation",
        "Government Verification: Must come from verified government official accounts only",
        "Verifiers must provide written comments explaining their verification decision",
        "Rejected verifications should include specific reasons and constructive feedback",
        "Do not verify your own projects — all verifications must come from independent parties",
        "Report attempts at verification fraud or collusion immediately"
      ]
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "Forum & Communication Standards",
      description: "Guidelines for effective and respectful platform communication",
      rules: [
        "Stay on topic and relevant to SDG development, ESG compliance, or community impact",
        "Use clear, descriptive titles for forum posts — avoid clickbait or misleading headlines",
        "Search before posting to avoid duplicates — check if your question has already been answered",
        "Provide context: country, SDG focus, project type, and relevant background information",
        "No spam, unsolicited advertising, or self-promotion unrelated to development work",
        "Respect the privacy of community members — do not share personal information without consent",
        "Use @mentions responsibly and do not abuse notification systems"
      ]
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Privacy & Data Protection",
      description: "Protecting the privacy of beneficiaries, reporters, and communities",
      rules: [
        "Do not share personally identifiable information (PII) of project beneficiaries without informed consent",
        "Obtain permission before photographing individuals, especially children, for project documentation",
        "Anonymize sensitive health, financial, or personal data in public reports",
        "Respect the 'anonymous donation' feature — do not attempt to identify anonymous donors",
        "Government officials and organizational representatives must use verified institutional accounts",
        "Report any suspected data breaches or unauthorized access immediately"
      ]
    },
    {
      icon: <Scale className="w-5 h-5" />,
      title: "ESG & Corporate Reporting Ethics",
      description: "Standards for organizations using the ESG compliance module",
      rules: [
        "Report emissions data (Scope 1, 2, 3) accurately — greenwashing is a serious violation",
        "Do not manipulate ESG scores, benchmarks, or supplier data for reputational benefit",
        "Disclose data quality levels honestly (estimated vs. measured vs. third-party verified)",
        "Respect supplier confidentiality when sharing supply chain emissions data",
        "Use the Ndovu Akili AI (Copilot) for genuine compliance gap analysis, not to generate misleading reports",
        "Regulatory exposure assessments should be treated as advisory, not legal counsel"
      ]
    },
    {
      icon: <Camera className="w-5 h-5" />,
      title: "Media & Content Standards",
      description: "Guidelines for photos, videos, and media uploads",
      rules: [
        "Upload only original photos or media you have rights to use",
        "Photos must accurately represent the project — no misleading angles, filters, or AI-generated imagery",
        "Include captions with location, date, and context for all uploaded media",
        "Avoid imagery that exploits poverty, suffering, or vulnerability for emotional manipulation",
        "Respect local photography laws and cultural sensitivities",
        "Maximum upload sizes apply based on your subscription plan"
      ]
    },
    {
      icon: <Flag className="w-5 h-5" />,
      title: "Reporting & Moderation",
      description: "How to report issues and what to expect from moderation",
      rules: [
        "Report violations using the Report button on any content — reports are reviewed within 48 hours",
        "Provide specific details about the policy violation including timestamps and evidence",
        "Don't engage in arguments — let moderators handle disputes professionally",
        "Appeals can be submitted through the Support Center within 14 days of any moderation action",
        "Repeated false reports are themselves a violation and may result in sanctions",
        "Platform admins and country admins are held to higher standards of conduct"
      ]
    },
  ];

  const roleSpecificGuidelines = [
    {
      role: 'Citizen Reporters',
      icon: <Users className="w-4 h-4" />,
      rules: [
        'Report projects you directly observe in your community',
        'Include specific location details and photo evidence when possible',
        'Use the mobile-friendly interface for on-the-ground reporting',
        'Participate in community verification of projects reported by others',
        'Share project updates as new developments occur',
      ]
    },
    {
      role: 'NGO Representatives',
      icon: <Heart className="w-4 h-4" />,
      rules: [
        'Maintain organizational profile accuracy with up-to-date contact information',
        'Provide detailed impact data with transparent methodology descriptions',
        'Respond to verification requests within 7 days',
        'Cross-reference reports with internal monitoring and evaluation data',
        'Collaborate with government partners for institutional-level verifications',
      ]
    },
    {
      role: 'Government Officials',
      icon: <Globe className="w-4 h-4" />,
      rules: [
        'Use verified institutional accounts — personal accounts cannot perform government verifications',
        'Ensure alignment with national SDG implementation plans and reporting',
        'Provide official data sources and budget documentation when verifying',
        'Maintain political neutrality in verification decisions',
        'Coordinate with national statistics offices for data harmonization',
      ]
    },
    {
      role: 'Corporate Users',
      icon: <BarChart3 className="w-4 h-4" />,
      rules: [
        'Report ESG data using recognized frameworks (GRI, TCFD, ISSB)',
        'Ensure Scope 1, 2, and 3 emissions data is traceable and auditable',
        'Disclose all CSR partnerships transparently with no hidden affiliations',
        'Use the platform for genuine impact tracking, not marketing purposes',
        'Respond to community feedback on corporate-reported projects constructively',
      ]
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-muted-foreground">
          Building a respectful, transparent, and impactful community for sustainable development across Africa.
          These guidelines apply to all DevMapper users across all roles and subscription tiers.
        </p>
      </div>

      {/* Core Principles Banner */}
      <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <h2 className="font-bold text-lg mb-3">Core Principles</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Accuracy', desc: 'Truth in every data point' },
              { label: 'Transparency', desc: 'Open processes and decisions' },
              { label: 'Inclusion', desc: 'Every voice matters' },
              { label: 'Impact', desc: 'Measurable positive change' },
            ].map(p => (
              <div key={p.label} className="text-center p-3 rounded-lg bg-background">
                <p className="font-semibold text-sm">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Guidelines */}
      <div className="grid gap-6 mb-8">
        {coreGuidelines.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">{section.icon}</div>
                <div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.rules.map((rule, ruleIndex) => (
                  <li key={ruleIndex} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role-Specific Guidelines */}
      <h2 className="text-2xl font-bold mb-4">Role-Specific Guidelines</h2>
      <Accordion type="multiple" className="mb-8 space-y-2">
        {roleSpecificGuidelines.map((role, index) => (
          <AccordionItem key={index} value={`role-${index}`} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded">{role.icon}</div>
                <span className="font-semibold">{role.role}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pb-2">
                {role.rules.map((rule, ri) => (
                  <li key={ri} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Violations */}
      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-amber-800 dark:text-amber-200">Violations & Consequences</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Badge variant="outline" className="text-amber-700 border-amber-300 shrink-0 mt-0.5">Level 1</Badge>
              <div>
                <p className="font-medium text-sm">Minor Violations</p>
                <p className="text-xs text-muted-foreground">Warning issued, content removed. Examples: off-topic posting, minor inaccuracies, duplicate reports.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Badge variant="outline" className="text-orange-700 border-orange-300 shrink-0 mt-0.5">Level 2</Badge>
              <div>
                <p className="font-medium text-sm">Serious Violations</p>
                <p className="text-xs text-muted-foreground">Temporary suspension (1–14 days), feature restrictions. Examples: fabricated data, harassment, verification fraud.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Badge variant="outline" className="text-red-700 border-red-300 shrink-0 mt-0.5">Level 3</Badge>
              <div>
                <p className="font-medium text-sm">Severe Violations</p>
                <p className="text-xs text-muted-foreground">Permanent account suspension, data purge, and potential reporting to authorities. Examples: systematic fraud, exploitation of vulnerable populations, malicious data destruction, greenwashing.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            All moderation actions can be appealed within 14 days via the Support Center. Appeals are reviewed by an independent panel within 7 business days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Guidelines;
