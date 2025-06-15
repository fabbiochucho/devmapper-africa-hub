
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SubmitReport = () => {
  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Submit a Project Report</CardTitle>
          <CardDescription>Fill in the details of the development project you are reporting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input id="title" placeholder="e.g., New School Build in Nairobi" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="A brief description of the project, its goals, and current status." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sdg-goal">SDG Goal</Label>
              <Select>
                <SelectTrigger id="sdg-goal">
                  <SelectValue placeholder="Select an SDG Goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">Goal 4: Quality Education</SelectItem>
                  <SelectItem value="6">Goal 6: Clean Water and Sanitation</SelectItem>
                  <SelectItem value="8">Goal 8: Decent Work and Economic Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., Kisumu, Kenya" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Submit Report</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubmitReport;
