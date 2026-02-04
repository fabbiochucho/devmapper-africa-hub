import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Target, DollarSign, Users, Calendar, MapPin, Share2, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DonationDialog } from "@/components/donation/DonationDialog";

interface FundraisingCampaign {
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

const SDG_OPTIONS = [
  { value: 1, label: "SDG 1: No Poverty" },
  { value: 2, label: "SDG 2: Zero Hunger" },
  { value: 3, label: "SDG 3: Good Health" },
  { value: 4, label: "SDG 4: Quality Education" },
  { value: 5, label: "SDG 5: Gender Equality" },
  { value: 6, label: "SDG 6: Clean Water" },
  { value: 7, label: "SDG 7: Clean Energy" },
  { value: 8, label: "SDG 8: Decent Work" },
  { value: 9, label: "SDG 9: Industry Innovation" },
  { value: 10, label: "SDG 10: Reduced Inequalities" },
  { value: 11, label: "SDG 11: Sustainable Cities" },
  { value: 12, label: "SDG 12: Responsible Consumption" },
  { value: 13, label: "SDG 13: Climate Action" },
  { value: 14, label: "SDG 14: Life Below Water" },
  { value: 15, label: "SDG 15: Life on Land" },
  { value: 16, label: "SDG 16: Peace and Justice" },
  { value: 17, label: "SDG 17: Partnerships" }
];

const Fundraising = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSDG, setFilterSDG] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<FundraisingCampaign | null>(null);
  
  // Campaign creation form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    currency: 'USD',
    sdg_goals: [] as number[],
    location: '',
    category: 'nano' as 'nano' | 'micro' | 'small',
    deadline: '',
    image_url: ''
  });

  useEffect(() => {
    fetchCampaigns();
    
    // Check for donation success
    const donationStatus = searchParams.get('donation');
    if (donationStatus === 'success') {
      toast.success('Thank you for your donation! Your contribution will make a real impact.');
    }
  }, [searchParams]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select(`
          *,
          public_profiles!fundraising_campaigns_change_maker_id_fkey(full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const campaignsWithNames = data?.map(campaign => ({
        ...campaign,
        category: campaign.category as 'nano' | 'micro' | 'small',
        change_maker_name: campaign.public_profiles?.full_name || 'Anonymous'
      })) || [];
      
      setCampaigns(campaignsWithNames as FundraisingCampaign[]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create a campaign');
      return;
    }

    // Determine category based on target amount
    const amount = parseFloat(formData.target_amount);
    let category: 'nano' | 'micro' | 'small';
    if (amount < 1000) category = 'nano';
    else if (amount < 10000) category = 'micro';
    else category = 'small';

    try {
      const { error } = await supabase
        .from('fundraising_campaigns')
        .insert([{
          title: formData.title,
          description: formData.description,
          target_amount: parseFloat(formData.target_amount),
          currency: formData.currency,
          sdg_goals: formData.sdg_goals,
          location: formData.location,
          category,
          deadline: formData.deadline,
          image_url: formData.image_url || '/placeholder.svg',
          created_by: user.id,
          change_maker_id: user.id
        }]);

      if (error) throw error;
      
      toast.success('Campaign created successfully!');
      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        target_amount: '',
        currency: 'USD',
        sdg_goals: [],
        location: '',
        category: 'nano',
        deadline: '',
        image_url: ''
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    }
  };

  const handleSDGToggle = (sdgValue: number) => {
    setFormData(prev => ({
      ...prev,
      sdg_goals: prev.sdg_goals.includes(sdgValue)
        ? prev.sdg_goals.filter(g => g !== sdgValue)
        : [...prev.sdg_goals, sdgValue]
    }));
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || campaign.category === filterCategory;
    const matchesSDG = filterSDG === "all" || campaign.sdg_goals.includes(parseInt(filterSDG));
    
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

  const handleDonate = (campaign: FundraisingCampaign) => {
    setSelectedCampaign(campaign);
    setShowDonationDialog(true);
  };

  const handleShare = (campaign: FundraisingCampaign) => {
    const url = `${window.location.origin}/fundraising/${campaign.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Campaign link copied to clipboard!");
  };

  // Calculate stats from real data
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised_amount, 0);
  const activeCampaigns = campaigns.length;
  const totalSupporters = campaigns.reduce((sum, c) => sum + Math.floor(c.raised_amount / 50), 0); // Estimate based on avg donation
  const completedProjects = campaigns.filter(c => c.status === 'completed').length;
  
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SDG Fundraising Platform</h1>
          <p className="text-muted-foreground">
            Support transparent, accountable micro-philanthropy for sustainable development
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Heart className="mr-2 h-4 w-4" />
              Start Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Fundraising Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCampaign} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Solar Panels for Rural School"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your project and its impact..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="target_amount">Target Amount *</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="5000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Lagos, Nigeria"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Campaign Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="image_url">Campaign Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>SDG Goals *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {SDG_OPTIONS.map((sdg) => (
                      <div key={sdg.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`sdg-${sdg.value}`}
                          checked={formData.sdg_goals.includes(sdg.value)}
                          onChange={() => handleSDGToggle(sdg.value)}
                          className="rounded"
                        />
                        <Label 
                          htmlFor={`sdg-${sdg.value}`} 
                          className="text-sm cursor-pointer"
                        >
                          {sdg.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Create Campaign
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Total Supporters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSupporters.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Individual donors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Funded</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

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
            {SDG_OPTIONS.map(sdg => (
              <SelectItem key={sdg.value} value={sdg.value.toString()}>
                {sdg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {campaigns.length === 0 
                ? "Be the first to create a fundraising campaign!" 
                : "Try adjusting your search filters."}
            </p>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow animate-fade-in">
              <CardHeader>
                <img
                  src={campaign.image_url || '/placeholder.svg'}
                  alt={campaign.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(campaign.category)}>
                    {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)} Grant
                  </Badge>
                  {campaign.is_verified && (
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
                    <span>{getProgressPercentage(campaign.raised_amount, campaign.target_amount).toFixed(1)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(campaign.raised_amount, campaign.target_amount)} />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(campaign.raised_amount, campaign.currency)} raised
                    </span>
                    <span className="text-gray-500">
                      of {formatCurrency(campaign.target_amount, campaign.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-500">
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
                  {campaign.sdg_goals.map((sdg) => (
                    <Badge key={sdg} variant="secondary" className="text-xs">
                      SDG {sdg}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleDonate(campaign)}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Donate
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
                  By {campaign.change_maker_name} • {new Date(campaign.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Donation Dialog */}
      <DonationDialog
        campaign={selectedCampaign}
        open={showDonationDialog}
        onOpenChange={setShowDonationDialog}
        onDonationComplete={fetchCampaigns}
      />
    </div>
  );
};

export default Fundraising;
