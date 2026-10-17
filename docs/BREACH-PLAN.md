# DevMapper breach plan

One page for the day personal data leaks, is changed or is lost. A breach includes data reaching someone who shouldn't have it, such as a wrong RLS policy, a leaked key, or a vendor sending data where the privacy policy says it doesn't go.

## Who decides
| Role | Person | Contact |
|---|---|---|
| Decides and signs off notices | Abiola Oshunniyi | devmapperafrica@becomechange.institute |
| Data Protection Officer | see `src/lib/dpo.ts` | dpo email in `src/lib/dpo.ts` |
| Technical lead (containment) | Abiola Oshunniyi | devmapperafrica@becomechange.institute |
| Lawyer to call | Adeola Osuntoki (to confirm) | via devmapperafrica@becomechange.institute |

## First hour: contain
1. Stop the leak: fix or drop the policy, disable the function (`supabase functions delete` or redeploy), or pause the project.
2. Rotate anything exposed: Supabase service role and JWT secret, `RESEND_API_KEY`, Paystack, Flutterwave and Lovable AI keys, and `SUPABASE_ACCESS_TOKEN` in GitHub.
3. Keep the evidence: export Supabase logs (API, auth, edge functions) before they age out, and write a timeline of what happened when.

## Within 72 hours: assess and notify
Start the clock when you become aware of the breach.
- **Nigeria (NDPA 2023):** notify the Nigeria Data Protection Commission within 72 hours. If the breach is likely to put people at high risk, tell those people without delay.
- **Kenya (DPA 2019):** notify the ODPC within 72 hours, and the affected people as soon as practicable.
- **South Africa (POPIA):** notify the Information Regulator and affected people as soon as reasonably possible.
- **EU/UK users (GDPR):** notify the lead supervisory authority within 72 hours, and tell affected people without undue delay if the risk to them is high.
- **Ghana, Uganda, Rwanda:** notify the regulator promptly. Check the deadline with the lawyer.

Each notice says what happened, what data and roughly how many people are affected, what you've done, what people should do (for example, change their password), and the DPO contact.

## Afterwards
- Record every breach, including ones that didn't need notifying: date, what happened, data affected, decision and reasons.
- Fix the cause and add a check (test, CI step or policy review) so it can't happen again silently.
- Update the privacy policy if the breach revealed a data flow it doesn't describe.

Vendor contracts (who must tell us about a breach on their side): see `docs/DPA-REGISTER.md`.
