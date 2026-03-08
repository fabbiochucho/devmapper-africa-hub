
import * as React from 'react';
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
} from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { reportSchema } from "@/lib/reportSchema";
import ReportStep1 from '@/components/report/ReportStep1';
import ReportStep2 from '@/components/report/ReportStep2';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const SubmitReport = () => {
  const [step, setStep] = React.useState(1);
  const [sdgTargets, setSdgTargets] = React.useState<string[]>([]);
  type ReportFormValues = z.infer<typeof reportSchema>;
  const { user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      country_code: "",
      sdg_goal: "",
      sdg_target: "",
      project_status: "",
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
    mode: 'onChange',
  });

  const sdgGoal = form.watch('sdg_goal');

  React.useEffect(() => {
    if (sdgGoal) {
      const mockTargets = [`${sdgGoal}.1`, `${sdgGoal}.2`, `${sdgGoal}.a`, `${sdgGoal}.b`, `${sdgGoal}.c`];
      setSdgTargets(mockTargets);
      form.setValue('sdg_target', '');
    } else {
      setSdgTargets([]);
    }
  }, [sdgGoal, form]);

  async function onSubmit(values: ReportFormValues) {
    if (!user) {
      toast.error("You must be logged in to submit a report.");
      return;
    }

    try {
      // Insert report into Supabase
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          title: values.title,
          description: values.description,
          sdg_goal: parseInt(values.sdg_goal),
          project_status: values.project_status || 'planned',
          location: values.location,
          user_id: user.id,
          lat: values.lat || null,
          lng: values.lng || null,
          cost: values.cost || null,
          cost_currency: values.costCurrency || 'USD',
          usd_exchange_rate: values.usd_exchange_rate || null,
          start_date: values.startDate?.toISOString().split('T')[0] || null,
          end_date: values.endDate?.toISOString().split('T')[0] || null,
          sponsor: values.sponsor || null,
          funder: values.funder || null,
          contractor: values.contractor || null,
          beneficiaries: null,
        })
        .select('id')
        .single();

      if (reportError) throw reportError;

      // Create owner affiliation
      if (report) {
        await supabase.from('project_affiliations').insert({
          report_id: report.id,
          user_id: user.id,
          relationship_type: 'owner',
        });
      }

      // Upload photos to storage if provided
      if (values.photos && report) {
        const files = Array.from(values.photos as FileList);
        for (const file of files) {
          const filePath = `${user.id}/${report.id}/${file.name}`;
          await supabase.storage.from('project-files').upload(filePath, file);
        }
      }

      // Handle exchange rate logging
      if (values.exchangeRateMode === 'auto' && values.startDate) {
        console.log(`TODO: Auto-fetch exchange rate for ${values.costCurrency} in ${values.startDate.getFullYear()}`);
      }

      toast.success("Report submitted successfully!", {
        description: "Your report has been saved. You can now track progress via milestones.",
      });
      form.reset();
      setStep(1);
      navigate('/my-projects');
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error("Failed to submit report", {
        description: error.message || "Please try again.",
      });
    }
  }

  const nextStep = async () => {
    const fieldsToValidate: (keyof ReportFormValues)[] = ['title', 'description', 'sdg_goal', 'project_status', 'location'];
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Submit a Project Report (Step {step} of 2)</CardTitle>
          <CardDescription>
            {step === 1 
              ? "Fill in the basic details of the development project."
              : "Provide financial, timeline, and stakeholder information."
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent>
              {step === 1 && <ReportStep1 form={form} sdgTargets={sdgTargets} />}
              {step === 2 && <ReportStep2 form={form} />}
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
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default SubmitReport;
