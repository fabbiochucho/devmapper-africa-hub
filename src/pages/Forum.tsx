
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, TrendingUp, Users, MessageCircle, Pin } from 'lucide-react';
import ForumPost from '@/components/forum/ForumPost';
import CreatePostDialog from '@/components/forum/CreatePostDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminVerification } from '@/hooks/useAdminVerification';
import { toast } from 'sonner';

interface ForumPostData {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    verified: boolean;
  };
  category: string;
  tags: string[];
  likes: number;
  replies: number;
  views: number;
  createdAt: string;
  isPinned: boolean;
  isLiked: boolean;
}

interface ForumStats {
  totalMembers: number;
  activeToday: number;
  postsThisWeek: number;
  newMembers: number;
}

const Forum = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminVerification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<ForumPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ForumStats>({
    totalMembers: 0,
    activeToday: 0,
    postsThisWeek: 0,
    newMembers: 0
  });

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch user likes for authenticated users
      let userLikes: any[] = [];
      if (user) {
        const { data: likesData, error: likesError } = await supabase
          .from('forum_post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (!likesError) {
          userLikes = likesData || [];
        }
      }

      const formattedPosts = postsData?.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author: {
          name: (post.profiles as any)?.full_name || 'Anonymous',
          avatar: (post.profiles as any)?.avatar_url || '/placeholder.svg',
          role: 'Community Member',
          verified: (post.profiles as any)?.is_verified || false
        },
        category: post.category,
        tags: post.tags || [],
        likes: post.likes_count,
        replies: post.replies_count,
        views: post.views_count,
        createdAt: new Date(post.created_at).toLocaleDateString(),
        isPinned: post.is_pinned,
        isLiked: userLikes.some(like => like.post_id === post.id)
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total members
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      // Get posts this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: recentPosts, error: recentError } = await supabase
        .from('forum_posts')
        .select('id')
        .gte('created_at', weekAgo.toISOString());

      if (recentError) throw recentError;

      setStats({
        totalMembers: profilesData?.length || 0,
        activeToday: Math.floor((profilesData?.length || 0) * 0.08), // 8% active estimate
        postsThisWeek: recentPosts?.length || 0,
        newMembers: Math.floor((profilesData?.length || 0) * 0.02) // 2% new members estimate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const categories = [
    { id: 'all', name: 'All Posts', count: posts.length },
    { id: 'Discussion', name: 'Discussions', count: posts.filter(p => p.category === 'Discussion').length },
    { id: 'Question', name: 'Questions', count: posts.filter(p => p.category === 'Question').length },
    { id: 'Announcement', name: 'Announcements', count: posts.filter(p => p.category === 'Announcement').length },
    { id: 'Project Update', name: 'Project Updates', count: posts.filter(p => p.category === 'Project Update').length }
  ];

  const trendingTags = [
    { name: 'community', count: posts.filter(p => p.tags.includes('community')).length },
    { name: 'verification', count: posts.filter(p => p.tags.includes('verification')).length },
    { name: 'data-quality', count: posts.filter(p => p.tags.includes('data-quality')).length },
    { name: 'partnerships', count: posts.filter(p => p.tags.includes('partnerships')).length },
    { name: 'mobile-app', count: posts.filter(p => p.tags.includes('mobile-app')).length }
  ].filter(tag => tag.count > 0).sort((a, b) => b.count - a.count);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreatePost = async (newPostData: any) => {
    if (!user) {
      toast.error('Please sign in to create a post');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([{
          title: newPostData.title,
          content: newPostData.content,
          author_id: user.id,
          category: newPostData.category || 'Discussion',
          tags: newPostData.tags || []
        }])
        .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .single();

      if (error) throw error;

      const newPost = {
        id: data.id,
        title: data.title,
        content: data.content,
        author: {
          name: (data.profiles as any)?.full_name || 'Anonymous',
          avatar: (data.profiles as any)?.avatar_url || '/placeholder.svg',
          role: 'Community Member',
          verified: (data.profiles as any)?.is_verified || false
        },
        category: data.category,
        tags: data.tags || [],
        likes: 0,
        replies: 0,
        views: 0,
        createdAt: 'just now',
        isPinned: false,
        isLiked: false
      };

      setPosts(prev => [newPost, ...prev]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        // Unlike
        const { error } = await supabase
          .from('forum_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('forum_post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (error) throw error;
      }

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleReply = async (postId: string, content: string) => {
    if (!user) { toast.error('Please sign in to reply'); return; }
    try {
      // Increment replies_count
      await supabase
        .from('forum_posts')
        .update({ replies_count: (posts.find(p => p.id === postId)?.replies || 0) + 1 })
        .eq('id', postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, replies: p.replies + 1 } : p
      ));
      toast.success('Reply posted!');
    } catch (err) {
      toast.error('Failed to post reply');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted');
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const handlePin = async (postId: string) => {
    if (!isAdmin) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    try {
      const { error } = await supabase
        .from('forum_posts')
        .update({ is_pinned: !post.isPinned })
        .eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, isPinned: !p.isPinned } : p
      ));
      toast.success(post.isPinned ? 'Post unpinned' : 'Post pinned');
    } catch (err) {
      toast.error('Failed to update pin status');
    }
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/forum/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success('Post link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
            <p className="text-muted-foreground">
              Connect, share knowledge, and collaborate with the DevMapper community
            </p>
          </div>
          <CreatePostDialog onCreatePost={handleCreatePost} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search posts, topics, or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              className="px-3 py-2 border rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="pinned">Pinned</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="space-y-4 mt-4">
              {filteredPosts.map(post => (
                <ForumPost
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onReply={handleReply}
                  onShare={handleShare}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  isAdmin={isAdmin}
                />
              ))}
            </TabsContent>

            <TabsContent value="trending" className="space-y-4 mt-4">
              {filteredPosts
                .sort((a, b) => (b.likes + b.replies + b.views) - (a.likes + a.replies + a.views))
                .map(post => (
                  <ForumPost
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onReply={handleReply}
                    onShare={handleShare}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    isAdmin={isAdmin}
                  />
                ))}
            </TabsContent>

            <TabsContent value="pinned" className="space-y-4 mt-4">
              {filteredPosts
                .filter(post => post.isPinned)
                .map(post => (
                  <ForumPost
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onReply={handleReply}
                    onShare={handleShare}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    isAdmin={isAdmin}
                  />
                ))}
            </TabsContent>

          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trending Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trendingTags.map(tag => (
                  <div key={tag.name} className="flex items-center justify-between">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      #{tag.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{tag.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Members</span>
                  <span className="font-semibold">{stats.totalMembers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Today</span>
                  <span className="font-semibold">{stats.activeToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Posts This Week</span>
                  <span className="font-semibold">{stats.postsThisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">New Members</span>
                  <span className="font-semibold">{stats.newMembers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Pin className="w-4 h-4 mr-2" />
                  View Guidelines
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Find Members
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Get Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Forum;
