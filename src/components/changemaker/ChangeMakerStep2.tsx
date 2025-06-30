
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

interface ChangeMakerStep2Props {
  form: UseFormReturn<any>;
  fields: any[];
  append: UseFieldArrayReturn<any>['append'];
  remove: UseFieldArrayReturn<any>['remove'];
}

const ChangeMakerStep2: React.FC<ChangeMakerStep2Props> = ({ form, fields, append, remove }) => {
  const changeMakerType = form.watch('type');

  const addMember = () => {
    append({
      name: "",
      role: "",
      bio: "",
      email: "",
      photo: undefined,
      socialMedia: {
        linkedin: "",
        twitter: "",
        facebook: "",
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload */}
      <FormField
        control={form.control}
        name="photo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profile Photo</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => field.onChange(e.target.files?.[0])}
              />
            </FormControl>
            <FormDescription>
              Upload a profile photo (headshot for individuals, logo for organizations).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+XXX-XXX-XXXX" {...field} />
              </FormControl>
              <FormDescription>
                Contact phone number (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormDescription>
                Official website URL (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Social Media */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Social Media (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="socialMedia.linkedin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn</FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialMedia.twitter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter</FormLabel>
                <FormControl>
                  <Input placeholder="https://twitter.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialMedia.facebook"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook</FormLabel>
                <FormControl>
                  <Input placeholder="https://facebook.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialMedia.instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input placeholder="https://instagram.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Group Members */}
      {changeMakerType === 'group' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Group Members *</h3>
            <Button type="button" onClick={addMember} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base">Member {index + 1}</CardTitle>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => remove(index)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`members.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Member name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`members.${index}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Project Lead" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`members.${index}.email`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="member@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`members.${index}.bio`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief bio of the member..."
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`members.${index}.photo`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`members.${index}.socialMedia.linkedin`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input placeholder="LinkedIn URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`members.${index}.socialMedia.twitter`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="Twitter URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`members.${index}.socialMedia.facebook`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder="Facebook URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChangeMakerStep2;
