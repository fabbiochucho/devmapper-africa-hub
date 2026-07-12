import { supabase } from '@/integrations/supabase/client';
import type { z } from 'zod';
import type { reportSchema } from '@/lib/reportSchema';
import { validateSatelliteReading } from '@/lib/satellite-validation';

export type ReportFormValues = z.infer<typeof reportSchema>;

export interface SubmitReportResult {
  failedUploads: number;
}

/**
 * The actual "write a report to the server" logic, extracted from
 * SubmitReport.tsx's onSubmit so it can be called both from the live form
 * submit and from the offline queue's flush path (src/lib/offline-report-queue.ts)
 * without duplicating this ~60-line pipeline in two places.
 */
export async function submitReportToServer(
  values: ReportFormValues,
  photos: File[],
  userId: string,
  fetchGEEData: (params: { type: 'ndvi'; bounds: { north: number; south: number; east: number; west: number } }) => Promise<any>,
): Promise<SubmitReportResult> {
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .insert({
      title: values.title,
      description: values.description,
      sdg_goal: parseInt(values.sdg_goal),
      project_status: values.project_status || 'planned',
      location: values.location,
      country_code: values.country_code || null,
      user_id: userId,
      lat: values.lat || null,
      lng: values.lng || null,
      cost: values.cost || null,
      cost_currency: values.costCurrency || 'USD',
      usd_exchange_rate: values.usd_exchange_rate || null,
      issue_type: values.issue_type && values.issue_type !== 'none' ? values.issue_type : null,
      issue_severity: values.issue_severity || 'low',
      evidence_type: values.evidence_type && values.evidence_type !== 'none' ? values.evidence_type : null,
      start_date: values.startDate ? new Date(values.startDate).toISOString().split('T')[0] : null,
      end_date: values.endDate ? new Date(values.endDate).toISOString().split('T')[0] : null,
      sponsor: values.sponsor || null,
      funder: values.funder || null,
      contractor: values.contractor || null,
      beneficiaries: null,
    })
    .select('id')
    .single();

  if (reportError) throw reportError;

  if (report) {
    await supabase.from('project_affiliations').insert({
      report_id: report.id,
      user_id: userId,
      relationship_type: 'owner',
    });
  }

  if (report && values.lat != null && values.lng != null) {
    try {
      const buffer = 0.01;
      const geeResult = await fetchGEEData({
        type: 'ndvi',
        bounds: { north: values.lat + buffer, south: values.lat - buffer, east: values.lng + buffer, west: values.lng - buffer },
      });
      const reading = geeResult?.data?.[0];
      const validation = validateSatelliteReading({
        sdgGoal: parseInt(values.sdg_goal) || null,
        ndviValue: reading?.value ?? null,
      });
      await supabase.from('evidence_items').insert({
        report_id: report.id,
        uploaded_by: userId,
        evidence_type: 'satellite',
        title: 'Satellite vegetation index (NDVI) at reported location',
        description: reading
          ? `NDVI reading: ${reading.value.toFixed(3)} at (${reading.lat.toFixed(4)}, ${reading.lng.toFixed(4)}). Source: ${geeResult.metadata?.source ?? 'Google Earth Engine'}. Auto-validation (${validation.verdict}): ${validation.message}`
          : 'No satellite reading available for this location.',
        // evidence_items.verification_status only allows pending/verified/rejected
        // (no "flagged" state) - a possible_mismatch verdict is surfaced via the
        // description text instead, for a human verifier to act on.
        verification_status: 'pending',
      });
    } catch (geeError) {
      console.error('Satellite evidence linking failed:', geeError);
    }
  }

  let failedUploads = 0;
  if (photos.length > 0 && report) {
    for (const file of photos) {
      const filePath = `${userId}/${report.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
      if (uploadError) {
        console.error('Photo upload failed:', uploadError);
        failedUploads++;
        continue;
      }

      const { data: signedData } = await supabase.storage
        .from('project-files')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);
      await supabase.from('evidence_items').insert({
        report_id: report.id,
        uploaded_by: userId,
        evidence_type: 'photo',
        title: file.name,
        file_url: signedData?.signedUrl ?? null,
        verification_status: 'pending',
      });
    }
  }

  return { failedUploads };
}
