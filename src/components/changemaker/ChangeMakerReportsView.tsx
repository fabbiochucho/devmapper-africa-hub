
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Eye, Download, MapPin, Calendar, Users } from "lucide-react";
import { mockChangeMakers, ChangeMaker } from "@/data/mockChangeMakers";

interface ChangeMakerReportsViewProps {
  selectedChangeMakerId?: string | null;
}

const ChangeMakerReportsView: React.FC<ChangeMakerReportsViewProps> = ({ selectedChangeMakerId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterVerification, setFilterVerification] = useState<string>("all");

  const filteredChangeMakers = mockChangeMakers.filter(changeMaker => {
    const matchesSearch = changeMaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         changeMaker.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || changeMaker.type === filterType;
    const matchesVerification = filterVerification === "all" || 
                               (filterVerification === "verified" && changeMaker.verified) ||
                               (filterVerification === "unverified" && !changeMaker.verified);
    
    return matchesSearch && matchesType && matchesVerification;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-green-100 text-green-800';
      case 'ngo': return 'bg-purple-100 text-purple-800';
      case 'corporate': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  const handleViewDetails = (changeMaker: ChangeMaker) => {
    console.log("View change maker details:", changeMaker.id);
    // TODO: Navigate to change maker detail page
  };

  const handleExportReport = (changeMaker: ChangeMaker) => {
    const reportData = {
      ...changeMaker,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-maker-report-${changeMaker.id}-${new Date().toISOString().split('T')[0]}.json`;
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
            Filter Change Makers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search change makers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
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
            {filteredChangeMakers.length} change maker(s) found
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChangeMakers.map((changeMaker) => (
                  <TableRow key={changeMaker.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={changeMaker.photo}
                          alt={changeMaker.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{changeMaker.name}</div>
                          <div className="text-sm text-muted-foreground">{changeMaker.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(changeMaker.type)}>
                        {changeMaker.type.charAt(0).toUpperCase() + changeMaker.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {changeMaker.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{changeMaker.impactMetrics.projectsCompleted}</div>
                        <div className="text-xs text-muted-foreground">completed</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(changeMaker.totalFunding)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{changeMaker.impactMetrics.livesTouched.toLocaleString()}+ lives</div>
                        <div className="text-muted-foreground">{changeMaker.impactMetrics.communitiesServed} communities</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {changeMaker.verified && (
                          <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                        )}
                        <div className="text-xs">{changeMaker.verification_score}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(changeMaker.submitted_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(changeMaker)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportReport(changeMaker)}
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

          {filteredChangeMakers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No change makers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeMakerReportsView;
