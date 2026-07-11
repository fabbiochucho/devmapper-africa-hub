
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
import { useNavigate } from 'react-router-dom';
import { useEarthIntelligence } from '@/hooks/useEarthIntelligence';
import { submitReportToServer } from '@/lib/report-submission';
import { queueReport, flushQueuedReports, listQueuedReports } from '@/lib/offline-report-queue';
import { WifiOff, RefreshCw } from 'lucide-react';

const SubmitReport = () => {
  const [step, setStep] = React.useState(1);
  const [sdgTargets, setSdgTargets] = React.useState<string[]>([]);
  type ReportFormValues = z.infer<typeof reportSchema>;
  const { user } = useAuth();
  const { fetchGEEData } = useEarthIntelligence();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);

  const refreshPendingCount = React.useCallback(() => {
    listQueuedReports().then((q) => setPendingCount(q.length)).catch(() => {});
  }, []);

  const syncQueuedReports = React.useCallback(async () => {
    if (!user || !navigator.onLine) return;
    setSyncing(true);
    try {
      const { succeeded, failed } = await flushQueuedReports((payload, photos) =>
        submitReportToServer(payload as any, photos, user.id, fetchGEEData)
      );
      if (succeeded > 0) toast.success(`${succeeded} offline report${succeeded > 1 ? 's' : ''} synced`);
      if (failed > 0) toast.warning(`${failed} queued report${failed > 1 ? 's' : ''} still pending sync`);
    } finally {
      setSyncing(false);
      refreshPendingCount();
    }
  }, [user, fetchGEEData, refreshPendingCount]);

  React.useEffect(() => {
    refreshPendingCount();
    window.addEventListener('online', syncQueuedReports);
    return () => window.removeEventListener('online', syncQueuedReports);
  }, [syncQueuedReports, refreshPendingCount]);

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
      issue_type: "",
      issue_severity: "",
      evidence_type: "",
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

    const photos = values.photos ? Array.from(values.photos as FileList) : [];

    // Offline: queue the whole submission (including any photo Files, which
    // IndexedDB can store directly) instead of attempting - and failing - a
    // network request. Flushed automatically once the 'online' event fires.
    if (!navigator.onLine) {
      try {
        await queueReport(values as unknown as Record<string, unknown>, photos);
        toast.success("You're offline - report saved on this device", {
          description: "It will sync automatically once you're back online.",
        });
        form.reset();
        setStep(1);
        refreshPendingCount();
        navigate('/my-projects');
      } catch (error: any) {
        toast.error("Failed to save report offline", { description: error.message || "Please try again." });
      }
      return;
    }

    try {
      const { failedUploads } = await submitReportToServer(values, photos, user.id, fetchGEEData);

      // Handle exchange rate logging
      if (values.exchangeRateMode === 'auto' && values.startDate) {
        console.log(`TODO: Auto-fetch exchange rate for ${values.costCurrency} in ${values.startDate.getFullYear()}`);
      }

      toast.success("Report submitted successfully!", {
        description: "Your report has been saved. You can now track progress via milestones.",
      });
      if (failedUploads > 0) {
        toast.warning(`${failedUploads} photo${failedUploads > 1 ? 's' : ''} failed to upload`, {
          description: "The report was saved, but you can try re-uploading the photo(s) later.",
        });
      }
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
    <div className="flex flex-col items-center pt-8 gap-4">
      {pendingCount > 0 && (
        <Card className="w-full max-w-2xl border-yellow-500/40 bg-yellow-500/5">
          <CardContent className="pt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <WifiOff className="h-4 w-4 text-yellow-600 shrink-0" />
              <span>{pendingCount} report{pendingCount > 1 ? 's' : ''} saved offline, pending sync</span>
            </div>
            <Button size="sm" variant="outline" onClick={syncQueuedReports} disabled={syncing || !navigator.onLine}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </CardContent>
        </Card>
      )}
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
