import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Pin, PinOff, Trash2, Eye, Flag, Loader2, MessageSquare, ThumbsUp } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: string;
  tags: string[];
  is_pinned: boolean;
  likes_count: number;
  replies_count: number;
  views_count: number;
  created_at: string;
}

const ForumModeration = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading forum posts:", error);
      toast.error("Failed to load forum posts");
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (post: ForumPost) => {
    setActionLoading(post.id);
    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({ is_pinned: !post.is_pinned })
        .eq("id", post.id);

      if (error) throw error;
      toast.success(post.is_pinned ? "Post unpinned" : "Post pinned");
      loadPosts();
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update post");
    } finally {
      setActionLoading(null);
    }
  };

  const deletePost = async (postId: string) => {
    setActionLoading(postId);
    try {
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
      toast.success("Post deleted");
      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      post.category.toLowerCase().includes(term)
    );
  });

  const pinnedPosts = filteredPosts.filter(p => p.is_pinned);
  const regularPosts = filteredPosts.filter(p => !p.is_pinned);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search forum posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadPosts}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Posts</p>
            <p className="text-2xl font-bold">{posts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pinned</p>
            <p className="text-2xl font-bold">{pinnedPosts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Replies</p>
            <p className="text-2xl font-bold">{posts.reduce((sum, p) => sum + p.replies_count, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Views</p>
            <p className="text-2xl font-bold">{posts.reduce((sum, p) => sum + p.views_count, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Forum Posts</CardTitle>
          <CardDescription>Manage, pin, and moderate forum discussions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No posts found</p>
          ) : (
            <div className="space-y-3">
              {/* Pinned Posts */}
              {pinnedPosts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned Posts
                  </h4>
                  <div className="space-y-2">
                    {pinnedPosts.map((post) => (
                      <PostRow
                        key={post.id}
                        post={post}
                        onTogglePin={togglePin}
                        onDelete={deletePost}
                        loading={actionLoading === post.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Posts */}
              <div className="space-y-2">
                {regularPosts.map((post) => (
                  <PostRow
                    key={post.id}
                    post={post}
                    onTogglePin={togglePin}
                    onDelete={deletePost}
                    loading={actionLoading === post.id}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface PostRowProps {
  post: ForumPost;
  onTogglePin: (post: ForumPost) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const PostRow = ({ post, onTogglePin, onDelete, loading }: PostRowProps) => {
  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {post.is_pinned && <Pin className="w-3 h-3 text-primary" />}
          <h4 className="font-medium text-sm">{post.title}</h4>
          <Badge variant="outline" className="text-xs">{post.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{post.content}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {post.likes_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {post.replies_count}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {post.views_count}
          </span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onTogglePin(post)}
          disabled={loading}
        >
          {post.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{post.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(post.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ForumModeration;
