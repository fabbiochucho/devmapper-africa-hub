import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Target, Shield, TrendingUp } from "lucide-react";

interface FundraisingStatsProps {
  totalRaised: number;
  activeCampaigns: number;
  verifiedCampaigns: number;
  avgProgress: number;
}

export const FundraisingStats = ({ totalRaised, activeCampaigns, verifiedCampaigns, avgProgress }: FundraisingStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${totalRaised.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">Across all campaigns</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{activeCampaigns}</div>
        <p className="text-xs text-muted-foreground">Currently fundraising</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Verified Campaigns</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{verifiedCampaigns}</div>
        <p className="text-xs text-muted-foreground">Verified by DevMapper</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{avgProgress.toFixed(0)}%</div>
        <p className="text-xs text-muted-foreground">Average funding progress</p>
      </CardContent>
    </Card>
  </div>
);
