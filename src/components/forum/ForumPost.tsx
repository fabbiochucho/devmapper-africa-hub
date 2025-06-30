
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Pin, 
  Flag, 
  ChevronUp, 
  ChevronDown,
  Eye,
  Clock
} from 'lucide-react';

interface ForumPostProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: {
      name: string;
      avatar?: string;
      role: string;
      verified: boolean;
    };
    category: string;
    tags: string[];
    likes: number;
    replies: number;
    views: number;
    createdAt: string;
    isPinned?: boolean;
    isLiked?: boolean;
  };
  onLike?: (postId: string) => void;
  onReply?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

const ForumPost: React.FC<ForumPostProps> = ({ post, onLike, onReply, onShare }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLike = () => {
    onLike?.(post.id);
  };

  const handleReply = () => {
    onReply?.(post.id);
  };

  const handleShare = () => {
    onShare?.(post.id);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Discussion':
        return 'bg-blue-100 text-blue-800';
      case 'Question':
        return 'bg-green-100 text-green-800';
      case 'Announcement':
        return 'bg-purple-100 text-purple-800';
      case 'Support':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{post.author.name}</span>
                {post.author.verified && (
                  <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0">✓</Badge>
                )}
                <Badge variant="outline" className="text-xs">{post.author.role}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{post.createdAt}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.isPinned && (
              <Pin className="w-4 h-4 text-orange-500" />
            )}
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={getCategoryColor(post.category)}>
              {post.category}
            </Badge>
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
            <div className={`text-muted-foreground ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {post.content}
            </div>
            {post.content.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0 h-auto text-primary"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show more
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-2 ${post.isLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                {post.likes}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReply}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {post.replies}
              </Button>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                {post.views}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForumPost;
