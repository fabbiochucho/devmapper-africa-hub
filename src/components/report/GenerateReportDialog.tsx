
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const generateReportSchema = z.object({
  reportType: z.string({ required_error: "Please select a report type." }),
  dateRange: z.custom<DateRange>().refine(
    (date) => !!date?.from && !!date?.to,
    { message: "A complete date range is required." }
  ),
});

type GenerateReportValues = z.infer<typeof generateReportSchema>;

interface GenerateReportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const GenerateReportDialog = ({ isOpen, onOpenChange }: GenerateReportDialogProps) => {
  const form = useForm<GenerateReportValues>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      reportType: undefined,
      dateRange: undefined,
    },
  });

  const onSubmit = (values: GenerateReportValues) => {
    console.log("Generating report with values:", values);
    
    const reportData = {
      id: `report_${Date.now()}`,
      userId: 5, // Mocking platform admin user ID
      reportType: values.reportType,
      dateRange: values.dateRange,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/reports/download/${Date.now()}.pdf`,
    };

    toast.success("Report generated successfully!", {
      description: `Your ${values.reportType} report is ready.`,
      action: {
        label: "Download",
        onClick: () => {
          console.log("Downloading from:", reportData.downloadUrl);
          toast.info("Download started (mock).");
        },
      },
    });

    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            form.reset();
        }
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate New Report</DialogTitle>
          <DialogDescription>
            Select the type and date range for your report.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a report type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Summary">Summary Report</SelectItem>
                      <SelectItem value="Detailed">Detailed Report</SelectItem>
                      <SelectItem value="Financial">Financial Report</SelectItem>
                      <SelectItem value="ESG">ESG Report</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Range</FormLabel>
                   <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, "LLL dd, y")} -{" "}
                                {format(field.value.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(field.value.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={field.value?.from}
                          selected={field.value}
                          onSelect={field.onChange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Generating..." : "Generate Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportDialog;
