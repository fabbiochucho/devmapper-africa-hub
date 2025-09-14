import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsEvent {
  event_type: string;
  event_data?: any;
  page_url?: string;
  referrer?: string;
}

export function useAnalytics() {
  const { user } = useAuth();

  const track = async (event: AnalyticsEvent) => {
    try {
      const eventData = {
        ...event,
        user_id: user?.id || null,
        page_url: event.page_url || window.location.href,
        referrer: event.referrer || document.referrer,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      await supabase
        .from('analytics_events')
        .insert([eventData]);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  const trackPageView = () => {
    track({
      event_type: 'page_view',
      event_data: {
        title: document.title,
        url: window.location.href,
        timestamp: Date.now()
      }
    });
  };

  const trackClick = (element: string, data?: any) => {
    track({
      event_type: 'click',
      event_data: {
        element,
        ...data,
        timestamp: Date.now()
      }
    });
  };

  const trackCustomEvent = (eventType: string, data?: any) => {
    track({
      event_type: eventType,
      event_data: {
        ...data,
        timestamp: Date.now()
      }
    });
  };

  // Auto-track page views
  useEffect(() => {
    trackPageView();

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackPageView();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    track,
    trackPageView,
    trackClick,
    trackCustomEvent
  };
}