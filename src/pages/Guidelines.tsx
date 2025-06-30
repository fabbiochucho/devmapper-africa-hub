
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Users, Shield, MessageCircle, Flag } from 'lucide-react';

const Guidelines = () => {
  const guidelines = [
    {
      icon: <Users className="w-5 h-5" />,
      title: "Community Respect",
      description: "Treat all community members with respect and kindness",
      rules: [
        "Use inclusive language and avoid discriminatory content",
        "Respect different perspectives and cultural backgrounds",
        "No harassment, bullying, or personal attacks",
        "Constructive criticism is welcome, but keep it professional"
      ]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Data Integrity",
      description: "Maintain high standards for data accuracy and verification",
      rules: [
        "Provide accurate location data and project information",
        "Include credible sources and documentation when possible",
        "Flag suspicious or potentially false information",
        "Correct mistakes promptly when identified"
      ]
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "Communication Standards",
      description: "Guidelines for effective and respectful communication",
      rules: [
        "Stay on topic and relevant to SDG development",
        "Use clear, descriptive titles for forum posts",
        "Search before posting to avoid duplicates",
        "Provide context and background information"
      ]
    },
    {
      icon: <Flag className="w-5 h-5" />,
      title: "Reporting & Moderation",
      description: "How to report issues and what to expect from moderation",
      rules: [
        "Report violations using the report button",
        "Provide specific details about policy violations",
        "Don't engage in arguments - let moderators handle disputes",
        "Appeals can be submitted through the support system"
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-muted-foreground">
          Building a respectful and productive community for sustainable development in Africa
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        {guidelines.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {section.icon}
                </div>
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

      <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <CardTitle className="text-yellow-800 dark:text-yellow-200">Violations & Consequences</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">Minor Violations</Badge>
              <span className="text-sm">Warning and content removal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-700 border-orange-300">Serious Violations</Badge>
              <span className="text-sm">Temporary suspension (1-7 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-red-700 border-red-300">Severe Violations</Badge>
              <span className="text-sm">Permanent account suspension</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Guidelines;
