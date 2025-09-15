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
      // Read file content
      const csvContent = await file.text();

      // Send to import API
      const response = await fetch(`/api/organizations/${organizationId}/esg/suppliers/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: csvContent,
          year: parseInt(year),
          autoEnrich
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast.success(data.message || 'Import completed successfully');
        
        if (onImportComplete) {
          onImportComplete(data);
        }
      } else {
        throw new Error(data.error || 'Import failed');
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