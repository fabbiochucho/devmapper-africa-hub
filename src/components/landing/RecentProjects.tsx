
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Report } from "@/data/mockReports";
import { mockUsers } from "@/data/mockUsers";

interface RecentProjectsProps {
  recentProjects: Report[];
}

const getUserById = (id: string) => mockUsers.find(u => u.id.toString() === id);

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
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {recentProjects.map((report) => {
              const user = getUserById(report.submitted_by);
              return (
                <CarouselItem key={report.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card className="h-full">
                      <CardContent className="flex flex-col items-start gap-4 p-6">
                        <Badge variant="secondary">{new Date(report.submitted_at).toLocaleDateString()}</Badge>
                        <p className="font-semibold leading-none">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Reported by: {user?.name || "Anonymous"}
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-auto">
                          <Link to={`/analytics?tab=reports&id=${report.id}`}>
                            View Project
                          </Link>
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
