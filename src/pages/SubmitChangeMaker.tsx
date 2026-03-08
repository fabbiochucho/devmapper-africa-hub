import * as React from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { changeMakerSchema } from "@/lib/changeMakerSchema";
import ChangeMakerStep1 from '@/components/changemaker/ChangeMakerStep1';
import ChangeMakerStep2 from '@/components/changemaker/ChangeMakerStep2';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const SubmitChangeMaker = () => {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [existingProfileId, setExistingProfileId] = React.useState<string | null>(null);
  const { user } = useAuth();
  type ChangeMakerFormValues = z.infer<typeof changeMakerSchema>;

  const form = useForm<ChangeMakerFormValues>({
    resolver: zodResolver(changeMakerSchema),
    defaultValues: {
      type: undefined,
      name: "",
      bio: "",
      description: "",
      sdg_goals: [],
      location: "",
      lat: undefined,
      lng: undefined,
      photo: undefined,
      members: [],
      email: "",
      phone: "",
      website: "",
      socialMedia: {
        linkedin: "",
        twitter: "",
        facebook: "",
        instagram: "",
      },
    },
    mode: 'onChange',
  });

  // Load existing profile if user already has one
  React.useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: existing, error } = await supabase
          .from('change_makers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (existing) {
          setExistingProfileId(existing.id);
          form.reset({
            type: 'individual' as any,
            name: existing.title || "",
            bio: existing.impact_description || "",
            description: existing.description || "",
            sdg_goals: (existing.sdg_goals || []).map(String),
            location: existing.location || "",
            photo: existing.image_url || undefined,
            members: [],
            email: "",
            phone: "",
            website: "",
            socialMedia: { linkedin: "", twitter: "", facebook: "", instagram: "" },
          });
            photo: existing.image_url || undefined,
            members: [],
            email: "",
            phone: "",
            website: "",
            socialMedia: { linkedin: "", twitter: "", facebook: "", instagram: "" },
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadExistingProfile();
  }, [user?.id]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members"
  });

  const changeMakerType = form.watch('type');

  React.useEffect(() => {
    if (changeMakerType === 'group' && fields.length === 0) {
      append({
        name: "", role: "", bio: "", email: "",
        photo: undefined,
        socialMedia: { linkedin: "", twitter: "", facebook: "" },
      });
    } else if (changeMakerType !== 'group') {
      while (fields.length > 0) { remove(0); }
    }
  }, [changeMakerType, fields.length, append, remove]);

  async function onSubmit(values: ChangeMakerFormValues) {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    const profileData = {
      title: values.name,
      description: values.description,
      impact_description: values.bio,
      sdg_goals: values.sdg_goals.map(Number),
      location: values.location,
      country_code: values.location.split(', ').pop()?.substring(0, 3).toUpperCase() || 'UNK',
      image_url: values.photo || null,
      user_id: user.id,
    };

    try {
      if (existingProfileId) {
        // UPDATE existing profile
        const { error } = await supabase
          .from('change_makers')
          .update(profileData)
          .eq('id', existingProfileId);

        if (error) throw error;
        toast.success("Change Maker profile updated successfully!");
      } else {
        // INSERT new profile
        const { data, error } = await supabase
          .from('change_makers')
          .insert([profileData])
          .select()
          .single();

        if (error) throw error;
        setExistingProfileId(data.id);
        toast.success("Change Maker profile created successfully!");
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    }
  }

  const nextStep = async () => {
    const fieldsToValidate: (keyof ChangeMakerFormValues)[] = ['type', 'name', 'bio', 'description', 'sdg_goals', 'location', 'email'];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>
            {existingProfileId ? "Update Your Change Maker Profile" : "Submit a Change Maker"} (Step {step} of 2)
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? existingProfileId 
                ? "Update your Change Maker profile information."
                : "Provide basic information about the change maker."
              : "Add additional details, contact information, and team members (if applicable)."
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent>
              {step === 1 && <ChangeMakerStep1 form={form} />}
              {step === 2 && (
                <ChangeMakerStep2 
                  form={form} 
                  fields={fields} 
                  append={append} 
                  remove={remove} 
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              )}
              {step === 1 && (
                <Button type="button" onClick={nextStep} className="ml-auto">
                  Next
                </Button>
              )}
              {step === 2 && (
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : existingProfileId ? "Update Profile" : "Submit Change Maker"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default SubmitChangeMaker;
