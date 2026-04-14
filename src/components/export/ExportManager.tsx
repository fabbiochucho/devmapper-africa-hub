import { useState } from 'react';
import { escapeHtml } from '@/lib/escapeHtml';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type ExportFormat = 'pdf' | 'excel' | 'json';

export interface ExportableData {
  type: 'esg_indicators' | 'esg_suppliers' | 'esg_scenarios' | 'reports' | 'analytics';
  label: string;
  data: any[];
}

interface ExportManagerProps {
  organizationName: string;
  availableData: ExportableData[];
  planType: 'free' | 'lite' | 'pro';
}

export default function ExportManager({ organizationName, availableData, planType }: ExportManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const formatIcons = {
    pdf: FileText,
    excel: FileSpreadsheet,
    json: FileJson
  };

  const canExportPDF = planType === 'pro';
  const canExportExcel = planType !== 'free';

  const toggleDataType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const exportToJSON = (data: Record<string, any[]> | any[], filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
  };

  const exportToPDF = async (data: ExportableData[]) => {
    // In a production app, you'd use a library like jsPDF or call a server-side PDF generator
    // For now, we'll create a printable HTML document
    const htmlContent = generatePDFHTML(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePDFHTML = (data: ExportableData[]) => {
    const now = new Date().toLocaleDateString();
    
    let tablesHTML = '';
    data.forEach(dataset => {
      if (!dataset.data.length) return;
      
      const headers = Object.keys(dataset.data[0]);
      const headerRow = headers.map(h => `<th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">${escapeHtml(String(h))}</th>`).join('');
      const rows = dataset.data.map(row => 
        `<tr>${headers.map(h => `<td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(String(row[h] ?? ''))}</td>`).join('')}</tr>`
      ).join('');
      
      tablesHTML += `
        <h2 style="margin-top: 30px;">${escapeHtml(dataset.label)}</h2>
        <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(organizationName)} - ESG Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            @media print {
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(organizationName)} - ESG Report</h1>
          <p style="color: #666;">Generated on ${now}</p>
          ${tablesHTML}
        </body>
      </html>
    `;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!selectedTypes.length) {
      toast.error('Please select at least one data type to export');
      return;
    }

    setExporting(true);
    try {
      const selectedData = availableData.filter(d => selectedTypes.includes(d.type));
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `${organizationName.replace(/\s+/g, '_')}_${timestamp}`;

      switch (format) {
        case 'json':
          const combinedData: Record<string, any[]> = {};
          selectedData.forEach(d => {
            combinedData[d.type] = d.data;
          });
          exportToJSON(combinedData, baseFilename);
          break;
        case 'excel':
          // Export as CSV (Excel-compatible)
          selectedData.forEach(dataset => {
            exportToCSV(dataset.data, `${baseFilename}_${dataset.type}`);
          });
          break;
        case 'pdf':
          await exportToPDF(selectedData);
          break;
      }

      toast.success(`Export completed successfully`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export ESG Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['json', 'excel', 'pdf'] as ExportFormat[]).map(fmt => {
                const Icon = formatIcons[fmt];
                const isDisabled = (fmt === 'pdf' && !canExportPDF) || (fmt === 'excel' && !canExportExcel);
                
                return (
                  <button
                    key={fmt}
                    onClick={() => !isDisabled && setFormat(fmt)}
                    disabled={isDisabled}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors
                      ${format === fmt ? 'border-primary bg-primary/5' : 'border-border'}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}
                    `}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium uppercase">{fmt}</span>
                    {isDisabled && (
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data Selection */}
          <div className="space-y-2">
            <Label>Select Data to Export</Label>
            <div className="space-y-2">
              {availableData.map(data => (
                <div
                  key={data.type}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={data.type}
                      checked={selectedTypes.includes(data.type)}
                      onCheckedChange={() => toggleDataType(data.type)}
                    />
                    <Label htmlFor={data.type} className="cursor-pointer">
                      {data.label}
                    </Label>
                  </div>
                  <Badge variant="outline">{data.data.length} records</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || !selectedTypes.length}>
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}