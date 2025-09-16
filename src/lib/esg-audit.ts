import { supabase } from '@/integrations/supabase/client';

/**
 * Write ESG audit log entry
 */
export async function writeESGAuditLog(
  organizationId: string,
  userId: string | null,
  module: string,
  action: string,
  tableName?: string,
  rowId?: string,
  metadata: any = {}
) {
  try {
    const { error } = await supabase
      .from('esg_audit_logs')
      .insert([{
        organization_id: organizationId,
        user_id: userId,
        module,
        action,
        table_name: tableName,
        row_id: rowId,
        metadata,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('ESG audit log write failed:', error);
    }
  } catch (err) {
    console.warn('ESG audit write failed:', err);
  }
}

/**
 * Get ESG audit logs for an organization
 */
export async function getESGAuditLogs(
  organizationId: string,
  options: {
    module?: string;
    action?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  let query = supabase
    .from('esg_audit_logs')
    .select(`
      *,
      profiles!esg_audit_logs_user_id_fkey(full_name, avatar_url)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options.module) {
    query = query.eq('module', options.module);
  }

  if (options.action) {
    query = query.eq('action', options.action);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching ESG audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get ESG activity summary for an organization
 */
export async function getESGActivitySummary(organizationId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('esg_audit_logs')
    .select('module, action, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching ESG activity summary:', error);
    return {
      total_actions: 0,
      actions_by_module: {},
      actions_by_day: {},
      most_active_modules: []
    };
  }

  const actionsByModule: Record<string, number> = {};
  const actionsByDay: Record<string, number> = {};
  
  data?.forEach(log => {
    // Count by module
    actionsByModule[log.module] = (actionsByModule[log.module] || 0) + 1;
    
    // Count by day
    const day = new Date(log.created_at).toDateString();
    actionsByDay[day] = (actionsByDay[day] || 0) + 1;
  });

  const mostActiveModules = Object.entries(actionsByModule)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return {
    total_actions: data?.length || 0,
    actions_by_module: actionsByModule,
    actions_by_day: actionsByDay,
    most_active_modules: mostActiveModules
  };
}

/**
 * Audit helper functions for common ESG operations
 */
export const ESGAuditHelpers = {
  // ESG Indicators
  async logIndicatorCreated(orgId: string, userId: string, indicatorId: string, year: number) {
    await writeESGAuditLog(orgId, userId, 'esg_indicators', 'created', 'esg_indicators', indicatorId, { year });
  },

  async logIndicatorUpdated(orgId: string, userId: string, indicatorId: string, changes: any) {
    await writeESGAuditLog(orgId, userId, 'esg_indicators', 'updated', 'esg_indicators', indicatorId, { changes });
  },

  // Suppliers
  async logSupplierImported(orgId: string, userId: string, count: number, source: string) {
    await writeESGAuditLog(orgId, userId, 'suppliers', 'csv_import', null, null, { count, source });
  },

  async logSupplierEnriched(orgId: string, userId: string, supplierId: string, provider: string) {
    await writeESGAuditLog(orgId, userId, 'suppliers', 'alphaearth_enriched', 'esg_suppliers', supplierId, { provider });
  },

  // Scenarios
  async logScenarioCreated(orgId: string, userId: string, scenarioId: string, name: string) {
    await writeESGAuditLog(orgId, userId, 'scenarios', 'created', 'esg_scenarios', scenarioId, { name });
  },

  async logScenarioRun(orgId: string, userId: string, scenarioId: string, results: any) {
    await writeESGAuditLog(orgId, userId, 'scenarios', 'executed', 'esg_scenarios', scenarioId, { results });
  },

  // Benchmarking
  async logBenchmarkFetched(orgId: string, userId: string, provider: string, params: any) {
    await writeESGAuditLog(orgId, userId, 'benchmarking', 'api_call', null, null, { provider, params });
  },

  // Exports
  async logDataExported(orgId: string, userId: string, format: string, scope: string) {
    await writeESGAuditLog(orgId, userId, 'exports', 'data_exported', null, null, { format, scope });
  }
};