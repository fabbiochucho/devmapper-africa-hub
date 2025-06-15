
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Report } from "@/data/mockReports";
import { sdgGoals, projectStatuses, projectStatusColors } from "@/lib/constants";
import { X, Star, BadgeCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import UpdateProgressDialog from "@/components/report/UpdateProgressDialog";
import { Progress } from "@/components/ui/progress";

interface ProjectDetailsProps {
  report: Report;
  onClose: () => void;
  onUpdate: (updatedReport: Report) => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ report, onClose, onUpdate }) => {
  const [currentReport, setCurrentReport] = useState<Report>(report);
  const [isValidated, setIsValidated] = useState(false);
  const [isUpdateProgressOpen, setUpdateProgressOpen] = useState(false);

  useEffect(() => {
    setCurrentReport(report);
    setIsValidated(false); // Reset validation status when a new report is selected
  }, [report]);

  const handleValidate = () => {
    if (!isValidated) {
      setCurrentReport(prev => ({ ...prev, validations: (prev.validations || 0) + 1 }));
      setIsValidated(true);
      toast.success("Project Validated!", {
        description: `Thank you for validating "${currentReport.title}".`,
      });
    }
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
          <div>
            <h4 className="font-semibold mb-2">Citizen Validations</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <BadgeCheck className="h-5 w-5 mr-2 text-green-500" />
                <span className="font-bold text-lg">{currentReport.validations}</span>
                <span className="ml-1.5 text-muted-foreground">validations</span>
              </div>
              <Button onClick={handleValidate} disabled={isValidated}>
                {isValidated ? "Validated" : "Validate Project"}
              </Button>
            </div>
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
          </div>
          <div>
            <h4 className="font-semibold mb-2">Project Status</h4>
            <Badge className={statusColor}>{status ? status.label : "N/A"}</Badge>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Submitted On</h4>
            <p>{new Date(currentReport.submitted_at).toLocaleDateString()}</p>
          </div>
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
