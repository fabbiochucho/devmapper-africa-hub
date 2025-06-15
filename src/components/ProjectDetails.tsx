
import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Report } from "@/data/mockReports";
import { sdgGoals, projectStatuses, projectStatusColors } from "@/lib/constants";
import { X } from "lucide-react";

interface ProjectDetailsProps {
  report: Report;
  onClose: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ report, onClose }) => {
  const sdgGoal = sdgGoals.find(g => g.value === report.sdg_goal);
  const status = projectStatuses.find(s => s.value === report.project_status);
  const statusColor = projectStatusColors[report.project_status] || "bg-gray-100 text-gray-800";

  return (
    <Card className="mt-4 relative animate-in fade-in-0 zoom-in-95">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{report.title}</CardTitle>
            <CardDescription>{report.location}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <p>{new Date(report.submitted_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetails;
