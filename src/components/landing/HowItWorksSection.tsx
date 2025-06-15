
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, TrendingUp } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">How DevMapper Works</h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform connects communities, governments, and organizations to create transparency in development
            projects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <MapPin className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Report Projects</CardTitle>
              <CardDescription>
                Citizens can report development projects in their communities with location data and photos.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Community Verification</CardTitle>
              <CardDescription>
                Multiple community members verify project details to ensure accuracy and prevent misinformation.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Monitor project progress against SDG targets with real-time analytics and impact measurements.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}
