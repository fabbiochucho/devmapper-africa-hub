import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ManualSupplierEntryProps {
  organizationId: string;
  onSupplierAdded: () => void;
}

const sectors = [
  'Agriculture', 'Manufacturing', 'Energy', 'Mining', 'Construction',
  'Transport', 'Retail', 'Technology', 'Healthcare', 'Finance',
  'Education', 'Hospitality', 'Waste Management', 'Water', 'Other'
];

export function ManualSupplierEntry({ organizationId, onSupplierAdded }: ManualSupplierEntryProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sector: '',
    country_code: '',
    contact_email: '',
    annual_spend: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('esg_suppliers').insert([{
        organization_id: organizationId,
        name: form.name.trim(),
        sector: form.sector || null,
        country_code: form.country_code || null,
        contact_email: form.contact_email || null,
        annual_spend: form.annual_spend ? parseFloat(form.annual_spend) : null,
        data_source: 'manual',
      }]);

      if (error) throw error;

      toast.success('Supplier added successfully');
      setForm({ name: '', sector: '', country_code: '', contact_email: '', annual_spend: '' });
      setOpen(false);
      onSupplierAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Supplier Manually</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Supplier Name *</Label>
            <Input
              id="supplier-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country Code</Label>
              <Input
                id="country"
                value={form.country_code}
                onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })}
                placeholder="e.g. NG"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="supplier@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spend">Annual Spend (USD)</Label>
              <Input
                id="spend"
                type="number"
                value={form.annual_spend}
                onChange={(e) => setForm({ ...form, annual_spend: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Supplier'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
