import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Participant {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_pinned: boolean;
  last_read_at: string | null;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  created_at: string;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  is_group: boolean;
  group_name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  last_message?: DirectMessage;
  unread_count: number;
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const realtimeRef = useRef<any>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get conversation IDs this user participates in
      const { data: partData, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, is_pinned, last_read_at')
        .eq('user_id', user.id);

      if (partError) throw partError;
      if (!partData?.length) { setConversations([]); return; }

      const convIds = partData.map(p => p.conversation_id);

      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Fetch all participants for these conversations with profiles
      const { data: allParts, error: allPartsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id, user_id, is_pinned, last_read_at,
          profiles:user_id (full_name, avatar_url, email)
        `)
        .in('conversation_id', convIds);

      if (allPartsError) throw allPartsError;

      // Fetch last message per conversation
      const lastMsgPromises = convIds.map(id =>
        supabase
          .from('direct_messages')
          .select('*, profiles:sender_id(full_name, avatar_url)')
          .eq('conversation_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );
      const lastMsgs = await Promise.all(lastMsgPromises);

      const formed: Conversation[] = (convData || []).map((conv, i) => {
        const myPart = partData.find(p => p.conversation_id === conv.id);
        const parts = (allParts || [])
          .filter(p => p.conversation_id === conv.id)
          .map(p => ({
            user_id: p.user_id,
            full_name: (p.profiles as any)?.full_name ?? null,
            avatar_url: (p.profiles as any)?.avatar_url ?? null,
            email: (p.profiles as any)?.email ?? null,
            is_pinned: p.is_pinned,
            last_read_at: p.last_read_at,
          }));

        const lastMsg = lastMsgs[i]?.data as DirectMessage | null;

        return {
          ...conv,
          participants: parts,
          last_message: lastMsg || undefined,
          unread_count: 0, // simplified; can be computed from last_read_at vs last message
        };
      });

      // Sort: pinned first, then by updated_at
      formed.sort((a, b) => {
        const aPinned = partData.find(p => p.conversation_id === a.id)?.is_pinned ?? false;
        const bPinned = partData.find(p => p.conversation_id === b.id)?.is_pinned ?? false;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      setConversations(formed);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          profiles:sender_id (full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as any[]) || []);

      // Mark as read
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [user]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text',
        });
      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  }, [user]);

  const startConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;
    try {
      // Check if a 1:1 conversation already exists
      const { data: existing } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (existing?.length) {
        const myConvIds = existing.map(e => e.conversation_id);
        const { data: otherParts } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', myConvIds);

        if (otherParts?.length) {
          // Check it's a 1:1 (not group)
          const sharedId = otherParts[0].conversation_id;
          const { data: convData } = await supabase
            .from('conversations')
            .select('id, is_group')
            .eq('id', sharedId)
            .eq('is_group', false)
            .maybeSingle();

          if (convData) {
            setSelectedConversationId(convData.id);
            return convData.id;
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({ is_group: false, created_by: user.id })
        .select()
        .single();

      if (convErr || !newConv) throw convErr;

      // Add both participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);

      await fetchConversations();
      setSelectedConversationId(newConv.id);
      return newConv.id;
    } catch (err) {
      console.error('Error starting conversation:', err);
      toast.error('Failed to start conversation');
      return null;
    }
  }, [user, fetchConversations]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !user) { setSearchResults([]); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, email')
        .neq('user_id', user.id)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  }, [user]);

  const togglePin = useCallback(async (conversationId: string, pinned: boolean) => {
    if (!user) return;
    await supabase
      .from('conversation_participants')
      .update({ is_pinned: pinned })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    fetchConversations();
  }, [user, fetchConversations]);

  // Subscribe to new messages in the selected conversation
  useEffect(() => {
    if (!selectedConversationId) return;
    fetchMessages(selectedConversationId);

    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
    }

    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as DirectMessage;
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', newMsg.sender_id)
            .maybeSingle();

          setMessages(prev => [
            ...prev,
            { ...newMsg, profiles: profile } as any
          ]);
        }
      )
      .subscribe();

    realtimeRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [selectedConversationId, fetchMessages]);

  // Subscribe to conversation list updates
  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const channel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    selectedConversationId,
    setSelectedConversationId,
    loading,
    messagesLoading,
    searchResults,
    sendMessage,
    startConversation,
    searchUsers,
    togglePin,
    fetchConversations,
  };
}
