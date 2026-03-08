import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Search, Database, Filter, Download, BarChart3, Target, Globe } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { SDG_INDICATOR_LIBRARY, type SDGIndicator } from '@/data/sdgIndicatorLibrary';

const SDG_NAMES: Record<number, string> = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health & Well-being',
  4: 'Quality Education', 5: 'Gender Equality', 6: 'Clean Water & Sanitation',
  7: 'Affordable & Clean Energy', 8: 'Decent Work & Economic Growth',
  9: 'Industry, Innovation & Infrastructure', 10: 'Reduced Inequalities',
  11: 'Sustainable Cities & Communities', 12: 'Responsible Consumption & Production',
  13: 'Climate Action', 14: 'Life Below Water', 15: 'Life on Land',
  16: 'Peace, Justice & Strong Institutions', 17: 'Partnerships for the Goals',
};

const SDG_COLORS: Record<number, string> = {
  1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
  6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
  11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
  16: '#00689D', 17: '#19486A',
};

const LEVELS = ['Input', 'Output', 'Outcome', 'Impact'] as const;
const VERIFICATION_LEVELS = ['Self-report', 'Peer', 'Third-party', 'Impact audit'] as const;

const SDGIndicatorRegistry = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSdg, setSelectedSdg] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<string>('all');

  const filtered = useMemo(() => {
    return SDG_INDICATOR_LIBRARY.filter((ind) => {
      if (selectedSdg !== 'all' && ind.sdg !== Number(selectedSdg)) return false;
      if (selectedLevel !== 'all' && ind.level !== selectedLevel) return false;
      if (selectedVerification !== 'all' && ind.verificationRequirement !== selectedVerification) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return ind.name.toLowerCase().includes(q) ||
          ind.id.toLowerCase().includes(q) ||
          ind.target.includes(q) ||
          ind.sector.toLowerCase().includes(q);
      }
      return true;
    });
  }, [searchQuery, selectedSdg, selectedLevel, selectedVerification]);

  const stats = useMemo(() => {
    const sdgs = new Set(SDG_INDICATOR_LIBRARY.map(i => i.sdg));
    const targets = new Set(SDG_INDICATOR_LIBRARY.map(i => i.target));
    return {
      total: SDG_INDICATOR_LIBRARY.length,
      sdgs: sdgs.size,
      targets: targets.size,
      filtered: filtered.length,
    };
  }, [filtered]);

  const levelColor = (level: string) => {
    switch (level) {
      case 'Input': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Output': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Outcome': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'Impact': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return '';
    }
  };

  const exportCSV = () => {
    const header = 'indicator_id,sdg,target,name,unit,level,sector,source,frequency,verification\n';
    const rows = filtered.map(i =>
      `${i.id},${i.sdg},${i.target},"${i.name}",${i.unit},${i.level},${i.sector},${i.source},${i.frequency},${i.verificationRequirement}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devmapper_sdg_indicators.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEOHead
        title="SDG Indicator Registry | DevMapper"
        description="Browse 500+ SDG indicators mapped to targets, sectors, and verification requirements. The DevMapper Global SDG Indicator Library."
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Database className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Global SDG Indicator Registry
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse DevMapper's comprehensive library of {stats.total} indicators across all 17 SDGs,
            mapped to targets, sectors, and verification requirements.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Indicators</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.sdgs}</p>
              <p className="text-xs text-muted-foreground">SDGs Covered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.targets}</p>
              <p className="text-xs text-muted-foreground">Targets Mapped</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.filtered}</p>
              <p className="text-xs text-muted-foreground">Showing</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search indicators, targets, sectors..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedSdg} onValueChange={setSelectedSdg}>
                <SelectTrigger>
                  <SelectValue placeholder="All SDGs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SDGs</SelectItem>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={String(n)}>
                      SDG {n}: {SDG_NAMES[n]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedVerification} onValueChange={setSelectedVerification}>
                <SelectTrigger>
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  {VERIFICATION_LEVELS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-sm text-muted-foreground">
                {stats.filtered} indicator{stats.filtered !== 1 ? 's' : ''} found
              </p>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Indicator Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Code</TableHead>
                    <TableHead className="w-16">SDG</TableHead>
                    <TableHead className="w-16">Target</TableHead>
                    <TableHead>Indicator</TableHead>
                    <TableHead className="w-20">Unit</TableHead>
                    <TableHead className="w-20">Level</TableHead>
                    <TableHead className="w-28">Sector</TableHead>
                    <TableHead className="w-24">Source</TableHead>
                    <TableHead className="w-24">Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((ind) => (
                    <TableRow key={ind.id}>
                      <TableCell className="font-mono text-xs">{ind.id}</TableCell>
                      <TableCell>
                        <Badge
                          className="text-white text-xs"
                          style={{ backgroundColor: SDG_COLORS[ind.sdg] }}
                        >
                          {ind.sdg}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{ind.target}</TableCell>
                      <TableCell className="text-sm">{ind.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ind.unit}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${levelColor(ind.level)}`}>
                          {ind.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ind.sector}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ind.source}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{ind.verificationRequirement}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Showing 100 of {filtered.length} indicators. Use filters to narrow results.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Methodology */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Indicator Framework Methodology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              DevMapper's SDG Indicator Library is based on the <strong>UN Global Indicator Framework</strong>,
              expanded with operational project-level metrics. Each indicator is classified by:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Results Chain Levels</p>
                <div className="space-y-1">
                  <Badge variant="outline" className={levelColor('Input')}>Input</Badge>
                  <span className="ml-2">Resources invested</span>
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className={levelColor('Output')}>Output</Badge>
                  <span className="ml-2">Direct deliverables</span>
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className={levelColor('Outcome')}>Outcome</Badge>
                  <span className="ml-2">Short-term changes</span>
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className={levelColor('Impact')}>Impact</Badge>
                  <span className="ml-2">Long-term transformation</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Verification Requirements</p>
                <p><strong>Self-report:</strong> Project implementer data</p>
                <p><strong>Peer:</strong> Independent peer review</p>
                <p><strong>Third-party:</strong> External audit / government data</p>
                <p><strong>Impact audit:</strong> Full independent impact assessment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SDGIndicatorRegistry;
