
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Eye, Download, MapPin, Calendar, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Report = Database['public']['Tables']['reports']['Row'];
type ChangeMaker = Database['public']['Tables']['change_makers']['Row'];

interface ChangeMakerReportsViewProps {
  selectedChangeMakerId?: string | null;
}

// Real reports submitted by change makers, joined via change_makers.user_id --
// there is no "type" column on change_makers (that was mock-only), so the
// type filter/badge from the old mock-driven table is dropped rather than
// faked.
const ChangeMakerReportsView: React.FC<ChangeMakerReportsViewProps> = ({ selectedChangeMakerId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [changeMakerTitles, setChangeMakerTitles] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVerification, setFilterVerification] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);

      if (selectedChangeMakerId) {
        const { data: cm } = await supabase
          .from('change_makers')
          .select('*')
          .eq('id', selectedChangeMakerId)
          .maybeSingle<ChangeMaker>();

        if (cm?.user_id) {
          const { data: reportsData } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', cm.user_id);
          setReports(reportsData || []);
          setChangeMakerTitles({ [cm.user_id]: cm.title });
        } else {
          setReports([]);
          setChangeMakerTitles({});
        }
      } else {
        const { data: cms } = await supabase.from('change_makers').select('*');
        const list = cms || [];
        const userIds = list.map(cm => cm.user_id).filter((id): id is string => !!id);
        const titles: Record<string, string> = {};
        list.forEach(cm => { if (cm.user_id) titles[cm.user_id] = cm.title; });
        setChangeMakerTitles(titles);

        if (userIds.length > 0) {
          const { data: reportsData } = await supabase
            .from('reports')
            .select('*')
            .in('user_id', userIds);
          setReports(reportsData || []);
        } else {
          setReports([]);
        }
      }

      setLoading(false);
    })();
  }, [selectedChangeMakerId]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerification = filterVerification === "all" ||
                               (filterVerification === "verified" && report.is_verified) ||
                               (filterVerification === "unverified" && !report.is_verified);

    return matchesSearch && matchesVerification;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewDetails = (report: Report) => {
    navigate(`/project/${report.id}`);
  };

  const handleExportReport = (report: Report) => {
    const reportData = {
      ...report,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterVerification} onValueChange={setFilterVerification}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Change Maker Reports</CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredReports.length} report(s) found
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      {!selectedChangeMakerId && <TableHead>Change Maker</TableHead>}
                      <TableHead>Location</TableHead>
                      <TableHead>Beneficiaries</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-sm text-muted-foreground">SDG {report.sdg_goal}</div>
                        </TableCell>
                        {!selectedChangeMakerId && (
                          <TableCell>
                            {report.user_id ? changeMakerTitles[report.user_id] || '—' : '—'}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            {report.location || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">{(report.beneficiaries ?? 0).toLocaleString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(report.cost ?? 0)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{report.project_status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {report.is_verified && (
                              <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(report.submitted_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(report)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportReport(report)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredReports.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {reports.length === 0
                      ? "No reports have been submitted by change makers yet."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeMakerReportsView;
