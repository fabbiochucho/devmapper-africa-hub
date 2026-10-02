import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribes to postgres_changes on a public table for the component's lifetime.
 * The latest `callback` is kept in a ref, so passing an inline function doesn't
 * tear down and re-create the channel on every render.
 */
export function useRealtime<T>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: T) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    channelRef.current = supabase
      .channel(`${table}-changes`)
      // supabase-js overloads take a literal event; '*' accepts every event type at runtime.
      .on('postgres_changes', { event: event as '*', schema: 'public', table }, (payload) => {
        callbackRef.current(payload as unknown as T);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event]);

  return channelRef.current;
}
