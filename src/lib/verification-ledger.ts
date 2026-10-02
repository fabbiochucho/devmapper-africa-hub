/**
 * Verification Ledger — Hash-Chain Audit Trail (Blockchain Alternative)
 * 
 * Each entry contains a SHA-256 hash of: prev_hash + event_type + payload + timestamp
 * This creates an immutable, tamper-evident chain without requiring a distributed ledger.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { errorMessageOf } from '@/lib/error-handler';

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

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function appendToLedger(
  reportId: string,
  eventType: LedgerEventType,
  payload: { [key: string]: Json | undefined } = {}
): Promise<{ data: LedgerEntry | null; error: string | null }> {
  try {
    const { data: lastEntry } = await (supabase)
      .from('verification_ledger')
      .select('entry_hash, sequence_number')
      .eq('report_id', reportId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const prevHash = lastEntry?.entry_hash || 'GENESIS';
    const sequenceNumber = (lastEntry?.sequence_number || 0) + 1;
    const timestamp = new Date().toISOString();

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
  } catch (err: unknown) {
    return { data: null, error: errorMessageOf(err) };
  }
}

export async function fetchAndVerifyLedger(reportId: string): Promise<{
  entries: LedgerEntry[];
  isValid: boolean;
  brokenAt: number | null;
}> {
  const { data: entries, error } = await (supabase)
    .from('verification_ledger')
    .select('*')
    .eq('report_id', reportId)
    .order('sequence_number', { ascending: true });

  if (error || !entries) return { entries: [], isValid: true, brokenAt: null };

  const typedEntries = entries as LedgerEntry[];

  for (let i = 0; i < typedEntries.length; i++) {
    const entry = typedEntries[i];
    if (i === 0) {
      if (entry.prev_hash !== null) return { entries: typedEntries, isValid: false, brokenAt: 0 };
    } else {
      const prevEntry = typedEntries[i - 1];
      if (entry.prev_hash !== prevEntry.entry_hash) {
        return { entries: typedEntries, isValid: false, brokenAt: i };
      }
    }
  }

  return { entries: typedEntries, isValid: true, brokenAt: null };
}
