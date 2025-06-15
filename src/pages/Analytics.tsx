
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import HeatMap from "@/components/HeatMap";

const Analytics = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
       <Card>
        <CardHeader>
          <CardTitle>Project Hotspots</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            This map shows the geographic concentration of submitted projects.
          </p>
          <div className="h-[500px] w-full">
            <HeatMap />
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>More Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This area will display more charts and visualizations.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
