
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Users } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

interface SocialFeed {
  platform: string;
  user: string;
  content: string;
  avatar: string;
}

interface SocialFeedProps {
  socialMediaFeeds: SocialFeed[];
}

const cardColors = [
  "dark:bg-sky-900/40 bg-sky-100",
  "dark:bg-emerald-900/40 bg-emerald-100",
  "dark:bg-amber-900/40 bg-amber-100",
  "dark:bg-fuchsia-900/40 bg-fuchsia-100",
  "dark:bg-rose-900/40 bg-rose-100",
  "dark:bg-violet-900/40 bg-violet-100",
];

export default function SocialFeed({ socialMediaFeeds }: SocialFeedProps) {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">What People Are Saying</h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Updates from our community on social media.
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
            {socialMediaFeeds.map((feed, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className={`h-full ${cardColors[index % cardColors.length]} transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl dark:hover:shadow-primary/20`}>
                    <CardContent className="flex flex-col items-start gap-4 p-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> {/* Placeholder icon */}
                        <span className="font-semibold">{feed.user}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">"{feed.content}"</p>
                      <Badge variant="outline" className="mt-auto">
                        {feed.platform}
                      </Badge>
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
