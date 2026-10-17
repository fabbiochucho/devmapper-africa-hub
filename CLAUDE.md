# DevMapper: rules for coding agents

Read these before changing anything. They hold the launch-readiness decisions that aren't obvious from the code.

## Data and security
- Every new table in `public` gets, in the same migration: `enable row level security`, a policy for each action the app needs, and explicit `grant`s. From 30 Oct 2026 Supabase no longer grants the Data API access to new tables automatically, so a table without grants is unreachable from the app.
- Policies check ownership (`user_id = auth.uid()`, membership or `has_role`), never just "is signed in".
- Secrets (service role, Resend, Paystack, Flutterwave, Lovable AI) live only in edge-function secrets. Nothing secret goes in a `VITE_` variable: those ship to every browser.
- Edge functions deploy from CI on merge to `main`. Removing a function from the repo does not delete it: run `supabase functions delete <name>`.

## Vendors and the privacy policy
- `src/pages/Privacy.tsx` lists every service that receives personal data, including the visitor's IP. When you add or remove a script, SDK, font, map or image CDN, AI provider or email sender, update that table and `PRIVACY_EFFECTIVE_DATE` in the same change.
- No analytics, ad pixels or session replay. If that changes, the vendor needs consent handling first.
- Sentry (`src/lib/sentry.ts`) reports errors only: no replay, tracing, user info, cookies, headers, bodies or query strings. Keep it that way, or update the privacy policy.
- Email is sent only from `devmapper.africa` addresses, the domain verified in Resend.

## Promises the UI makes
- Don't describe features that don't exist (the old API docs did). Docs, Guidelines and Terms must match the code.
- Paid plans are one-off payments that never renew. If auto-renewal is added, revisit the Terms, checkout wording and renewal notices first.
- The AI copilot must say it's an AI and that answers can be wrong.
- Accessibility target: WCAG 2.2 AA. Icon-only buttons need an `aria-label`, and colours must keep 4.5:1 contrast. `--primary` was darkened for that reason.

## Breach
- See `docs/BREACH-PLAN.md`.
