// Where a donor is, so the donation dialog can suggest sensible amounts (src/lib/donationPresets.ts).
// Country: Cloudflare's cf-ipcountry header when present, else a geojs.io lookup of the request IP.
// The IP is used for that lookup only - never stored or logged. Rates: open.er-api.com, from 1 NGN.
import { corsHeaders } from "../_shared/agent-utils.ts";

// ISO 3166 alpha-2 -> ISO 4217. African Union members plus the usual diaspora countries;
// anyone else gets their estimate in USD.
const CURRENCY: Record<string, string> = {
  DZ: "DZD", AO: "AOA", BJ: "XOF", BW: "BWP", BF: "XOF", BI: "BIF", CV: "CVE", CM: "XAF", CF: "XAF",
  TD: "XAF", KM: "KMF", CD: "CDF", CG: "XAF", CI: "XOF", DJ: "DJF", EG: "EGP", GQ: "XAF", ER: "ERN",
  SZ: "SZL", ET: "ETB", GA: "XAF", GM: "GMD", GH: "GHS", GN: "GNF", GW: "XOF", KE: "KES", LS: "LSL",
  LR: "LRD", LY: "LYD", MG: "MGA", MW: "MWK", ML: "XOF", MR: "MRU", MU: "MUR", MA: "MAD", MZ: "MZN",
  NA: "NAD", NE: "XOF", NG: "NGN", RW: "RWF", ST: "STN", SN: "XOF", SC: "SCR", SL: "SLE", SO: "SOS",
  ZA: "ZAR", SS: "SSP", SD: "SDG", TZ: "TZS", TG: "XOF", TN: "TND", UG: "UGX", ZM: "ZMW", ZW: "ZWG",
  US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK",
  AE: "AED", SA: "SAR", QA: "QAR", IN: "INR", CN: "CNY", JP: "JPY", BR: "BRL",
  ...Object.fromEntries(
    ["DE", "FR", "IT", "ES", "NL", "BE", "IE", "PT", "AT", "FI", "GR", "LU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR"]
      .map((c) => [c, "EUR"]),
  ),
};

// ponytail: per-instance cache; rates update daily upstream, so a cold start refetching is fine.
let cachedRates: { at: number; perNgn: Record<string, number> } | null = null;

async function ngnRates(): Promise<Record<string, number> | null> {
  if (cachedRates && Date.now() - cachedRates.at < 6 * 3600_000) return cachedRates.perNgn;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/NGN", { signal: AbortSignal.timeout(4000) });
    const body = await res.json();
    if (body?.result !== "success" || typeof body.rates?.USD !== "number") return cachedRates?.perNgn ?? null;
    cachedRates = { at: Date.now(), perNgn: body.rates };
    return cachedRates.perNgn;
  } catch {
    return cachedRates?.perNgn ?? null;
  }
}

async function countryOf(req: Request): Promise<string | null> {
  const cf = req.headers.get("cf-ipcountry")?.toUpperCase();
  if (cf && /^[A-Z]{2}$/.test(cf) && cf !== "XX" && cf !== "T1") return cf;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (!ip || !/^[0-9a-fA-F:.]+$/.test(ip)) return null;
  try {
    const res = await fetch(`https://get.geojs.io/v1/ip/country/${ip}.json`, { signal: AbortSignal.timeout(3000) });
    const country = (await res.json())?.country;
    return typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const [country, perNgn] = await Promise.all([countryOf(req), ngnRates()]);
  const currency = country ? CURRENCY[country] ?? "USD" : null;
  // Only the rates the dialog needs.
  const rates = perNgn
    ? Object.fromEntries(["USD", currency].filter((c): c is string => !!c && typeof perNgn[c] === "number").map((c) => [c, perNgn[c]]))
    : null;
  return new Response(JSON.stringify({ country, currency, perNgn: rates }), {
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "private, max-age=3600" },
  });
});
