import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import Autoplay from "embla-carousel-autoplay";

interface RecentProject {
  id: string;
  title: string;
  description: string;
  submitted_at: string;
  user_name: string;
  project_status: string;
}

const cardColors = [
  "dark:bg-blue-900/40 bg-blue-100",
  "dark:bg-green-900/40 bg-green-100",
  "dark:bg-yellow-900/40 bg-yellow-100",
  "dark:bg-purple-900/40 bg-purple-100",
  "dark:bg-pink-900/40 bg-pink-100",
  "dark:bg-indigo-900/40 bg-indigo-100",
];

export default function RecentProjects() {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const { data: reports, error } = await supabase
          .from('reports')
          .select(`
            id,
            title,
            description,
            submitted_at,
            project_status,
            profiles:user_id (
              full_name
            )
          `)
          .order('submitted_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        const formattedProjects = reports?.map(report => ({
          id: report.id,
          title: report.title,
          description: report.description,
          submitted_at: report.submitted_at,
          project_status: report.project_status,
          user_name: (report.profiles as any)?.full_name || 'Anonymous'
        })) || [];

        setRecentProjects(formattedProjects);
      } catch (error) {
        console.error('Error fetching recent projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProjects();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Recently Added Projects</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Check out the latest development projects reported by the community.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (recentProjects.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Recently Added Projects</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              No projects have been reported yet. Be the first to make a difference!
            </p>
          </div>
          <div className="text-center">
            <Button asChild>
              <Link to="/submit-report">Submit First Project</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

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
            {recentProjects.map((project, index) => (
              <CarouselItem key={project.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className={`h-full ${cardColors[index % cardColors.length]} transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl dark:hover:shadow-primary/20`}>
                    <CardContent className="flex flex-col items-start gap-4 p-6">
                      <Badge variant="secondary">
                        {new Date(project.submitted_at).toLocaleDateString()}
                      </Badge>
                      <p className="font-semibold leading-none">{project.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Reported by: {project.user_name}
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {project.project_status.replace('_', ' ')}
                      </Badge>
                      <Button asChild variant="outline" size="sm" className="mt-auto">
                        <Link to={`/analytics?tab=reports&id=${project.id}`}>View Project</Link>
                      </Button>
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