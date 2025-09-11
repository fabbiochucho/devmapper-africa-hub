-- Create forum posts table for real discussion functionality
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'Discussion',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Forum posts are viewable by everyone" 
ON public.forum_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create forum posts" 
ON public.forum_posts 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" 
ON public.forum_posts 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Only admins can delete posts" 
ON public.forum_posts 
FOR DELETE 
USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create forum post likes table
CREATE TABLE public.forum_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Users can view all likes" 
ON public.forum_post_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can like posts" 
ON public.forum_post_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.forum_post_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger to update likes count
CREATE OR REPLACE FUNCTION public.update_forum_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts 
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts 
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_forum_post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.forum_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_forum_post_likes_count();

-- Insert some sample forum posts to get started
INSERT INTO public.forum_posts (title, content, author_id, category, tags) VALUES
  ('Welcome to the DevMapper Community Forum', 'Welcome everyone! This is our space to share knowledge, ask questions, and collaborate on sustainable development projects. Please read our community guidelines and let''s build something amazing together!', 
   (SELECT id FROM auth.users LIMIT 1), 'Announcement', ARRAY['welcome', 'community', 'guidelines']),
  ('Best practices for community engagement', 'What are your proven strategies for engaging rural communities in development projects? I''ve learned that working with local leaders is crucial...',
   (SELECT id FROM auth.users LIMIT 1), 'Discussion', ARRAY['community', 'engagement', 'best-practices']);

-- Create updated_at trigger
CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();