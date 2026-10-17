# Data processing agreements

Every vendor that receives personal data (the table in `src/pages/Privacy.tsx`) and the agreement covering it. Signed copies are kept offline, not in this public repo. Update this file in the same change as the privacy policy's vendor table.

| Vendor | What it handles | Agreement | Status (2026-10-17) |
|---|---|---|---|
| Supabase | Database, auth, storage, functions | [DPA](https://supabase.com/legal/customer-resources/data-processing-addendum), part of the [Terms](https://supabase.com/terms) | In place |
| Lovable (incl. AI gateway: Google Gemini, OpenAI) | Hosting, AI features | [DPA page](https://lovable.dev/data-processing-agreement), [signed PDF](https://lovable.dev/documents/Lovable_DPA_17Nov2025_Signed.pdf) | In place |
| Resend | Email | Signed DPA (`resend-dpa-signed.pdf`, held offline) | In place |
| Paystack | Payments | None yet; their [security article](https://support.paystack.com/en/articles/2131458) says to email support@paystack.com | **To do: request a DPA** |
| Flutterwave | Payments | Merchant agreement accepted at [onboarding](https://app.flutterwave.com/dashboard/onboarding/agreement); [privacy policy](https://dispute.flutterwave.com/privacy) | **To check:** confirm the agreement has data-protection terms, or request a DPA |
| Cloudflare | Turnstile CAPTCHA, DNS | Cloudflare's self-serve customer DPA, part of its terms | Covered by terms |
| OpenStreetMap, Flagpedia (flagcdn), GeoJS | Map tiles and place search, flag images, IP-to-country | Public services; they receive only IP address or search text | No DPA available |
