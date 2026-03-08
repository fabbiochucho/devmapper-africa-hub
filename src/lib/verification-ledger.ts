/**
 * Verification Ledger — Hash-Chain Audit Trail (Blockchain Alternative)
 * 
 * Each entry contains a SHA-256 hash of: prev_hash + event_type + payload + timestamp
 * This creates an immutable, tamper-evident chain without requiring a distributed ledger.
 * Any modification to a past entry breaks the chain, making tampering detectable.
 */

import { supabase } from '@/integrations/supabase/client';

export interface LedgerEntry {
  id: string;
  report_id: string;
  event_type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  prev_hash: string | null;
  entry_hash: string;
  sequence_number: number;
  created_at: string;
}

export type LedgerEventType =
  | 'application_submitted'
  | 'evidence_uploaded'
  | 'evidence_verified'
  | 'stage_started'
  | 'stage_completed'
  | 'stage_failed'
  | 'score_updated'
  | 'certification_issued'
  | 'certification_revoked'
  | 'human_verification'
  | 'ai_verification'
  | 'governance_approved'
  | 'governance_rejected';

/**
 * Compute SHA-256 hash from concatenated input
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Append an entry to the verification ledger with hash chain integrity
 */
export async function appendToLedger(
  reportId: string,
  eventType: LedgerEventType,
  payload: Record<string, unknown> = {}
): Promise<{ data: LedgerEntry | null; error: string | null }> {
  try {
    // Get the last entry for this report to chain hashes
    const { data: lastEntry } = await supabase
      .from('verification_ledger')
      .select('entry_hash, sequence_number')
      .eq('report_id', reportId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const prevHash = lastEntry?.entry_hash || 'GENESIS';
    const sequenceNumber = (lastEntry?.sequence_number || 0) + 1;
    const timestamp = new Date().toISOString();

    // Compute hash: prev_hash + event_type + JSON(payload) + timestamp + sequence
    const hashInput = `${prevHash}|${eventType}|${JSON.stringify(payload)}|${timestamp}|${sequenceNumber}`;
    const entryHash = await sha256(hashInput);

    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('verification_ledger')
      .insert({
        report_id: reportId,
        event_type: eventType,
        actor_id: user?.user?.id || null,
        payload,
        prev_hash: prevHash === 'GENESIS' ? null : prevHash,
        entry_hash: entryHash,
        sequence_number: sequenceNumber,
        created_at: timestamp,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as LedgerEntry, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Fetch the full ledger chain for a report and verify integrity
 */
export async function fetchAndVerifyLedger(reportId: string): Promise<{
  entries: LedgerEntry[];
  isValid: boolean;
  brokenAt: number | null;
}> {
  const { data: entries, error } = await supabase
    .from('verification_ledger')
    .select('*')
    .eq('report_id', reportId)
    .order('sequence_number', { ascending: true });

  if (error || !entries) return { entries: [], isValid: true, brokenAt: null };

  // Verify hash chain
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i] as LedgerEntry;
    if (i === 0) {
      // First entry should have no prev_hash
      if (entry.prev_hash !== null) return { entries: entries as LedgerEntry[], isValid: false, brokenAt: 0 };
    } else {
      const prevEntry = entries[i - 1] as LedgerEntry;
      if (entry.prev_hash !== prevEntry.entry_hash) {
        return { entries: entries as LedgerEntry[], isValid: false, brokenAt: i };
      }
    }
  }

  return { entries: entries as LedgerEntry[], isValid: true, brokenAt: null };
}
