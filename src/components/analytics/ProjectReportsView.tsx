import * as React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, CheckCircle, ExternalLink } from "lucide-react";
import { sdgGoals, projectStatuses } from "@/lib/constants";
import { useReportsList, type ReportListItem } from "@/hooks/useReportsList";
import { downloadFile, reportsToCsv } from "@/lib/reportExport";
import GenerateReportDialog from "@/components/report/GenerateReportDialog";

type ProjectReportsViewProps = {
  selectedProjectId?: string | null;
};

const sdgLabel = new Map(sdgGoals.map((g) => [g.number, g.label]));
const statusLabel = new Map(projectStatuses.map((s) => [s.value, s.label]));

const ProjectReportsView: React.FC<ProjectReportsViewProps> = ({ selectedProjectId }) => {
  const { data: reports = [], isLoading, error } = useReportsList();
  const [selectedId, setSelectedId] = React.useState<string | null>(selectedProjectId ?? null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sdgFilter, setSdgFilter] = React.useState("all");
  const [isGenerateDialogOpen, setGenerateDialogOpen] = React.useState(false);

  const filteredReports = React.useMemo(
    () =>
      reports.filter(
        (r) =>
          (statusFilter === "all" || r.project_status === statusFilter) &&
          (sdgFilter === "all" || r.sdg_goal === Number(sdgFilter)),
      ),
    [reports, statusFilter, sdgFilter],
  );
  const selected: ReportListItem | undefined = reports.find((r) => r.id === selectedId);

  const handleExport = () =>
    downloadFile(reportsToCsv(filteredReports), `reports-${new Date().toISOString().split("T")[0]}.csv`, "text/csv");

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Reports</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {projectStatuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={sdgFilter} onValueChange={setSdgFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by SDG..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All SDGs</SelectItem>
                      {sdgGoals.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label.split(":")[0]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExport} variant="outline" size="sm" disabled={!filteredReports.length}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={() => setGenerateDialogOpen(true)} size="sm" disabled={!reports.length}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="text-sm text-destructive">Couldn't load reports. Refresh to try again.</p>
              ) : isLoading ? (
                <p className="text-sm text-muted-foreground">Loading reports…</p>
              ) : filteredReports.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports match these filters.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Title</TableHead>
                      <TableHead>SDG Goal</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Verifications</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow
                        key={report.id}
                        onClick={() => setSelectedId(report.id)}
                        className={`cursor-pointer hover:bg-muted/50 ${selectedId === report.id ? "bg-muted" : ""}`}
                      >
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{sdgLabel.get(report.sdg_goal) || "N/A"}</TableCell>
                        <TableCell>{report.location || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{statusLabel.get(report.project_status) || report.project_status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1">
                            {report.verification_count ?? 0}
                            {report.is_verified && <CheckCircle className="h-4 w-4 text-green-600" aria-label="Verified" />}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(report.submitted_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-6">{selected.description}</p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <dt className="text-muted-foreground">SDG</dt><dd>{sdgLabel.get(selected.sdg_goal) || "N/A"}</dd>
                  <dt className="text-muted-foreground">Status</dt><dd>{statusLabel.get(selected.project_status) || selected.project_status}</dd>
                  <dt className="text-muted-foreground">Location</dt><dd>{selected.location || "—"}</dd>
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd>{selected.cost ? `${selected.cost_currency || "USD"} ${selected.cost.toLocaleString()}` : "—"}</dd>
                  <dt className="text-muted-foreground">Verifications</dt><dd>{selected.verification_count ?? 0}{selected.is_verified ? " · verified" : ""}</dd>
                </dl>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/project/${selected.id}`}>
                    Open project, evidence and verification <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex h-full min-h-[400px] items-center justify-center">
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Select a report from the list to see details.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <GenerateReportDialog isOpen={isGenerateDialogOpen} onOpenChange={setGenerateDialogOpen} reports={reports} />
    </>
  );
};

export default ProjectReportsView;
