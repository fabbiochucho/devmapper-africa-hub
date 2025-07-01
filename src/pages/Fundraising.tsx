
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Heart, Target, DollarSign, Users, Calendar, MapPin, Share2, MessageCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  changeMakerId: string;
  changeMakerName: string;
  targetAmount: number;
  raisedAmount: number;
  currency: string;
  sdgGoals: string[];
  location: string;
  category: 'nano' | 'micro' | 'small';
  deadline: string;
  status: 'active' | 'completed' | 'expired';
  image: string;
  supporters: number;
  updates: number;
  verified: boolean;
}

const mockCampaigns: FundraisingCampaign[] = [
  {
    id: "FC-001",
    title: "Solar Panels for Rural School",
    description: "Providing clean energy access to Mwanza Primary School to improve learning conditions for 300 students.",
    changeMakerId: "CM-002",
    changeMakerName: "Clean Water Initiative Kenya",
    targetAmount: 5000,
    raisedAmount: 3200,
    currency: "USD",
    sdgGoals: ["7", "4"],
    location: "Mwanza, Tanzania",
    category: "micro",
    deadline: "2025-03-15",
    status: "active",
    image: "/placeholder.svg",
    supporters: 48,
    updates: 3,
    verified: true
  },
  {
    id: "FC-002",
    title: "Girls Education Scholarship Fund",
    description: "Supporting 20 girls in Lagos with school fees and supplies to complete their secondary education.",
    changeMakerId: "CM-001",
    changeMakerName: "Amina Hassan",
    targetAmount: 2500,
    raisedAmount: 1800,
    currency: "USD",
    sdgGoals: ["4", "5"],
    location: "Lagos, Nigeria",
    category: "nano",
    deadline: "2025-02-28",
    status: "active",
    image: "/placeholder.svg",
    supporters: 35,
    updates: 5,
    verified: true
  },
  {
    id: "FC-003",
    title: "Community Water Well Project",
    description: "Drilling a clean water well to serve 500 families in rural Kenya with safe drinking water.",
    changeMakerId: "CM-002",
    changeMakerName: "Clean Water Initiative Kenya",
    targetAmount: 15000,
    raisedAmount: 12000,
    currency: "USD",
    sdgGoals: ["6", "3"],
    location: "Kisumu, Kenya",
    category: "small",
    deadline: "2025-04-30",
    status: "active",
    image: "/placeholder.svg",
    supporters: 120,
    updates: 8,
    verified: true
  }
];

const Fundraising = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSDG, setFilterSDG] = useState<string>("all");

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || campaign.category === filterCategory;
    const matchesSDG = filterSDG === "all" || campaign.sdgGoals.includes(filterSDG);
    
    return matchesSearch && matchesCategory && matchesSDG;
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getProgressPercentage = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nano': return 'bg-green-100 text-green-800';
      case 'micro': return 'bg-blue-100 text-blue-800';
      case 'small': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysLeft = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleDonate = (campaignId: string, amount: number) => {
    toast.success(`Thank you for your donation of $${amount}!`, {
      description: "Your contribution will make a real impact.",
    });
  };

  const handleShare = (campaign: FundraisingCampaign) => {
    const url = `${window.location.origin}/fundraising/${campaign.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Campaign link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SDG Fundraising Platform</h1>
          <p className="text-muted-foreground">
            Support transparent, accountable micro-philanthropy for sustainable development
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Heart className="mr-2 h-4 w-4" />
          Start Campaign
        </Button>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$247,500</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">Currently fundraising</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supporters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,845</div>
            <p className="text-xs text-muted-foreground">Individual donors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Funded</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="create">Create Campaign</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="nano">Nano Grants (&lt;$1K)</SelectItem>
                <SelectItem value="micro">Micro Grants ($1K-$10K)</SelectItem>
                <SelectItem value="small">Small Grants ($10K+)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSDG} onValueChange={setFilterSDG}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by SDG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SDGs</SelectItem>
                <SelectItem value="1">SDG 1: No Poverty</SelectItem>
                <SelectItem value="3">SDG 3: Good Health</SelectItem>
                <SelectItem value="4">SDG 4: Quality Education</SelectItem>
                <SelectItem value="6">SDG 6: Clean Water</SelectItem>
                <SelectItem value="7">SDG 7: Clean Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(campaign.category)}>
                      {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)} Grant
                    </Badge>
                    {campaign.verified && (
                      <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-3">{campaign.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{getProgressPercentage(campaign.raisedAmount, campaign.targetAmount).toFixed(1)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(campaign.raisedAmount, campaign.targetAmount)} />
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(campaign.raisedAmount, campaign.currency)} raised
                      </span>
                      <span className="text-gray-500">
                        of {formatCurrency(campaign.targetAmount, campaign.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {campaign.supporters} supporters
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {getDaysLeft(campaign.deadline)} days left
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {campaign.location}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {campaign.sdgGoals.map((sdg) => (
                      <Badge key={sdg} variant="secondary" className="text-xs">
                        SDG {sdg}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleDonate(campaign.id, 25)}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Donate $25
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleShare(campaign)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    By {campaign.changeMakerName} • {campaign.updates} updates
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Completed Campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">
              View successfully funded projects and their impact reports.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Fundraising Campaign</CardTitle>
              <p className="text-muted-foreground">
                Launch a transparent, accountable campaign for your SDG-focused project.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Heart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Campaign Creation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Campaign creation form will be implemented here.
                </p>
                <Button className="mt-4 bg-green-600 hover:bg-green-700">
                  Start Creating Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Fundraising;
