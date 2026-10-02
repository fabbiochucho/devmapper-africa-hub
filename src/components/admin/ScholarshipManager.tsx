import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { errorMessageOf } from '@/lib/error-handler';

interface ScholarshipApplication {
  id: string;
  user_id: string;
  org_id: string | null;
  organization_name: string | null;
  role: string | null;
  country: string | null;
  use_case: string | null;
  requested_plan: string;
  duration_months: number;
  justification: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export function ScholarshipManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('scholarships')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching scholarships:', error);
      toast.error(t('admin.scholarships.loadError'));
    } else {
      setApplications(data as ScholarshipApplication[]);
    }
    setLoading(false);
  }, [filter, t]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications, filter]);

  const handleApprove = async (app: ScholarshipApplication) => {
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (app.duration_months || 6));

      // Update scholarship status
      const { error: scholarshipError } = await supabase
        .from('scholarships')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString().split('T')[0],
        })
        .eq('id', app.id);

      if (scholarshipError) throw scholarshipError;

      // If user has an org, update the scholarship override
      if (app.org_id) {
        await supabase
          .from('organizations')
          .update({
            scholarship_override: app.requested_plan,
            project_cap: app.requested_plan === 'advanced' ? 150 : 40,
            monthly_addition: app.requested_plan === 'advanced' ? 15 : 5,
            rollover_allowed: true,
          })
          .eq('id', app.org_id);
      }

      toast.success(t('admin.scholarships.approveSuccess'));
      fetchApplications();
    } catch (error: unknown) {
      toast.error(errorMessageOf(error) || t('admin.scholarships.approveError'));
    }
  };

  const handleDeny = async (appId: string) => {
    const { error } = await supabase
      .from('scholarships')
      .update({ status: 'denied' })
      .eq('id', appId);

    if (error) {
      toast.error(t('admin.scholarships.denyError'));
    } else {
      toast.success(t('admin.scholarships.denySuccess'));
      fetchApplications();
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t('admin.scholarships.statusApproved')}</Badge>;
      case 'denied': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t('admin.scholarships.statusDenied')}</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t('admin.scholarships.statusPending')}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          {t('admin.scholarships.title')}
        </CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">{t('admin.scholarships.filterPending')}</SelectItem>
            <SelectItem value="approved">{t('admin.scholarships.filterApproved')}</SelectItem>
            <SelectItem value="denied">{t('admin.scholarships.filterDenied')}</SelectItem>
            <SelectItem value="all">{t('admin.scholarships.filterAll')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">{t('admin.scholarships.loading')}</p>
        ) : applications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t('admin.scholarships.noApplicationsFound')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.scholarships.columnOrganization')}</TableHead>
                  <TableHead>{t('admin.scholarships.columnRole')}</TableHead>
                  <TableHead>{t('admin.scholarships.columnCountry')}</TableHead>
                  <TableHead>{t('admin.scholarships.columnPlan')}</TableHead>
                  <TableHead>{t('admin.scholarships.columnDuration')}</TableHead>
                  <TableHead>{t('admin.scholarships.columnStatus')}</TableHead>
                  <TableHead>{t('admin.scholarships.columnActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.organization_name || '—'}</TableCell>
                    <TableCell>{app.role || '—'}</TableCell>
                    <TableCell>{app.country || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.requested_plan}</Badge>
                    </TableCell>
                    <TableCell>{t('admin.scholarships.durationMonths', { count: app.duration_months })}</TableCell>
                    <TableCell>{statusBadge(app.status)}</TableCell>
                    <TableCell>
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(app)}>{t('admin.scholarships.approveButton')}</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeny(app.id)}>{t('admin.scholarships.denyButton')}</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
