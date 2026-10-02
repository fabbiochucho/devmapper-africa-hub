import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// A type alias (not an interface) so entries are assignable to the jsonb column type.
export type ProgressEntry = {
  value: number;
  recordedAt: string;
  notes: string;
};

export interface CorporateTarget {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  progress: number;
  deadline: string;
  sdgGoal: number;
  countryCode: string | null;
  progressHistory: ProgressEntry[];
}

type Row = Tables<"corporate_targets">;

const isEntry = (e: unknown): e is ProgressEntry =>
  !!e && typeof e === "object" && typeof (e as ProgressEntry).value === "number" && typeof (e as ProgressEntry).recordedAt === "string";

export function toTarget(r: Row): CorporateTarget {
  const targetValue = r.target_value ?? 0;
  const currentValue = r.current_value ?? 0;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    targetValue,
    targetUnit: r.unit ?? "",
    currentValue,
    progress: targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0,
    deadline: r.target_date,
    sdgGoal: r.sdg_goals?.[0] ?? 0,
    countryCode: r.country_code ?? null,
    progressHistory: Array.isArray(r.progress_history) ? (r.progress_history as unknown[]).filter(isEntry) : [],
  };
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in to manage targets");
  return data.user.id;
}

export async function getCorporateTargets(): Promise<CorporateTarget[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("corporate_targets")
    .select("*")
    .eq("company_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toTarget(r as Row));
}

export async function addCorporateEsgTarget(t: {
  title: string; description: string; targetValue: string | number; targetUnit: string; targetDate: string; sdgGoal: string | number; countryCode: string;
}): Promise<CorporateTarget> {
  const userId = await currentUserId();
  const sdg = Number(t.sdgGoal);
  const { data, error } = await supabase
    .from("corporate_targets")
    .insert({
      company_id: userId,
      title: t.title,
      description: t.description,
      target_value: Number(t.targetValue),
      unit: t.targetUnit,
      target_date: t.targetDate,
      current_value: 0,
      sdg_goals: sdg ? [sdg] : [],
      country_code: t.countryCode || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toTarget(data as Row);
}

export async function updateCorporateTarget({ target, progressData }: {
  target: CorporateTarget;
  progressData: { value: string; notes: string };
}): Promise<CorporateTarget> {
  const value = Number(progressData.value);
  const entry: ProgressEntry = {
    value,
    recordedAt: new Date().toISOString(),
    notes: progressData.notes || `Updated to ${value} ${target.targetUnit}`.trim(),
  };
  const { data, error } = await supabase
    .from("corporate_targets")
    .update({ current_value: value, progress_history: [...target.progressHistory, entry], updated_at: new Date().toISOString() })
    .eq("id", target.id)
    .select("*")
    .single();
  if (error) throw error;
  return toTarget(data as Row);
}
