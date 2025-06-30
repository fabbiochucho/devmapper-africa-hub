
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Smile, Paperclip, MoreVertical, Phone, Video, Info } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isCurrentUser: boolean;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
}

interface MessageThreadProps {
  conversation: {
    id: string;
    participants: Array<{
      id: string;
      name: string;
      email: string;
      avatar?: string;
      status: 'online' | 'offline' | 'away';
      lastSeen?: string;
    }>;
    messages: Message[];
    isGroup: boolean;
    groupName?: string;
  };
  onSendMessage: (content: string) => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({ conversation, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const otherParticipant = conversation.participants.find(p => p.id !== 'current-user');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherParticipant?.avatar} />
              <AvatarFallback>{otherParticipant?.name.charAt(0) || 'G'}</AvatarFallback>
            </Avatar>
            {otherParticipant && (
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(otherParticipant.status)}`} />
            )}
          </div>
          <div>
            <h3 className="font-semibold">
              {conversation.isGroup ? conversation.groupName : otherParticipant?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {conversation.isGroup 
                ? `${conversation.participants.length} members`
                : otherParticipant?.status === 'online' 
                  ? 'Online' 
                  : `Last seen ${otherParticipant?.lastSeen}`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Info className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-xs lg:max-w-md ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}>
              {!message.isCurrentUser && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.sender.avatar} />
                  <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`rounded-lg p-3 ${
                message.isCurrentUser 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <p className="text-sm">{message.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${
                  message.isCurrentUser ? 'justify-end' : 'justify-start'
                }`}>
                  <span className="text-xs opacity-70">{message.timestamp}</span>
                  {message.isCurrentUser && (
                    <div className="flex">
                      <div className={`w-1 h-1 rounded-full ${
                        message.status === 'read' ? 'bg-green-400' : 
                        message.status === 'delivered' ? 'bg-gray-400' : 'bg-gray-300'
                      }`} />
                      <div className={`w-1 h-1 rounded-full ml-0.5 ${
                        message.status === 'read' ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherParticipant?.avatar} />
              <AvatarFallback>{otherParticipant?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-10"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MessageThread;
