import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plug, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';

interface ErpConnection {
  id: string;
  organization_id: string;
  provider: string;
  base_url: string;
  sync_status: string;
  last_synced_at: string | null;
  last_error: string | null;
}

export default function ErpIntegrations() {
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [connections, setConnections] = useState<ErpConnection[]>([]);
  const [provider, setProvider] = useState<'odoo' | 'sap'>('odoo');
  const [baseUrl, setBaseUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadConnections = async (orgId: string) => {
    const { data } = await supabase.from('erp_connections').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
    setConnections(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from('organizations').select('id').eq('created_by', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setOrganizationId(data.id);
          loadConnections(data.id);
        }
      });
  }, [user]);

  const handleCreate = async () => {
    if (!organizationId || !baseUrl.trim()) {
      toast.error('Enter a base URL');
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from('erp_connections').insert([{
        organization_id: organizationId,
        provider,
        base_url: baseUrl.trim(),
        created_by: user!.id,
      }]);
      if (error) throw error;
      toast.success('Connection created');
      setBaseUrl('');
      await loadConnections(organizationId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create connection');
    } finally {
      setCreating(false);
    }
  };

  const handleSync = async (connection: ErpConnection) => {
    if (connection.provider !== 'odoo') {
      toast.info('SAP sync is coming soon');
      return;
    }
    setSyncingId(connection.id);
    try {
      const { data, error } = await supabase.functions.invoke('erp-odoo-connector', {
        body: { connectionId: connection.id },
      });
      if (error) throw error;
      toast.success(`Synced ${data?.processed ?? 0} line items (${data?.matched ?? 0} matched to emission factors)`);
      if (organizationId) await loadConnections(organizationId);
    } catch (error: any) {
      toast.error(error.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const variant = status === 'connected' ? 'default' : status === 'error' ? 'destructive' : status === 'syncing' ? 'secondary' : 'outline';
    return <Badge variant={variant as any}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title="ERP Integrations - DevMapper" description="Connect Odoo or SAP to automatically estimate Scope 3 emissions from invoice data." />
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Plug className="h-7 w-7 text-primary" />
          ERP Integrations
        </h1>
        <p className="text-muted-foreground mt-1">Connect your ERP to estimate Scope 3 emissions from purchasing data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Connection</CardTitle>
          <CardDescription>Odoo sync is implemented; SAP is coming soon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={provider} onValueChange={(v) => setProvider(v as 'odoo' | 'sap')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="odoo">Odoo</SelectItem>
                <SelectItem value="sap">SAP (coming soon)</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Base URL (e.g. https://yourcompany.odoo.com)" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          {provider === 'odoo' && (
            <p className="text-xs text-muted-foreground">
              After creating the connection, set an <code>ERP_ODOO_&lt;id&gt;</code>-style Supabase secret containing
              <code>{'{"db":"...","username":"...","apiKey":"..."}'}</code> and reference its name from the connection record before syncing.
            </p>
          )}
          <Button onClick={handleCreate} disabled={creating || !organizationId}>
            {creating ? 'Creating…' : 'Add Connection'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {connections.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.provider.toUpperCase()} — {c.base_url}</p>
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge(c.sync_status)}
                  {c.last_synced_at && <span className="text-xs text-muted-foreground">Last synced {new Date(c.last_synced_at).toLocaleString()}</span>}
                </div>
                {c.last_error && <p className="text-xs text-destructive mt-1">{c.last_error}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => handleSync(c)} disabled={syncingId === c.id}>
                <RefreshCw className={`h-3 w-3 mr-1 ${syncingId === c.id ? 'animate-spin' : ''}`} />
                {syncingId === c.id ? 'Syncing…' : 'Sync Now'}
              </Button>
            </CardContent>
          </Card>
        ))}
        {connections.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No ERP connections yet</p>
        )}
      </div>
    </div>
  );
}
