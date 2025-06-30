
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MessageCircle, Users, Pin } from 'lucide-react';

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away';
  }>;
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  isPinned?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredConversations = conversations.filter(conversation => {
    const searchText = searchTerm.toLowerCase();
    return (
      conversation.isGroup 
        ? conversation.groupName?.toLowerCase().includes(searchText)
        : conversation.participants.some(p => 
            p.name.toLowerCase().includes(searchText) || 
            p.email.toLowerCase().includes(searchText)
          )
    ) || conversation.lastMessage.content.toLowerCase().includes(searchText);
  });

  const sortedConversations = filteredConversations.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
  });

  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.groupName || 'Group Chat';
    }
    const otherParticipant = conversation.participants.find(p => p.id !== 'current-user');
    return otherParticipant?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return null; // Group avatars could be handled differently
    }
    const otherParticipant = conversation.participants.find(p => p.id !== 'current-user');
    return otherParticipant?.avatar;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    const content = conversation.lastMessage.content;
    const maxLength = 40;
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Button onClick={onNewConversation} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={`m-2 cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedConversationId === conversation.id ? 'bg-muted' : ''
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={getConversationAvatar(conversation)} />
                    <AvatarFallback>
                      {conversation.isGroup ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        getConversationName(conversation).charAt(0)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  {!conversation.isGroup && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      conversation.participants.find(p => p.id !== 'current-user')?.status === 'online'
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {getConversationName(conversation)}
                    </h3>
                    {conversation.isPinned && (
                      <Pin className="w-3 h-3 text-muted-foreground" />
                    )}
                    {conversation.isGroup && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {conversation.participants.length}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {getLastMessagePreview(conversation)}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(conversation.lastMessage.timestamp)}
                  </span>
                  
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {sortedConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No conversations found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Start a new conversation to get started'}
            </p>
            <Button onClick={onNewConversation}>
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
