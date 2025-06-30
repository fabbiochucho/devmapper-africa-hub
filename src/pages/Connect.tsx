import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  MessageSquare, 
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

const Connect = () => {
  const integrations = [
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Report projects and get updates directly through Telegram',
      icon: <MessageSquare className="w-8 h-8" />,
      status: 'Available',
      features: [
        'Submit project reports via chat',
        'Receive real-time notifications',
        'Community group discussions',
        'Multilingual support'
      ],
      instructions: [
        'Search for @DevMapperBot on Telegram',
        'Send /start to begin setup',
        'Link your DevMapper account',
        'Start reporting projects!'
      ]
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Bot',
      description: 'Access DevMapper features through WhatsApp messaging',
      icon: <MessageCircle className="w-8 h-8" />,
      status: 'Available',
      features: [
        'Voice and text project reporting',
        'Photo and location sharing',
        'Status updates and notifications',
        'Group collaboration features'
      ],
      instructions: [
        'Save +234 123 DEVMAP to your contacts',
        'Send "Hello" to start conversation',
        'Follow setup prompts to link account',
        'Use voice commands or text to report'
      ]
    },
    {
      id: 'mobile',
      name: 'Mobile App',
      description: 'Full-featured mobile application for iOS and Android',
      icon: <Smartphone className="w-8 h-8" />,
      status: 'Coming Soon',
      features: [
        'Offline data collection',
        'GPS-enabled reporting',
        'Photo and video capture',
        'Real-time synchronization'
      ],
      instructions: [
        'App will be available on App Store and Google Play',
        'Sign up for beta testing notifications',
        'Early access for verified contributors',
        'Full launch planned for Q2 2025'
      ]
    },
    {
      id: 'api',
      name: 'API Access',
      description: 'Integrate DevMapper data into your applications',
      icon: <Code className="w-8 h-8" />,
      status: 'Available',
      features: [
        'RESTful API endpoints',
        'Real-time data feeds',
        'Webhook notifications',
        'SDKs for popular languages'
      ],
      instructions: [
        'Register for API access',
        'Generate your API key',
        'Review documentation',
        'Start building integrations'
      ]
    },
    {
      id: 'partnerships',
      name: 'Partnerships',
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
    {
      method: 'GET',
      endpoint: '/api/v1/projects',
      description: 'Retrieve all projects with optional filtering',
      parameters: ['country', 'sdg', 'status', 'dateRange']
    },
    {
      method: 'POST',
      endpoint: '/api/v1/projects',
      description: 'Create a new project report',
      parameters: ['title', 'description', 'location', 'sdg_goals']
    },
    {
      method: 'GET',
      endpoint: '/api/v1/analytics',
      description: 'Get analytics data and statistics',
      parameters: ['metric', 'timeframe', 'region']
    },
    {
      method: 'GET',
      endpoint: '/api/v1/verification',
      description: 'Access verification status and reports',
      parameters: ['project_id', 'verification_level']
    }
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
                      <Button 
                        className="w-full"
                        disabled={integration.status === 'Coming Soon'}
                      >
                        {integration.status === 'Available' ? (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Get Started
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Notify Me
                          </>
                        )}
                      </Button>
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
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Code className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">REST API</h3>
                      <p className="text-sm text-muted-foreground">Full REST API access</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">Webhooks</h3>
                      <p className="text-sm text-muted-foreground">Real-time notifications</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Download className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">SDKs</h3>
                      <p className="text-sm text-muted-foreground">Multiple languages</p>
                    </CardContent>
                  </Card>
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
                  <Button>
                    <Code className="w-4 h-4 mr-2" />
                    Get API Key
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Documentation
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
                  <h3 className="font-semibold">Quick Start Guides</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Code className="w-4 h-4 mr-2" />
                      JavaScript SDK
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Code className="w-4 h-4 mr-2" />
                      Python SDK
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Code className="w-4 h-4 mr-2" />
                      REST API Tutorial
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Code className="w-4 h-4 mr-2" />
                      Webhook Setup
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Code Examples</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Fetch Projects Example</p>
                    <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`fetch('https://api.devmapper.africa/v1/projects', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
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
