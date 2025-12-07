import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileCheck,
  Clock,
  User,
  MessageSquare,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ESGDataVerificationProps {
  organizationId: string;
  indicatorId?: string;
  currentStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  onStatusChange?: (newStatus: string) => void;
}

interface VerificationCheck {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  details?: string;
}

export default function ESGDataVerification({
  organizationId,
  indicatorId,
  currentStatus,
  onStatusChange
}: ESGDataVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationChecks, setVerificationChecks] = useState<VerificationCheck[]>([]);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    if (indicatorId) {
      runVerificationChecks();
    }
  }, [indicatorId]);

  const runVerificationChecks = async () => {
    setLoading(true);
    
    try {
      // Fetch the indicator data
      const { data: indicator, error } = await supabase
        .from('esg_indicators')
        .select('*')
        .eq('id', indicatorId)
        .single();

      if (error) throw error;

      // Run automated checks
      const checks: VerificationCheck[] = [
        {
          id: 'data_completeness',
          label: 'Data Completeness',
          description: 'All required fields are populated',
          status: checkDataCompleteness(indicator),
          details: getCompletenessDetails(indicator)
        },
        {
          id: 'scope_breakdown',
          label: 'Scope Breakdown',
          description: 'Emissions are properly categorized by scope',
          status: checkScopeBreakdown(indicator),
          details: getScopeDetails(indicator)
        },
        {
          id: 'data_quality',
          label: 'Data Quality Rating',
          description: 'Data quality meets minimum standards',
          status: indicator.data_quality === 'verified' ? 'pass' : 
                  indicator.data_quality === 'reported' ? 'warning' : 'fail',
          details: `Current quality: ${indicator.data_quality || 'not specified'}`
        },
        {
          id: 'temporal_consistency',
          label: 'Temporal Consistency',
          description: 'Data falls within expected reporting period',
          status: checkTemporalConsistency(indicator),
          details: `Reporting year: ${indicator.reporting_year}`
        },
        {
          id: 'value_ranges',
          label: 'Value Range Validation',
          description: 'Values fall within reasonable ranges',
          status: checkValueRanges(indicator),
          details: getValueRangeDetails(indicator)
        }
      ];

      setVerificationChecks(checks);
      
      // Calculate overall score
      const passCount = checks.filter(c => c.status === 'pass').length;
      const warningCount = checks.filter(c => c.status === 'warning').length;
      const score = ((passCount + warningCount * 0.5) / checks.length) * 100;
      setOverallScore(Math.round(score));

    } catch (error) {
      console.error('Error running verification checks:', error);
      toast.error('Failed to run verification checks');
    } finally {
      setLoading(false);
    }
  };

  const checkDataCompleteness = (indicator: any): 'pass' | 'fail' | 'warning' => {
    const requiredFields = ['carbon_scope1_tonnes', 'carbon_scope2_tonnes', 'energy_consumption_kwh'];
    const optionalFields = ['carbon_scope3_tonnes', 'water_consumption_m3', 'waste_generated_tonnes'];
    
    const requiredComplete = requiredFields.every(f => indicator[f] !== null && indicator[f] !== undefined);
    const optionalComplete = optionalFields.filter(f => indicator[f] !== null && indicator[f] !== undefined).length;
    
    if (!requiredComplete) return 'fail';
    if (optionalComplete < optionalFields.length / 2) return 'warning';
    return 'pass';
  };

  const getCompletenessDetails = (indicator: any): string => {
    const fields = [
      'carbon_scope1_tonnes', 'carbon_scope2_tonnes', 'carbon_scope3_tonnes',
      'energy_consumption_kwh', 'water_consumption_m3', 'waste_generated_tonnes'
    ];
    const filled = fields.filter(f => indicator[f] !== null && indicator[f] !== undefined).length;
    return `${filled}/${fields.length} fields populated`;
  };

  const checkScopeBreakdown = (indicator: any): 'pass' | 'fail' | 'warning' => {
    const hasScope1 = indicator.carbon_scope1_tonnes !== null;
    const hasScope2 = indicator.carbon_scope2_tonnes !== null;
    const hasScope3 = indicator.carbon_scope3_tonnes !== null;
    
    if (hasScope1 && hasScope2 && hasScope3) return 'pass';
    if (hasScope1 && hasScope2) return 'warning';
    return 'fail';
  };

  const getScopeDetails = (indicator: any): string => {
    const scopes = [];
    if (indicator.carbon_scope1_tonnes !== null) scopes.push('Scope 1');
    if (indicator.carbon_scope2_tonnes !== null) scopes.push('Scope 2');
    if (indicator.carbon_scope3_tonnes !== null) scopes.push('Scope 3');
    return scopes.length > 0 ? `Includes: ${scopes.join(', ')}` : 'No scope data';
  };

  const checkTemporalConsistency = (indicator: any): 'pass' | 'fail' | 'warning' => {
    const currentYear = new Date().getFullYear();
    const reportingYear = indicator.reporting_year;
    
    if (reportingYear === currentYear || reportingYear === currentYear - 1) return 'pass';
    if (reportingYear >= currentYear - 2) return 'warning';
    return 'fail';
  };

  const checkValueRanges = (indicator: any): 'pass' | 'fail' | 'warning' => {
    // Basic sanity checks
    const checks = [
      indicator.renewable_energy_percentage === null || (indicator.renewable_energy_percentage >= 0 && indicator.renewable_energy_percentage <= 100),
      indicator.esg_score === null || (indicator.esg_score >= 0 && indicator.esg_score <= 100),
      indicator.carbon_scope1_tonnes === null || indicator.carbon_scope1_tonnes >= 0,
      indicator.carbon_scope2_tonnes === null || indicator.carbon_scope2_tonnes >= 0,
      indicator.carbon_scope3_tonnes === null || indicator.carbon_scope3_tonnes >= 0
    ];
    
    const failCount = checks.filter(c => !c).length;
    if (failCount === 0) return 'pass';
    if (failCount <= 1) return 'warning';
    return 'fail';
  };

  const getValueRangeDetails = (indicator: any): string => {
    const issues = [];
    if (indicator.renewable_energy_percentage !== null && (indicator.renewable_energy_percentage < 0 || indicator.renewable_energy_percentage > 100)) {
      issues.push('Renewable % out of range');
    }
    if (indicator.esg_score !== null && (indicator.esg_score < 0 || indicator.esg_score > 100)) {
      issues.push('ESG score out of range');
    }
    return issues.length > 0 ? issues.join(', ') : 'All values within expected ranges';
  };

  const submitForVerification = async () => {
    setSubmitting(true);
    
    try {
      // Update indicator status
      const { error: updateError } = await supabase
        .from('esg_indicators')
        .update({ verification_status: 'pending' })
        .eq('id', indicatorId);

      if (updateError) throw updateError;

      // Log the verification request
      await supabase.from('esg_audit_logs').insert({
        organization_id: organizationId,
        module: 'verification',
        action: 'verification_requested',
        row_id: indicatorId,
        metadata: {
          notes: verificationNotes,
          checks_passed: verificationChecks.filter(c => c.status === 'pass').length,
          overall_score: overallScore
        }
      });

      toast.success('Submitted for verification');
      onStatusChange?.('pending');
    } catch (error) {
      console.error('Error submitting for verification:', error);
      toast.error('Failed to submit for verification');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Unverified</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Data Verification
              </CardTitle>
              <CardDescription>
                Validate and verify your ESG data for audit-ready compliance
              </CardDescription>
            </div>
            {getStatusBadge(currentStatus)}
          </div>
        </CardHeader>
        <CardContent>
          {!indicatorId ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No ESG data available for verification. Please add indicators first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Data Quality Score</span>
                  <span className="text-2xl font-bold">{overallScore}%</span>
                </div>
                <Progress value={overallScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Based on automated validation checks
                </p>
              </div>

              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={runVerificationChecks} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Rerun Checks
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Checks */}
      {indicatorId && verificationChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Automated Checks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {verificationChecks.map(check => (
              <div
                key={check.id}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border
                  ${check.status === 'pass' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : ''}
                  ${check.status === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' : ''}
                  ${check.status === 'fail' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : ''}
                  ${check.status === 'pending' ? 'border-border bg-muted' : ''}
                `}
              >
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="font-medium text-sm">{check.label}</div>
                  <div className="text-xs text-muted-foreground">{check.description}</div>
                  {check.details && (
                    <div className="text-xs mt-1 font-mono">{check.details}</div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submit for Verification */}
      {indicatorId && currentStatus === 'unverified' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Request Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-notes">Additional Notes</Label>
              <Textarea
                id="verification-notes"
                placeholder="Provide any additional context or documentation references for the verifier..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                Verification requests are reviewed by platform administrators. 
                You'll be notified when the review is complete.
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Quality Score: {overallScore}%
                {overallScore < 60 && ' (Consider improving data quality before submission)'}
              </div>
              <Button 
                onClick={submitForVerification} 
                disabled={submitting || overallScore < 40}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Submit for Verification
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Status */}
      {currentStatus === 'pending' && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Your verification request is being reviewed. You'll be notified once the review is complete.
          </AlertDescription>
        </Alert>
      )}

      {/* Verified Status */}
      {currentStatus === 'verified' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Your ESG data has been verified and is audit-ready. Verification badges will appear on exported reports.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}