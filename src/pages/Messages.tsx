
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Send, Smile, Paperclip, MoreVertical, Phone, Video, Info,
  Search, Plus, Users, MessageCircle, Pin, Check, CheckCheck
} from 'lucide-react';
import { useMessages, Conversation, DirectMessage } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';

// ── Conversation List ────────────────────────────────────────────────────────
function ConversationListPanel({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
  onNewConversation,
  loading,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
  onNewConversation: () => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState('');

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find(p => p.user_id !== currentUserId);

  const getDisplayName = (conv: Conversation) => {
    if (conv.is_group) return conv.group_name || 'Group Chat';
    return getOtherParticipant(conv)?.full_name || 'Unknown User';
  };

  const getAvatar = (conv: Conversation) => {
    if (conv.is_group) return null;
    return getOtherParticipant(conv)?.avatar_url;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  };

  const filtered = conversations.filter(c => {
    const name = getDisplayName(c).toLowerCase();
    const lastMsg = c.last_message?.content?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || lastMsg.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="sm" onClick={onNewConversation}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageCircle className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No results found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          filtered.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                selectedId === conv.id ? 'bg-muted' : ''
              }`}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={getAvatar(conv) || undefined} />
                  <AvatarFallback>
                    {conv.is_group
                      ? <Users className="w-5 h-5" />
                      : getDisplayName(conv).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {conv.is_group && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {conv.participants.length}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium truncate text-sm">{getDisplayName(conv)}</span>
                  {conv.participants.find(p => p.user_id === currentUserId)?.is_pinned && (
                    <Pin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.last_message?.content || 'No messages yet'}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {conv.last_message ? formatTime(conv.last_message.created_at) : formatTime(conv.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Message Thread ───────────────────────────────────────────────────────────
function MessageThreadPanel({
  conversation,
  messages,
  loading,
  onSend,
  currentUserId,
}: {
  conversation: Conversation | null;
  messages: DirectMessage[];
  loading: boolean;
  onSend: (content: string) => void;
  currentUserId: string;
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select a conversation or start a new one to connect with community members.
        </p>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(p => p.user_id !== currentUserId);
  const displayName = conversation.is_group
    ? conversation.group_name || 'Group Chat'
    : otherParticipant?.full_name || 'Unknown';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherParticipant?.avatar_url || undefined} />
            <AvatarFallback>
              {conversation.is_group ? <Users className="w-5 h-5" /> : displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{displayName}</h3>
            <p className="text-xs text-muted-foreground">
              {conversation.is_group
                ? `${conversation.participants.length} members`
                : otherParticipant?.email || ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm"><Phone className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm"><Video className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm"><Info className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUserId;
            const senderProfile = (msg as any).profiles;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                {!isMine && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={senderProfile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {senderProfile?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-2 text-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <Button type="submit" size="sm" disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── New Conversation Dialog ──────────────────────────────────────────────────
function NewConversationDialog({
  open,
  onClose,
  onStart,
  searchUsers,
  searchResults,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (userId: string) => void;
  searchUsers: (q: string) => void;
  searchResults: any[];
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => searchUsers(query), 300);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              autoFocus
              placeholder="Search by name or email..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {searchResults.map(u => (
              <button
                key={u.user_id}
                onClick={() => { onStart(u.user_id); onClose(); setQuery(''); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback>{(u.full_name || u.email || '?').charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{u.full_name || 'Unnamed User'}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </button>
            ))}
            {query && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Messages Page ───────────────────────────────────────────────────────
const Messages = () => {
  const { user } = useAuth();
  const {
    conversations, messages, selectedConversationId, setSelectedConversationId,
    loading, messagesLoading, searchResults, sendMessage, startConversation,
    searchUsers,
  } = useMessages();

  const [newConvOpen, setNewConvOpen] = useState(false);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) ?? null;

  const handleSend = (content: string) => {
    if (selectedConversationId) sendMessage(selectedConversationId, content);
  };

  const handleStartConversation = async (userId: string) => {
    await startConversation(userId);
    setNewConvOpen(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to access messages.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 h-full border rounded-xl overflow-hidden bg-background">
        {/* Left: Conversation List */}
        <div className="lg:col-span-1 h-full overflow-hidden">
          <ConversationListPanel
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            currentUserId={user.id}
            onNewConversation={() => setNewConvOpen(true)}
            loading={loading}
          />
        </div>

        {/* Right: Message Thread */}
        <div className="lg:col-span-2 h-full overflow-hidden">
          <MessageThreadPanel
            conversation={selectedConversation}
            messages={messages}
            loading={messagesLoading}
            onSend={handleSend}
            currentUserId={user.id}
          />
        </div>
      </div>

      <NewConversationDialog
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onStart={handleStartConversation}
        searchUsers={searchUsers}
        searchResults={searchResults}
      />
    </div>
  );
};

export default Messages;
