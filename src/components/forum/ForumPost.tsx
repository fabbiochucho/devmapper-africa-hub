
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
  Clock,
  Trash2,
  X,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  onReply?: (postId: string, content: string) => void;
  onShare?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPin?: (postId: string) => void;
  isAdmin?: boolean;
}

const categoryConfig: Record<string, string> = {
  Discussion: 'bg-primary/10 text-primary',
  Question: 'bg-accent text-accent-foreground',
  Announcement: 'bg-secondary text-secondary-foreground',
  Support: 'bg-muted text-muted-foreground',
  'Project Update': 'bg-primary/5 text-primary',
  'Resource Sharing': 'bg-secondary/50 text-secondary-foreground',
};

const ForumPost: React.FC<ForumPostProps> = ({
  post,
  onLike,
  onReply,
  onShare,
  onDelete,
  onPin,
  isAdmin = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const categoryStyle = categoryConfig[post.category] || { bg: 'bg-muted', text: 'text-muted-foreground' };

  const categoryClass = categoryConfig[post.category] ?? 'bg-muted text-muted-foreground';

  const handleLike = () => onLike?.(post.id);
  const handleShare = () => onShare?.(post.id);
  const handleDelete = () => onDelete?.(post.id);
  const handlePin = () => onPin?.(post.id);

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      onReply?.(post.id, replyContent.trim());
      setReplyContent('');
      setShowReply(false);
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
                  <Badge className="bg-primary/10 text-primary text-xs px-1 py-0 border-0">✓ Verified</Badge>
                )}
                <Badge variant="outline" className="text-xs">{post.author.role}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{post.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {post.isPinned && (
              <Pin className="w-4 h-4 text-muted-foreground" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className="w-4 h-4 mr-2" />
                  Report Post
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className="w-4 h-4 mr-2" />
                      {post.isPinned ? 'Unpin Post' : 'Pin Post'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryClass}`}>
              {post.category}
            </span>
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
            <div className={`text-muted-foreground text-sm leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {post.content}
            </div>
            {post.content.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0 h-auto text-primary mt-1"
              >
                {isExpanded ? (
                  <><ChevronUp className="w-4 h-4 mr-1" />Show less</>
                ) : (
                  <><ChevronDown className="w-4 h-4 mr-1" />Show more</>
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-1.5 ${post.isLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{post.likes}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{post.replies}</span>
              </Button>

              <div className="flex items-center gap-1 text-sm text-muted-foreground px-2">
                <Eye className="w-4 h-4" />
                <span>{post.views}</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Inline reply form */}
          {showReply && (
            <div className="border-t pt-3">
              <form onSubmit={handleSubmitReply} className="space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowReply(false); setReplyContent(''); }}
                  >
                    <X className="w-4 h-4 mr-1" />Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!replyContent.trim()}>
                    <Send className="w-4 h-4 mr-1" />Reply
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ForumPost;
