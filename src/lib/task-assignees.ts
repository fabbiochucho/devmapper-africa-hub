import { supabase } from '@/integrations/supabase/client';
import { listGrantsForOrg } from '@/lib/org-data-shares';

export interface AssignableUser {
  user_id: string;
  name: string;
  source: 'affiliation' | 'org_share';
}

/**
 * Who a project owner can assign a Kanban task to: people already
 * affiliated with the project (project_affiliations), plus anyone
 * holding an active, unexpired organization_data_shares grant from an
 * organization the report owner administers - the cross-org extension
 * for #87, reusing the sharing infrastructure built for #88 rather than
 * inventing a second grant mechanism.
 */
export async function fetchAssignableUsers(reportId: string, reportOwnerId: string): Promise<AssignableUser[]> {
  const [affiliations, orgs] = await Promise.all([
    supabase.from('project_affiliations').select('user_id').eq('report_id', reportId),
    supabase.from('organizations').select('id').eq('created_by', reportOwnerId),
  ]);

  const affiliatedIds = (affiliations.data ?? []).map((a) => a.user_id);

  let orgShareIds: string[] = [];
  if (orgs.data && orgs.data.length > 0) {
    const now = new Date().toISOString();
    const grantLists = await Promise.all(orgs.data.map((o) => listGrantsForOrg(o.id)));
    orgShareIds = grantLists
      .flat()
      .filter((g: any) => !g.revoked_at && g.expires_at > now)
      .map((g: any) => g.grantee_user_id);
  }

  const idToSource = new Map<string, 'affiliation' | 'org_share'>();
  affiliatedIds.forEach((id) => idToSource.set(id, 'affiliation'));
  orgShareIds.forEach((id) => { if (!idToSource.has(id)) idToSource.set(id, 'org_share'); });
  idToSource.delete(reportOwnerId);

  const allIds = Array.from(idToSource.keys());
  if (allIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('user_id, full_name')
    .in('user_id', allIds);

  const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

  return allIds.map((id) => ({
    user_id: id,
    name: nameById.get(id) || 'Unnamed user',
    source: idToSource.get(id)!,
  }));
}

/** Batch-fetch display names for a set of user ids already known to be assignees (for the Kanban board). */
export async function fetchUserNames(userIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(userIds));
  if (uniqueIds.length === 0) return {};
  const { data } = await supabase.from('public_profiles').select('user_id, full_name').in('user_id', uniqueIds);
  const result: Record<string, string> = {};
  (data ?? []).forEach((p) => { result[p.user_id] = p.full_name || 'Unnamed user'; });
  return result;
}
