
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  MessageCircle,
  Copy,
  Download,
  Eye,
  Globe
} from 'lucide-react';

interface SocialShareButtonProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  data?: any;
  type: 'project' | 'analytics' | 'report';
}

const SocialShareButton: React.FC<SocialShareButtonProps> = ({
  title,
  description,
  url,
  imageUrl,
  data,
  type
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const generateShareableContent = () => {
    const watermarkedTitle = `${title} | DevMapper Africa`;
    const watermarkedDescription = `${description}\n\n🌍 Tracking sustainable development across Africa\n📊 Verified by DevMapper community\n🔗 Join us at devmapper.africa`;
    
    return {
      title: watermarkedTitle,
      description: watermarkedDescription,
      hashtags: ['DevMapper', 'SustainableDevelopment', 'Africa', 'SDGs', 'CommunityDriven'],
      url: `${url}?utm_source=social&utm_medium=share&utm_campaign=devmapper`
    };
  };

  const generatePreviewImage = async () => {
    // Create a canvas with DevMapper branding
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    canvas.width = 1200;
    canvas.height = 630;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(1, '#3b82f6');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // DevMapper logo area
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, 80);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    
    const maxWidth = canvas.width - 100;
    const words = title.split(' ');
    let line = '';
    let y = 200;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[i] + ' ';
        y += 60;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);
    
    // Description
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    y += 80;
    
    const descWords = description.split(' ').slice(0, 20).join(' ') + '...';
    ctx.fillText(descWords, canvas.width / 2, y);
    
    // DevMapper branding
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText('🌍 DevMapper', 50, 50);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Tracking sustainable development across Africa', 50, canvas.height - 30);
    
    // Stats overlay (if analytics data available)
    if (type === 'analytics' && data) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(canvas.width - 300, 100, 250, 200);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Quick Stats:', canvas.width - 280, 130);
      
      ctx.font = '16px Arial';
      ctx.fillText(`Projects: ${data.totalProjects || 'N/A'}`, canvas.width - 280, 160);
      ctx.fillText(`Countries: ${data.countriesCount || 'N/A'}`, canvas.width - 280, 185);
      ctx.fillText(`SDGs: ${data.sdgCount || 'N/A'}`, canvas.width - 280, 210);
    }
    
    return canvas.toDataURL('image/png');
  };

  const socialPlatforms = [
    {
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-blue-500',
      generateUrl: (content: any) => {
        const text = `${content.title}\n\n${content.description.slice(0, 200)}...`;
        const hashtags = content.hashtags.join(',');
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=${hashtags}&url=${encodeURIComponent(content.url)}`;
      }
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-600',
      generateUrl: (content: any) => {
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}&quote=${encodeURIComponent(content.title + ' - ' + content.description)}`;
      }
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      color: 'bg-blue-700',
      generateUrl: (content: any) => {
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}&title=${encodeURIComponent(content.title)}&summary=${encodeURIComponent(content.description)}`;
      }
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-500',
      generateUrl: (content: any) => {
        const text = `${content.title}\n\n${content.description}\n\n${content.url}`;
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
      }
    }
  ];

  const handleShare = async (platform: any) => {
    const content = generateShareableContent();
    const shareUrl = platform.generateUrl(content);
    
    // Generate preview image if needed
    if (!previewUrl) {
      const preview = await generatePreviewImage();
      setPreviewUrl(preview);
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    
    toast({
      title: "Shared!",
      description: `Content shared to ${platform.name} with DevMapper branding`,
    });
  };

  const copyToClipboard = async () => {
    const content = generateShareableContent();
    const textToCopy = `${content.title}\n\n${content.description}\n\n${content.url}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Copied!",
        description: "Shareable content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadPreview = async () => {
    if (!previewUrl) {
      const preview = await generatePreviewImage();
      setPreviewUrl(preview);
    }
    
    const link = document.createElement('a');
    link.download = `devmapper-${type}-preview.png`;
    link.href = previewUrl;
    link.click();
    
    toast({
      title: "Downloaded!",
      description: "Preview image downloaded with DevMapper branding",
    });
  };

  React.useEffect(() => {
    if (isOpen && !previewUrl) {
      generatePreviewImage().then(setPreviewUrl);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share with DevMapper Branding</DialogTitle>
          <DialogDescription>
            Share this {type} with automatic DevMapper watermarks and branding
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt="Share preview" 
                    className="w-32 h-20 object-cover rounded border"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {generateShareableContent().title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {generateShareableContent().description.slice(0, 150)}...
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {generateShareableContent().hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Platform Buttons */}
          <div>
            <h4 className="font-semibold mb-3">Share on Social Media</h4>
            <div className="grid grid-cols-2 gap-3">
              {socialPlatforms.map((platform, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-12"
                  onClick={() => handleShare(platform)}
                >
                  <div className={`w-8 h-8 rounded-full ${platform.color} flex items-center justify-center text-white mr-3`}>
                    {platform.icon}
                  </div>
                  Share on {platform.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={copyToClipboard} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copy Text
            </Button>
            <Button variant="outline" onClick={downloadPreview} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Preview
            </Button>
          </div>

          {/* Branding Notice */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                All shared content includes DevMapper branding and attribution
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Help us spread awareness about sustainable development tracking in Africa
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialShareButton;
