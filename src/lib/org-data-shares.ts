import { supabase } from '@/integrations/supabase/client';

export const ORG_SHARE_SCOPES = [
  'esg_indicators',
  'esg_suppliers',
  'esg_supplier_emissions',
  'compliance_scores',
  'standards_metadata',
] as const;

export type OrgShareScope = typeof ORG_SHARE_SCOPES[number];

export interface CreateDataShareInput {
  grantorOrgId: string;
  granteeUserId: string;
  scope: OrgShareScope[];
  purpose?: string;
  expiresAt: string;
}

export async function createDataShare(input: CreateDataShareInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('organization_data_shares')
    .insert([{
      grantor_org_id: input.grantorOrgId,
      grantee_user_id: input.granteeUserId,
      scope: input.scope,
      purpose: input.purpose || null,
      granted_by: user.id,
      expires_at: input.expiresAt,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function revokeDataShare(shareId: string) {
  const { error } = await supabase
    .from('organization_data_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', shareId);

  if (error) throw error;
}

export async function listGrantsForOrg(orgId: string) {
  const { data, error } = await supabase
    .from('organization_data_shares')
    .select('*')
    .eq('grantor_org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listActiveGrantsForVerifier(userId: string) {
  const { data, error } = await supabase
    .from('organization_data_shares')
    .select('*, organizations(name)')
    .eq('grantee_user_id', userId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
