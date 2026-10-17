// A visitor's country: Cloudflare's cf-ipcountry header when present, else a geojs.io
// lookup of the request IP. The IP is used for that lookup only - never stored or logged.
export async function countryOf(req: Request): Promise<string | null> {
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
