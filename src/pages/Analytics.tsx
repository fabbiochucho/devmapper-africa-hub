
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Analytics = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
       <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will display analytics, charts, and visualizations.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
