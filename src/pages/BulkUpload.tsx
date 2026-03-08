import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Info, Users, Building2, Landmark, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  TEMPLATES,
  downloadTemplate,
  parseCSV,
  validateRows,
  mapRowToReport,
  type BulkUploadTemplate,
  type ParsedRow,
  type ValidationError,
} from '@/lib/bulkUploadTemplates';

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  changemaker: <Users className="w-5 h-5" />,
  ngo: <Building2 className="w-5 h-5" />,
  government: <Landmark className="w-5 h-5" />,
  corporate: <Briefcase className="w-5 h-5" />,
};

const BulkUpload = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BulkUploadTemplate>(TEMPLATES[0]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error('No data rows found in the file');
        return;
      }

      if (rows.length > 500) {
        toast.error('Maximum 500 rows per upload. Please split your file.');
        return;
      }

      const validationErrors = validateRows(rows, selectedTemplate);
      setParsedRows(rows);
      setErrors(validationErrors);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload projects');
      return;
    }

    if (errors.length > 0) {
      toast.error('Please fix all validation errors before uploading');
      return;
    }

    setUploading(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      try {
        const reportData = mapRowToReport(parsedRows[i], user.id);

        const { data: report, error } = await supabase
          .from('reports')
          .insert(reportData)
          .select('id')
          .single();

        if (error) throw error;

        // Create owner affiliation
        if (report) {
          await supabase.from('project_affiliations').insert({
            report_id: report.id,
            user_id: user.id,
            relationship_type: 'owner',
          });
        }

        success++;
      } catch (err) {
        console.error(`Row ${i + 2} failed:`, err);
        failed++;
      }

      setProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }

    setResults({ success, failed });
    setUploading(false);
    setStep('done');

    if (failed === 0) {
      toast.success(`All ${success} projects uploaded successfully!`);
    } else {
      toast.warning(`${success} uploaded, ${failed} failed. Check the results.`);
    }
  };

  const reset = () => {
    setParsedRows([]);
    setErrors([]);
    setResults(null);
    setProgress(0);
    setStep('select');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Project Upload</h1>
        <p className="text-muted-foreground mt-1">
          Quickly onboard your project portfolio using CSV templates tailored to your role.
        </p>
      </div>

      {/* Step 1: Template Selection & Download */}
      {step === 'select' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Download a Template</CardTitle>
              <CardDescription>Choose the template that matches your organisation type, fill it out, then upload.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TEMPLATES.map((tmpl) => (
                  <Card
                    key={tmpl.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate.id === tmpl.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedTemplate(tmpl)}
                  >
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center gap-2">
                        {TEMPLATE_ICONS[tmpl.id]}
                        <span className="font-semibold">{tmpl.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{tmpl.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTemplate(tmpl);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-muted-foreground" />
                Field Reference — {selectedTemplate.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTemplate.columns.map((col) => (
                      <TableRow key={col.key}>
                        <TableCell className="font-mono text-sm">{col.header}</TableCell>
                        <TableCell>
                          {col.required ? (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{col.description}</TableCell>
                        <TableCell className="font-mono text-xs">{col.example}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Upload Your File</CardTitle>
              <CardDescription>Upload a filled CSV using the <strong>{selectedTemplate.label}</strong> template. Max 500 rows.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Click to select a CSV file or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">Supported format: .csv (comma-separated)</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 2: Preview & Validate */}
      {step === 'preview' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Preview &amp; Validate</h2>
            <Button variant="outline" size="sm" onClick={reset}>
              <X className="w-4 h-4 mr-2" /> Start Over
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{errors.length} validation error(s) found</AlertTitle>
              <AlertDescription>
                <ScrollArea className="max-h-[150px] mt-2">
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {errors.slice(0, 20).map((e, i) => (
                      <li key={i}>
                        Row {e.row}, <strong>{e.field}</strong>: {e.message}
                      </li>
                    ))}
                    {errors.length > 20 && (
                      <li className="text-muted-foreground">...and {errors.length - 20} more</li>
                    )}
                  </ul>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {errors.length === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">All {parsedRows.length} rows passed validation</AlertTitle>
              <AlertDescription>Ready to upload to DevMapper.</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="max-h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {selectedTemplate.columns.slice(0, 6).map(c => (
                        <TableHead key={c.key}>{c.header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 50).map((row, idx) => {
                      const rowErrors = errors.filter(e => e.row === idx + 2);
                      return (
                        <TableRow key={idx} className={rowErrors.length > 0 ? 'bg-destructive/5' : ''}>
                          <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                          {selectedTemplate.columns.slice(0, 6).map(c => (
                            <TableCell key={c.key} className="text-sm max-w-[200px] truncate">
                              {row[c.header] || <span className="text-muted-foreground italic">—</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              {parsedRows.length > 50 && (
                <p className="text-xs text-muted-foreground mt-2">Showing first 50 of {parsedRows.length} rows</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || errors.length > 0}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload {parsedRows.length} Project{parsedRows.length !== 1 ? 's' : ''}
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">Uploading... {progress}%</p>
            </div>
          )}
        </>
      )}

      {/* Step 3: Results */}
      {step === 'done' && results && (
        <>
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Upload Complete</h2>
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-primary">{results.success}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                {results.failed > 0 && (
                  <div>
                    <p className="text-3xl font-bold text-destructive">{results.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={reset}>Upload More</Button>
                <Button onClick={() => window.location.href = '/my-projects'}>
                  View My Projects
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BulkUpload;
