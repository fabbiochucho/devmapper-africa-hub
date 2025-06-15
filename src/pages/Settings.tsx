
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
       <Card>
        <CardHeader>
          <CardTitle>User & Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page will contain user profile settings, notifications, and other preferences.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
