
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Users, Twitter, Linkedin, Facebook } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

interface SocialFeedItem {
  id: string;
  platform: string;
  user: string;
  content: string;
  avatar: string;
  created_at: string;
}

const cardColors = [
  "dark:bg-sky-900/40 bg-sky-100",
  "dark:bg-emerald-900/40 bg-emerald-100",
  "dark:bg-amber-900/40 bg-amber-100",
  "dark:bg-fuchsia-900/40 bg-fuchsia-100",
  "dark:bg-rose-900/40 bg-rose-100",
  "dark:bg-violet-900/40 bg-violet-100",
];

const mockSocialFeeds: SocialFeedItem[] = [
  {
    id: "1",
    platform: "Twitter",
    user: "@devadvocate",
    content: "Just used #DevMapper to report a new school being built in my village. Transparency is key for development! 🏫✨",
    avatar: "/placeholder.svg",
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    platform: "LinkedIn",
    user: "Amina Okoro, NGO Director",
    content: "Our team at 'Educate Africa' is now using DevMapper to track our projects. The analytics dashboard provides incredible insights into our SDG alignment! 📊",
    avatar: "/placeholder.svg",
    created_at: "2024-01-14T14:22:00Z",
  },
  {
    id: "3",
    platform: "Facebook",
    user: "John Mensah",
    content: "It's amazing to see so many projects mapped out across Ghana on DevMapper. I just verified a clean water well project near me. Feeling empowered! 💧",
    avatar: "/placeholder.svg",
    created_at: "2024-01-13T16:45:00Z",
  },
  {
    id: "4",
    platform: "Twitter",
    user: "@EcoWarriorJane",
    content: "Kudos to the DevMapper team for creating a tool that holds organizations accountable. Following the progress of the solar farm installation in Kenya! ☀️",
    avatar: "/placeholder.svg",
    created_at: "2024-01-12T09:15:00Z",
  },
];

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'twitter': return <Twitter className="w-4 h-4" />;
    case 'linkedin': return <Linkedin className="w-4 h-4" />;
    case 'facebook': return <Facebook className="w-4 h-4" />;
    default: return <Users className="w-4 h-4" />;
  }
};

export default function SocialFeed() {
  const [socialFeeds, setSocialFeeds] = useState<SocialFeedItem[]>([]);

  useEffect(() => {
    // For now, use mock data. In the future, this could fetch from a social media API
    // or a database table storing curated social media posts
    setSocialFeeds(mockSocialFeeds);
  }, []);

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">What People Are Saying</h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real feedback from our community making a difference across Africa.
          </p>
        </div>
        <Carousel
          plugins={[
            Autoplay({
              delay: 5500,
              stopOnInteraction: true,
            }),
          ]}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {socialFeeds.map((feed, index) => (
              <CarouselItem key={feed.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className={`h-full ${cardColors[index % cardColors.length]} transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl dark:hover:shadow-primary/20`}>
                    <CardContent className="flex flex-col items-start gap-4 p-6">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(feed.platform)}
                        <span className="font-semibold">{feed.user}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">"{feed.content}"</p>
                      <div className="flex items-center justify-between w-full mt-auto">
                        <Badge variant="outline">
                          {feed.platform}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(feed.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
