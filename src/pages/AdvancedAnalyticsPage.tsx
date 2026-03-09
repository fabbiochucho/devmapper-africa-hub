import React, { lazy, Suspense, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, BarChart3, Zap, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PageSkeleton } from '@/components/ui/loading-skeleton';

// Lazy load heavy components
const AdvancedAnalytics = lazy(() => 
  import('@/components/analytics/AdvancedAnalytics').then(m => ({ default: m.AdvancedAnalytics }))
);
const PerformanceOptimizer = lazy(() => 
  import('@/components/performance/PerformanceOptimizer').then(m => ({ default: m.PerformanceOptimizer }))
);
const FileUpload = lazy(() => 
  import('@/components/ui/file-upload').then(m => ({ default: m.FileUpload }))
);

const CardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    </CardContent>
  </Card>
);

export default function AdvancedAnalyticsPage() {
  const handleFileUpload = useCallback((urls: string[]) => {
    toast.success(`Successfully uploaded ${urls.length} file(s)`);
  }, []);

  const handleUploadError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Files</span>
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Real-time</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <Suspense fallback={<CardSkeleton />}>
              <AdvancedAnalytics />
            </Suspense>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Suspense fallback={<CardSkeleton />}>
              <PerformanceOptimizer />
            </Suspense>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Suspense fallback={<CardSkeleton />}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
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
                      <Upload className="w-5 h-5 text-success" />
                      Document Upload
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      bucket="documents"
                      accept="application/pdf,text/*"
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
                      <Upload className="w-5 h-5 text-info" />
                      Project Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUpload
                      bucket="project-files"
                      folder="organization-1"
                      accept="image/*,application/pdf,text/*,application/json"
                      maxSizeMB={50}
                      multiple
                      onUploadComplete={handleFileUpload}
                      onUploadError={handleUploadError}
                    />
                  </CardContent>
                </Card>
              </div>
            </Suspense>
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
                  <div className="p-3 bg-success/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-success">
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
                      <div className="text-sm font-medium text-success">✓</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="text-xs text-muted-foreground">Tablet</div>
                      <div className="text-sm font-medium text-success">✓</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="text-xs text-muted-foreground">Desktop</div>
                      <div className="text-sm font-medium text-success">✓</div>
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
