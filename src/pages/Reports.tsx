
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
import { mockReports } from "@/data/mockReports";
import { sdgGoals, projectStatuses, projectStatusColors } from "@/lib/constants";

const Reports = () => {
  const [statusFilter, setStatusFilter] = React.useState("all");

  const sdgGoalMap = React.useMemo(() => new Map(sdgGoals.map(g => [g.value, g.label])), []);
  const projectStatusMap = React.useMemo(() => new Map(projectStatuses.map(s => [s.value, s.label])), []);

  const filteredReports = React.useMemo(() => {
    if (statusFilter === "all") {
      return mockReports;
    }
    return mockReports.filter((report) => report.project_status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Reports</CardTitle>
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Title</TableHead>
                <TableHead>SDG Goal</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{sdgGoalMap.get(report.sdg_goal) || 'N/A'}</TableCell>
                  <TableCell>{report.location}</TableCell>
                  <TableCell>
                    <Badge className={projectStatusColors[report.project_status] || ''}>
                      {projectStatusMap.get(report.project_status) || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.submitted_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
