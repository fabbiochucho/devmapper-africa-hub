import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Calendar, MapPin, Share2, Shield } from "lucide-react";
import { formatCurrency, getProgressPercentage, getCategoryColor, getDaysLeft } from "@/lib/fundraisingUtils";

export interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  change_maker_id: string;
  target_amount: number;
  raised_amount: number;
  currency: string;
  sdg_goals: number[];
  location: string;
  category: 'nano' | 'micro' | 'small';
  deadline: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  image_url?: string;
  is_verified: boolean;
  created_by: string;
  created_at: string;
  change_maker_name?: string;
}

interface CampaignCardProps {
  campaign: FundraisingCampaign;
  onDonate: (campaign: FundraisingCampaign) => void;
  onShare: (campaign: FundraisingCampaign) => void;
}

export const CampaignCard = ({ campaign, onDonate, onShare }: CampaignCardProps) => {
  const daysLeft = getDaysLeft(campaign.deadline);
  const progress = getProgressPercentage(campaign.raised_amount, campaign.target_amount);
  const isExpired = daysLeft === 0 && campaign.status !== 'completed';

  return (
    <Card className="hover:shadow-lg transition-shadow animate-fade-in overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={campaign.image_url || '/placeholder.svg'}
            alt={campaign.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={getCategoryColor(campaign.category)}>
              {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)} Grant
            </Badge>
            {campaign.is_verified && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Shield className="w-3 h-3 mr-1" /> Verified
              </Badge>
            )}
          </div>
          {isExpired && (
            <div className="absolute top-3 right-3">
              <Badge variant="destructive">Expired</Badge>
            </div>
          )}
        </div>
        <div className="p-4 pb-0">
          <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{campaign.description}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-primary">
              {formatCurrency(campaign.raised_amount, campaign.currency)} raised
            </span>
            <span className="text-muted-foreground">
              of {formatCurrency(campaign.target_amount, campaign.currency)}
            </span>
          </div>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {daysLeft > 0 ? `${daysLeft} days left` : 'Campaign ended'}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {campaign.location}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {campaign.sdg_goals.slice(0, 4).map((sdg) => (
            <Badge key={sdg} variant="secondary" className="text-xs">
              SDG {sdg}
            </Badge>
          ))}
          {campaign.sdg_goals.length > 4 && (
            <Badge variant="secondary" className="text-xs">+{campaign.sdg_goals.length - 4}</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => onDonate(campaign)}
            disabled={isExpired}
          >
            <Heart className="w-4 h-4 mr-2" />
            Donate
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onShare(campaign)}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          By {campaign.change_maker_name} • {new Date(campaign.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};
