import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Activity, TrendingUp, Users, Eye, MousePointer, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';

interface DailyActivity { date: string; events: number; }
interface HourlyActivity { hour: string; events: number; }
interface TopPage { page: string; views: number; }
interface DeviceBreakdown { name: string; value: number; color: string; }

interface AnalyticsData {
  dailyActivity: DailyActivity[];
  hourlyActivity: HourlyActivity[];
  topPages: TopPage[];
  deviceTypes: DeviceBreakdown[];
  totalEvents: number;
  pageViewCount: number;
  uniqueVisitors: number;
}

// Real analytics computed from public.analytics_events - no simulated data.
// Metrics that would require session-duration/exit tracking (bounce rate,
// average session length, live concurrent users) aren't included: nothing
// in the schema tracks sessions today, so there's no honest way to compute
// them - see the DevMapper launch audit for the decision to drop rather
// than fabricate these.
export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { trackCustomEvent } = useAnalytics();

  useEffect(() => {
    fetchAnalyticsData();
    trackCustomEvent('analytics_dashboard_viewed');
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('event_type, page_url, user_agent, user_id, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      const rows = events || [];

      // Daily activity, last 7 days (all event types)
      const dayBuckets = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayBuckets.set(d.toISOString().slice(0, 10), 0);
      }
      rows.forEach(r => {
        const day = (r.created_at || '').slice(0, 10);
        if (dayBuckets.has(day)) dayBuckets.set(day, (dayBuckets.get(day) || 0) + 1);
      });
      const dailyActivity: DailyActivity[] = Array.from(dayBuckets.entries())
        .map(([date, events]) => ({ date, events }));

      // Activity by time of day (4-hour buckets, across the whole 7-day window)
      const hourBucketStarts = [0, 4, 8, 12, 16, 20];
      const hourCounts = hourBucketStarts.map(() => 0);
      rows.forEach(r => {
        if (!r.created_at) return;
        const hour = new Date(r.created_at).getHours();
        hourCounts[Math.floor(hour / 4)]++;
      });
      const hourlyActivity: HourlyActivity[] = hourBucketStarts.map((h, i) => ({
        hour: `${h.toString().padStart(2, '0')}:00`,
        events: hourCounts[i],
      }));

      // Top pages, from real page_view events
      const pageCounts = new Map<string, number>();
      rows.filter(r => r.event_type === 'page_view' && r.page_url).forEach(r => {
        pageCounts.set(r.page_url!, (pageCounts.get(r.page_url!) || 0) + 1);
      });
      const topPages: TopPage[] = Array.from(pageCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, views]) => ({ page, views }));

      // Device split, parsed from the real user_agent string
      let mobile = 0, tablet = 0, desktop = 0;
      rows.forEach(r => {
        const ua = r.user_agent || '';
        if (/iPad|Tablet/i.test(ua)) tablet++;
        else if (/Mobile|Android|iPhone/i.test(ua)) mobile++;
        else desktop++;
      });
      const deviceTotal = mobile + tablet + desktop || 1;
      const deviceTypes: DeviceBreakdown[] = [
        { name: 'Desktop', value: Math.round((desktop / deviceTotal) * 100), color: '#8884d8' },
        { name: 'Mobile', value: Math.round((mobile / deviceTotal) * 100), color: '#82ca9d' },
        { name: 'Tablet', value: Math.round((tablet / deviceTotal) * 100), color: '#ffc658' },
      ];

      const uniqueVisitors = new Set(rows.map(r => r.user_id || 'anonymous')).size;
      const pageViewCount = rows.filter(r => r.event_type === 'page_view').length;

      setData({
        dailyActivity,
        hourlyActivity,
        topPages,
        deviceTypes,
        totalEvents: rows.length,
        pageViewCount,
        uniqueVisitors,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Real metrics from analytics_events, last 7 days */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Visitors (7d)</p>
                <p className="text-2xl font-bold">{data.uniqueVisitors}</p>
              </div>
              <Users className="w-4 h-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Page Views (7d)</p>
                <p className="text-2xl font-bold">{data.pageViewCount.toLocaleString()}</p>
              </div>
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events (7d)</p>
                <p className="text-2xl font-bold">{data.totalEvents.toLocaleString()}</p>
              </div>
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Most Viewed Page</p>
                <p className="text-lg font-bold truncate">{data.topPages[0]?.page || '—'}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Activity by Time of Day</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not enough page-view data yet.</p>
              ) : (
                <div className="space-y-4">
                  {data.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <p className="font-medium">{page.page}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {page.views.toLocaleString()} views
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.deviceTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.deviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  {data.deviceTypes.map((device) => (
                    <div key={device.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: device.color }}
                        ></div>
                        <span className="font-medium">{device.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{device.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
