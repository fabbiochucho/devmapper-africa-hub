
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SocialShareButton from '@/components/social/SocialShareButton';
import { BarChart3, TrendingUp, Globe, Users } from 'lucide-react';

interface ShareableAnalyticsProps {
  data: {
    totalProjects: number;
    countriesCount: number;
    sdgCount: number;
    completedProjects: number;
    verifiedProjects: number;
  };
}

const ShareableAnalytics: React.FC<ShareableAnalyticsProps> = ({ data }) => {
  const currentUrl = window.location.href;
  
  const shareableTitle = `DevMapper Analytics: ${data.totalProjects} Projects Across ${data.countriesCount} African Countries`;
  const shareableDescription = `Discover the impact of sustainable development projects across Africa. ${data.completedProjects} completed projects, ${data.verifiedProjects} verified by our community. Track progress on all 17 SDG goals with real-time data and community verification.`;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle>Analytics Overview</CardTitle>
          </div>
          <SocialShareButton
            title={shareableTitle}
            description={shareableDescription}
            url={currentUrl}
            data={data}
            type="analytics"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{data.totalProjects}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.completedProjects}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.verifiedProjects}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.countriesCount}</div>
            <div className="text-sm text-muted-foreground">Countries</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareableAnalytics;
