import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Users,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { enrichSuppliers } from '@/lib/alphaearth-client';
import { ESGAuditHelpers } from '@/lib/esg-audit';

interface ImportResult {
  success: boolean;
  results: {
    processed: number;
    created_suppliers: number;
    created_emissions: number;
    enriched: number;
    errors: string[];
  };
  message?: string;
}

const SupplierCSVImporter = ({ 
  organizationId, 
  onImportComplete 
}: { 
  organizationId: string;
  onImportComplete?: (result: ImportResult) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    // Create CSV template
    const template = `supplier_name,country_code,sector,contact_email,annual_spend,emissions_tonnes,activity_description,data_quality
Example Corp,US,manufacturing,contact@example.com,50000,125.5,Raw materials procurement,reported
Green Supplier Ltd,CA,services,info@greensupplier.com,25000,,Professional services,estimated
Tech Solutions Inc,GB,technology,sales@techsolutions.com,75000,45.2,Software licensing,verified`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values.map((v) => v.trim());
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    return lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] ?? '';
      });
      return row;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const csvContent = await file.text();
      const rows = parseCSV(csvContent);

      if (rows.length === 0) {
        throw new Error('CSV file is empty or has no data rows');
      }

      const reportingYear = parseInt(year, 10);
      const errors: string[] = [];
      let createdSuppliers = 0;
      let createdEmissions = 0;
      const suppliersToEnrich: Array<{
        id: string;
        name: string;
        country_code: string;
        sector: string;
        annual_spend?: number;
      }> = [];

      const CHUNK_SIZE = 50;
      const chunk = <T,>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
        return chunks;
      };

      interface ParsedRow {
        rowNum: number;
        clientId: string;
        name: string;
        country_code: string | null;
        sector: string | null;
        contact_email: string | null;
        annual_spend: number | null;
        emissions_tonnes: number | null;
        activity_description: string | null;
        data_quality: string | null;
      }

      const parsedRows: ParsedRow[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +1 for header, +1 for 1-indexing
        const name = row.supplier_name?.trim();

        if (!name) {
          errors.push(`Row ${rowNum}: missing supplier_name`);
          continue;
        }

        const annualSpend = row.annual_spend ? parseFloat(row.annual_spend) : null;
        const emissionsTonnes = row.emissions_tonnes ? parseFloat(row.emissions_tonnes) : null;

        parsedRows.push({
          rowNum,
          clientId: crypto.randomUUID(),
          name,
          country_code: row.country_code?.toUpperCase() || null,
          sector: row.sector?.toLowerCase() || null,
          contact_email: row.contact_email || null,
          annual_spend: annualSpend !== null && !isNaN(annualSpend) ? annualSpend : null,
          emissions_tonnes: emissionsTonnes !== null && !isNaN(emissionsTonnes) ? emissionsTonnes : null,
          activity_description: row.activity_description || null,
          data_quality: row.data_quality || 'reported',
        });
      }

      // Client-assigns each supplier's id so success can be tracked without
      // depending on RETURNING row order. Chunked batch insert per network
      // round trip; a chunk that fails falls back to per-row inserts so one
      // bad row doesn't sink the whole chunk and errors stay row-attributable.
      const createdRows: ParsedRow[] = [];
      for (const rowChunk of chunk(parsedRows, CHUNK_SIZE)) {
        const { error: chunkError } = await supabase.from('esg_suppliers').insert(
          rowChunk.map((r) => ({
            id: r.clientId,
            organization_id: organizationId,
            name: r.name,
            country_code: r.country_code,
            sector: r.sector,
            contact_email: r.contact_email,
            annual_spend: r.annual_spend,
            data_source: 'csv_import',
          }))
        );

        if (!chunkError) {
          createdRows.push(...rowChunk);
          continue;
        }

        for (const r of rowChunk) {
          const { error: supplierError } = await supabase.from('esg_suppliers').insert([{
            id: r.clientId,
            organization_id: organizationId,
            name: r.name,
            country_code: r.country_code,
            sector: r.sector,
            contact_email: r.contact_email,
            annual_spend: r.annual_spend,
            data_source: 'csv_import',
          }]);

          if (supplierError) {
            errors.push(`Row ${r.rowNum} (${r.name}): ${supplierError.message}`);
          } else {
            createdRows.push(r);
          }
        }
      }
      createdSuppliers = createdRows.length;

      const rowsWithEmissions = createdRows.filter((r) => r.emissions_tonnes !== null);
      for (const rowChunk of chunk(rowsWithEmissions, CHUNK_SIZE)) {
        const { error: chunkError } = await supabase.from('esg_supplier_emissions').insert(
          rowChunk.map((r) => ({
            supplier_id: r.clientId,
            organization_id: organizationId,
            reporting_year: reportingYear,
            activity_description: r.activity_description,
            emissions_tonnes: r.emissions_tonnes,
            data_quality: r.data_quality,
          }))
        );

        if (!chunkError) {
          createdEmissions += rowChunk.length;
          continue;
        }

        for (const r of rowChunk) {
          const { error: emissionsError } = await supabase.from('esg_supplier_emissions').insert([{
            supplier_id: r.clientId,
            organization_id: organizationId,
            reporting_year: reportingYear,
            activity_description: r.activity_description,
            emissions_tonnes: r.emissions_tonnes,
            data_quality: r.data_quality,
          }]);

          if (emissionsError) {
            errors.push(`Row ${r.rowNum} (${r.name}): emissions data failed - ${emissionsError.message}`);
          } else {
            createdEmissions++;
          }
        }
      }

      for (const r of createdRows) {
        if (r.emissions_tonnes === null && autoEnrich && r.country_code && r.sector) {
          suppliersToEnrich.push({
            id: r.clientId,
            name: r.name,
            country_code: r.country_code,
            sector: r.sector,
            annual_spend: r.annual_spend ?? undefined,
          });
        }
      }

      let enrichedCount = 0;
      if (autoEnrich && suppliersToEnrich.length > 0) {
        try {
          const enrichResult = await enrichSuppliers(organizationId, suppliersToEnrich, reportingYear);
          enrichedCount = enrichResult.enriched.filter((r) => !r.error).length;
        } catch (enrichError: any) {
          errors.push(`Auto-enrichment failed: ${enrichError.message}`);
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && createdSuppliers > 0) {
        await ESGAuditHelpers.logSupplierImported(organizationId, user.id, createdSuppliers, 'csv_import');
      }

      const data: ImportResult = {
        success: createdSuppliers > 0,
        results: {
          processed: rows.length,
          created_suppliers: createdSuppliers,
          created_emissions: createdEmissions,
          enriched: enrichedCount,
          errors,
        },
        message:
          createdSuppliers > 0
            ? `Imported ${createdSuppliers} of ${rows.length} suppliers`
            : 'No suppliers were imported',
      };

      setResult(data);
      if (data.success) {
        toast.success(data.message || 'Import completed successfully');
      } else {
        toast.error(data.message || 'Import failed');
      }

      if (onImportComplete) {
        onImportComplete(data);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import suppliers');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Suppliers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to bulk import suppliers and their emissions data for Scope 3 tracking.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">CSV Template</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadTemplate}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reporting-year">Reporting Year</Label>
              <Input
                id="reporting-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="2020"
                max="2030"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-enrich">Auto-enrich with AlphaEarth</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-enrich"
                  checked={autoEnrich}
                  onCheckedChange={setAutoEnrich}
                />
                <span className="text-sm text-muted-foreground">
                  Automatically estimate missing emissions
                </span>
                <Badge variant="secondary" className="text-xs">
                  Pro only
                </Badge>
              </div>
            </div>
          </div>

          {/* Import Button */}
          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Suppliers
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Progress/Results */}
      {importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing CSV...</span>
                <span>Please wait</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Success Summary */}
            {result.success && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {result.results.processed}
                  </div>
                  <div className="text-xs text-green-600/80">Processed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {result.results.created_suppliers}
                  </div>
                  <div className="text-xs text-blue-600/80">New Suppliers</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {result.results.created_emissions}
                  </div>
                  <div className="text-xs text-purple-600/80">Emissions Records</div>
                </div>
                {autoEnrich && (
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {result.results.enriched}
                    </div>
                    <div className="text-xs text-orange-600/80">Enriched</div>
                  </div>
                )}
              </div>
            )}

            {/* Errors */}
            {result.results.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">{result.results.errors.length} errors occurred:</p>
                    <ul className="text-sm space-y-1">
                      {result.results.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-muted-foreground">• {error}</li>
                      ))}
                      {result.results.errors.length > 5 && (
                        <li className="text-muted-foreground">
                          • ... and {result.results.errors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {result.message && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {result.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupplierCSVImporter;