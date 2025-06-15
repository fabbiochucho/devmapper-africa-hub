
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { mockReports, Report } from "@/data/mockReports";
import { sdgGoals, sdgTargets } from "@/lib/constants";
import Autoplay from "embla-carousel-autoplay";
import SdgIcon from "./SdgIcon";
import { Badge } from "../ui/badge";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";

const projectsBySdg: { [key: string]: Report } = {};
mockReports.forEach(report => {
  if (!projectsBySdg[report.sdg_goal]) {
    projectsBySdg[report.sdg_goal] = report;
  }
});

const sdgData = sdgGoals.map(goal => ({
  ...goal,
  targets: sdgTargets[goal.value] || [],
  project: projectsBySdg[goal.value] || null,
}));

export default function SdgCarousel() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Carousel
        plugins={[
            Autoplay({
            delay: 6000,
            stopOnInteraction: true,
            }),
        ]}
        opts={{
            align: "start",
            loop: true,
        }}
        className="w-full"
        >
        <CarouselContent>
            {sdgData.filter(sdg => sdg.project).map((sdg, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                <Card className="h-full flex flex-col bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <SdgIcon goal={sdg.value} />
                            <CardTitle className="text-lg">{sdg.label.replace(/Goal \d+: /, '')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col gap-4">
                        <div>
                            <h4 className="font-semibold mb-2">Key Targets:</h4>
                            <div className="flex flex-wrap gap-1">
                                {sdg.targets.slice(0, 3).map(target => (
                                    <Badge key={target} variant="secondary" className="bg-white/20 text-white border-none">{target}</Badge>
                                ))}
                            </div>
                        </div>
                        {sdg.project && (
                            <div className="mt-auto pt-4 border-t border-white/20">
                                <h4 className="font-semibold mb-2">Example Project:</h4>
                                <p className="text-sm font-medium mb-2">{sdg.project.title}</p>
                                <Button asChild variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-blue-600">
                                    <Link to={`/analytics?tab=reports&id=${sdg.project.id}`}>View Project</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className="border-white text-white hover:bg-white hover:text-blue-600 -left-12" />
        <CarouselNext className="border-white text-white hover:bg-white hover:text-blue-600 -right-12" />
        </Carousel>
    </div>
  );
}
