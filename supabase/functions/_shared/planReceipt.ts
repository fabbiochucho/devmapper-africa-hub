import { computePlanExpiry } from "./planQuotas.ts";

export interface PlanReceipt {
  to: string | undefined;
  plan: string;
  interval: string | undefined;
  amount: number;
  currency: string;
  reference: string;
}

export function planReceiptText(r: PlanReceipt, now = new Date()): string {
  const ends = new Date(computePlanExpiry(r.interval)).toUTCString().slice(0, 16);
  return [
    `Thank you. Your payment for DevMapper has been received.`,
    ``,
    `Plan: ${r.plan} (${r.interval ?? 'monthly'})`,
    `Amount: ${r.amount.toFixed(2)} ${r.currency}`,
    `Paid: ${now.toUTCString().slice(0, 16)}`,
    `Reference: ${r.reference}`,
    `Plan active until: ${ends}`,
    ``,
    `This was a one-off payment. Your plan does not renew automatically and you will not be charged again unless you pay again. When it ends your account returns to the free plan.`,
    `For a refund, contact us within 30 days at https://devmapper.africa/contact.`,
    ``,
    `DiBadili Institute, P.O. Box 2550, Festac Town, Lagos, Nigeria`,
  ].join('\n');
}

/** Emails the payer a receipt. Never throws: a failed email must not fail the webhook. */
export async function sendPlanReceipt(r: PlanReceipt): Promise<void> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key || !r.to) return;
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'DevMapper Africa <noreply@devmapper.africa>',
        to: [r.to],
        subject: `Your DevMapper receipt (${r.reference})`,
        text: planReceiptText(r),
      }),
    });
    if (!resp.ok) console.error('receipt email failed', resp.status, await resp.text());
  } catch (error) {
    console.error('receipt email failed', error);
  }
}
