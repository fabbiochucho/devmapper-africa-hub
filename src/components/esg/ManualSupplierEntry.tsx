import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { errorMessageOf } from '@/lib/error-handler';

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
  const { t } = useTranslation();
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
      toast.error(t('esg.manualSupplierEntry.nameRequiredError'));
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

      toast.success(t('esg.manualSupplierEntry.addSuccess'));
      setForm({ name: '', sector: '', country_code: '', contact_email: '', annual_spend: '' });
      setOpen(false);
      onSupplierAdded();
    } catch (error: unknown) {
      toast.error(errorMessageOf(error) || t('esg.manualSupplierEntry.addFailedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {t('esg.manualSupplierEntry.addSupplierButton')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('esg.manualSupplierEntry.dialogTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">{t('esg.manualSupplierEntry.supplierNameLabel')}</Label>
            <Input
              id="supplier-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('esg.manualSupplierEntry.supplierNamePlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('esg.manualSupplierEntry.sectorLabel')}</Label>
              <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                <SelectTrigger><SelectValue placeholder={t('esg.manualSupplierEntry.sectorSelectPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('esg.manualSupplierEntry.countryCodeLabel')}</Label>
              <Input
                id="country"
                value={form.country_code}
                onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })}
                placeholder={t('esg.manualSupplierEntry.countryCodePlaceholder')}
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('esg.manualSupplierEntry.contactEmailLabel')}</Label>
              <Input
                id="email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="supplier@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spend">{t('esg.manualSupplierEntry.annualSpendLabel')}</Label>
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
            {loading ? t('esg.manualSupplierEntry.addingButton') : t('esg.manualSupplierEntry.addSupplierButton')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
