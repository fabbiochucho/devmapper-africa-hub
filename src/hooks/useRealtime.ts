import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtime<T>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: T) => void,
  dependencies: any[] = []
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create channel for real-time updates
    channelRef.current = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
        },
        (payload) => {
          callback(payload as T);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, dependencies);

  return channelRef.current;
}

export function usePresence(
  roomId: string,
  userState: any,
  onPresenceSync?: (presences: any) => void,
  onPresenceJoin?: (joins: any) => void,
  onPresenceLeave?: (leaves: any) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = supabase.channel(roomId);

    if (onPresenceSync) {
      channelRef.current.on('presence' as any, { event: 'sync' }, onPresenceSync);
    }
    
    if (onPresenceJoin) {
      channelRef.current.on('presence' as any, { event: 'join' }, onPresenceJoin);
    }
    
    if (onPresenceLeave) {
      channelRef.current.on('presence' as any, { event: 'leave' }, onPresenceLeave);
    }

    channelRef.current.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channelRef.current?.track(userState);
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, userState]);

  return channelRef.current;
}