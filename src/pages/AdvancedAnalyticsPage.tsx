import React from 'react';
import Layout from '@/components/Layout';
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics';
import { PerformanceOptimizer } from '@/components/performance/PerformanceOptimizer';
import { FileUpload } from '@/components/ui/file-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, Zap, Upload } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';

export default function AdvancedAnalyticsPage() {
  const { trackCustomEvent } = useAnalytics();

  const handleFileUpload = (urls: string[]) => {
    toast.success(`Successfully uploaded ${urls.length} file(s)`);
    trackCustomEvent('file_upload', { count: urls.length, urls });
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
    trackCustomEvent('file_upload_error', { error });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Analytics & Performance
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive analytics dashboard with real-time performance monitoring, 
            file management, and advanced insights for your platform.
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              File Management
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceOptimizer />
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-500" />
                    Avatar Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    bucket="avatars"
                    accept="image/*"
                    maxSizeMB={5}
                    onUploadComplete={handleFileUpload}
                    onUploadError={handleUploadError}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-green-500" />
                    Document Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    bucket="documents"
                    accept="application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    maxSizeMB={20}
                    multiple
                    onUploadComplete={handleFileUpload}
                    onUploadError={handleUploadError}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-purple-500" />
                    Project Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    bucket="project-files"
                    folder="organization-1" // In real app, this would be dynamic
                    accept="image/*,application/pdf,text/*,application/json"
                    maxSizeMB={50}
                    multiple
                    onUploadComplete={handleFileUpload}
                    onUploadError={handleUploadError}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Active Real-time Features:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Forum post updates</li>
                      <li>• Live user activity</li>
                      <li>• Payment notifications</li>
                      <li>• Organization updates</li>
                      <li>• Analytics tracking</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Real-time connection active
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mobile Responsiveness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Responsive Features:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Adaptive layouts</li>
                      <li>• Touch-friendly interfaces</li>
                      <li>• Optimized images</li>
                      <li>• Progressive loading</li>
                      <li>• Offline support</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 border rounded">
                      <div className="text-xs text-muted-foreground">Mobile</div>
                      <div className="text-sm font-medium">✓</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="text-xs text-muted-foreground">Tablet</div>
                      <div className="text-sm font-medium">✓</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="text-xs text-muted-foreground">Desktop</div>
                      <div className="text-sm font-medium">✓</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}