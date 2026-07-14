import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

type PollState = "polling" | "success" | "failed" | "timeout";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15; // ~30s total

/**
 * Landing page for a buyer/upgrader returning from Flutterwave's or
 * Paystack's hosted checkout. The actual payment confirmation always
 * happens server-to-server via the flutterwave-webhook/paystack-webhook
 * functions (configured separately in each gateway's dashboard) - this page
 * just polls the row that webhook updates until it sees the change, since
 * the browser redirect can arrive before or after the webhook does.
 */
export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type"); // 'marketplace_purchase' | 'subscription'
  const orderId = searchParams.get("order_id");
  const organizationId = searchParams.get("organization_id");
  const expectedPlan = searchParams.get("plan_type");
  // Flutterwave appends its own status param on redirect (successful/cancelled/failed).
  // Paystack doesn't, so this only ever short-circuits for Flutterwave.
  const gatewayStatus = searchParams.get("status");

  const [state, setState] = useState<PollState>("polling");
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (gatewayStatus === "cancelled" || gatewayStatus === "failed") {
      setState("failed");
      return;
    }
    if (type === "marketplace_purchase" && !orderId) { setState("failed"); return; }
    if (type === "subscription" && !organizationId) { setState("failed"); return; }
    if (type !== "marketplace_purchase" && type !== "subscription") { setState("failed"); return; }

    let cancelled = false;

    const checkOnce = async (): Promise<boolean> => {
      if (type === "marketplace_purchase") {
        const { data } = await supabase.from("carbon_credit_orders").select("status").eq("id", orderId!).maybeSingle();
        return data?.status === "paid";
      }
      const { data } = await supabase.from("organizations").select("plan_type").eq("id", organizationId!).maybeSingle();
      return !!data?.plan_type && (!expectedPlan || data.plan_type === expectedPlan);
    };

    const interval = setInterval(async () => {
      attemptsRef.current += 1;
      const done = await checkOnce();
      if (cancelled) return;
      if (done) {
        setState("success");
        clearInterval(interval);
      } else if (attemptsRef.current >= MAX_POLLS) {
        setState("timeout");
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    checkOnce().then((done) => { if (done && !cancelled) { setState("success"); clearInterval(interval); } });

    return () => { cancelled = true; clearInterval(interval); };
  }, [type, orderId, organizationId, expectedPlan, gatewayStatus]);

  const backLink = type === "marketplace_purchase"
    ? { to: "/carbon-marketplace", label: "Back to Marketplace" }
    : { to: "/billing-upgrade", label: "Back to Billing" };

  return (
    <div className="flex justify-center items-start pt-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {state === "polling" && <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />}
          {state === "success" && <CheckCircle2 className="h-10 w-10 mx-auto text-green-600" />}
          {state === "failed" && <XCircle className="h-10 w-10 mx-auto text-destructive" />}
          {state === "timeout" && <Clock className="h-10 w-10 mx-auto text-yellow-600" />}
          <CardTitle className="mt-2">
            {state === "polling" && "Confirming your payment..."}
            {state === "success" && "Payment confirmed!"}
            {state === "failed" && "Payment was cancelled or failed"}
            {state === "timeout" && "Still processing"}
          </CardTitle>
          <CardDescription>
            {state === "polling" && "This usually takes a few seconds."}
            {state === "success" && (type === "marketplace_purchase"
              ? "Your carbon credit purchase has been recorded."
              : "Your organization's plan has been upgraded.")}
            {state === "failed" && "No charge was completed. You can try again from where you started."}
            {state === "timeout" && "Your payment may still be processing on the provider's side. Check back in a minute — no need to retry."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant={state === "success" ? "default" : "outline"}>
            <Link to={backLink.to}>{backLink.label}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
