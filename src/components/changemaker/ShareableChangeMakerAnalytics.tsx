
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Download, Users, DollarSign, TrendingUp, Target } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface ShareableChangeMakerAnalyticsProps {
  data: {
    totalChangeMakers: number;
    totalFunding: number;
    totalLivesTouched: number;
    totalProjects: number;
    verifiedChangeMakers: number;
  };
}

const ShareableChangeMakerAnalytics: React.FC<ShareableChangeMakerAnalyticsProps> = ({ data }) => {
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      ...data,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-maker-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Analytics data exported successfully!");
  };

  const formatCurrency = (value: number) => `$${(value / 1000000).toFixed(1)}M`;
  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Change Maker Analytics Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Key metrics and insights into African change makers
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{formatNumber(data.totalChangeMakers)}</p>
              <p className="text-xs text-muted-foreground">Total Change Makers</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{formatNumber(data.verifiedChangeMakers)}</p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{formatCurrency(data.totalFunding)}</p>
              <p className="text-xs text-muted-foreground">Total Funding</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">{formatNumber(data.totalLivesTouched)}</p>
              <p className="text-xs text-muted-foreground">Lives Touched</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{formatNumber(data.totalProjects)}</p>
              <p className="text-xs text-muted-foreground">Projects Completed</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareableChangeMakerAnalytics;
