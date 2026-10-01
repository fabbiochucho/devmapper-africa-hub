# DevMapper Launch Video — Brief D: "Ndovu Akili — Data to Insight"

For use with `/brag` or `/brag-slim`.

## Ground truth (verified in code before writing this brief)

Ndovu Akili is two distinct real capabilities, not one:

1. **Bill/document auto-extraction** (`carbon.extractedByNdovuAkili` in
   `src/components/carbon/CarbonTab.tsx`) — upload a utility bill, it reads
   quantity/unit/vendor/billing period and a confidence score, pre-fills
   the entry form.
2. **Multi-agent orchestrator + synthesizer**
   (`src/components/ai/NdovuMultiAgentPanel.tsx`,
   `supabase/functions/ndovu-orchestrator`,
   `supabase/functions/ndovu-synthesizer`, plus specialist agents —
   verifier, supplier, investor, project, regulator, trader) — ask a
   free-text question, it classifies intent, routes to the right
   specialist agent(s), and synthesizes their outputs into insights /
   risks / actions with a confidence score and an audit trail
   (`NdovuAuditTrail.tsx`). Rate-limited by plan tier (free: 3/day, lite: 5,
   pro: 25, advanced: 100, enterprise: unlimited) — this is what grounds
   the "scale" claim below; don't state the exact numbers in the video
   itself (see note at the bottom).

## Plot

As you enter data — type it, bulk-import a CSV, or just upload a utility
bill — Ndovu Akili is already working in the background, turning raw input
into a filled-in form. Then, separately, you can ask it anything about what
that data means, and it routes your question to the right specialist and
hands back insight, risk, and action — with an audit trail, not a black
box. The close makes the scaling claim explicit: one question or thousands
of data points, same AI underneath.

**Tone:** Confident, slightly more technical than Briefs A/B/C — this
audience (ESG leads, analysts) wants to see rigor (confidence scores, audit
trail), not just a vibe.

**Length:** ~22 seconds, 6 shots.

## Storyboard

| # | Time | Visual (real product) | On-screen text | Audio |
|---|------|------------------------|-----------------|-------|
| 1 | 0:00–0:04 | A utility bill image dropped into the upload zone → form fields auto-fill (quantity, unit, vendor, billing period) with a confidence badge | "Upload a bill. Ndovu Akili reads it." | Music opens, light and precise |
| 2 | 0:04–0:07 | Cut to the Ndovu Multi-Agent panel, a question typed in: "Where's my biggest emissions risk?" | "Or just ask." | — |
| 3 | 0:07–0:11 | Agent status list flipping pending → running → complete across 2–3 named agents | "It routes to the right specialist." | Music builds, one tick per agent completing |
| 4 | 0:11–0:15 | Synthesizer output: insights / risks / actions list, confidence score, "View audit trail" link | "One answer. Full trail." | — |
| 5 | 0:15–0:19 | Quick split: a single free-text question on one side, a CSV of hundreds of supplier rows being imported on the other | "One question or ten thousand rows." | Music lifts |
| 6 | 0:19–0:22 | Wordmark, tagline | "Same AI. Your scale." | Resolve to silence |

**Deliberately cut:** the plan-tier rate limits themselves (free: 3/day vs.
enterprise: unlimited) — true and relevant to the "scale" claim, but
stating exact numbers in a launch video invites exactly the kind of audit
DevMapper's own positioning is built around avoiding; let the visual
contrast (one question vs. a CSV wall) carry it instead.
