import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SDG_OPTIONS, CURRENCY_OPTIONS } from "@/data/fundraisingOptions";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  initialSdgGoals?: number[];
}

const emptyFormData = {
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
};

const getMinDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export const CreateCampaignDialog = ({ open, onOpenChange, onCreated, initialSdgGoals }: CreateCampaignDialogProps) => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [userReports, setUserReports] = useState<{ id: string; title: string }[]>([]);
  const [formData, setFormData] = useState(emptyFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      supabase.from('reports').select('id, title').eq('user_id', user.id).order('submitted_at', { ascending: false }).then(({ data }) => {
        if (data) setUserReports(data);
      });
    }
  }, [user]);

  useEffect(() => {
    // Re-applies on every reopen (not just the first time initialSdgGoals is
    // set) so a Cancel + reopen still honors the SDGs carried in the URL.
    if (open && initialSdgGoals && initialSdgGoals.length > 0) {
      setFormData(prev => ({ ...prev, sdg_goals: initialSdgGoals }));
    }
  }, [initialSdgGoals, open]);

  const resetForm = () => {
    setFormData(emptyFormData);
    setFormErrors({});
  };

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

    // Compare as UTC-day strings (not Date objects) so the check matches
    // exactly what the date picker's min/max allow, regardless of the
    // browser's local timezone or time-of-day.
    if (formData.deadline < getMinDeadline()) errors.deadline = 'Deadline must be at least 7 days from now';

    const maxDeadline = new Date();
    maxDeadline.setFullYear(maxDeadline.getFullYear() + 1);
    const maxDeadlineStr = maxDeadline.toISOString().split('T')[0];
    if (formData.deadline > maxDeadlineStr) errors.deadline = 'Deadline cannot exceed 1 year';

    if (formData.sdg_goals.length === 0) errors.sdg_goals = 'Select at least one SDG goal';
    if (formData.sdg_goals.length > 5) errors.sdg_goals = 'Maximum 5 SDG goals';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
      onOpenChange(false);
      resetForm();
      onCreated();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) resetForm(); }}>
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

            {userReports.length > 0 && (
              <div className="md:col-span-2">
                <Label>Link to Project (optional)</Label>
                <Select value={formData.report_id || "none"} onValueChange={(v) => setFormData({ ...formData, report_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Select a project to link" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked project</SelectItem>
                    {userReports.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Link this campaign to one of your projects for transparency</p>
              </div>
            )}

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
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
