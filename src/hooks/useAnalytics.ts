import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

interface AnalyticsEvent {
  event_type: string;
  event_data?: { [key: string]: Json | undefined };
  page_url?: string;
  referrer?: string;
}

/**
 * Analytics tracking hook with debounced page views and batched events
 */
export function useAnalytics() {
  const { user } = useAuth();
  const lastTrackedUrl = useRef<string | null>(null);
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Batched event flush - sends events in batches for efficiency
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;
    
    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];
    
    try {
      // Page views go through track-visit for everyone (it adds the country); other
      // events need a signed-in user, since analytics_events only accepts their own rows.
      for (const event of eventsToSend.filter(e => e.event_type === 'page_view')) {
        const url = typeof event.event_data?.url === 'string' ? event.event_data.url : window.location.href;
        void supabase.functions.invoke('track-visit', {
          body: { path: new URL(url).pathname, referrer: document.referrer, title: event.event_data?.title ?? document.title },
        });
      }
      const others = eventsToSend.filter(e => e.event_type !== 'page_view');
      if (!user || others.length === 0) return;

      const formattedEvents = others.map(event => ({
        ...event,
        user_id: user.id,
        page_url: event.page_url || (typeof window !== 'undefined' ? window.location.href : ''),
        referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        created_at: new Date().toISOString()
      }));

      await supabase.from('analytics_events').insert(formattedEvents);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [user?.id]);

  // Queue event with debounced flush
  const queueEvent = useCallback((event: AnalyticsEvent) => {
    eventQueue.current.push(event);
    
    // Clear existing timeout
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
    
    // Flush after 2 seconds of inactivity or when queue reaches 10 events
    if (eventQueue.current.length >= 10) {
      flushEvents();
    } else {
      flushTimeoutRef.current = setTimeout(flushEvents, 2000);
    }
  }, [flushEvents]);

  const track = useCallback((event: AnalyticsEvent) => {
    queueEvent(event);
  }, [queueEvent]);

  const trackPageView = useCallback(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    // Prevent duplicate tracking for same URL
    if (lastTrackedUrl.current === currentUrl) return;
    lastTrackedUrl.current = currentUrl;
    
    queueEvent({
      event_type: 'page_view',
      event_data: {
        title: typeof document !== 'undefined' ? document.title : '',
        url: currentUrl,
        timestamp: Date.now()
      }
    });
  }, [queueEvent]);

  const trackClick = useCallback((element: string, data?: { [key: string]: Json | undefined }) => {
    queueEvent({
      event_type: 'click',
      event_data: {
        element,
        ...data,
        timestamp: Date.now()
      }
    });
  }, [queueEvent]);

  const trackCustomEvent = useCallback((eventType: string, data?: { [key: string]: Json | undefined }) => {
    queueEvent({
      event_type: eventType,
      event_data: {
        ...data,
        timestamp: Date.now()
      }
    });
  }, [queueEvent]);

  // Auto-track page views on mount only (not on every visibility change)
  useEffect(() => {
    trackPageView();

    // Flush remaining events when user leaves page
    const handleBeforeUnload = () => {
      flushEvents();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushEvents();
    };
  }, [trackPageView, flushEvents]);

  return {
    track,
    trackPageView,
    trackClick,
    trackCustomEvent
  };
}
