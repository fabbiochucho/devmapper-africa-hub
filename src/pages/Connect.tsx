import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/data/resourcesApiData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Code, 
  Handshake, 
  Download, 
  ExternalLink, 
  Zap,
  Globe,
  Users,
  Building,
  MessageCircle
} from 'lucide-react';

const WHATSAPP_DISPLAY = '+234 818 846 6444';
const WHATSAPP_URL = 'https://wa.me/2348188466444';

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

const Connect = () => {
  // Browsers that support installing web apps fire this; others use the written steps.
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const integrations = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Support',
      description: 'Chat with the DevMapper team on WhatsApp',
      icon: <MessageCircle className="w-8 h-8" />,
      status: 'Available',
      href: WHATSAPP_URL,
      features: [
        'Questions about reporting and verification',
        'Help with your account or organisation',
        'Send photos or locations from your phone'
      ],
      instructions: [
        `Save ${WHATSAPP_DISPLAY} to your contacts`,
        'Open WhatsApp and send us a message',
        'Tell us your DevMapper email if it is about your account'
      ]
    },
    {
      id: 'mobile',
      name: 'Install the App',
      description: 'Install DevMapper on your phone or computer - no app store needed',
      icon: <Smartphone className="w-8 h-8" />,
      status: 'Available',
      features: [
        'Opens full-screen from your home screen',
        'GPS-tagged project reports',
        'Photo upload from your camera',
        'Loads faster after the first visit'
      ],
      instructions: [
        'Android (Chrome): menu ⋮ → Install app',
        'iPhone/iPad (Safari): Share → Add to Home Screen',
        'Desktop (Chrome/Edge): install icon in the address bar',
        'Sign in once and keep using it like any app'
      ]
    },
    {
      id: 'api',
      name: 'API Access',
      description: 'Read DevMapper public data from your own applications',
      icon: <Code className="w-8 h-8" />,
      status: 'Available',
      href: '/resources?tab=api',
      features: [
        'Projects, milestones, campaigns and change makers',
        'Country regulatory profiles for 54 countries',
        'SDG, Agenda 2063 and certificate lookups',
        'No API key - plain HTTPS and JSON'
      ],
      instructions: [
        'Open the API documentation',
        'Call GET /v1/projects from any language',
        'Filter by country, SDG or status',
        'Credit DevMapper when you publish the data'
      ]
    },
    {
      id: 'partnerships',
      name: 'Partnerships',
      href: '/contact',
      description: 'Collaborate with organizations and institutions',
      icon: <Handshake className="w-8 h-8" />,
      status: 'Open',
      features: [
        'Data sharing agreements',
        'Co-development opportunities',
        'Funding partnerships',
        'Research collaborations'
      ],
      instructions: [
        'Submit partnership proposal',
        'Schedule initial consultation',
        'Develop collaboration framework',
        'Launch joint initiatives'
      ]
    }
  ];

  const partnershipTypes = [
    {
      type: 'NGOs & Non-Profits',
      icon: <Users className="w-6 h-6" />,
      description: 'Community organizations and development agencies',
      benefits: [
        'Enhanced project visibility',
        'Access to verification networks',
        'Funding opportunity alerts',
        'Capacity building support'
      ],
      examples: ['Oxfam', 'Save the Children', 'ActionAid', 'Local CBOs']
    },
    {
      type: 'Government Agencies',
      icon: <Building className="w-6 h-6" />,
      description: 'Government departments and public institutions',
      benefits: [
        'Policy-aligned project tracking',
        'Official data integration',
        'Transparency reporting',
        'Citizen engagement tools'
      ],
      examples: ['Ministry of Development', 'National Statistics Offices', 'Local Governments']
    },
    {
      type: 'Corporate Partners',
      icon: <Building className="w-6 h-6" />,
      description: 'Private sector and corporate social responsibility',
      benefits: [
        'CSR impact measurement',
        'Stakeholder reporting',
        'Community partnership facilitation',
        'Brand visibility'
      ],
      examples: ['Multinational corporations', 'Local businesses', 'Social enterprises']
    },
    {
      type: 'Academic Institutions',
      icon: <Globe className="w-6 h-6" />,
      description: 'Universities and research organizations',
      benefits: [
        'Research data access',
        'Student engagement opportunities',
        'Publication partnerships',
        'Innovation collaborations'
      ],
      examples: ['Universities', 'Research centers', 'Think tanks']
    }
  ];

  const apiEndpoints = [
    { method: 'GET', endpoint: '/v1/projects', description: 'Public projects, with paging and filters', parameters: ['country', 'sdg', 'status', 'verified', 'search'] },
    { method: 'GET', endpoint: '/v1/projects/{id}/milestones', description: "A public project's milestones", parameters: ['id'] },
    { method: 'GET', endpoint: '/v1/countries/{code}', description: 'Country regulatory and institutional profile', parameters: ['code'] },
    { method: 'GET', endpoint: '/v1/stats', description: 'Public project counts by SDG and country', parameters: [] },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connect & Integrate</h1>
        <p className="text-muted-foreground">
          Extend DevMapper's reach through various platforms, APIs, and partnerships
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
          <TabsTrigger value="developers">Developers</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {integration.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={integration.status === 'Available' ? 'default' : 'secondary'}
                    >
                      {integration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Features</h4>
                      <ul className="space-y-1 text-sm">
                        {integration.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Getting Started</h4>
                      <ol className="space-y-1 text-sm">
                        {integration.instructions.map((instruction, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-muted-foreground">{index + 1}.</span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                    
                    <div className="pt-2">
                      {integration.href ? (
                        <Button className="w-full" asChild>
                          <a href={integration.href} {...(integration.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Get Started
                          </a>
                        </Button>
                      ) : integration.id === 'mobile' && installPrompt ? (
                        <Button className="w-full" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null); }}>
                          <Smartphone className="w-4 h-4 mr-2" />
                          Install DevMapper
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Integrate DevMapper data and functionality into your applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: <Code className="w-8 h-8 mx-auto mb-2 text-primary" />, title: 'REST API', text: 'Read-only GET endpoints' },
                    { icon: <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />, title: 'No API key', text: 'Public data, open access' },
                    { icon: <Download className="w-8 h-8 mx-auto mb-2 text-primary" />, title: 'JSON', text: 'Works from any language' },
                  ].map((c) => (
                    <Card key={c.title}>
                      <CardContent className="p-4 text-center">
                        {c.icon}
                        <h3 className="font-semibold mb-1">{c.title}</h3>
                        <p className="text-sm text-muted-foreground">{c.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Available Endpoints</h3>
                  <div className="space-y-2">
                    {apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {endpoint.endpoint}
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {endpoint.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <Badge key={paramIndex} variant="outline" className="text-xs">
                              {param}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button asChild>
                    <a href="/resources?tab=api">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Documentation
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partnerships" className="space-y-6">
          <div className="grid gap-6">
            {partnershipTypes.map((partnership, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {partnership.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{partnership.type}</CardTitle>
                      <CardDescription>{partnership.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Partnership Benefits</h4>
                      <ul className="space-y-2">
                        {partnership.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                            <span className="text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Example Partners</h4>
                      <div className="flex flex-wrap gap-2">
                        {partnership.examples.map((example, exampleIndex) => (
                          <Badge key={exampleIndex} variant="outline">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button>
                      <Handshake className="w-4 h-4 mr-2" />
                      Explore Partnership
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="developers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Developer Resources</CardTitle>
              <CardDescription>
                Tools and resources for developers building on DevMapper
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Guides</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'API documentation', href: '/resources?tab=api' },
                      { label: 'Bulk upload templates (CSV)', href: '/bulk-upload' },
                      { label: 'SDG indicator registry', href: '/sdg-indicators' },
                    ].map((g) => (
                      <Button key={g.href} variant="outline" className="w-full justify-start" asChild>
                        <a href={g.href}><Code className="w-4 h-4 mr-2" />{g.label}</a>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Code Examples</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Fetch Projects Example</p>
                    <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`fetch('${API_BASE_URL}/v1/projects?country=KE')
  .then((res) => res.json())
  .then(({ data, meta }) => console.log(meta.total, data));`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Connect;
