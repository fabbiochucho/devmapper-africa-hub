
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
  Send,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserBadgeList } from '@/components/badges/UserBadgeList';
import { supabase } from '@/integrations/supabase/client';

interface ForumReply {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; avatar: string };
}

interface ForumPostProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: {
      id?: string;
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
  onReply?: (postId: string, content: string) => void | Promise<void>;
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
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replies, setReplies] = useState<ForumReply[] | null>(null);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const categoryStyle = categoryConfig[post.category] || { bg: 'bg-muted', text: 'text-muted-foreground' };

  const categoryClass = categoryConfig[post.category] ?? 'bg-muted text-muted-foreground';

  const handleLike = () => onLike?.(post.id);
  const handleShare = () => onShare?.(post.id);
  const handleDelete = () => onDelete?.(post.id);
  const handlePin = () => onPin?.(post.id);

  const loadReplies = async () => {
    setLoadingReplies(true);
    try {
      const { data: replyRows, error } = await supabase
        .from('forum_replies')
        .select('id, content, created_at, author_id')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const authorIds = Array.from(new Set((replyRows || []).map(r => r.author_id).filter(Boolean)));
      const { data: authorProfiles } = authorIds.length
        ? await supabase.from('public_profiles').select('user_id, full_name, avatar_url').in('user_id', authorIds)
        : { data: [] as { user_id: string; full_name: string | null; avatar_url: string | null }[] };
      const profileMap = new Map((authorProfiles || []).map(p => [p.user_id, p]));

      setReplies((replyRows || []).map(r => {
        const prof = profileMap.get(r.author_id);
        return {
          id: r.id,
          content: r.content,
          createdAt: new Date(r.created_at).toLocaleString(),
          author: { name: prof?.full_name || 'Anonymous', avatar: prof?.avatar_url || '/placeholder.svg' },
        };
      }));
    } catch {
      setReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = () => {
    const next = !showReply;
    setShowReply(next);
    if (next && replies === null) loadReplies();
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !onReply) return;
    setSubmittingReply(true);
    try {
      await onReply(post.id, replyContent.trim());
      setReplyContent('');
      await loadReplies();
    } finally {
      setSubmittingReply(false);
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
                <UserBadgeList userId={post.author.id} max={2} />
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
                onClick={toggleReplies}
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

          {/* Replies list + inline reply form */}
          {showReply && (
            <div className="border-t pt-3 space-y-3">
              {loadingReplies ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : replies && replies.length > 0 ? (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={reply.author.avatar} />
                        <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{reply.author.name}</span>
                          <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : replies && replies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No replies yet — be the first.</p>
              ) : null}

              {onReply && (
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
                    <Button type="submit" size="sm" disabled={!replyContent.trim() || submittingReply}>
                      <Send className="w-4 h-4 mr-1" />{submittingReply ? 'Posting...' : 'Reply'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ForumPost;
