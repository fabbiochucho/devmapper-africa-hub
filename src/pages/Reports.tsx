
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Reports = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Project Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will contain filterable lists of project reports.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
