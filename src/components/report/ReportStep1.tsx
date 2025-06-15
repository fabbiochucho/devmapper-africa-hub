import * as React from 'react';
import * as z from 'zod';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { sdgGoals, projectStatuses } from "@/lib/constants";
import { ImagePlus, Trash2, MapPin } from "lucide-react";
import ExifReader from "exif-reader";
import { Buffer } from 'buffer';
import { reportSchema } from '@/lib/reportSchema';
import { reverseGeocode } from '@/lib/geocode';
import { getCountries, Country } from '@/data/countries';

const reportFormSchema = reportSchema.extend({
  sdg_target: z.string().optional(),
});
type ReportFormValues = z.infer<typeof reportFormSchema>;

interface ReportStep1Props {
  form: UseFormReturn<ReportFormValues>;
  sdgTargets: string[];
}

const getGpsData = (tags: any): { latitude: number | null; longitude: number | null } => {
  if (tags && tags.gps && tags.gps.Latitude && tags.gps.Longitude) {
    return { latitude: tags.gps.Latitude, longitude: tags.gps.Longitude };
  }
  return { latitude: null, longitude: null };
};

const ReportStep1: React.FC<ReportStep1Props> = ({ form, sdgTargets }) => {
  const { control, watch, setValue, getValues, formState: { dirtyFields } } = form;
  const photos = watch("photos");
  const lat = watch("lat");
  const lng = watch("lng");
  const sdgGoal = watch("sdg_goal");
  const [countries, setCountries] = React.useState<Country[]>([]);

  React.useEffect(() => {
    getCountries().then(setCountries);
  }, []);

  React.useEffect(() => {
    const performGeocoding = async () => {
      // Only auto-fill location if user hasn't typed in it manually and we have coordinates
      if (lat !== undefined && lng !== undefined && !dirtyFields.location) {
        const geocodeResult = await reverseGeocode(lat, lng);
        if (geocodeResult) {
          setValue('location', geocodeResult.country, { shouldValidate: true });
          toast.success(`Location auto-detected as ${geocodeResult.country}.`);
        }
      }
    };
    performGeocoding();
  }, [lat, lng, setValue, dirtyFields]);

  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldOnChange: (value: FileList | null) => void
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      fieldOnChange(files);

      for (const file of Array.from(files)) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const tags = ExifReader(buffer);
          const { latitude, longitude } = getGpsData(tags);

          if (latitude && longitude && !getValues('lat') && !getValues('lng')) {
            setValue('lat', parseFloat(latitude.toFixed(6)));
            setValue('lng', parseFloat(longitude.toFixed(6)));
            toast.success("Location data extracted from photo and pre-filled.");
            break; 
          }
        } catch (error) {
          // Ignore errors
        }
      }
    } else {
      fieldOnChange(null);
    }
  };
  
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("Getting location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('lat', parseFloat(position.coords.latitude.toFixed(6)), { shouldValidate: true });
        setValue('lng', parseFloat(position.coords.longitude.toFixed(6)), { shouldValidate: true });
        toast.success("Location captured!");
        setLocationStatus("Location captured!");
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to get location.");
        setLocationStatus("Failed to get location.");
      }
    );
  };
  
  const [locationStatus, setLocationStatus] = React.useState("");

  return (
    <div className="space-y-4">
      <FormField
        control={control}
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
        control={control}
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
          control={control}
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
        {sdgGoal && sdgTargets.length > 0 && (
          <FormField
            control={control}
            name="sdg_target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SDG Target</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an SDG Target" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sdgTargets.map((target) => (
                      <SelectItem key={target} value={target}>
                        {target}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <FormField
        control={control}
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

      <div className="space-y-4 rounded-lg border p-4">
        <Label className="font-semibold">Project Location</Label>
        <FormField
          control={control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
               <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                You can also upload a photo with location data to pre-fill coordinates and country.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2">
            <Label>Coordinates</Label>
            <div className="flex gap-2 items-center">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetCurrentLocation}
                    className="flex-shrink-0"
                >
                    <MapPin className="mr-2 h-4 w-4" />
                    Use my location
                </Button>
                {locationStatus && <p className="text-sm text-muted-foreground">{locationStatus}</p>}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="lat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., -0.0917" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="lng"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 34.7680" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <FormField
        control={control}
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
                {Array.from(photos as FileList).map((file: File, index: number) => (
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
                          Array.from(photos as FileList)
                            .filter((_, i) => i !== index)
                            .forEach((f) => newFiles.items.add(f));
                          setValue(
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
    </div>
  );
};

export default ReportStep1;
