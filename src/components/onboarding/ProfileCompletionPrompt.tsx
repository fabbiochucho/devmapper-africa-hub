import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { africanCountries } from '@/data/countries';
import { toast } from 'sonner';

const ProfileCompletionPrompt = () => {
  const { user, profile, updateProfile } = useAuth();
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [country, setCountry] = useState(profile?.country || '');
  const [organization, setOrganization] = useState(profile?.organization || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  // Don't show if profile is already complete or dismissed
  const isComplete = profile?.country && profile?.organization;
  const dismissed = typeof window !== 'undefined' && localStorage.getItem('devmapper_profile_prompt_dismissed');

  if (!user || !profile || isComplete || dismissed) return null;

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, string> = {};
    if (country) updates.country = country;
    if (organization) updates.organization = organization;
    if (bio) updates.bio = bio;
    if (phone) updates.phone = phone;

    const { error } = await updateProfile(updates);
    setSaving(false);

    if (!error) {
      toast.success('Profile updated!');
      setOpen(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('devmapper_profile_prompt_dismissed', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Help us personalize your experience. This takes less than a minute.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {africanCountries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Your company, NGO, or institution"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What do you work on? (optional)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>Skip for now</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionPrompt;
