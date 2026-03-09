import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DemoVideoSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-3">See DevMapper in Action</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Watch how organizations across Africa track SDG progress, manage ESG compliance, and generate donor-ready reports — all in one platform.
        </p>
        <Card className="relative overflow-hidden group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center">
              {/* Decorative grid pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }} />

              {/* Play button */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-primary-foreground ml-1" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Platform Demo • Coming Soon
                </p>
              </div>

              {/* Corner screenshots placeholder */}
              <div className="absolute top-4 left-4 w-32 h-20 rounded-lg bg-background/60 border border-border/50 shadow-sm flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Dashboard</span>
              </div>
              <div className="absolute bottom-4 right-4 w-32 h-20 rounded-lg bg-background/60 border border-border/50 shadow-sm flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Analytics</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" asChild>
            <a href="/about">Learn More</a>
          </Button>
          <Button variant="default" asChild>
            <a href="/platform-overview">Explore Features</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
