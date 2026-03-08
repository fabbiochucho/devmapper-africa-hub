import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, MapPin, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Campaign {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  currency: string;
  sdg_goals: number[];
  location: string;
  deadline: string;
  image_url?: string;
  change_maker_name?: string;
}

interface DonationDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDonationComplete: () => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export function DonationDialog({ campaign, open, onOpenChange, onDonationComplete }: DonationDialogProps) {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState<string>('25');
  const [email, setEmail] = useState<string>(profile?.email || '');
  const [name, setName] = useState<string>(profile?.full_name || '');
  const [message, setMessage] = useState<string>('');
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  if (!campaign) return null;

  const getProgressPercentage = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const getDaysLeft = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const handleDonate = async () => {
    const donationAmount = parseFloat(amount);
    
    if (!donationAmount || donationAmount < 1) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Create donation record
      const donationData: any = {
        campaign_id: campaign.id,
        amount: donationAmount,
        currency: campaign.currency,
        anonymous,
        message: message || null,
        status: 'pending'
      };

      if (user) {
        donationData.donor_id = user.id;
      }

      const { data: donation, error: donationError } = await supabase
        .from('campaign_donations')
        .insert([donationData])
        .select()
        .single();

      if (donationError) throw donationError;

      // Initialize Flutterwave payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: donationAmount,
          currency: campaign.currency,
          email,
          name: anonymous ? 'Anonymous Donor' : name,
          campaign_id: campaign.id,
          donation_id: donation.id,
          redirect_url: `${window.location.origin}/fundraising?donation=success`,
          payment_type: 'donation'
        }
      });

      if (paymentError) throw paymentError;

      if (paymentData?.payment_link) {
        // Redirect to payment page
        window.location.href = paymentData.payment_link;
      } else {
        throw new Error('Payment link not received');
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      toast.error(error.message || 'Failed to process donation');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Support this Campaign
          </DialogTitle>
          <DialogDescription>
            Your donation makes a real difference
          </DialogDescription>
        </DialogHeader>

        {/* Campaign Summary */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <img
              src={campaign.image_url || '/placeholder.svg'}
              alt={campaign.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2">{campaign.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{campaign.location}</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={getProgressPercentage(campaign.raised_amount, campaign.target_amount)} />
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-green-600">
                {formatCurrency(campaign.raised_amount, campaign.currency)} raised
              </span>
              <span className="text-muted-foreground">
                of {formatCurrency(campaign.target_amount, campaign.currency)}
              </span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {getDaysLeft(campaign.deadline)} days left
            </div>
          </div>

          {/* SDG Goals */}
          <div className="flex flex-wrap gap-1">
            {campaign.sdg_goals.map((sdg) => (
              <Badge key={sdg} variant="secondary" className="text-xs">
                SDG {sdg}
              </Badge>
            ))}
          </div>
        </div>

        {/* Donation Form */}
        <div className="space-y-4 mt-4 border-t pt-4">
          <div>
            <Label>Select Amount ({campaign.currency})</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === String(preset) ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setAmount(String(preset))}
                >
                  {formatCurrency(preset, campaign.currency)}
                </Button>
              ))}
            </div>
            <div className="mt-2">
              <Label htmlFor="custom-amount">Or enter custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {campaign.currency}
                </span>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-12"
                  placeholder="Enter amount"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="donor-name">Your Name</Label>
              <Input
                id="donor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                disabled={anonymous}
              />
            </div>

            <div>
              <Label htmlFor="donor-email">Email Address *</Label>
              <Input
                id="donor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Leave a message (optional)</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your words of encouragement..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={anonymous}
                onCheckedChange={(checked) => setAnonymous(checked as boolean)}
              />
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                Make this donation anonymous
              </Label>
            </div>
          </div>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            size="lg"
            onClick={handleDonate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Donate {formatCurrency(parseFloat(amount) || 0, campaign.currency)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Flutterwave. Your donation is tax-deductible.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
