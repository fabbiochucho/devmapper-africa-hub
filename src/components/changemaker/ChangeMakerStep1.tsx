
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { sdgGoals } from "@/lib/constants";
import { UseFormReturn } from "react-hook-form";

interface ChangeMakerStep1Props {
  form: UseFormReturn<any>;
}

const ChangeMakerStep1: React.FC<ChangeMakerStep1Props> = ({ form }) => {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Change Maker Type *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type of change maker" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="ngo">NGO/Non-Profit</SelectItem>
                <SelectItem value="corporate">Corporate Entity</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Select the type that best describes this change maker.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter the name" {...field} />
            </FormControl>
            <FormDescription>
              Full name of the individual, group, organization, or company.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Short Bio *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Brief description of background and expertise..."
                className="min-h-[80px]"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              A concise bio highlighting key background and expertise (minimum 20 characters).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Detailed Description *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Detailed description of work, mission, and impact..."
                className="min-h-[120px]"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Comprehensive description of the change maker's work, mission, and impact (minimum 50 characters).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sdg_goals"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base">SDG Goals *</FormLabel>
              <FormDescription>
                Select all SDG goals that this change maker focuses on.
              </FormDescription>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {sdgGoals.map((item) => (
                <FormField
                  key={item.number}
                  control={form.control}
                  name="sdg_goals"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.number}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.number.toString())}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.number.toString()])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== item.number.toString()
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          SDG {item.number}: {item.title}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location *</FormLabel>
              <FormControl>
                <Input placeholder="City, Country" {...field} />
              </FormControl>
              <FormDescription>
                Primary location where the change maker operates.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contact@example.com" {...field} />
              </FormControl>
              <FormDescription>
                Primary contact email address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="lat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="e.g., -1.2921"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormDescription>
                Geographic latitude for map display.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lng"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="e.g., 36.8219"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormDescription>
                Geographic longitude for map display.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default ChangeMakerStep1;
