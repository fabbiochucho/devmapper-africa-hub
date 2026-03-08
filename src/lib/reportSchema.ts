
import * as z from "zod";

export const reportSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  sdg_goal: z.string({ required_error: "Please select an SDG Goal." }),
  sdg_target: z.string().optional(),
  project_status: z.string({ required_error: "Please select a project status." }),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
  country_code: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  costCurrency: z.string().optional(),
  exchangeRateMode: z.enum(['manual', 'auto']).optional(),
  usd_exchange_rate: z.coerce.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sponsor: z.string().optional(),
  funder: z.string().optional(),
  contractor: z.string().optional(),
  photos: z.any().optional(),
}).superRefine((data, ctx) => {
  if ((data.cost !== undefined && data.cost !== 0) && !data.costCurrency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Currency is required when cost is provided.",
      path: ["costCurrency"],
    });
  }
  if (data.costCurrency && (data.cost === undefined || data.cost === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cost is required when currency is selected.",
      path: ["cost"],
    });
  }
  if (data.costCurrency && data.costCurrency !== 'USD') {
    if (!data.exchangeRateMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select an exchange rate option.",
        path: ["exchangeRateMode"],
      });
    } else if (data.exchangeRateMode === 'manual' && (!data.usd_exchange_rate || data.usd_exchange_rate <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A valid exchange rate is required for manual entry.",
        path: ["usd_exchange_rate"],
      });
    } else if (data.exchangeRateMode === 'auto' && !data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Project Start Date is required for automatic calculation.",
        path: ["startDate"],
      });
    }
  }
});

export const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'KES', label: 'KES - Kenyan Shilling' },
    { value: 'NGN', label: 'NGN - Nigerian Naira' },
    { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
    { value: 'ETB', label: 'ETB - Ethiopian Birr' },
    { value: 'ZAR', label: 'ZAR - South African Rand' },
];

