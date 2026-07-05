
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, BookOpen, FileText, Video, Link, ExternalLink, Filter } from 'lucide-react';
import ApiDocsTab from '@/components/resources/ApiDocsTab';
import { resources, externalResources, categories } from '@/data/resourcesLibraryData';

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-4 h-4" />;
      case 'Video': return <Video className="w-4 h-4" />;
      case 'ZIP': case 'DOCX': return <Download className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
        <p className="text-muted-foreground">Access tools, guides, and resources for sustainable development tracking</p>
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
                <Input placeholder="Search resources..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select className="px-3 py-2 border rounded-md bg-background" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map(cat => (<option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>))}
              </select>
            </div>
          </div>
          <div className="grid gap-4">
            {filteredResources.map((resource, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">{getTypeIcon(resource.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{resource.title}</h3>
                          <Badge variant="outline">{resource.category}</Badge>
                          <Badge variant="secondary">{resource.type}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{resource.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resource.tags.map((tag, ti) => (<Badge key={ti} variant="outline" className="text-xs">{tag}</Badge>))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{resource.size}</span>
                          <span>{resource.downloads} downloads</span>
                          <span>Updated: {resource.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button><Download className="w-4 h-4 mr-2" />Download</Button>
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
                      <div className="p-2 bg-primary/10 rounded-lg"><Link className="w-5 h-5" /></div>
                      <div>
                        <h3 className="font-semibold text-lg">{resource.title}</h3>
                        <p className="text-muted-foreground">{resource.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">Source: {resource.organization}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">Visit Site<ExternalLink className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-0">
          <ApiDocsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Resources;
