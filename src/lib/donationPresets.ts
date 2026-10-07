// Donation preset amounts, chosen by where the donor is (see the donor-context edge function).
// Presets are always in the campaign's currency - that is what Paystack charges - and donors
// outside the campaign's country also see an approximate value in their own currency.
// Donors can still type any amount in the dialog's custom field.

/** donor-context's response: the donor's country/currency and exchange rates from 1 NGN. */
export interface DonorContext {
  country: string | null;
  currency: string | null;
  perNgn: Record<string, number> | null;
}

export interface Preset {
  amount: number;
  /** Approximate value in the donor's currency; absent when it would repeat the amount. */
  estimate?: { value: number; currency: string };
}

const NGN_LOCAL = [5000, 10000, 25000, 50000, 100000, 250000];
const USD_LADDER = [25, 50, 100, 250, 500, 1000];

/** Two significant figures: 33,201 -> 33,000; 1,327,900 -> 1,300,000. */
export const roundNicely = (x: number) => {
  const step = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1);
  return Math.round(x / step) * step;
};

export function donationPresets(campaignCurrency: string, ctx: DonorContext | null): Preset[] {
  const usdPerNgn = ctx?.perNgn?.USD;
  // The donor's currency if we have a rate for it, else USD as a widely understood stand-in.
  const local = ctx?.currency && ctx.perNgn?.[ctx.currency] ? ctx.currency : 'USD';
  const toLocal = (amount: number, from: string) => {
    if (!ctx?.perNgn || !usdPerNgn || local === from) return undefined;
    const ngn = from === 'NGN' ? amount : amount / usdPerNgn;
    return { value: ngn * ctx.perNgn[local], currency: local };
  };

  if (campaignCurrency === 'NGN') {
    // Nigerian donors - and anyone we couldn't place or price - get the naira ladder.
    if (!usdPerNgn || !ctx?.country || ctx.country === 'NG') return NGN_LOCAL.map((amount) => ({ amount }));
    return USD_LADDER.map((usd) => {
      const amount = roundNicely(usd / usdPerNgn);
      return { amount, estimate: toLocal(amount, 'NGN') };
    });
  }
  return USD_LADDER.map((amount) => ({ amount, estimate: campaignCurrency === 'USD' ? toLocal(amount, 'USD') : undefined }));
}
