/**
 * Route prefetching utility
 * Prefetches route chunks on hover/focus for instant navigation
 */

// Map of routes to their lazy import functions
const routeImports: Record<string, () => Promise<any>> = {
  '/analytics': () => import('@/pages/Analytics'),
  '/forum': () => import('@/pages/Forum'),
  '/my-projects': () => import('@/pages/MyProjects'),
  '/messages': () => import('@/pages/Messages'),
  '/submit-report': () => import('@/pages/SubmitReport'),
  '/settings': () => import('@/pages/Settings'),
  '/change-makers': () => import('@/pages/ChangeMakers'),
  '/fundraising': () => import('@/pages/Fundraising'),
  '/search': () => import('@/pages/SearchPage'),
  '/training': () => import('@/pages/Training'),
  '/esg': () => import('@/pages/ESG'),
  '/admin-dashboard': () => import('@/pages/AdminDashboard'),
  '/admin-crm': () => import('@/pages/AdminCRM'),
  '/pricing': () => import('@/pages/Pricing'),
};

// Track which routes have already been prefetched
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's code chunk
 * Safely handles errors and prevents duplicate prefetches
 */
export function prefetchRoute(path: string): void {
  // Normalize path
  const normalizedPath = path.split('?')[0].split('#')[0];
  
  if (prefetchedRoutes.has(normalizedPath)) return;
  
  const importFn = routeImports[normalizedPath];
  if (!importFn) return;
  
  prefetchedRoutes.add(normalizedPath);
  
  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleImport = typeof requestIdleCallback !== 'undefined' 
    ? requestIdleCallback 
    : (fn: () => void) => setTimeout(fn, 100);
  
  scheduleImport(() => {
    importFn().catch(() => {
      // Remove from cache so it can be retried
      prefetchedRoutes.delete(normalizedPath);
    });
  });
}

/**
 * Prefetch routes that are likely to be navigated to
 * Call this after initial page load to warm the cache
 */
export function prefetchCommonRoutes(): void {
  // Wait for the page to be fully interactive
  const schedule = typeof requestIdleCallback !== 'undefined'
    ? requestIdleCallback
    : (fn: () => void) => setTimeout(fn, 2000);

  schedule(() => {
    // Prefetch the most commonly navigated routes
    const commonRoutes = ['/analytics', '/my-projects', '/forum'];
    commonRoutes.forEach(route => prefetchRoute(route));
  });
}

/**
 * Create event handlers for link hover/focus prefetching
 * Usage: <NavLink {...prefetchHandlers('/analytics')} to="/analytics">
 */
export function prefetchHandlers(path: string) {
  return {
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
    onTouchStart: () => prefetchRoute(path),
  };
}
