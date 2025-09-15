import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { enrichSupplierEmissions } from '@/lib/alphaearth';
import { ESGAuditHelpers } from '@/lib/esg-audit';
import { getAuth } from '@clerk/nextjs/server';
import { parse } from 'csv-parse/sync';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orgId = req.query.id as string;
  const { csvData, year, autoEnrich = true } = req.body;

  try {
    // Verify organization access
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .eq('created_by', userId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!org.esg_enabled) {
      return res.status(403).json({ error: 'ESG module not enabled' });
    }

    // Parse CSV data
    let records;
    try {
      records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid CSV format', details: parseError.message });
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'No valid records found in CSV' });
    }

    // Check supplier limits
    const currentCount = await supabase
      .from('esg_suppliers')
      .select('id', { count: 'exact' })
      .eq('organization_id', orgId);

    const existingCount = currentCount.count || 0;
    const newRecordsCount = records.length;

    if (org.esg_suppliers_limit > 0 && (existingCount + newRecordsCount) > org.esg_suppliers_limit) {
      return res.status(403).json({ 
        error: 'Supplier limit exceeded', 
        limit: org.esg_suppliers_limit,
        current: existingCount,
        attempting: newRecordsCount
      });
    }

    const results = {
      processed: 0,
      created_suppliers: 0,
      created_emissions: 0,
      errors: [],
      enriched: 0
    };

    const createdSuppliers = [];
    const reportingYear = year || org.reporting_year || new Date().getFullYear();

    // Process each CSV record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validate required fields
        const supplierName = record.supplier_name || record.name;
        if (!supplierName) {
          results.errors.push(`Row ${i + 1}: Missing supplier name`);
          continue;
        }

        // Create or find supplier
        const { data: existingSupplier } = await supabase
          .from('esg_suppliers')
          .select('*')
          .eq('organization_id', orgId)
          .eq('name', supplierName)
          .maybeSingle();

        let supplierId = existingSupplier?.id;

        if (!existingSupplier) {
          const { data: newSupplier, error: supplierError } = await supabase
            .from('esg_suppliers')
            .insert([{
              organization_id: orgId,
              name: supplierName,
              country_code: record.country_code || record.country,
              sector: record.sector || record.category,
              contact_email: record.contact_email || record.email,
              annual_spend: record.annual_spend ? parseFloat(record.annual_spend) : null,
              data_source: 'csv_import'
            }])
            .select()
            .single();

          if (supplierError) {
            results.errors.push(`Row ${i + 1}: Failed to create supplier - ${supplierError.message}`);
            continue;
          }

          supplierId = newSupplier.id;
          createdSuppliers.push(newSupplier);
          results.created_suppliers++;
        }

        // Create emissions record if emissions data provided
        const emissionsValue = record.emissions_tonnes || record.emissions;
        if (emissionsValue && !isNaN(parseFloat(emissionsValue))) {
          const { error: emissionsError } = await supabase
            .from('esg_supplier_emissions')
            .insert([{
              supplier_id: supplierId,
              organization_id: orgId,
              reporting_year: reportingYear,
              activity_description: record.activity_description || record.activity,
              emissions_tonnes: parseFloat(emissionsValue),
              data_quality: record.data_quality || 'reported',
              evidence_url: record.evidence_url
            }]);

          if (emissionsError) {
            results.errors.push(`Row ${i + 1}: Failed to create emissions record - ${emissionsError.message}`);
          } else {
            results.created_emissions++;
          }
        }

        results.processed++;

      } catch (rowError: any) {
        results.errors.push(`Row ${i + 1}: ${rowError.message}`);
      }
    }

    // Auto-enrich suppliers if requested and on Pro plan
    if (autoEnrich && org.plan_type === 'pro' && createdSuppliers.length > 0) {
      try {
        const enrichmentResults = await enrichSupplierEmissions(
          orgId,
          org.plan_type,
          createdSuppliers.map(s => ({
            id: s.id,
            name: s.name,
            country_code: s.country_code || 'US',
            sector: s.sector || 'services',
            annual_spend: s.annual_spend
          })),
          reportingYear
        );

        results.enriched = enrichmentResults.filter(r => !r.error).length;
      } catch (enrichError) {
        console.error('Auto-enrichment failed:', enrichError);
      }
    }

    // Log the import
    await ESGAuditHelpers.logSupplierImported(orgId, userId, results.processed, 'csv_upload');

    return res.json({
      success: true,
      results,
      message: `Successfully processed ${results.processed} suppliers. Created ${results.created_suppliers} new suppliers and ${results.created_emissions} emissions records.`
    });

  } catch (error: any) {
    console.error('Supplier import error:', error);
    return res.status(500).json({ 
      error: 'Import failed',
      details: error.message 
    });
  }
}