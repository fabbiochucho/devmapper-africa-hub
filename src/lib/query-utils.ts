/**
 * Query optimization utilities for backend performance
 * Provides request deduplication, batching, and common query patterns
 */

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

/**
 * Deduplicate identical concurrent requests
 * Multiple simultaneous calls with the same key will share a single promise
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const existing = requestCache.get(key);
  if (existing) {
    return existing;
  }

  const promise = requestFn().finally(() => {
    // Clean up after request completes
    requestCache.delete(key);
  });

  requestCache.set(key, promise);
  return promise;
}

/**
 * Batch multiple async operations and execute them in parallel
 * Returns results in the same order as the input operations
 */
export async function batchRequests<T>(
  operations: Array<() => Promise<T>>
): Promise<Array<T | Error>> {
  const results = await Promise.allSettled(operations.map(op => op()));
  return results.map(result => 
    result.status === 'fulfilled' ? result.value : result.reason
  );
}

/**
 * Common select fields to reduce payload size
 */
export const COMMON_SELECTS = {
  // Profile fields (minimal)
  profileMinimal: 'user_id, full_name, avatar_url, is_verified',
  
  // Report list fields
  reportsList: `
    id, title, description, sdg_goal, country_code, location,
    submitted_at, project_status, user_id, cost, cost_currency,
    beneficiaries, is_verified
  `,
  
  // Campaign list fields
  campaignsList: `
    id, title, description, target_amount, raised_amount, currency,
    deadline, status, created_at, location, category, sdg_goals,
    image_url, is_verified
  `,
  
  // Organization fields
  organizationBasic: `
    id, name, plan_type, created_by, esg_enabled,
    project_quota_remaining, project_cap
  `,
  
  // Evidence items
  evidenceList: `
    id, report_id, title, evidence_type, verification_status,
    created_at, file_url
  `,
  
  // Project tasks
  tasksList: `
    id, report_id, title, description, status, priority,
    due_date, assigned_to, created_by, estimated_hours, actual_hours
  `
} as const;

/**
 * Build optimized query filters for common patterns
 */
export const QueryFilters = {
  /**
   * Get reports with pagination and optional filters
   */
  reportsFilter: (options: {
    limit?: number;
    offset?: number;
    userId?: string;
    sdgGoal?: number;
    countryCode?: string;
    status?: string;
  }) => {
    const { limit = 20, offset = 0, userId, sdgGoal, countryCode, status } = options;
    
    let query: any = { limit, offset };
    if (userId) query.user_id = userId;
    if (sdgGoal) query.sdg_goal = sdgGoal;
    if (countryCode) query.country_code = countryCode;
    if (status) query.project_status = status;
    
    return query;
  },
  
  /**
   * Get active campaigns
   */
  activeCampaignsFilter: (limit = 20) => ({
    status: 'active',
    deadline: { gte: new Date().toISOString().split('T')[0] },
    limit
  }),
  
  /**
   * Get recent items (generic)
   */
  recentItemsFilter: (limit = 20, offset = 0) => ({
    limit,
    offset,
    order: { created_at: 'desc' as const }
  })
};

/**
 * Cache key generators for consistent deduplication
 */
export const CacheKeys = {
  dashboardStats: () => 'dashboard-stats',
  
  userProfile: (userId: string) => `profile-${userId}`,
  
  userReports: (userId: string, filters?: any) => 
    `reports-${userId}-${JSON.stringify(filters || {})}`,
  
  reportDetails: (reportId: string) => `report-${reportId}`,
  
  campaignsList: (filters?: any) => 
    `campaigns-${JSON.stringify(filters || {})}`,
  
  organizationDetails: (orgId: string) => `org-${orgId}`,
  
  esgIndicators: (orgId: string, year: number) => 
    `esg-indicators-${orgId}-${year}`,
};

/**
 * Pagination helper
 */
export function calculatePagination(page: number, pageSize: number = 20) {
  return {
    from: page * pageSize,
    to: (page + 1) * pageSize - 1,
    limit: pageSize,
    offset: page * pageSize
  };
}

/**
 * Error handler for queries
 */
export function handleQueryError(error: any, context: string): Error {
  console.error(`[Query Error - ${context}]`, error);
  
  if (error?.message?.includes('JWT')) {
    return new Error('Authentication expired. Please log in again.');
  }
  
  if (error?.message?.includes('violates row-level security')) {
    return new Error('Access denied. You do not have permission to access this resource.');
  }
  
  return error instanceof Error ? error : new Error('An unexpected error occurred');
}
