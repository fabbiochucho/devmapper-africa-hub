import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Report, Verification } from "@/data/mockReports";
import { sdgGoals, projectStatuses, projectStatusColors } from "@/lib/constants";
import { X, Star, BadgeCheck, Pencil, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import UpdateProgressDialog from "@/components/report/UpdateProgressDialog";
import { Progress } from "@/components/ui/progress";
import CommentsSection from "./comments/CommentsSection";
import { useUserRole } from "@/contexts/UserRoleContext";

interface ProjectDetailsProps {
  report: Report;
  onClose: () => void;
  onUpdate: (updatedReport: Report) => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ report, onClose, onUpdate }) => {
  const [currentReport, setCurrentReport] = useState<Report>(report);
  const [isUpdateProgressOpen, setUpdateProgressOpen] = useState(false);
  const { user } = useUserRole();

  useEffect(() => {
    setCurrentReport(report);
  }, [report]);

  const hasVerified = useMemo(() => 
    currentReport.verifications?.some(v => v.userId === user.id) || false,
    [currentReport.verifications, user.id]
  );

  const handleVerification = (action: 'confirm' | 'dispute') => {
    if (hasVerified) {
      toast.info("You have already verified this project.");
      return;
    }

    const newVerification: Verification = {
      id: (currentReport.verifications?.length || 0) + 1,
      userId: user.id,
      userName: user.name,
      action: action,
      createdAt: new Date().toISOString(),
    };

    const updatedVerifications = [...(currentReport.verifications || []), newVerification];

    const confirmations = updatedVerifications.filter(v => v.action === 'confirm').length;
    const disputes = updatedVerifications.filter(v => v.action === 'dispute').length;
    const total = confirmations + disputes;
    const verificationScore = total > 0 ? Math.round((confirmations / total) * 100) : 0;

    let newStatus = currentReport.project_status;
    if (verificationScore >= 80 && confirmations >= 3) {
      newStatus = "completed"; // "confirmed" status mapped to "completed"
    } else if (verificationScore <= 20 && disputes >= 3) {
      newStatus = "stalled"; // "invalid" status mapped to "stalled"
    }

    const updatedReport: Report = {
      ...currentReport,
      verifications: updatedVerifications,
      verification_score: verificationScore,
      validations: updatedVerifications.length, // Keep validations in sync
      project_status: newStatus,
    };
    
    onUpdate(updatedReport);
    toast.success(`Project ${action === 'confirm' ? 'confirmed' : 'disputed'} successfully!`);
  };

  const sdgGoal = sdgGoals.find(g => g.value === currentReport.sdg_goal);
  const status = projectStatuses.find(s => s.value === currentReport.project_status);
  const statusColor = projectStatusColors[currentReport.project_status] || "bg-gray-100 text-gray-800";

  const progressPercentage = (currentReport.targetValue && currentReport.currentValue) 
    ? (currentReport.currentValue / currentReport.targetValue) * 100 
    : 0;

  return (
    <>
      <Card className="relative animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentReport.title}
                {currentReport.validations > 10 && (
                  <Badge variant="secondary" className="border-yellow-400 text-yellow-600 bg-yellow-50">
                    <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-500" />
                    Highly Validated
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{currentReport.location}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentReport.description && (
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{currentReport.description}</p>
            </div>
          )}
          <div>
            <h4 className="font-semibold mb-2">Project Verification</h4>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <BadgeCheck className="h-6 w-6 text-green-500" />
                <div>
                  <div className="font-bold text-lg">{currentReport.verifications?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">verifications</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-200" />
                 <div>
                  <div className="font-bold text-lg">{currentReport.verification_score ?? 'N/A'}{currentReport.verification_score !== undefined ? '%' : ''}</div>
                  <div className="text-xs text-muted-foreground">score</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <Button onClick={() => handleVerification('confirm')} disabled={hasVerified} size="sm">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Confirm
              </Button>
              <Button onClick={() => handleVerification('dispute')} disabled={hasVerified} variant="destructive" size="sm">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Dispute
              </Button>
            </div>
            {hasVerified && <p className="text-sm text-muted-foreground mt-2">You have already verified this project.</p>}
          </div>
          {currentReport.targetValue && (
            <div>
              <h4 className="font-semibold mb-2">Project Progress</h4>
              <div className="space-y-2">
                <Progress value={progressPercentage} className="w-full" />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{currentReport.currentValue || 0} / {currentReport.targetValue} {currentReport.targetUnit}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                </div>
              </div>
              <Button onClick={() => setUpdateProgressOpen(true)} size="sm" variant="outline" className="mt-2">
                <Pencil className="mr-2 h-4 w-4" />
                Update Progress
              </Button>
            </div>
          )}
          <div>
            <h4 className="font-semibold mb-2">SDG Goal</h4>
            <p>{sdgGoal ? sdgGoal.label : "N/A"}</p>
            {currentReport.sdg_target && (
              <p className="text-sm text-muted-foreground mt-1">Target: {currentReport.sdg_target}</p>
            )}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Project Status</h4>
            <Badge className={statusColor}>{status ? status.label : "N/A"}</Badge>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Submitted On</h4>
            <p>{new Date(currentReport.submitted_at).toLocaleDateString()}</p>
          </div>
          <CommentsSection projectId={currentReport.id} />
        </CardContent>
      </Card>
      {isUpdateProgressOpen && (
        <UpdateProgressDialog 
          isOpen={isUpdateProgressOpen}
          onOpenChange={setUpdateProgressOpen}
          report={currentReport}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default ProjectDetails;
