
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

const reportSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  sdg_goal: z.string({ required_error: "Please select an SDG Goal." }),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
});

const sdgGoals = [
  { value: "1", label: "Goal 1: No Poverty" },
  { value: "2", label: "Goal 2: Zero Hunger" },
  { value: "3", label: "Goal 3: Good Health and Well-being" },
  { value: "4", label: "Goal 4: Quality Education" },
  { value: "5", label: "Goal 5: Gender Equality" },
  { value: "6", label: "Goal 6: Clean Water and Sanitation" },
  { value: "7", label: "Goal 7: Affordable and Clean Energy" },
  { value: "8", label: "Goal 8: Decent Work and Economic Growth" },
  { value: "9", label: "Goal 9: Industry, Innovation and Infrastructure" },
  { value: "10", label: "Goal 10: Reduced Inequality" },
  { value: "11", label: "Goal 11: Sustainable Cities and Communities" },
  { value: "12", label: "Goal 12: Responsible Consumption and Production" },
  { value: "13", label: "Goal 13: Climate Action" },
  { value: "14", label: "Goal 14: Life Below Water" },
  { value: "15", label: "Goal 15: Life on Land" },
  { value: "16", label: "Goal 16: Peace and Justice Strong Institutions" },
  { value: "17", label: "Goal 17: Partnerships to achieve the Goal" },
];

const SubmitReport = () => {
  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
    },
  });

  function onSubmit(values: z.infer<typeof reportSchema>) {
    console.log("Form Submitted:", values);
    toast.success("Report submitted successfully!", {
      description: "Your report has been received and will be reviewed.",
    });
    form.reset();
  }

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Submit a Project Report</CardTitle>
          <CardDescription>
            Fill in the details of the development project you are reporting.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., New School Build in Nairobi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of the project, its goals, and current status."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sdg_goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SDG Goal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an SDG Goal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sdgGoals.map((goal) => (
                            <SelectItem key={goal.value} value={goal.value}>
                              {goal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Kisumu, Kenya" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default SubmitReport;
