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
import { mockChangeMakers, ChangeMaker } from '@/data/mockChangeMakers';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useAuth } from '@/contexts/AuthContext';

const SubmitChangeMaker = () => {
  const [step, setStep] = React.useState(1);
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members"
  });

  const changeMakerType = form.watch('type');

  React.useEffect(() => {
    if (changeMakerType === 'group' && fields.length === 0) {
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
    } else if (changeMakerType !== 'group') {
      // Clear members for non-group types
      while (fields.length > 0) {
        remove(0);
      }
    }
  }, [changeMakerType, fields.length, append, remove]);

  function onSubmit(values: ChangeMakerFormValues) {
    console.log("Form Submitted:", values);

    if (!user) {
      toast.error("You must be logged in to submit a change maker.");
      return;
    }

    // Filter out incomplete members and ensure all required fields are present
    const validMembers = (values.members || []).filter(member => 
      member.name && member.role && member.bio && member.email
    ).map(member => ({
      name: member.name!,
      role: member.role!,
      bio: member.bio!,
      email: member.email!,
      photo: member.photo,
      socialMedia: member.socialMedia || {
        linkedin: "",
        twitter: "",
        facebook: "",
      }
    }));

    const newChangeMaker: ChangeMaker = {
      id: `CM-${String(mockChangeMakers.length + 1).padStart(3, '0')}`,
      type: values.type,
      name: values.name,
      bio: values.bio,
      description: values.description,
      sdg_goals: values.sdg_goals,
      location: values.location,
      country_code: values.location.split(', ').pop()?.substring(0, 3).toUpperCase() || 'UNK',
      lat: values.lat,
      lng: values.lng,
      photo: values.photo || "/placeholder.svg",
      members: validMembers,
      email: values.email,
      phone: values.phone,
      website: values.website,
      socialMedia: values.socialMedia,
      projects: [],
      totalFunding: 0,
      impactMetrics: {
        livesTouched: 0,
        communitiesServed: 0,
        projectsCompleted: 0
      },
      verifications: [],
      verification_score: 0,
      submitted_by: user.id.toString(),
      submitted_at: new Date().toISOString(),
      verified: false,
    };

    mockChangeMakers.push(newChangeMaker);

    toast.success("Change Maker submitted successfully!", {
      description: "Your submission has been received and will be reviewed.",
    });
    form.reset();
    setStep(1);
  }

  const nextStep = async () => {
    const fieldsToValidate: (keyof ChangeMakerFormValues)[] = ['type', 'name', 'bio', 'description', 'sdg_goals', 'location', 'email'];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Submit a Change Maker (Step {step} of 2)</CardTitle>
          <CardDescription>
            {step === 1 
              ? "Provide basic information about the change maker."
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
                <Button type="button" variant="outline" onClick={prevStep}>
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
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Change Maker"}
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
