/**
 * Emission Factor Engine & Activity Data Model
 * Aligned with GHG Protocol, Carbon Trust structure
 * Region-aware (Africa-first), version-controlled
 */

export interface EmissionFactor {
  id: string;
  category: string;
  subcategory: string;
  activity: string;
  unit: string;
  factor: number; // kgCO2e per unit
  source: string;
  region: string;
  scope: 'scope1' | 'scope2' | 'scope3';
  year: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface ActivityEntry {
  id: string;
  category: string;
  subcategory: string;
  activity: string;
  quantity: number;
  unit: string;
  emissionFactorId: string;
  emissionFactor: number;
  emissions: number; // calculated: quantity × factor
  scope: 'scope1' | 'scope2' | 'scope3';
  period: string;
  dataQuality: 'measured' | 'estimated' | 'default';
  confidenceScore: number;
  notes?: string;
}

export interface CalculationResult {
  input: { quantity: number; unit: string; activity: string };
  emissionFactor: { value: number; source: string; region: string; year: number };
  formula: string;
  result: { emissions: number; unit: string };
  confidence: number;
  methodology: string;
}

// ─── Predefined Activity Categories (GHG Protocol + Carbon Trust) ───

export const ACTIVITY_CATEGORIES = [
  {
    category: 'Energy',
    subcategories: [
      { name: 'Electricity', activities: ['Grid electricity', 'Solar PV', 'Wind', 'Diesel generator'], defaultUnit: 'kWh' },
      { name: 'Fuel', activities: ['Diesel', 'Petrol/Gasoline', 'Natural gas', 'LPG', 'Coal', 'Biomass'], defaultUnit: 'litres' },
      { name: 'Heat & Steam', activities: ['District heating', 'Steam purchased'], defaultUnit: 'kWh' },
    ],
  },
  {
    category: 'Transport',
    subcategories: [
      { name: 'Road', activities: ['Diesel truck', 'Petrol car', 'Electric vehicle', 'Motorcycle', 'Bus'], defaultUnit: 'km' },
      { name: 'Air', activities: ['Short-haul flight (<3h)', 'Medium-haul flight (3-6h)', 'Long-haul flight (>6h)', 'Freight air'], defaultUnit: 'passenger-km' },
      { name: 'Rail', activities: ['National rail', 'International rail', 'Freight rail'], defaultUnit: 'passenger-km' },
      { name: 'Maritime', activities: ['Container ship', 'Bulk carrier', 'Tanker'], defaultUnit: 'tonne-km' },
    ],
  },
  {
    category: 'Waste',
    subcategories: [
      { name: 'Landfill', activities: ['Mixed municipal', 'Organic waste', 'Construction waste'], defaultUnit: 'tonnes' },
      { name: 'Recycling', activities: ['Paper/cardboard', 'Plastic', 'Metal', 'Glass'], defaultUnit: 'tonnes' },
      { name: 'Incineration', activities: ['Municipal waste', 'Hazardous waste'], defaultUnit: 'tonnes' },
      { name: 'Composting', activities: ['Garden waste', 'Food waste'], defaultUnit: 'tonnes' },
    ],
  },
  {
    category: 'Business Travel',
    subcategories: [
      { name: 'Hotels', activities: ['Hotel night stay'], defaultUnit: 'nights' },
      { name: 'Commuting', activities: ['Car commute', 'Public transport commute', 'Cycling/walking'], defaultUnit: 'km' },
      { name: 'Working from home', activities: ['Home office'], defaultUnit: 'days' },
    ],
  },
  {
    category: 'Agriculture',
    subcategories: [
      { name: 'Livestock', activities: ['Cattle (enteric)', 'Poultry', 'Goats/sheep', 'Pigs'], defaultUnit: 'head-year' },
      { name: 'Crops', activities: ['Rice paddies', 'Fertilizer application', 'Crop residue burning'], defaultUnit: 'hectares' },
      { name: 'Land use', activities: ['Deforestation', 'Reforestation (sequestration)'], defaultUnit: 'hectares' },
    ],
  },
  {
    category: 'Industrial',
    subcategories: [
      { name: 'Process emissions', activities: ['Cement production', 'Steel production', 'Chemical manufacturing'], defaultUnit: 'tonnes-product' },
      { name: 'Refrigerants', activities: ['HFC leakage', 'Air conditioning', 'Refrigeration'], defaultUnit: 'kg' },
    ],
  },
  {
    category: 'Water',
    subcategories: [
      { name: 'Supply', activities: ['Municipal water supply', 'Borehole extraction'], defaultUnit: 'm³' },
      { name: 'Treatment', activities: ['Wastewater treatment', 'Desalination'], defaultUnit: 'm³' },
    ],
  },
  {
    category: 'Purchased Goods',
    subcategories: [
      { name: 'Materials', activities: ['Paper products', 'Plastics', 'Metals', 'Textiles', 'Electronics'], defaultUnit: 'kg' },
      { name: 'Services', activities: ['IT services', 'Professional services', 'Catering'], defaultUnit: 'USD-spent' },
    ],
  },
];

// ─── Default Emission Factors (GHG Protocol / DEFRA / Africa-specific) ───

export const DEFAULT_EMISSION_FACTORS: EmissionFactor[] = [
  // Energy - Electricity (Africa-specific grid factors)
  { id: 'ef-elec-ng', category: 'Energy', subcategory: 'Electricity', activity: 'Grid electricity', unit: 'kWh', factor: 0.43, source: 'IEA 2023', region: 'Nigeria', scope: 'scope2', year: 2023, confidence: 'medium' },
  { id: 'ef-elec-ke', category: 'Energy', subcategory: 'Electricity', activity: 'Grid electricity', unit: 'kWh', factor: 0.32, source: 'IEA 2023', region: 'Kenya', scope: 'scope2', year: 2023, confidence: 'medium' },
  { id: 'ef-elec-za', category: 'Energy', subcategory: 'Electricity', activity: 'Grid electricity', unit: 'kWh', factor: 0.95, source: 'Eskom/IEA 2023', region: 'South Africa', scope: 'scope2', year: 2023, confidence: 'high' },
  { id: 'ef-elec-gh', category: 'Energy', subcategory: 'Electricity', activity: 'Grid electricity', unit: 'kWh', factor: 0.36, source: 'IEA 2023', region: 'Ghana', scope: 'scope2', year: 2023, confidence: 'medium' },
  { id: 'ef-elec-eg', category: 'Energy', subcategory: 'Electricity', activity: 'Grid electricity', unit: 'kWh', factor: 0.49, source: 'IEA 2023', region: 'Egypt', scope: 'scope2', year: 2023, confidence: 'medium' },
  { id: 'ef-elec-global', category: 'Energy', subcategory: 'Electricity', activity: 'Grid electricity', unit: 'kWh', factor: 0.42, source: 'IEA Global Average', region: 'Global', scope: 'scope2', year: 2023, confidence: 'medium' },
  { id: 'ef-solar', category: 'Energy', subcategory: 'Electricity', activity: 'Solar PV', unit: 'kWh', factor: 0.04, source: 'IPCC AR6', region: 'Global', scope: 'scope2', year: 2023, confidence: 'high' },
  { id: 'ef-wind', category: 'Energy', subcategory: 'Electricity', activity: 'Wind', unit: 'kWh', factor: 0.011, source: 'IPCC AR6', region: 'Global', scope: 'scope2', year: 2023, confidence: 'high' },
  { id: 'ef-diesel-gen', category: 'Energy', subcategory: 'Electricity', activity: 'Diesel generator', unit: 'kWh', factor: 0.78, source: 'DEFRA 2023', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high' },

  // Energy - Fuel
  { id: 'ef-diesel', category: 'Energy', subcategory: 'Fuel', activity: 'Diesel', unit: 'litres', factor: 2.68, source: 'GHG Protocol', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high' },
  { id: 'ef-petrol', category: 'Energy', subcategory: 'Fuel', activity: 'Petrol/Gasoline', unit: 'litres', factor: 2.31, source: 'GHG Protocol', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high' },
  { id: 'ef-natgas', category: 'Energy', subcategory: 'Fuel', activity: 'Natural gas', unit: 'litres', factor: 2.02, source: 'GHG Protocol', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high', notes: 'Per m³' },
  { id: 'ef-lpg', category: 'Energy', subcategory: 'Fuel', activity: 'LPG', unit: 'litres', factor: 1.56, source: 'GHG Protocol', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high' },
  { id: 'ef-coal', category: 'Energy', subcategory: 'Fuel', activity: 'Coal', unit: 'litres', factor: 2450, source: 'GHG Protocol', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high', notes: 'Per tonne' },

  // Transport - Road
  { id: 'ef-truck-diesel', category: 'Transport', subcategory: 'Road', activity: 'Diesel truck', unit: 'km', factor: 0.89, source: 'DEFRA 2023', region: 'Global', scope: 'scope1', year: 2023, confidence: 'medium' },
  { id: 'ef-car-petrol', category: 'Transport', subcategory: 'Road', activity: 'Petrol car', unit: 'km', factor: 0.17, source: 'DEFRA 2023', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high' },
  { id: 'ef-ev', category: 'Transport', subcategory: 'Road', activity: 'Electric vehicle', unit: 'km', factor: 0.05, source: 'DEFRA 2023', region: 'Global', scope: 'scope2', year: 2023, confidence: 'medium' },
  { id: 'ef-bus', category: 'Transport', subcategory: 'Road', activity: 'Bus', unit: 'km', factor: 0.089, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },

  // Transport - Air
  { id: 'ef-short-haul', category: 'Transport', subcategory: 'Air', activity: 'Short-haul flight (<3h)', unit: 'passenger-km', factor: 0.255, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'high' },
  { id: 'ef-medium-haul', category: 'Transport', subcategory: 'Air', activity: 'Medium-haul flight (3-6h)', unit: 'passenger-km', factor: 0.195, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'high' },
  { id: 'ef-long-haul', category: 'Transport', subcategory: 'Air', activity: 'Long-haul flight (>6h)', unit: 'passenger-km', factor: 0.147, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'high' },

  // Transport - Rail
  { id: 'ef-rail-national', category: 'Transport', subcategory: 'Rail', activity: 'National rail', unit: 'passenger-km', factor: 0.035, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },

  // Transport - Maritime
  { id: 'ef-container', category: 'Transport', subcategory: 'Maritime', activity: 'Container ship', unit: 'tonne-km', factor: 0.016, source: 'IMO 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },

  // Waste
  { id: 'ef-landfill-mixed', category: 'Waste', subcategory: 'Landfill', activity: 'Mixed municipal', unit: 'tonnes', factor: 580, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },
  { id: 'ef-landfill-organic', category: 'Waste', subcategory: 'Landfill', activity: 'Organic waste', unit: 'tonnes', factor: 1170, source: 'IPCC', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },
  { id: 'ef-recycle-paper', category: 'Waste', subcategory: 'Recycling', activity: 'Paper/cardboard', unit: 'tonnes', factor: 21, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },
  { id: 'ef-recycle-plastic', category: 'Waste', subcategory: 'Recycling', activity: 'Plastic', unit: 'tonnes', factor: 21, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },

  // Business Travel
  { id: 'ef-hotel', category: 'Business Travel', subcategory: 'Hotels', activity: 'Hotel night stay', unit: 'nights', factor: 20.6, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },
  { id: 'ef-wfh', category: 'Business Travel', subcategory: 'Working from home', activity: 'Home office', unit: 'days', factor: 0.59, source: 'EcoAct', region: 'Global', scope: 'scope3', year: 2023, confidence: 'low' },

  // Agriculture
  { id: 'ef-cattle', category: 'Agriculture', subcategory: 'Livestock', activity: 'Cattle (enteric)', unit: 'head-year', factor: 2850, source: 'IPCC', region: 'Africa', scope: 'scope1', year: 2023, confidence: 'medium' },
  { id: 'ef-rice', category: 'Agriculture', subcategory: 'Crops', activity: 'Rice paddies', unit: 'hectares', factor: 5000, source: 'IPCC', region: 'Global', scope: 'scope1', year: 2023, confidence: 'low' },
  { id: 'ef-reforestation', category: 'Agriculture', subcategory: 'Land use', activity: 'Reforestation (sequestration)', unit: 'hectares', factor: -8500, source: 'IPCC AR6', region: 'Tropical Africa', scope: 'scope1', year: 2023, confidence: 'low', notes: 'Negative = sequestration' },

  // Water
  { id: 'ef-water-supply', category: 'Water', subcategory: 'Supply', activity: 'Municipal water supply', unit: 'm³', factor: 0.344, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },
  { id: 'ef-wastewater', category: 'Water', subcategory: 'Treatment', activity: 'Wastewater treatment', unit: 'm³', factor: 0.708, source: 'DEFRA 2023', region: 'Global', scope: 'scope3', year: 2023, confidence: 'medium' },

  // Industrial
  { id: 'ef-cement', category: 'Industrial', subcategory: 'Process emissions', activity: 'Cement production', unit: 'tonnes-product', factor: 900, source: 'WBCSD CSI', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high' },
  { id: 'ef-steel', category: 'Industrial', subcategory: 'Process emissions', activity: 'Steel production', unit: 'tonnes-product', factor: 1850, source: 'World Steel', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high' },
  { id: 'ef-hfc', category: 'Industrial', subcategory: 'Refrigerants', activity: 'HFC leakage', unit: 'kg', factor: 1430, source: 'IPCC AR6', region: 'Global', scope: 'scope1', year: 2023, confidence: 'high', notes: 'GWP of R-134a' },
];

// ─── Calculation Engine (Transparent & Auditable) ───

export function calculateEmissions(
  quantity: number,
  emissionFactor: EmissionFactor
): CalculationResult {
  const emissions = quantity * emissionFactor.factor / 1000; // Convert kgCO2e to tCO2e

  return {
    input: { quantity, unit: emissionFactor.unit, activity: emissionFactor.activity },
    emissionFactor: {
      value: emissionFactor.factor,
      source: emissionFactor.source,
      region: emissionFactor.region,
      year: emissionFactor.year,
    },
    formula: `${quantity.toLocaleString()} ${emissionFactor.unit} × ${emissionFactor.factor} kgCO₂e/${emissionFactor.unit} ÷ 1000 = ${emissions.toFixed(4)} tCO₂e`,
    result: { emissions, unit: 'tCO₂e' },
    confidence: emissionFactor.confidence === 'high' ? 95 : emissionFactor.confidence === 'medium' ? 70 : 40,
    methodology: 'GHG Protocol Corporate Standard',
  };
}

export function findEmissionFactor(
  category: string,
  subcategory: string,
  activity: string,
  region?: string
): EmissionFactor | undefined {
  // Try region-specific first, fall back to global
  const regionSpecific = DEFAULT_EMISSION_FACTORS.find(
    ef => ef.category === category && ef.subcategory === subcategory && ef.activity === activity && ef.region === region
  );
  if (regionSpecific) return regionSpecific;

  return DEFAULT_EMISSION_FACTORS.find(
    ef => ef.category === category && ef.subcategory === subcategory && ef.activity === activity
  );
}

export function getFactorsForActivity(category: string, subcategory: string, activity: string): EmissionFactor[] {
  return DEFAULT_EMISSION_FACTORS.filter(
    ef => ef.category === category && ef.subcategory === subcategory && ef.activity === activity
  );
}

export function getAllRegions(): string[] {
  return [...new Set(DEFAULT_EMISSION_FACTORS.map(ef => ef.region))].sort();
}

// ─── Data Quality & Confidence Layer ───

export interface DataQualityAssessment {
  overallScore: number; // 0-100
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  issues: string[];
  suggestions: string[];
}

export function assessDataQuality(entries: ActivityEntry[]): DataQualityAssessment {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (entries.length === 0) {
    return { overallScore: 0, completeness: 0, accuracy: 0, consistency: 0, timeliness: 0, issues: ['No activity data entries'], suggestions: ['Add activity data for at least Scope 1 and 2 categories'] };
  }

  // Completeness: Do we have all 3 scopes?
  const scopes = new Set(entries.map(e => e.scope));
  const completeness = (scopes.size / 3) * 100;
  if (!scopes.has('scope1')) { issues.push('Missing Scope 1 data'); suggestions.push('Add direct emissions (fuel combustion, company vehicles)'); }
  if (!scopes.has('scope2')) { issues.push('Missing Scope 2 data'); suggestions.push('Add electricity consumption data'); }
  if (!scopes.has('scope3')) { issues.push('Missing Scope 3 data'); suggestions.push('Add supply chain, travel, or waste data'); }

  // Accuracy: How many entries use measured vs estimated data?
  const measured = entries.filter(e => e.dataQuality === 'measured').length;
  const accuracy = (measured / entries.length) * 100;
  if (accuracy < 50) { issues.push('Over half of entries use estimated data'); suggestions.push('Replace estimates with measured data where possible'); }

  // Consistency: Check for unrealistic values
  let consistency = 100;
  for (const entry of entries) {
    if (entry.quantity <= 0) { issues.push(`Invalid quantity for ${entry.activity}: ${entry.quantity}`); consistency -= 20; }
    if (entry.emissions < -100000) { consistency -= 10; }
  }
  consistency = Math.max(0, consistency);

  // Timeliness
  const timeliness = 80; // Placeholder - would check reporting period vs current date

  const overallScore = Math.round((completeness * 0.3 + accuracy * 0.3 + consistency * 0.25 + timeliness * 0.15));

  return { overallScore, completeness, accuracy, consistency, timeliness, issues, suggestions };
}

// ─── Data Validation Engine ───

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'missing' | 'invalid_unit' | 'unrealistic_value' | 'negative' | 'type_mismatch';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestedValue?: number;
}

export function validateActivityEntry(entry: Partial<ActivityEntry>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Missing data checks
  if (!entry.category) errors.push({ field: 'category', message: 'Activity category is required', type: 'missing' });
  if (!entry.activity) errors.push({ field: 'activity', message: 'Activity type is required', type: 'missing' });
  if (entry.quantity === undefined || entry.quantity === null) errors.push({ field: 'quantity', message: 'Quantity is required', type: 'missing' });
  if (!entry.unit) errors.push({ field: 'unit', message: 'Unit of measurement is required', type: 'missing' });

  // Negative value check (except sequestration)
  if (entry.quantity !== undefined && entry.quantity < 0 && entry.activity !== 'Reforestation (sequestration)') {
    errors.push({ field: 'quantity', message: 'Quantity cannot be negative', type: 'negative' });
  }

  // Unrealistic value detection
  if (entry.quantity !== undefined && entry.category === 'Energy' && entry.subcategory === 'Electricity') {
    if (entry.quantity > 100_000_000) {
      warnings.push({ field: 'quantity', message: `${entry.quantity.toLocaleString()} kWh seems very high. Typical large facility: 1-10M kWh/year`, suggestedValue: 5_000_000 });
    }
  }
  if (entry.quantity !== undefined && entry.category === 'Transport' && entry.subcategory === 'Air') {
    if (entry.quantity > 1_000_000) {
      warnings.push({ field: 'quantity', message: 'Over 1M passenger-km seems high for a single entry. Did you mean to break this into multiple trips?' });
    }
  }
  if (entry.quantity !== undefined && entry.category === 'Water' && entry.unit === 'm³' && entry.quantity > 10_000_000) {
    warnings.push({ field: 'quantity', message: 'Extremely high water consumption. Verify this is in cubic meters, not litres.' });
  }

  // Unit validation
  if (entry.unit && entry.category) {
    const cat = ACTIVITY_CATEGORIES.find(c => c.category === entry.category);
    const sub = cat?.subcategories.find(s => s.name === entry.subcategory);
    if (sub && sub.defaultUnit !== entry.unit) {
      warnings.push({ field: 'unit', message: `Expected unit "${sub.defaultUnit}" for this activity. You entered "${entry.unit}". Make sure this is correct.` });
    }
  }

  // Suggestions
  if (errors.length === 0 && warnings.length === 0) {
    suggestions.push('Data looks good. Consider adding evidence documentation for higher credibility.');
  }
  if (entry.dataQuality === 'default') {
    suggestions.push('Using default emission factors. Upgrade to region-specific or measured data for higher accuracy.');
  }

  return { valid: errors.length === 0, errors, warnings, suggestions };
}
