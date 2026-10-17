// Error monitoring with Sentry. The DSN is public (it only allows sending events);
// empty = off. Privacy: no session replay, no tracing, no personal data, and events
// carry the page path but not query strings, which can hold emails or tokens.
const SENTRY_DSN = '';

type SentryModule = typeof import('@sentry/react');
let sentry: SentryModule | null = null;

export async function initSentry(): Promise<void> {
  if (!SENTRY_DSN || ['localhost', '127.0.0.1'].includes(location.hostname)) return;
  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: location.hostname === 'devmapper.africa' ? 'production' : 'preview',
    // Collect no personal data: no user, cookies, headers, bodies or query strings.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    tracesSampleRate: 0,
    // Keep breadcrumbs (page changes, failed requests) but never console output or clicked text.
    beforeBreadcrumb: (crumb) => (crumb.category === 'console' || crumb.category === 'ui.click' ? null : crumb),
    beforeSend(event) {
      if (event.request?.url) event.request.url = event.request.url.split('?')[0];
      delete event.user;
      return event;
    },
  });
  sentry = Sentry;
}

export function captureError(error: unknown): void {
  sentry?.captureException(error);
}
