
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import Map from "@/components/Map";

const Index = () => {
  return (
    <div className="space-y-4 h-full flex flex-col">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Card className="w-full flex-grow">
        <CardHeader>
          <CardTitle>Pan-African SDG Project Map</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%_-_72px)]">
          {/* <Map /> */}
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Map is temporarily disabled for debugging.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
