import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { sdgGoals, sdgTargets } from "@/lib/constants";
import Autoplay from "embla-carousel-autoplay";
import SdgIcon from "./SdgIcon";
import { Badge } from "../ui/badge";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, DollarSign } from "lucide-react";

interface SdgMetrics {
  projectCount: number;
  totalBeneficiaries: number;
  totalFunding: number;
}

export default function SdgCarousel() {
  const [sdgMetrics, setSdgMetrics] = useState<Record<number, SdgMetrics>>({});

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data: reports } = await supabase
        .from('reports')
        .select('sdg_goal, beneficiaries, cost');

      if (reports) {
        const metrics: Record<number, SdgMetrics> = {};
        reports.forEach((r) => {
          if (!metrics[r.sdg_goal]) {
            metrics[r.sdg_goal] = { projectCount: 0, totalBeneficiaries: 0, totalFunding: 0 };
          }
          metrics[r.sdg_goal].projectCount++;
          metrics[r.sdg_goal].totalBeneficiaries += r.beneficiaries || 0;
          metrics[r.sdg_goal].totalFunding += Number(r.cost) || 0;
        });
        setSdgMetrics(metrics);
      }
    };
    fetchMetrics();
  }, []);

  const sdgData = sdgGoals.map(goal => ({
    ...goal,
    targets: sdgTargets[goal.value] || [],
    metrics: sdgMetrics[goal.value] || { projectCount: 0, totalBeneficiaries: 0, totalFunding: 0 },
  }));

  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Carousel
        plugins={[Autoplay({ delay: 6000, stopOnInteraction: true })]}
        opts={{ align: "start", loop: true }}
        className="w-full"
      >
        <CarouselContent>
          {sdgData.map((sdg, index) => (
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
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/10 rounded-lg p-2">
                        <BarChart3 className="h-4 w-4 mx-auto mb-1 opacity-80" />
                        <div className="text-lg font-bold">{sdg.metrics.projectCount}</div>
                        <div className="text-[10px] opacity-70">Projects</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <Users className="h-4 w-4 mx-auto mb-1 opacity-80" />
                        <div className="text-lg font-bold">{formatCompact(sdg.metrics.totalBeneficiaries)}</div>
                        <div className="text-[10px] opacity-70">Beneficiaries</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <DollarSign className="h-4 w-4 mx-auto mb-1 opacity-80" />
                        <div className="text-lg font-bold">${formatCompact(sdg.metrics.totalFunding)}</div>
                        <div className="text-[10px] opacity-70">Funding</div>
                      </div>
                    </div>

                    {/* Key Targets */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Key Targets:</h4>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(sdg.targets) ? sdg.targets : []).slice(0, 3).map(target => (
                          <Badge key={target} variant="secondary" className="bg-white/20 text-white border-none text-xs">{target}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/20">
                      <Button asChild variant="outline" size="sm" className="w-full border-white text-white hover:bg-white hover:text-blue-600">
                        <Link to={`/analytics?tab=sdg&goal=${sdg.value}`}>View SDG {sdg.value} Projects</Link>
                      </Button>
                    </div>
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
