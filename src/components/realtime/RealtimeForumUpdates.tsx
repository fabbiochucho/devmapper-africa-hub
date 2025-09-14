import React, { useEffect, useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Heart, Users } from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  likes_count: number;
  replies_count: number;
  author_id: string;
}

export function RealtimeForumUpdates() {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);

  // Listen for new forum posts
  useRealtime<{ new: ForumPost }>(
    'forum_posts',
    'INSERT',
    (payload) => {
      const newPost = payload.new;
      setRecentActivity(prev => [
        {
          type: 'new_post',
          title: newPost.title,
          time: new Date(),
          id: newPost.id
        },
        ...prev.slice(0, 4)
      ]);
      
      toast.success('New forum post: ' + newPost.title);
    }
  );

  // Listen for likes
  useRealtime<{ new: any }>(
    'forum_post_likes',
    'INSERT',
    (payload) => {
      setRecentActivity(prev => [
        {
          type: 'new_like',
          time: new Date(),
          id: payload.new.id
        },
        ...prev.slice(0, 4)
      ]);
    }
  );

  // Simulate online user presence
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(Math.floor(Math.random() * 50) + 10);
    }, 30000);
    
    setOnlineUsers(Math.floor(Math.random() * 50) + 10);
    return () => clearInterval(interval);
  }, []);

  if (recentActivity.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Live Activity</h3>
        <Badge variant="secondary" className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <Users className="w-3 h-3" />
          {onlineUsers}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {recentActivity.map((activity, index) => (
          <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
            {activity.type === 'new_post' ? (
              <>
                <MessageSquare className="w-3 h-3 text-blue-500" />
                <span className="truncate">New post: {activity.title}</span>
              </>
            ) : (
              <>
                <Heart className="w-3 h-3 text-red-500" />
                <span>Someone liked a post</span>
              </>
            )}
            <span className="text-xs">
              {Math.floor((Date.now() - activity.time.getTime()) / 1000)}s ago
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}