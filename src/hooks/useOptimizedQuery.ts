/**
 * Optimized React Query hooks with standardized caching strategies
 */
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { deduplicateRequest, handleQueryError } from '@/lib/query-utils';

/**
 * Default stale times based on data volatility
 */
export const STALE_TIMES = {
  // Static/rarely changing data (1 hour)
  STATIC: 60 * 60 * 1000,
  
  // Semi-static data (10 minutes)
  SEMI_STATIC: 10 * 60 * 1000,
  
  // Dynamic data (2 minutes)
  DYNAMIC: 2 * 60 * 1000,
  
  // Real-time data (30 seconds)
  REALTIME: 30 * 1000,
} as const;

/**
 * Default garbage collection times
 */
export const GC_TIMES = {
  // Keep in cache for 1 hour after becoming unused
  LONG: 60 * 60 * 1000,
  
  // Keep in cache for 10 minutes after becoming unused
  MEDIUM: 10 * 60 * 1000,
  
  // Keep in cache for 2 minutes after becoming unused
  SHORT: 2 * 60 * 1000,
} as const;

/**
 * Base optimized query hook with request deduplication
 */
export function useOptimizedQuery<T>(
  options: UseQueryOptions<T> & {
    deduplicationKey?: string;
  }
): UseQueryResult<T> {
  const { queryFn, deduplicationKey, ...restOptions } = options;
  
  const optimizedQueryFn = async () => {
    if (!queryFn) throw new Error('queryFn is required');
    
    // Apply deduplication if key provided
    if (deduplicationKey) {
      return deduplicateRequest(deduplicationKey, queryFn as () => Promise<T>);
    }
    
    return queryFn();
  };
  
  return useQuery({
    ...restOptions,
    queryFn: optimizedQueryFn,
    // Default to semi-static if not specified
    staleTime: restOptions.staleTime ?? STALE_TIMES.SEMI_STATIC,
    gcTime: restOptions.gcTime ?? GC_TIMES.MEDIUM,
    // Retry failed requests with exponential backoff
    retry: restOptions.retry ?? 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for static/rarely changing data
 * Examples: Feature flags, country lists, SDG definitions
 */
export function useStaticQuery<T>(
  options: UseQueryOptions<T> & { deduplicationKey?: string }
): UseQueryResult<T> {
  return useOptimizedQuery({
    ...options,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook for real-time data that needs frequent updates
 * Examples: Live donation amounts, active user counts
 */
export function useRealtimeQuery<T>(
  options: UseQueryOptions<T> & { deduplicationKey?: string }
): UseQueryResult<T> {
  return useOptimizedQuery({
    ...options,
    staleTime: STALE_TIMES.REALTIME,
    gcTime: GC_TIMES.SHORT,
    refetchInterval: STALE_TIMES.REALTIME,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for list queries with pagination
 * Optimized for dashboard lists and infinite scroll
 */
export function useListQuery<T>(
  options: UseQueryOptions<T[]> & {
    deduplicationKey?: string;
    keepPreviousData?: boolean;
  }
): UseQueryResult<T[]> {
  return useOptimizedQuery({
    ...options,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.MEDIUM,
    // Keep previous data while fetching to avoid layout shift
    placeholderData: options.keepPreviousData ? (prev: any) => prev : undefined,
  });
}

/**
 * Hook for detail queries (single item)
 * Optimized for detail pages
 */
export function useDetailQuery<T>(
  options: UseQueryOptions<T> & { deduplicationKey?: string }
): UseQueryResult<T> {
  return useOptimizedQuery({
    ...options,
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: GC_TIMES.LONG,
  });
}

/**
 * Hook for user-specific data
 * Automatically refetches on window focus
 */
export function useUserDataQuery<T>(
  options: UseQueryOptions<T> & { deduplicationKey?: string }
): UseQueryResult<T> {
  return useOptimizedQuery({
    ...options,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.MEDIUM,
    refetchOnWindowFocus: true,
  });
}
