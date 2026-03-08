// CSV template definitions for bulk project uploads per stakeholder type

export interface TemplateColumn {
  header: string;
  key: string;
  required: boolean;
  description: string;
  example: string;
}

export interface BulkUploadTemplate {
  id: string;
  label: string;
  description: string;
  columns: TemplateColumn[];
}

const COMMON_COLUMNS: TemplateColumn[] = [
  { header: 'Project Title', key: 'title', required: true, description: 'Name of the project (min 5 chars)', example: 'Clean Water Initiative - Nairobi' },
  { header: 'Description', key: 'description', required: true, description: 'Project description (min 20 chars)', example: 'Installing water purification systems in Kibera slum to provide clean drinking water.' },
  { header: 'SDG Goal (1-17)', key: 'sdg_goal', required: true, description: 'Primary SDG goal number', example: '6' },
  { header: 'SDG Target', key: 'sdg_target', required: false, description: 'Specific SDG target e.g. 6.1', example: '6.1' },
  { header: 'Status', key: 'project_status', required: true, description: 'planned | in_progress | completed | stalled | cancelled', example: 'in_progress' },
  { header: 'Location', key: 'location', required: true, description: 'City, Region or Address', example: 'Kibera, Nairobi' },
  { header: 'Country Code (ISO3)', key: 'country_code', required: false, description: '3-letter ISO country code', example: 'KEN' },
  { header: 'Latitude', key: 'lat', required: false, description: 'Decimal latitude', example: '-1.2921' },
  { header: 'Longitude', key: 'lng', required: false, description: 'Decimal longitude', example: '36.8219' },
  { header: 'Budget', key: 'cost', required: false, description: 'Project budget amount', example: '50000' },
  { header: 'Currency', key: 'cost_currency', required: false, description: 'ISO currency code (default USD)', example: 'KES' },
  { header: 'Start Date', key: 'start_date', required: false, description: 'YYYY-MM-DD', example: '2025-01-15' },
  { header: 'End Date', key: 'end_date', required: false, description: 'YYYY-MM-DD', example: '2026-06-30' },
];

export const TEMPLATES: BulkUploadTemplate[] = [
  {
    id: 'changemaker',
    label: 'Change Maker',
    description: 'For individual change makers and community groups uploading grassroots projects.',
    columns: [
      ...COMMON_COLUMNS,
      { header: 'Beneficiaries', key: 'beneficiaries', required: false, description: 'Number of people impacted', example: '500' },
    ],
  },
  {
    id: 'ngo',
    label: 'NGO / Civil Society',
    description: 'For NGOs uploading programme portfolios with donor and partner information.',
    columns: [
      ...COMMON_COLUMNS,
      { header: 'Sponsor', key: 'sponsor', required: false, description: 'Sponsoring organisation', example: 'UNDP' },
      { header: 'Funder', key: 'funder', required: false, description: 'Funding organisation', example: 'Bill & Melinda Gates Foundation' },
      { header: 'Contractor', key: 'contractor', required: false, description: 'Implementing contractor', example: 'WaterAid Kenya' },
      { header: 'Beneficiaries', key: 'beneficiaries', required: false, description: 'Number of people impacted', example: '10000' },
    ],
  },
  {
    id: 'government',
    label: 'Government',
    description: 'For government bodies uploading public projects and national development programmes.',
    columns: [
      ...COMMON_COLUMNS,
      { header: 'Sponsor', key: 'sponsor', required: false, description: 'Government ministry or department', example: 'Ministry of Water & Sanitation' },
      { header: 'Funder', key: 'funder', required: false, description: 'Funding source', example: 'National Treasury' },
      { header: 'Contractor', key: 'contractor', required: false, description: 'Implementing contractor', example: 'KenGen Ltd' },
      { header: 'Beneficiaries', key: 'beneficiaries', required: false, description: 'Number of citizens impacted', example: '50000' },
      { header: 'Admin Area', key: 'admin_area', required: false, description: 'Administrative region/county', example: 'Nairobi County' },
    ],
  },
  {
    id: 'corporate',
    label: 'Corporate / ESG',
    description: 'For corporates uploading CSR, ESG and sustainability projects.',
    columns: [
      ...COMMON_COLUMNS,
      { header: 'Sponsor', key: 'sponsor', required: false, description: 'Parent company or division', example: 'Safaricom Foundation' },
      { header: 'Funder', key: 'funder', required: false, description: 'Funding entity', example: 'Safaricom PLC' },
      { header: 'Contractor', key: 'contractor', required: false, description: 'Implementing partner', example: 'Conservation International' },
      { header: 'Beneficiaries', key: 'beneficiaries', required: false, description: 'Number of people impacted', example: '25000' },
    ],
  },
];

export function generateCSV(template: BulkUploadTemplate): string {
  const headers = template.columns.map(c => c.header).join(',');
  const exampleRow = template.columns.map(c => {
    const val = c.example;
    // Wrap in quotes if contains comma
    return val.includes(',') ? `"${val}"` : val;
  }).join(',');
  return `${headers}\n${exampleRow}`;
}

export function downloadTemplate(template: BulkUploadTemplate) {
  const csv = generateCSV(template);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `devmapper-${template.id}-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ParsedRow {
  [key: string]: string;
}

export function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const VALID_STATUSES = ['planned', 'in_progress', 'completed', 'stalled', 'cancelled'];

export function validateRows(rows: ParsedRow[], template: BulkUploadTemplate): ValidationError[] {
  const errors: ValidationError[] = [];
  const headerToKey = new Map(template.columns.map(c => [c.header, c]));

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 for 1-index and header row

    // Check required fields
    template.columns.forEach(col => {
      if (col.required) {
        const value = row[col.header] ?? '';
        if (!value) {
          errors.push({ row: rowNum, field: col.header, message: `Required field is empty` });
        }
      }
    });

    // Title min length
    const title = row['Project Title'] ?? '';
    if (title && title.length < 5) {
      errors.push({ row: rowNum, field: 'Project Title', message: 'Must be at least 5 characters' });
    }

    // Description min length
    const desc = row['Description'] ?? '';
    if (desc && desc.length < 20) {
      errors.push({ row: rowNum, field: 'Description', message: 'Must be at least 20 characters' });
    }

    // SDG Goal range
    const sdg = parseInt(row['SDG Goal (1-17)'] ?? '');
    if (row['SDG Goal (1-17)'] && (isNaN(sdg) || sdg < 1 || sdg > 17)) {
      errors.push({ row: rowNum, field: 'SDG Goal (1-17)', message: 'Must be a number between 1 and 17' });
    }

    // Status validation
    const status = row['Status'] ?? '';
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ row: rowNum, field: 'Status', message: `Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // Lat/Lng validation
    const lat = parseFloat(row['Latitude'] ?? '');
    if (row['Latitude'] && (isNaN(lat) || lat < -90 || lat > 90)) {
      errors.push({ row: rowNum, field: 'Latitude', message: 'Must be between -90 and 90' });
    }
    const lng = parseFloat(row['Longitude'] ?? '');
    if (row['Longitude'] && (isNaN(lng) || lng < -180 || lng > 180)) {
      errors.push({ row: rowNum, field: 'Longitude', message: 'Must be between -180 and 180' });
    }

    // Date validation
    ['Start Date', 'End Date'].forEach(field => {
      const val = row[field] ?? '';
      if (val && isNaN(Date.parse(val))) {
        errors.push({ row: rowNum, field, message: 'Invalid date format. Use YYYY-MM-DD' });
      }
    });

    // Budget must be positive number
    const cost = row['Budget'] ?? '';
    if (cost && (isNaN(parseFloat(cost)) || parseFloat(cost) < 0)) {
      errors.push({ row: rowNum, field: 'Budget', message: 'Must be a positive number' });
    }
  });

  return errors;
}

export function mapRowToReport(row: ParsedRow, userId: string) {
  return {
    title: row['Project Title'],
    description: row['Description'],
    sdg_goal: parseInt(row['SDG Goal (1-17)']),
    sdg_target: row['SDG Target'] || null,
    project_status: row['Status'] || 'planned',
    location: row['Location'],
    country_code: row['Country Code (ISO3)'] || null,
    lat: row['Latitude'] ? parseFloat(row['Latitude']) : null,
    lng: row['Longitude'] ? parseFloat(row['Longitude']) : null,
    cost: row['Budget'] ? parseFloat(row['Budget']) : null,
    cost_currency: row['Currency'] || 'USD',
    start_date: row['Start Date'] || null,
    end_date: row['End Date'] || null,
    sponsor: row['Sponsor'] || null,
    funder: row['Funder'] || null,
    contractor: row['Contractor'] || null,
    beneficiaries: row['Beneficiaries'] ? parseInt(row['Beneficiaries']) : null,
    user_id: userId,
  };
}
