# Wastely — project notes for picking this up in a new session

Read this file first if you're a new Claude Code session helping on this project. It captures
decisions, context, and open items that aren't obvious from the code alone.

## What this is

Wastely: point a camera at an item, Claude's vision model tells you if it's recyclable or trash,
with confidence, material category, and an estimated weight. Built end-to-end (frontend, backend,
database, deployment) as a real product, not a demo — has real signed-up users, is aimed at a
YC application, and the founder has been recording marketing videos and drafting application copy
based on it.

## Live URLs

- Client: https://wastely-client-ten.vercel.app
- API: https://wastely-api.onrender.com
- GitHub: https://github.com/aarav253/Wastely

## Stack

- **Client**: React 19 + TypeScript, Vite, React Router, Framer Motion, Lucide icons. Hand-written
  CSS (no Tailwind). Deployed on Vercel.
- **Server**: Node/Express, TypeScript. Deployed on Render (free tier).
- **AI**: `@anthropic-ai/sdk`, model `claude-sonnet-5`, forced structured output via tool-use
  (`server/src/lib/claude.ts`) — never free-text parsing.
- **Database/Auth**: Supabase — Postgres, Google OAuth, row-level security, and
  `SECURITY DEFINER` Postgres functions for anything that awards points, so a signed-in user
  can't call the RPC directly and fake their own score (see `supabase/schema.sql`, especially the
  `revoke execute` lines).

## What's built

- Camera capture + upload fallback, with a flip-camera button.
- Classification returns category, confidence, reason, `estimatedWeightGrams`, and
  `materialCategory` (paper_cardboard/plastic/metal/glass/organic/electronic/other).
- **Google sign-in is mandatory to use the scanner** (`AuthGate.tsx`) — but only when Supabase is
  configured client-side; if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are unset, it falls back
  to fully anonymous (this is the local-dev-without-Supabase path, not a real anonymous mode in
  production).
- Points/streaks/badges/leaderboard, all computed server-side/RLS-protected so nothing can be
  spoofed from the client.
- Personal "impact" view (est. lbs diverted) in the profile panel.
- Two export formats from the History tab: a plain CSV (readable in Excel/Sheets) and a JSON
  report structured around the real **GRI 306** waste-reporting disclosures (306-3/4/5), with an
  explicit methodology/disclaimer block in the file itself — it's positioned as supporting
  documentation, NOT a certified ESG/CSR filing, since AI-estimated weights aren't scale-verified.
- Marketing landing page (Navbar/Hero/Features/HowItWorks/Impact/CtaBanner/Footer). The Stats
  section is currently **not rendered** (removed from `Landing.tsx`'s composition) because the
  real numbers looked thin for a demo recording — the component still exists, just unused.
- PWA scaffolding exists (`vite-plugin-pwa`, icons generated via `npm run icons:generate`) but is
  **currently disabled** (commented out in `client/vite.config.ts`) — its build step was crashing
  specifically on Vercel's build machine (exited non-zero right after the core Vite build finished,
  no useful error surfaced) and it was never root-caused. Don't just re-enable it blind; expect to
  need to actually debug that.

## Known issues / things NOT yet fixed (don't assume these are done)

- **Supabase project status is unconfirmed as of the last check** — its subdomain
  (`aujpjgdkkgqtdajnszvo.supabase.co`) was returning `DNS_PROBE_FINISHED_NXDOMAIN` (confirmed via
  browser, curl, nslookup, AND the user's own browser independently) for over a month. Free-tier
  Supabase projects auto-pause after 7 days of inactivity, and can be deleted outright if left
  paused long enough. **Check this first** if anything Supabase-related seems broken — sign-in,
  points, leaderboard, exports all depend on it. If the project is gone, a fresh one needs
  `supabase/schema.sql` re-run, a new Google OAuth redirect URI, and new env vars in Vercel+Render.
- `/api/classify` has **no rate limiting** and does not enforce sign-in at the HTTP level — the
  mandatory-sign-in gate is UI-only (`AuthGate.tsx`); the raw endpoint is still callable
  unauthenticated by anyone (curl, a script), and every call is a real metered Claude API charge.
  A fix for this (auth middleware + `express-rate-limit`) was drafted once in this repo's history
  and then explicitly reverted at the user's request ("let's not build rn") — it is NOT currently
  in place. If asked to build this again, the approach that was drafted: two middlewares
  (`requireAuthIfConfigured` for classify, `requireAuth` for feedback) plus per-user rate limits
  (20/15min classify, 60/15min feedback).
- CORS is fully open (`cors()` with no origin restriction) on the server — never restricted.
- `react-router` has a known moderate security advisory (open redirect); the fix requires a v6→v7
  major upgrade, deliberately not applied yet since it risks breaking routing without dedicated
  testing.
- The History tab's list view still shows only local-device IndexedDB history, while the Export
  feature (both CSV and JSON) correctly pulls the full cross-device account history from Supabase
  when signed in. This inconsistency was identified but never fixed.
- The public leaderboard shows real names/photos (from Google) with no pseudonym option or
  opt-out — flagged as a privacy consideration, not addressed.
- No organization/team accounts exist — everything is per-individual. This is repeatedly the
  actual prerequisite for the B2B/ESG-at-scale story (see Strategy below) and hasn't been started.

## Strategy context (so you don't re-litigate settled discussions)

- Competitive landscape: Bower/Plovie is the closest direct competitor (camera-based, Gemini
  vision, ~680k users, cash/coupon rewards, Google-backed) — individual consumer monetization
  is considered weak specifically because of this.
- Recommended go-to-market: B2B self-serve to single-decision-maker buyers (gyms, coworking
  spaces, apartment buildings, property managers) — fast sales cycle, fits YC-speed expectations.
  Municipal/hauler contamination-insights (using the `user_corrected`/`feedback_given` data as a
  product) is a real, differentiated angle but a slower sales cycle — a later-stage move, not
  a first customer.
- Monetization discussion is **unresolved and in tension**: the user has floated (a) a consumer
  paywall ("$5/month after a usage cap"), (b) wanting to distribute free to as many people as
  possible, and (c) a fully offline/no-API mode to eliminate cost entirely. These pull in different
  directions (paywall vs. free wide reach) and no decision has been made. If asked to build a
  paywall, it needs real inputs first: free-tier scan limit, confirmed price, and whether a Stripe
  account exists — don't guess these.
- A no-API/offline mode would mean an in-browser model (e.g. TensorFlow.js) as a fallback path —
  meaningfully less accurate than Claude (general object classes, not recycling-specific judgment)
  and would lose material/weight estimates unless approximated. Discussed, not built.

## Deployment notes

- Pushing to `main` on GitHub auto-deploys both Vercel (client) and Render (server).
- Render free tier sleeps after 15 min idle (~30s cold start on first request after) — do a
  warm-up request before any live demo.
- `server/.env` and `client/.env` are gitignored (not in the repo) — they hold
  `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server) and
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client). These must exist locally for `npm run
  dev` to work with accounts enabled; without them the app still runs, just fully anonymous.
- `vercel.json`'s rewrite target and Vercel's dashboard Root Directory setting were both sources
  of real, time-consuming deploy failures in this project's history — if a Vercel build fails on
  "No Output Directory," check the dashboard's Root Directory field first (it was silently set to
  `client` from initial auto-import and caused exactly this), not just `vercel.json`.
