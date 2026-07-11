import { supabase } from '@/integrations/supabase/client';

export interface VerifierProfileOption {
  id: string;
  user_id: string;
  display_name: string;
  organization_name: string | null;
  availability_status: string | null;
  is_certified: boolean | null;
}

export async function fetchAvailableVerifiers(): Promise<VerifierProfileOption[]> {
  const { data, error } = await supabase
    .from('verifier_profiles')
    .select('id, user_id, display_name, organization_name, availability_status, is_certified')
    .order('reputation_score', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface ReportAssignment {
  id: string;
  report_id: string;
  verifier_id: string | null;
  status: string | null;
  stage: string | null;
  created_at: string | null;
  verifier_profiles: { display_name: string; organization_name: string | null } | null;
}

/** All routing assignments for a single report - lets the owner see who it's been sent to. */
export async function fetchReportAssignments(reportId: string): Promise<ReportAssignment[]> {
  const { data, error } = await supabase
    .from('verification_assignments')
    .select('id, report_id, verifier_id, status, stage, created_at, verifier_profiles(display_name, organization_name)')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReportAssignment[];
}

/** Report owner routes their submission to a specific verifier (stage: field review). */
export async function assignVerifierToReport(reportId: string, verifierProfileId: string, assignedByUserId: string) {
  const { error } = await supabase.from('verification_assignments').insert({
    report_id: reportId,
    verifier_id: verifierProfileId,
    assigned_by: assignedByUserId,
    status: 'pending',
    assignment_type: 'manual',
    stage: 'field',
  });
  if (error) throw error;
}

export interface RoleUserOption {
  user_id: string;
  full_name: string | null;
  organization: string | null;
}

/** Looks up active users holding a given platform role (e.g. 'government_official'), for routing pickers. */
export async function listUsersByRole(role: 'government_official' | 'ngo_member' | 'company_representative'): Promise<RoleUserOption[]> {
  const { data, error } = await supabase.rpc('list_users_by_role', { p_role: role });
  if (error) throw error;
  return data ?? [];
}

/**
 * A verifier who has completed their review routes the report on to a
 * specific government official's "awaiting your review" queue.
 * routingVerifierUserId is the verifier's own auth.uid() (project_verifications
 * requires verifier_id = the inserting user), assignedReviewerId is the
 * government official's auth.uid().
 */
export async function routeToGovernmentReviewer(
  reportId: string,
  routingVerifierUserId: string,
  assignedReviewerId: string,
  comments?: string,
) {
  const { error } = await supabase.from('project_verifications').insert({
    report_id: reportId,
    verifier_id: routingVerifierUserId,
    verification_level: 'government',
    status: 'pending',
    assigned_reviewer_id: assignedReviewerId,
    comments: comments || null,
  });
  if (error) throw error;
}

export interface GovernmentReviewQueueItem {
  id: string;
  report_id: string;
  comments: string | null;
  created_at: string;
  reports: { title: string; description: string | null; user_id: string; sdg_goal: number | null } | null;
}

/** Reports awaiting this specific government official's decision. */
export async function fetchGovernmentReviewQueue(userId: string): Promise<GovernmentReviewQueueItem[]> {
  const { data, error } = await supabase
    .from('project_verifications')
    .select('id, report_id, comments, created_at, reports(title, description, user_id, sdg_goal)')
    .eq('verification_level', 'government')
    .eq('status', 'pending')
    .eq('assigned_reviewer_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as GovernmentReviewQueueItem[];
}

// Notifying the report owner is handled by the existing trg_notify_verification
// trigger on project_verifications (fires on both insert and status update) -
// no client-side notification insert needed here, and a client-side insert
// would be blocked anyway (notifications INSERT is RLS-restricted to admins).
export async function submitGovernmentDecision(verificationId: string, decision: 'approved' | 'rejected') {
  const { error } = await supabase
    .from('project_verifications')
    .update({ status: decision, verified_at: new Date().toISOString() })
    .eq('id', verificationId);
  if (error) throw error;
}
