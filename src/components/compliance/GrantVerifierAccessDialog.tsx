import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createDataShare, ORG_SHARE_SCOPES, type OrgShareScope } from '@/lib/org-data-shares';

interface VerifierOption {
  id: string;
  user_id: string;
  display_name: string;
}

interface GrantVerifierAccessDialogProps {
  organizationId: string;
  onGranted?: () => void;
}

const DEFAULT_EXPIRY_DAYS = 30;

export function GrantVerifierAccessDialog({ organizationId, onGranted }: GrantVerifierAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifiers, setVerifiers] = useState<VerifierOption[]>([]);
  const [selectedVerifierId, setSelectedVerifierId] = useState('');
  const [scope, setScope] = useState<OrgShareScope[]>([]);
  const [purpose, setPurpose] = useState('');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_EXPIRY_DAYS);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!open) return;
    supabase
      .from('verifier_profiles')
      .select('id, user_id, display_name')
      .eq('availability_status', 'available')
      .then(({ data }) => setVerifiers(data ?? []));
  }, [open]);

  const toggleScope = (value: OrgShareScope) => {
    setScope((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
  };

  const handleSubmit = async () => {
    if (!selectedVerifierId) {
      toast.error('Select a verifier');
      return;
    }
    if (scope.length === 0) {
      toast.error('Select at least one data scope');
      return;
    }

    const verifier = verifiers.find((v) => v.id === selectedVerifierId);
    if (!verifier) return;

    setLoading(true);
    try {
      await createDataShare({
        grantorOrgId: organizationId,
        granteeUserId: verifier.user_id,
        scope,
        purpose: purpose.trim() || undefined,
        expiresAt: new Date(expiryDate).toISOString(),
      });
      toast.success(`Access granted to ${verifier.display_name}`);
      setOpen(false);
      setSelectedVerifierId('');
      setScope([]);
      setPurpose('');
      onGranted?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck className="w-4 h-4 mr-2" />
          Grant Verifier Access
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant Verifier Audit Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Verifier</Label>
            <Select value={selectedVerifierId} onValueChange={setSelectedVerifierId}>
              <SelectTrigger><SelectValue placeholder="Select a verifier" /></SelectTrigger>
              <SelectContent>
                {verifiers.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data scope</Label>
            {ORG_SHARE_SCOPES.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <Checkbox
                  id={`scope-${s}`}
                  checked={scope.includes(s)}
                  onCheckedChange={() => toggleScope(s)}
                />
                <label htmlFor={`scope-${s}`} className="text-sm">{s}</label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Access expires</Label>
            <Input id="expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Engagement purpose (optional)</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Annual ESG audit engagement"
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Granting…' : 'Grant Access'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
