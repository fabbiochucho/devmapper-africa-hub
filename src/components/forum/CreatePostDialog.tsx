
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, Image, Link, Hash } from 'lucide-react';

interface CreatePostDialogProps {
  onCreatePost: (post: any) => void;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ onCreatePost }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    tagInput: ''
  });

  const categories = [
    'Discussion',
    'Question', 
    'Announcement',
    'Support',
    'Project Update',
    'Resource Sharing'
  ];

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPost = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      author: {
        name: 'Current User',
        role: 'Community Member',
        verified: true
      },
      likes: 0,
      replies: 0,
      views: 0,
      createdAt: 'Just now',
      isLiked: false
    };

    onCreatePost(newPost);
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: [],
      tagInput: ''
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Create Post
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a descriptive title..."
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, ask questions, or provide updates..."
              rows={6}
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={formData.tagInput}
                onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Hash className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm">
              <Image className="w-4 h-4 mr-2" />
              Add Image
            </Button>
            <Button type="button" variant="outline" size="sm">
              <Link className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
