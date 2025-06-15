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
import { mockReports, Report } from '@/data/mockReports';
import { useUserRole } from '@/contexts/UserRoleContext';

const SubmitReport = () => {
  const [step, setStep] = React.useState(1);
  const [sdgTargets, setSdgTargets] = React.useState<string[]>([]);
  type ReportFormValues = z.infer<typeof reportSchema>;
  const { user } = useUserRole();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
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
      // In a real app, you'd fetch this. For now, we'll mock it like in your example.
      const mockTargets = [`${sdgGoal}.1`, `${sdgGoal}.2`, `${sdgGoal}.a`, `${sdgGoal}.b`, `${sdgGoal}.c`];
      setSdgTargets(mockTargets);
      form.setValue('sdg_target', ''); // Reset target when goal changes
    } else {
      setSdgTargets([]);
    }
  }, [sdgGoal, form]);

  function onSubmit(values: ReportFormValues) {
    console.log("Form Submitted:", values);

    const newReport: Report = {
      id: `REP-${String(mockReports.length + 1).padStart(3, '0')}`,
      title: values.title,
      description: values.description,
      sdg_goal: values.sdg_goal,
      sdg_target: values.sdg_target,
      project_status: values.project_status as Report['project_status'],
      location: values.location,
      submitted_at: new Date().toISOString(),
      lat: values.lat,
      lng: values.lng,
      validations: 0,
      verifications: [],
      cost: values.cost,
      costCurrency: values.costCurrency,
      usd_exchange_rate: values.usd_exchange_rate,
      startDate: values.startDate?.toISOString(),
      endDate: values.endDate?.toISOString(),
      sponsor: values.sponsor,
      funder: values.funder,
      contractor: values.contractor,
      official: user.role === 'Government Official' || user.role === 'Platform Admin',
    };
    
    if (values.photos) {
      console.log("Photos to upload:", values.photos);
    }
    
    if (values.exchangeRateMode === 'auto' && values.startDate) {
      const year = values.startDate.getFullYear();
      console.log(`TODO: Automatically fetch exchange rate for currency ${values.costCurrency} for the year ${year}.`);
    } else if (values.cost && values.costCurrency && values.costCurrency !== 'USD' && values.usd_exchange_rate) {
      const usdAmount = values.cost / values.usd_exchange_rate;
      console.log(`Converted USD amount: ${usdAmount.toFixed(2)}`);
    }

    mockReports.push(newReport);

    toast.success("Report submitted successfully!", {
      description: "Your report has been received and will be reviewed.",
    });
    form.reset();
    setStep(1);
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
