import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DonationDialog } from "@/components/donation/DonationDialog";
import { CreateCampaignDialog } from "@/components/fundraising/CreateCampaignDialog";
import { FundraisingStats } from "@/components/fundraising/FundraisingStats";
import { FundraisingFilters } from "@/components/fundraising/FundraisingFilters";
import { CampaignCard, type FundraisingCampaign } from "@/components/fundraising/CampaignCard";
import { getProgressPercentage } from "@/lib/fundraisingUtils";
import { Heart } from "lucide-react";

const Fundraising = () => {
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
  const [initialSdgGoals, setInitialSdgGoals] = useState<number[]>([]);

  useEffect(() => {
    // Data refresh is handled by the [filterStatus] effect below (which also
    // fires on mount); this effect only handles the toast + deep-link, so it
    // doesn't need to refetch on every unrelated searchParams change.
    // Flutterwave appends its own `status` param to our redirect_url on top
    // of the `donation=success` marker we set ourselves - checking only our
    // own marker (as before) would show a success toast even for a
    // cancelled/failed checkout, since we set that marker before knowing
    // the real outcome.
    const donationStatus = searchParams.get('donation');
    const gatewayStatus = searchParams.get('status');
    if (donationStatus === 'success') {
      if (gatewayStatus === 'cancelled' || gatewayStatus === 'failed') {
        toast.error('Your donation was not completed.', { description: 'No charge was made. Feel free to try again.' });
      } else {
        toast.success('Thank you for your donation! Your contribution will make a real impact.');
      }
    }

    // Deep-link: open create dialog + prefill SDGs
    if (searchParams.get('create') === '1') {
      const sdgs = (searchParams.get('sdgs') || '')
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => Number.isFinite(n) && n >= 1 && n <= 17)
        .slice(0, 5);

      if (sdgs.length > 0) {
        setInitialSdgGoals(sdgs);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || campaign.category === filterCategory;
    const matchesSDG = filterSDG === "all" || campaign.sdg_goals.includes(parseInt(filterSDG));

    return matchesSearch && matchesCategory && matchesSDG;
  });

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
        <CreateCampaignDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreated={fetchCampaigns}
          initialSdgGoals={initialSdgGoals}
        />
      </div>

      <FundraisingStats
        totalRaised={totalRaised}
        activeCampaigns={activeCampaigns}
        verifiedCampaigns={verifiedCampaigns}
        avgProgress={avgProgress}
      />

      <FundraisingFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        filterSDG={filterSDG}
        onFilterSDGChange={setFilterSDG}
      />

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
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDonate={handleDonate}
              onShare={handleShare}
            />
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
