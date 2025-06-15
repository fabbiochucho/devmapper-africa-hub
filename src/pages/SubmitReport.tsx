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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { sdgGoals, projectStatuses } from "@/lib/constants";
import { Calendar as CalendarIcon, ImagePlus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ExifReader from "exif-reader";

const reportSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  sdg_goal: z.string({ required_error: "Please select an SDG Goal." }),
  project_status: z.string({ required_error: "Please select a project status." }),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
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

const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'KES', label: 'KES - Kenyan Shilling' },
    { value: 'NGN', label: 'NGN - Nigerian Naira' },
    { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
    { value: 'ETB', label: 'ETB - Ethiopian Birr' },
    { value: 'ZAR', label: 'ZAR - South African Rand' },
];

const getGpsData = (tags: any): { latitude: number | null; longitude: number | null } => {
  if (tags && tags.gps && tags.gps.Latitude && tags.gps.Longitude) {
    return { latitude: tags.gps.Latitude, longitude: tags.gps.Longitude };
  }
  return { latitude: null, longitude: null };
};

const SubmitReport = () => {
  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      lat: undefined,
      lng: undefined,
      cost: undefined,
      costCurrency: undefined,
      exchangeRateMode: undefined,
      usd_exchange_rate: undefined,
      sponsor: "",
      funder: "",
      contractor: "",
      photos: undefined,
    },
  });

  const costCurrency = form.watch('costCurrency');
  const exchangeRateMode = form.watch('exchangeRateMode');
  const photos = form.watch("photos");

  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldOnChange: (value: FileList | null) => void
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      fieldOnChange(files);

      // Try to extract GPS from the first image that has it
      for (const file of Array.from(files)) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const tags = ExifReader.load(arrayBuffer, { expanded: true });
          const { latitude, longitude } = getGpsData(tags);

          if (latitude && longitude && !form.getValues('lat') && !form.getValues('lng')) {
            form.setValue('lat', parseFloat(latitude.toFixed(6)));
            form.setValue('lng', parseFloat(longitude.toFixed(6)));
            toast.success("Location data extracted from photo and pre-filled.");
            break; // Stop after finding the first one
          }
        } catch (error) {
          // It's normal for some images not to have EXIF data, so we can ignore errors here.
        }
      }
    } else {
      fieldOnChange(null);
    }
  };

  function onSubmit(values: z.infer<typeof reportSchema>) {
    console.log("Form Submitted:", values);
    
    if (values.photos) {
      console.log("Photos to upload:", values.photos);
      // In a real app, you would upload files to a storage server here
      // and save the URLs with the report.
    }
    
    if (values.exchangeRateMode === 'auto' && values.startDate) {
      const year = values.startDate.getFullYear();
      console.log(`TODO: Automatically fetch exchange rate for currency ${values.costCurrency} for the year ${year}.`);
      // This would be where the API call for automatic conversion would happen.
    } else if (values.cost && values.costCurrency && values.costCurrency !== 'USD' && values.usd_exchange_rate) {
      const usdAmount = values.cost / values.usd_exchange_rate;
      console.log(`Converted USD amount: ${usdAmount.toFixed(2)}`);
      // This converted amount can then be saved with the report.
    }

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
            Fill in the details of the development project you are reporting. More details lead to better accountability.
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
                  name="project_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Kisumu, Kenya" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., -0.0917" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 34.7680" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Cost (if known)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 150000" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {costCurrency && costCurrency !== 'USD' && (
                <FormField
                  control={form.control}
                  name="exchangeRateMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3 pt-2">
                      <FormLabel>Exchange Rate Option</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset exchange rate when switching modes
                            if (value === 'auto') {
                              form.setValue('usd_exchange_rate', undefined);
                            }
                          }}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="manual" id="manual" />
                            </FormControl>
                            <Label htmlFor="manual" className="font-normal">
                              Enter manually
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="auto" id="auto" />
                            </FormControl>
                            <Label htmlFor="auto" className="font-normal">
                              Calculate automatically
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Automatic calculation requires the Project Start Date.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {costCurrency && costCurrency !== 'USD' && exchangeRateMode === 'manual' && (
                <FormField
                  control={form.control}
                  name="usd_exchange_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exchange Rate (Local Currency per 1 USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 110.5 for KES"
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                          Enter the exchange rate if known.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sponsor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Sponsor</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ministry of Education" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="funder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funder</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., World Bank, Local Government" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contractor</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC Construction Ltd." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Photos</FormLabel>
                    <FormDescription>
                      Upload photos of the project. On mobile, you can use your camera. If photos have location data, it can pre-fill the coordinates.
                    </FormDescription>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <Label
                          htmlFor="photo-upload"
                          className="flex flex-col items-center justify-center w-full h-32 px-4 text-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <ImagePlus className="w-8 h-8 mb-2 text-gray-500" />
                          <span className="font-semibold text-gray-600">
                            Click to upload photos
                          </span>
                          <span className="text-sm text-gray-500">or use your camera on mobile</span>
                        </Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handlePhotoChange(e, field.onChange)}
                          ref={field.ref}
                        />
                      </div>
                    </FormControl>
                    {photos && photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-3 lg:grid-cols-4">
                        {Array.from(photos).map((file: File, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`preview ${index}`}
                              className="object-cover w-full h-32 rounded-md"
                              onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                            />
                            <div className="absolute top-0 right-0 p-1">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="w-6 h-6 transition-opacity opacity-0 group-hover:opacity-100"
                                onClick={() => {
                                  const newFiles = new DataTransfer();
                                  Array.from(photos)
                                    .filter((_, i) => i !== index)
                                    .forEach((f) => newFiles.items.add(f));
                                  form.setValue(
                                    'photos',
                                    newFiles.files.length > 0 ? newFiles.files : undefined,
                                    { shouldValidate: true }
                                  );
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

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
