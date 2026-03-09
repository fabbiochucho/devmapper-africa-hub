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
import { Heart, Target, DollarSign, Users, Calendar, MapPin, Share2, MessageCircle, Plus, TrendingUp, Shield, AlertCircle } from "lucide-react";
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

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD – US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR – Euro", symbol: "€" },
  { value: "GBP", label: "GBP – British Pound", symbol: "£" },
  { value: "NGN", label: "NGN – Nigerian Naira", symbol: "₦" },
  { value: "KES", label: "KES – Kenyan Shilling", symbol: "KSh" },
  { value: "GHS", label: "GHS – Ghanaian Cedi", symbol: "GH₵" },
  { value: "ZAR", label: "ZAR – South African Rand", symbol: "R" },
  { value: "TZS", label: "TZS – Tanzanian Shilling", symbol: "TSh" },
  { value: "UGX", label: "UGX – Ugandan Shilling", symbol: "USh" },
  { value: "RWF", label: "RWF – Rwandan Franc", symbol: "FRw" },
  { value: "ETB", label: "ETB – Ethiopian Birr", symbol: "Br" },
  { value: "XOF", label: "XOF – West African CFA", symbol: "CFA" },
  { value: "XAF", label: "XAF – Central African CFA", symbol: "FCFA" },
  { value: "EGP", label: "EGP – Egyptian Pound", symbol: "E£" },
  { value: "MAD", label: "MAD – Moroccan Dirham", symbol: "MAD" },
];

const getCurrencySymbol = (code: string) => {
  return CURRENCY_OPTIONS.find(c => c.value === code)?.symbol || code;
};

const Fundraising = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSDG, setFilterSDG] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<FundraisingCampaign | null>(null);
  const [creating, setCreating] = useState(false);
  
  const [userReports, setUserReports] = useState<{ id: string; title: string }[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    currency: 'USD',
    sdg_goals: [] as number[],
    location: '',
    category: 'nano' as 'nano' | 'micro' | 'small',
    deadline: '',
    image_url: '',
    report_id: '' as string,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch user's reports for campaign linking
  useEffect(() => {
    if (user) {
      supabase.from('reports').select('id, title').eq('user_id', user.id).order('submitted_at', { ascending: false }).then(({ data }) => {
        if (data) setUserReports(data);
      });
    }
  }, [user]);

  useEffect(() => {
    fetchCampaigns();

    const donationStatus = searchParams.get('donation');
    if (donationStatus === 'success') {
      toast.success('Thank you for your donation! Your contribution will make a real impact.');
    }

    // Deep-link: open create dialog + prefill SDGs
    if (searchParams.get('create') === '1') {
      const sdgs = (searchParams.get('sdgs') || '')
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => Number.isFinite(n) && n >= 1 && n <= 17)
        .slice(0, 5);

      if (sdgs.length > 0) {
        setFormData(prev => ({ ...prev, sdg_goals: sdgs }));
      }
      setShowCreateDialog(true);
    }
  }, [searchParams]);

  const fetchCampaigns = async () => {
    try {
      const query = supabase
        .from('fundraising_campaigns')
        .select(`
          *,
          public_profiles!fundraising_campaigns_change_maker_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      // Only filter by status if not "all"
      if (filterStatus !== 'all') {
        query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const campaignsWithNames = data?.map(campaign => ({
        ...campaign,
        category: campaign.category as 'nano' | 'micro' | 'small',
        change_maker_name: (campaign as any).public_profiles?.full_name || 'Anonymous'
      })) || [];
      
      setCampaigns(campaignsWithNames as FundraisingCampaign[]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when status filter changes
  useEffect(() => {
    fetchCampaigns();
  }, [filterStatus]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) errors.title = 'Campaign title is required';
    if (formData.title.length > 120) errors.title = 'Title must be under 120 characters';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.description.length < 50) errors.description = 'Description must be at least 50 characters';
    
    const amount = parseFloat(formData.target_amount);
    if (!amount || amount < 10) errors.target_amount = 'Minimum target is 10';
    if (amount > 100000) errors.target_amount = 'Maximum target is 100,000';
    
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!formData.deadline) errors.deadline = 'Deadline is required';
    
    const deadlineDate = new Date(formData.deadline);
    const minDeadline = new Date();
    minDeadline.setDate(minDeadline.getDate() + 7);
    if (deadlineDate < minDeadline) errors.deadline = 'Deadline must be at least 7 days from now';
    
    const maxDeadline = new Date();
    maxDeadline.setFullYear(maxDeadline.getFullYear() + 1);
    if (deadlineDate > maxDeadline) errors.deadline = 'Deadline cannot exceed 1 year';
    
    if (formData.sdg_goals.length === 0) errors.sdg_goals = 'Select at least one SDG goal';
    if (formData.sdg_goals.length > 5) errors.sdg_goals = 'Maximum 5 SDG goals';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create a campaign');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setCreating(true);

    const amount = parseFloat(formData.target_amount);
    let category: 'nano' | 'micro' | 'small';
    if (amount < 1000) category = 'nano';
    else if (amount < 10000) category = 'micro';
    else category = 'small';

    try {
      const insertData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_amount: amount,
        currency: formData.currency,
        sdg_goals: formData.sdg_goals,
        location: formData.location.trim(),
        category,
        deadline: formData.deadline,
        image_url: formData.image_url || '/placeholder.svg',
        created_by: user.id,
        change_maker_id: user.id,
      };
      if (formData.report_id) {
        insertData.report_id = formData.report_id;
      }
      const { error } = await supabase
        .from('fundraising_campaigns')
        .insert([insertData]);

      if (error) throw error;
      
      toast.success('Campaign created successfully! It will appear after verification.');
      setShowCreateDialog(false);
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '', target_amount: '', currency: 'USD',
      sdg_goals: [], location: '', category: 'nano', deadline: '', image_url: ''
    });
    setFormErrors({});
  };

  const handleSDGToggle = (sdgValue: number) => {
    setFormData(prev => ({
      ...prev,
      sdg_goals: prev.sdg_goals.includes(sdgValue)
        ? prev.sdg_goals.filter(g => g !== sdgValue)
        : prev.sdg_goals.length < 5
          ? [...prev.sdg_goals, sdgValue]
          : prev.sdg_goals
    }));
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || campaign.category === filterCategory;
    const matchesSDG = filterSDG === "all" || campaign.sdg_goals.includes(parseInt(filterSDG));
    
    return matchesSearch && matchesCategory && matchesSDG;
  });

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;
    }
  };

  const getProgressPercentage = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nano': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'micro': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'small': return 'bg-violet-500/10 text-violet-700 border-violet-500/20';
      default: return 'bg-muted text-muted-foreground';
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

  const handleShare = async (campaign: FundraisingCampaign) => {
    const url = `${window.location.origin}/fundraising?campaign=${campaign.id}`;
    const shareData = {
      title: campaign.title,
      text: `Support: ${campaign.title} - ${campaign.description.slice(0, 100)}...`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Campaign link copied to clipboard!");
      }
    } catch {
      await navigator.clipboard.writeText(url);
      toast.success("Campaign link copied to clipboard!");
    }
  };

  // Stats from real data
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised_amount, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const verifiedCampaigns = campaigns.filter(c => c.is_verified).length;
  const avgProgress = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + getProgressPercentage(c.raised_amount, c.target_amount), 0) / campaigns.length
    : 0;

  const getMinDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

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
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SDG Fundraising Platform</h1>
          <p className="text-muted-foreground mt-1">
            Transparent, accountable micro-philanthropy for sustainable development across Africa
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Start Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    maxLength={120}
                    required
                  />
                  {formErrors.title && <p className="text-sm text-destructive mt-1">{formErrors.title}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formData.title.length}/120</p>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description * (min 50 characters)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your project, its impact, how funds will be used, and the beneficiaries..."
                    rows={5}
                    required
                  />
                  {formErrors.description && <p className="text-sm text-destructive mt-1">{formErrors.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formData.description.length} characters</p>
                </div>

                <div>
                  <Label htmlFor="target_amount">Target Amount * (10–100,000)</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    min="10"
                    max="100000"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="5000"
                    required
                  />
                  {formErrors.target_amount && <p className="text-sm text-destructive mt-1">{formErrors.target_amount}</p>}
                  {formData.target_amount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Category: {parseFloat(formData.target_amount) < 1000 ? 'Nano Grant' : parseFloat(formData.target_amount) < 10000 ? 'Micro Grant' : 'Small Grant'}
                    </p>
                  )}
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
                      {CURRENCY_OPTIONS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
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
                  {formErrors.location && <p className="text-sm text-destructive mt-1">{formErrors.location}</p>}
                </div>

                <div>
                  <Label htmlFor="deadline">Campaign Deadline * (min 7 days)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    min={getMinDeadline()}
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                  {formErrors.deadline && <p className="text-sm text-destructive mt-1">{formErrors.deadline}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="image_url">Campaign Image URL (optional)</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>SDG Goals * (select 1–5)</Label>
                  {formErrors.sdg_goals && <p className="text-sm text-destructive mt-1">{formErrors.sdg_goals}</p>}
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
                <Button type="button" variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Platform Stats */}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search campaigns by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
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
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No campaigns found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {campaigns.length === 0 
                ? "Be the first to create a fundraising campaign!" 
                : "Try adjusting your search filters."}
            </p>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => {
            const daysLeft = getDaysLeft(campaign.deadline);
            const progress = getProgressPercentage(campaign.raised_amount, campaign.target_amount);
            const isExpired = daysLeft === 0 && campaign.status !== 'completed';
            
            return (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow animate-fade-in overflow-hidden">
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
                      onClick={() => handleDonate(campaign)}
                      disabled={isExpired}
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
                  </div>

                  <div className="text-xs text-muted-foreground">
                    By {campaign.change_maker_name} • {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            );
          })
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
