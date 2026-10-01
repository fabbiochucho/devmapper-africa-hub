
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, Image, Link, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NewPostInput {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

interface CreatePostDialogProps {
  onCreatePost: (post: NewPostInput) => void;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ onCreatePost }) => {
  const { t } = useTranslation();
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
    
    onCreatePost({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
    });
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
          {t('forum.createPost')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('forum.createNewPost')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('forum.titleLabel')}</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('forum.titlePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t('forum.categoryLabel')}</label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('forum.categoryPlaceholder')} />
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
            <label className="text-sm font-medium mb-2 block">{t('forum.contentLabel')}</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder={t('forum.contentPlaceholder')}
              rows={6}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t('forum.tagsLabel')}</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={formData.tagInput}
                onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                placeholder={t('forum.tagPlaceholder')}
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
              {t('forum.addImage')}
            </Button>
            <Button type="button" variant="outline" size="sm">
              <Link className="w-4 h-4 mr-2" />
              {t('forum.addLink')}
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('forum.cancel')}
            </Button>
            <Button type="submit">
              {t('forum.createPost')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
