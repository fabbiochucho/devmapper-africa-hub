import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface ValidationResult {
  report_id: string;
  validation_score: number;
  status: 'pass' | 'needs_review' | 'fail';
  issues: ValidationIssue[];
  validated_at: string;
}

interface ReportValidatorProps {
  reportId: string;
}

export default function ReportValidator({ reportId }: ReportValidatorProps) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-report', {
        body: { report_id: reportId },
      });
      if (error) throw error;
      setResult(data);
      if (data.status === 'pass') toast.success('Report passed validation!');
      else if (data.status === 'needs_review') toast.warning('Report needs review');
      else toast.error('Report has validation errors');
    } catch (err: any) {
      toast.error(err.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const severityIcon = (s: string) => {
    if (s === 'error') return <XCircle className="h-4 w-4 text-destructive" />;
    if (s === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const statusColor = (status: string) => {
    if (status === 'pass') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status === 'needs_review') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> AI Validation
          </CardTitle>
          <Button size="sm" onClick={handleValidate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {loading ? 'Validating...' : 'Validate Report'}
          </Button>
        </div>
      </CardHeader>
      {result && (
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">{result.validation_score}/100</div>
            <Badge className={statusColor(result.status)}>{result.status.replace('_', ' ')}</Badge>
          </div>
          {result.issues.length > 0 && (
            <div className="space-y-2">
              {result.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {severityIcon(issue.severity)}
                  <div>
                    <span className="font-medium text-foreground">{issue.field}:</span>{' '}
                    <span className="text-muted-foreground">{issue.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
