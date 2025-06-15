
import * as React from 'react';
import * as z from 'zod';
import { UseFormReturn } from 'react-hook-form';
import { format } from "date-fns";
import {
  FormControl,
  FormDescription,
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { reportSchema, currencies } from '@/lib/reportSchema';

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportStep2Props {
  form: UseFormReturn<ReportFormValues>;
}

const ReportStep2: React.FC<ReportStep2Props> = ({ form }) => {
  const { control, watch, setValue } = form;
  const costCurrency = watch('costCurrency');
  const exchangeRateMode = watch('exchangeRateMode');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
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
          control={control}
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
          control={control}
          name="exchangeRateMode"
          render={({ field }) => (
            <FormItem className="space-y-3 pt-2">
              <FormLabel>Exchange Rate Option</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === 'auto') {
                      setValue('usd_exchange_rate', undefined);
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
          control={control}
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
          control={control}
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
          control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
    </div>
  );
};

export default ReportStep2;
