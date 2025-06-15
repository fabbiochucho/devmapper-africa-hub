
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Report } from "@/data/mockReports";

const updateProgressSchema = z.object({
  value: z.coerce.number().min(0, "Value must be positive."),
  notes: z.string().optional(),
});

type UpdateProgressValues = z.infer<typeof updateProgressSchema>;

interface UpdateProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  report: Report;
  onUpdate: (updatedReport: Report) => void;
}

const UpdateProgressDialog = ({ isOpen, onOpenChange, report, onUpdate }: UpdateProgressDialogProps) => {
  const form = useForm<UpdateProgressValues>({
    resolver: zodResolver(updateProgressSchema),
    defaultValues: {
      value: report.currentValue || 0,
      notes: "",
    },
  });
  
  React.useEffect(() => {
    form.reset({
      value: report.currentValue || 0,
      notes: ""
    });
  }, [report, form]);


  const onSubmit = (values: UpdateProgressValues) => {
    if (!report.targetValue) {
        toast.error("Cannot update progress as no target value is set for this project.");
        return;
    }

    const updatedReport: Report = {
      ...report,
      currentValue: values.value,
      progressHistory: [
        ...(report.progressHistory || []),
        {
          value: values.value,
          recordedAt: new Date().toISOString(),
          notes: values.notes || `Updated to ${values.value} ${report.targetUnit || ''}`.trim(),
        },
      ],
    };
    
    onUpdate(updatedReport);
    toast.success("Progress updated successfully!");
    onOpenChange(false);
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
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>
            Update progress for "{report.title}". Target is {report.targetValue} {report.targetUnit}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value ({report.targetUnit})</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter current value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any relevant notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Updating..." : "Update Progress"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProgressDialog;
