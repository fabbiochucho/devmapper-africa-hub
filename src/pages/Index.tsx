
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pan-African SDG Project Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[70vh] bg-muted rounded-lg border flex items-center justify-center">
            <p className="text-muted-foreground">Interactive map will be rendered here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
