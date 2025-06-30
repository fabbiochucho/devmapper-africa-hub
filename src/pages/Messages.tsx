
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Video, Phone } from 'lucide-react';
import ConversationList from '@/components/messages/ConversationList';
import MessageThread from '@/components/messages/MessageThread';

const Messages = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>('1');

  const mockConversations = [
    {
      id: '1',
      participants: [
        {
          id: 'current-user',
          name: 'You',
          email: 'you@example.com',
          status: 'online' as const
        },
        {
          id: 'user-2',
          name: 'Amina Hassan',
          email: 'amina@example.com',
          avatar: '/api/placeholder/40/40',
          status: 'online' as const
        }
      ],
      lastMessage: {
        content: 'Thanks for sharing those insights about community engagement!',
        timestamp: '2024-01-15T10:30:00Z',
        senderId: 'user-2'
      },
      unreadCount: 2,
      isGroup: false,
      isPinned: true
    },
    {
      id: '2',
      participants: [
        {
          id: 'current-user',
          name: 'You',
          email: 'you@example.com',
          status: 'online' as const
        },
        {
          id: 'user-3',
          name: 'John Kwame',
          email: 'john@example.com',
          avatar: '/api/placeholder/40/40',
          status: 'away' as const
        }
      ],
      lastMessage: {
        content: 'I\'ll review the water project data and get back to you',
        timestamp: '2024-01-15T09:15:00Z',
        senderId: 'current-user'
      },
      unreadCount: 0,
      isGroup: false
    },
    {
      id: '3',
      participants: [
        {
          id: 'current-user',
          name: 'You',
          email: 'you@example.com',
          status: 'online' as const
        },
        {
          id: 'user-4',
          name: 'Sarah Okonkwo',
          email: 'sarah@example.com',
          avatar: '/api/placeholder/40/40',
          status: 'offline' as const,
          lastSeen: '2 hours ago'
        },
        {
          id: 'user-5',
          name: 'Michael Chen',
          email: 'michael@example.com',
          avatar: '/api/placeholder/40/40',
          status: 'online' as const
        }
      ],
      lastMessage: {
        content: 'Great! Let\'s schedule a meeting to discuss the partnership details',
        timestamp: '2024-01-14T16:45:00Z',
        senderId: 'user-4'
      },
      unreadCount: 1,
      isGroup: true,
      groupName: 'Kenya Education Project',
      isPinned: false
    }
  ];

  const mockMessages = {
    '1': [
      {
        id: '1',
        content: 'Hi! I saw your post about community engagement best practices. Very insightful!',
        sender: {
          id: 'user-2',
          name: 'Amina Hassan',
          avatar: '/api/placeholder/40/40'
        },
        timestamp: '10:25 AM',
        isCurrentUser: false,
        type: 'text' as const,
        status: 'read' as const
      },
      {
        id: '2',
        content: 'Thank you! I\'ve learned so much from working with different communities across West Africa.',
        sender: {
          id: 'current-user',
          name: 'You'
        },
        timestamp: '10:27 AM',
        isCurrentUser: true,
        type: 'text' as const,
        status: 'read' as const
      },
      {
        id: '3',
        content: 'Would you be interested in collaborating on a project in Ghana? We\'re looking for experienced partners.',
        sender: {
          id: 'user-2',
          name: 'Amina Hassan',
          avatar: '/api/placeholder/40/40'
        },
        timestamp: '10:28 AM',
        isCurrentUser: false,
        type: 'text' as const,
        status: 'read' as const
      },
      {
        id: '4',
        content: 'That sounds really interesting! I\'d love to learn more about the project. Can you share some details?',
        sender: {
          id: 'current-user',
          name: 'You'
        },
        timestamp: '10:30 AM',
        isCurrentUser: true,
        type: 'text' as const,
        status: 'delivered' as const
      },
      {
        id: '5',
        content: 'Thanks for sharing those insights about community engagement!',
        sender: {
          id: 'user-2',
          name: 'Amina Hassan',
          avatar: '/api/placeholder/40/40'
        },
        timestamp: '10:30 AM',
        isCurrentUser: false,
        type: 'text' as const,
        status: 'read' as const
      }
    ],
    '2': [
      {
        id: '1',
        content: 'Hi John! I need your help with verifying some water project data.',
        sender: {
          id: 'current-user',
          name: 'You'
        },
        timestamp: '9:10 AM',
        isCurrentUser: true,
        type: 'text' as const,
        status: 'read' as const
      },
      {
        id: '2',
        content: 'Sure! Send me the details and I\'ll take a look.',
        sender: {
          id: 'user-3',
          name: 'John Kwame',
          avatar: '/api/placeholder/40/40'
        },
        timestamp: '9:12 AM',
        isCurrentUser: false,
        type: 'text' as const,
        status: 'read' as const
      },
      {
        id: '3',
        content: 'I\'ll review the water project data and get back to you',
        sender: {
          id: 'current-user',
          name: 'You'
        },
        timestamp: '9:15 AM',
        isCurrentUser: true,
        type: 'text' as const,
        status: 'read' as const
      }
    ],
    '3': [
      {
        id: '1',
        content: 'Welcome to the Kenya Education Project discussion!',
        sender: {
          id: 'user-4',
          name: 'Sarah Okonkwo',
          avatar: '/api/placeholder/40/40'
        },
        timestamp: 'Yesterday',
        isCurrentUser: false,
        type: 'text' as const,
        status: 'read' as const
      },
      {
        id: '2',
        content: 'Thanks for adding me to the group. Looking forward to collaborating!',
        sender: {
          id: 'current-user',
          name: 'You'
        },
        timestamp: 'Yesterday',
        isCurrentUser: true,
        type: 'text' as const,
        status: 'read' as const
      },
      {
        id: '3',
        content: 'Great! Let\'s schedule a meeting to discuss the partnership details',
        sender: {
          id: 'user-4',
          name: 'Sarah Okonkwo',
          avatar: '/api/placeholder/40/40'
        },
        timestamp: 'Yesterday',
        isCurrentUser: false,
        type: 'text' as const,
        status: 'read' as const
      }
    ]
  };

  const selectedConversation = selectedConversationId 
    ? mockConversations.find(c => c.id === selectedConversationId)
    : null;

  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content, 'to conversation:', selectedConversationId);
    // In a real app, this would send the message to the backend
  };

  const handleNewConversation = () => {
    console.log('Creating new conversation');
    // In a real app, this would open a user selection dialog
  };

  return (
    <div className="container mx-auto p-4 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <ConversationList
              conversations={mockConversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onNewConversation={handleNewConversation}
            />
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {selectedConversation ? (
              <MessageThread
                conversation={{
                  ...selectedConversation,
                  messages: mockMessages[selectedConversationId as keyof typeof mockMessages] || []
                }}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to Messages</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Connect with other community members, share insights, and collaborate on sustainable development projects across Africa.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                  <Button onClick={handleNewConversation} className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Start Chat
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Create Group
                  </Button>
                </div>
                
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Quick Actions</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Video Call
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Voice Call
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
