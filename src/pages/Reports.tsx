import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { mockReports, Report } from "@/data/mockReports";
import { sdgGoals, projectStatuses, projectStatusColors } from "@/lib/constants";
import { Download, Star, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import GenerateReportDialog from "@/components/report/GenerateReportDialog";
import ProjectDetails from "@/components/ProjectDetails";

const Reports = () => {
  const [reports, setReports] = React.useState<Report[]>(mockReports);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sdgFilter, setSdgFilter] = React.useState("all");
  const [isGenerateDialogOpen, setGenerateDialogOpen] = React.useState(false);

  const sdgGoalMap = React.useMemo(() => new Map(sdgGoals.map(g => [g.value, g.label])), []);
  const projectStatusMap = React.useMemo(() => new Map(projectStatuses.map(s => [s.value, s.label])), []);

  const filteredReports = React.useMemo(() => {
    let filtered = [...reports].sort((a, b) => b.validations - a.validations);

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.project_status === statusFilter);
    }

    if (sdgFilter !== "all") {
      filtered = filtered.filter((report) => report.sdg_goal === sdgFilter);
    }
    
    return filtered;
  }, [statusFilter, sdgFilter, reports]);

  const handleUpdateReport = (updatedReport: Report) => {
    const newReports = reports.map(r => r.id === updatedReport.id ? updatedReport : r);
    setReports(newReports);
    if (selectedReport && selectedReport.id === updatedReport.id) {
        setSelectedReport(updatedReport);
    }
  };
  
  const handleExport = () => {
    const headers = [
      "Project ID",
      "Title",
      "SDG Goal",
      "Location",
      "Status",
      "Validations",
      "Submitted Date",
    ];

    const csvRows = [
      headers.join(","),
      ...filteredReports.map((report) =>
        [
          report.id,
          `"${report.title.replace(/"/g, '""')}"`,
          `"${sdgGoalMap.get(report.sdg_goal) || "N/A"}"`,
          `"${report.location.replace(/"/g, '""')}"`,
          `"${projectStatusMap.get(report.project_status) || "N/A"}"`,
          report.validations,
          report.submitted_at,
        ].join(",")
      ),
    ];

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reports-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Reports</CardTitle>
                <div className="flex items-center gap-2">
                    <div className="w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {projectStatuses.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="w-48">
                      <Select value={sdgFilter} onValueChange={setSdgFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by SDG..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All SDGs</SelectItem>
                          {sdgGoals.map((goal) => (
                            <SelectItem key={goal.value} value={goal.value}>
                              {goal.label.split(':')[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                    </Button>
                    <Button onClick={() => setGenerateDialogOpen(true)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Generate Report
                    </Button>
                </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Project Title</TableHead>
                        <TableHead>SDG Goal</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Validations</TableHead>
                        <TableHead>Submitted</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredReports.map((report) => (
                        <TableRow key={report.id} onClick={() => setSelectedReport(report)} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{sdgGoalMap.get(report.sdg_goal) || 'N/A'}</TableCell>
                        <TableCell>{report.location}</TableCell>
                        <TableCell>
                            <Badge className={projectStatusColors[report.project_status] || ''}>
                            {projectStatusMap.get(report.project_status) || 'N/A'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                            <span>{report.validations}</span>
                            {report.validations > 10 && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                            </div>
                        </TableCell>
                        <TableCell>{report.submitted_at}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-3">
          {selectedReport ? (
            <ProjectDetails 
              report={selectedReport} 
              onClose={() => setSelectedReport(null)}
              onUpdate={handleUpdateReport}
            />
          ) : (
            <Card className="flex h-full min-h-[400px] items-center justify-center">
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Select a report from the list to see details.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <GenerateReportDialog isOpen={isGenerateDialogOpen} onOpenChange={setGenerateDialogOpen} />
    </div>
  );
};

export default Reports;
