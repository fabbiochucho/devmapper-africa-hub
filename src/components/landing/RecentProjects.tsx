
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Report } from "@/data/mockReports";
import { mockUsers } from "@/data/mockUsers";
import Autoplay from "embla-carousel-autoplay";

interface RecentProjectsProps {
  recentProjects: Report[];
}

const cardColors = [
  "dark:bg-blue-900/30 bg-blue-50/50",
  "dark:bg-green-900/30 bg-green-50/50",
  "dark:bg-yellow-900/30 bg-yellow-50/50",
  "dark:bg-purple-900/30 bg-purple-50/50",
  "dark:bg-pink-900/30 bg-pink-50/50",
  "dark:bg-indigo-900/30 bg-indigo-50/50",
];

const getUserById = (id: string) => mockUsers.find((u) => u.id.toString() === id);

export default function RecentProjects({ recentProjects }: RecentProjectsProps) {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Recently Added Projects</h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Check out the latest development projects reported by the community.
          </p>
        </div>
        <Carousel
          plugins={[
            Autoplay({
              delay: 5000,
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
            {recentProjects.map((report, index) => {
              const user = getUserById(report.submitted_by);
              return (
                <CarouselItem key={report.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className={`h-full ${cardColors[index % cardColors.length]}`}>
                      <CardContent className="flex flex-col items-start gap-4 p-6">
                        <Badge variant="secondary">{new Date(report.submitted_at).toLocaleDateString()}</Badge>
                        <p className="font-semibold leading-none">{report.title}</p>
                        <p className="text-sm text-muted-foreground">Reported by: {user?.name || "Anonymous"}</p>
                        <Button asChild variant="outline" size="sm" className="mt-auto">
                          <Link to={`/analytics?tab=reports&id=${report.id}`}>View Project</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
