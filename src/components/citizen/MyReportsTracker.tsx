import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, AlertTriangle, CheckCircle2, Clock, MessageSquare, ShieldCheck, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MyReport {
  id: string;
  title: string;
  description: string;
  sdg_goal: number;
  project_status: string;
  location: string;
  issue_type: string | null;
  issue_severity: string | null;
  escalation_status: string | null;
  submitted_at: string;
  verification_count: number;
  feedback_count: number;
}

const severityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-green-500', label: 'Low' },
  medium: { color: 'bg-yellow-500', label: 'Medium' },
  high: { color: 'bg-orange-500', label: 'High' },
  critical: { color: 'bg-red-500', label: 'Critical' },
};

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  planned: { variant: 'secondary', label: 'Planned' },
  in_progress: { variant: 'default', label: 'In Progress' },
  completed: { variant: 'outline', label: 'Completed' },
  stalled: { variant: 'destructive', label: 'Stalled' },
  idea: { variant: 'secondary', label: 'Idea' },
  verified: { variant: 'default', label: 'Verified' },
};

const escalationConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  none: { icon: <Clock className="h-3 w-3" />, label: 'Pending Review', color: 'text-muted-foreground' },
  acknowledged: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Acknowledged', color: 'text-blue-500' },
  under_investigation: { icon: <AlertTriangle className="h-3 w-3" />, label: 'Under Investigation', color: 'text-yellow-500' },
  resolved: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Resolved', color: 'text-green-500' },
  escalated: { icon: <AlertTriangle className="h-3 w-3" />, label: 'Escalated', color: 'text-red-500' },
};

export default function MyReportsTracker() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, title, description, sdg_goal, project_status, location,
          issue_type, issue_severity, escalation_status, submitted_at
        `)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        // Fetch verification and feedback counts
        const enrichedReports = await Promise.all(
          data.map(async (report) => {
            const [verifications, feedback] = await Promise.all([
              supabase.from('project_verifications').select('id', { count: 'exact' }).eq('report_id', report.id),
              supabase.from('citizen_project_feedback').select('id', { count: 'exact' }).eq('report_id', report.id),
            ]);
            return {
              ...report,
              verification_count: verifications.count || 0,
              feedback_count: feedback.count || 0,
            };
          })
        );
        setReports(enrichedReports as MyReport[]);
      }
      setLoading(false);
    };

    fetchReports();
  }, [user]);

  const issueReports = reports.filter(r => r.issue_type);
  const projectReports = reports.filter(r => !r.issue_type);

  const getEscalationProgress = (status: string | null) => {
    const stages = ['none', 'acknowledged', 'under_investigation', 'resolved'];
    const idx = stages.indexOf(status || 'none');
    return ((idx + 1) / stages.length) * 100;
  };

  const renderReportCard = (report: MyReport) => {
    const status = statusConfig[report.project_status] || statusConfig.planned;
    const severity = report.issue_severity ? severityConfig[report.issue_severity] : null;
    const escalation = escalationConfig[report.escalation_status || 'none'];

    return (
      <Card key={report.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{report.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">{report.description}</CardDescription>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">SDG {report.sdg_goal}</Badge>
            {report.location && <Badge variant="outline">{report.location}</Badge>}
            {report.issue_type && (
              <Badge variant="secondary">{report.issue_type}</Badge>
            )}
            {severity && (
              <Badge className={`${severity.color} text-white`}>{severity.label} Severity</Badge>
            )}
          </div>

          {/* Escalation Progress for Issue Reports */}
          {report.issue_type && (
            <div className="space-y-1">
              <div className={`flex items-center gap-1 text-xs ${escalation.color}`}>
                {escalation.icon}
                <span>{escalation.label}</span>
              </div>
              <Progress value={getEscalationProgress(report.escalation_status)} className="h-1.5" />
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {report.verification_count} verifications
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {report.feedback_count} feedback
            </span>
            <span className="ml-auto">
              {new Date(report.submitted_at).toLocaleDateString()}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate(`/project-management?project=${report.id}`)}
          >
            View Details <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading your reports...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Submitted Reports
        </CardTitle>
        <CardDescription>
          Track the status of reports you've submitted. View verifications and community feedback.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">You haven't submitted any reports yet.</p>
            <Button className="mt-4" onClick={() => navigate('/submit-report')}>
              Submit Your First Report
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({reports.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projectReports.length})</TabsTrigger>
              <TabsTrigger value="issues">Issues ({issueReports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {reports.map(renderReportCard)}
            </TabsContent>

            <TabsContent value="projects" className="space-y-3">
              {projectReports.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No project reports.</p>
              ) : (
                projectReports.map(renderReportCard)
              )}
            </TabsContent>

            <TabsContent value="issues" className="space-y-3">
              {issueReports.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No issue reports.</p>
              ) : (
                issueReports.map(renderReportCard)
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
