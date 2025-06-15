
import * as z from "zod";

export const targetSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  metric: z.string().min(3, { message: "Metric must be at least 3 characters." }),
  targetValue: z.coerce.number().positive({ message: "Target value must be a positive number." }),
  targetUnit: z.string().min(1, { message: "Target unit is required." }),
  deadline: z.date({
    required_error: "A deadline date is required.",
  }),
});

export type TargetFormValues = z.infer<typeof targetSchema>;

