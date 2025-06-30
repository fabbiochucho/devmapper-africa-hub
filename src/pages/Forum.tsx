
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, TrendingUp, Users, MessageCircle, Pin } from 'lucide-react';
import ForumPost from '@/components/forum/ForumPost';
import CreatePostDialog from '@/components/forum/CreatePostDialog';

const Forum = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState([
    {
      id: '1',
      title: 'Best practices for community engagement in rural areas',
      content: 'I\'ve been working on several SDG projects in rural communities and wanted to share some insights on effective engagement strategies. One key aspect I\'ve learned is the importance of working with local leaders and respecting traditional governance structures...',
      author: {
        name: 'Amina Hassan',
        avatar: '/api/placeholder/40/40',
        role: 'NGO Coordinator',
        verified: true
      },
      category: 'Discussion',
      tags: ['community', 'engagement', 'rural', 'best-practices'],
      likes: 24,
      replies: 8,
      views: 156,
      createdAt: '2 hours ago',
      isPinned: true,
      isLiked: false
    },
    {
      id: '2',
      title: 'How to verify water project data accuracy?',
      content: 'I\'m reviewing several water access projects and need guidance on verification methods. What are the most reliable ways to confirm that reported beneficiary numbers are accurate? Are there specific tools or techniques that work best for remote verification?',
      author: {
        name: 'John Kwame',
        avatar: '/api/placeholder/40/40',
        role: 'Data Analyst',
        verified: true
      },
      category: 'Question',
      tags: ['verification', 'water', 'data-quality'],
      likes: 12,
      replies: 5,
      views: 89,
      createdAt: '4 hours ago',
      isLiked: true
    },
    {
      id: '3',
      title: 'New mobile app features for field data collection',
      content: 'We\'re excited to announce new features in our mobile app that will make field data collection more efficient. The update includes offline synchronization, photo geotagging, and improved form validation...',
      author: {
        name: 'DevMapper Team',
        avatar: '/api/placeholder/40/40',
        role: 'Platform Admin',
        verified: true
      },
      category: 'Announcement',
      tags: ['mobile-app', 'features', 'data-collection'],
      likes: 45,
      replies: 12,
      views: 234,
      createdAt: '1 day ago',
      isLiked: false
    },
    {
      id: '4',
      title: 'Seeking partnerships for education projects in Kenya',
      content: 'Our organization is planning several education infrastructure projects in Kenya and we\'re looking for potential partners. We have funding secured and are particularly interested in collaborating with local NGOs and community organizations...',
      author: {
        name: 'Sarah Okonkwo',
        avatar: '/api/placeholder/40/40',
        role: 'Project Manager',
        verified: true
      },
      category: 'Project Update',
      tags: ['partnerships', 'education', 'kenya', 'infrastructure'],
      likes: 18,
      replies: 7,
      views: 134,
      createdAt: '2 days ago',
      isLiked: false
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Posts', count: posts.length },
    { id: 'Discussion', name: 'Discussions', count: posts.filter(p => p.category === 'Discussion').length },
    { id: 'Question', name: 'Questions', count: posts.filter(p => p.category === 'Question').length },
    { id: 'Announcement', name: 'Announcements', count: posts.filter(p => p.category === 'Announcement').length },
    { id: 'Project Update', name: 'Project Updates', count: posts.filter(p => p.category === 'Project Update').length }
  ];

  const trendingTags = [
    { name: 'community', count: 12 },
    { name: 'verification', count: 8 },
    { name: 'data-quality', count: 6 },
    { name: 'partnerships', count: 5 },
    { name: 'mobile-app', count: 4 }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreatePost = (newPost: any) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  const handleReply = (postId: string) => {
    console.log('Reply to post:', postId);
    // This would typically open a reply dialog or navigate to the post detail page
  };

  const handleShare = (postId: string) => {
    console.log('Share post:', postId);
    // This would typically open a share dialog
  };

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
                  <span className="font-semibold">2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Today</span>
                  <span className="font-semibold">234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Posts This Week</span>
                  <span className="font-semibold">89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">New Members</span>
                  <span className="font-semibold">12</span>
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
