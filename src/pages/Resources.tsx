
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, BookOpen, FileText, Video, Link, ExternalLink, Filter } from 'lucide-react';

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const resources = [
    {
      title: 'SDG Implementation Handbook',
      description: 'Comprehensive guide to implementing Sustainable Development Goals in African communities',
      type: 'PDF',
      category: 'Guidelines',
      size: '4.2 MB',
      downloads: 2156,
      date: '2024-12-15',
      tags: ['SDG', 'Implementation', 'Community', 'Africa']
    },
    {
      title: 'Community Engagement Toolkit',
      description: 'Practical tools and strategies for effective community participation in development projects',
      type: 'ZIP',
      category: 'Toolkits',
      size: '8.7 MB',
      downloads: 1843,
      date: '2024-12-10',
      tags: ['Engagement', 'Community', 'Participation', 'Tools']
    },
    {
      title: 'Data Collection Best Practices',
      description: 'Video series on effective data collection methods for development projects',
      type: 'Video',
      category: 'Training',
      size: '45 min',
      downloads: 3421,
      date: '2024-12-08',
      tags: ['Data', 'Collection', 'Methods', 'Training']
    },
    {
      title: 'Report Writing Templates',
      description: 'Standardized templates for various types of development project reports',
      type: 'DOCX',
      category: 'Templates',
      size: '2.1 MB',
      downloads: 1567,
      date: '2024-12-05',
      tags: ['Templates', 'Reports', 'Writing', 'Standards']
    },
    {
      title: 'Verification Checklist',
      description: 'Comprehensive checklist for verifying the accuracy of project reports',
      type: 'PDF',
      category: 'Guidelines',
      size: '1.3 MB',
      downloads: 987,
      date: '2024-12-01',
      tags: ['Verification', 'Quality', 'Checklist', 'Accuracy']
    },
    {
      title: 'Mobile Data Collection App Guide',
      description: 'Step-by-step guide to using mobile apps for field data collection',
      type: 'PDF',
      category: 'Guides',
      size: '2.8 MB',
      downloads: 1234,
      date: '2024-11-28',
      tags: ['Mobile', 'Apps', 'Field', 'Collection']
    }
  ];

  const externalResources = [
    {
      title: 'UN SDG Knowledge Platform',
      description: 'Official UN platform for SDG resources and progress tracking',
      url: 'https://sustainabledevelopment.un.org/',
      organization: 'United Nations'
    },
    {
      title: 'Africa SDG Index',
      description: 'Comprehensive assessment of African countries\' progress on SDGs',
      url: 'https://sdgindex.org/reports/sdg-index-and-dashboards-2021/',
      organization: 'SDSN Africa'
    },
    {
      title: 'World Bank Open Data',
      description: 'Free access to global development data and statistics',
      url: 'https://data.worldbank.org/',
      organization: 'World Bank'
    },
    {
      title: 'AfDB Development Indicators',
      description: 'African Development Bank statistics and development indicators',
      url: 'https://www.afdb.org/en/knowledge/statistics',
      organization: 'African Development Bank'
    }
  ];

  const categories = ['all', 'Guidelines', 'Toolkits', 'Training', 'Templates', 'Guides'];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4" />;
      case 'Video':
        return <Video className="w-4 h-4" />;
      case 'ZIP':
      case 'DOCX':
        return <Download className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
        <p className="text-muted-foreground">
          Access tools, guides, and resources for sustainable development tracking
        </p>
      </div>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library">Resource Library</TabsTrigger>
          <TabsTrigger value="external">External Links</TabsTrigger>
          <TabsTrigger value="api">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                className="px-3 py-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredResources.map((resource, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getTypeIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{resource.title}</h3>
                          <Badge variant="outline">{resource.category}</Badge>
                          <Badge variant="secondary">{resource.type}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{resource.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resource.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{resource.size}</span>
                          <span>{resource.downloads} downloads</span>
                          <span>Updated: {resource.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline">Preview</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">External Resources</h2>
          <div className="grid gap-4">
            {externalResources.map((resource, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Link className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{resource.title}</h3>
                        <p className="text-muted-foreground">{resource.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Source: {resource.organization}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                      Visit Site
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>DevMapper API Documentation</CardTitle>
              <CardDescription>
                Access our API to integrate DevMapper data into your applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Getting Started</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Learn how to authenticate and make your first API call
                      </p>
                      <Button variant="outline" className="w-full">View Guide</Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">API Reference</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Complete documentation of all available endpoints
                      </p>
                      <Button variant="outline" className="w-full">Browse Endpoints</Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">SDKs & Libraries</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Official SDKs for popular programming languages
                      </p>
                      <Button variant="outline" className="w-full">Download SDKs</Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Code Examples</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Sample code and integration examples
                      </p>
                      <Button variant="outline" className="w-full">View Examples</Button>
                    </CardContent>
                  </Card>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Quick Start</h3>
                  <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.devmapper.africa/v1/projects`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Resources;
