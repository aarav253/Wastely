# Wastely

An AI-powered waste-sorting assistant. Point your camera (or upload a photo) at an item and Wastely tells you whether it's recyclable or trash, with a confidence score and a plain-language reason. Includes a marketing landing page, Google sign-in (required to scan, once Supabase is configured) with points/streaks/badges/leaderboard, and installable-app (PWA) support.

## How it works

- **Capture** — the client grabs a frame from your camera (or an uploaded photo).
- **Classify** — the image is sent to the server, which calls Claude's vision API to identify the item and classify it as `recyclable` or `trash`, via a structured tool-use call (`server/src/lib/claude.ts`). If you've set a state, that's factored into the guidance.
- **Display** — the result (item name, category, confidence, reason) is shown immediately.
- **Learn over time** — every scan, plus any correction you make, is stored locally in your browser (IndexedDB) regardless of login. The History tab lets you export it as JSON.
- **Accounts** — once Supabase is configured (see below), signing in with Google is required before you can scan at all. This unlocks points per scan, a day streak, badges, and the leaderboard. If Supabase isn't configured, there's no auth system to gate behind, so the app runs fully anonymous instead (see Quick start).

## Architecture

```
client/    Vite + React + TypeScript — landing page, camera capture, results UI, local history, auth UI, PWA
server/    Express — proxies image classification to Claude, verifies logins and awards points (Supabase)
supabase/  schema.sql — run once in your Supabase project to create the accounts/points database
```

## Quick start (core scanner only, no accounts)

```
npm install
```

Add your Anthropic API key to `server/.env` (copy `server/.env.example`):

```
ANTHROPIC_API_KEY=sk-ant-...
```

```
npm run dev
```

This starts the Express API (`server/.env`'s `API_PORT`, default `4001`) and the Vite client (default `5183`, see `client/vite.config.ts`) — the client proxies `/api/*` to the server. Open the client URL printed in the terminal.

Camera access requires either `localhost` or HTTPS. If camera permissions aren't available, use "Upload photo" instead. With no further setup, the app works exactly like this — no login, no database, fully local history — since there's no auth system configured yet to require sign-in against. `/api/health` reports `hasAccounts: false` in this state.

## Adding accounts, points, and the leaderboard

This layer needs a free [Supabase](https://supabase.com) project. **Once the client's `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set (step 5 below), signing in with Google becomes mandatory before the scanner is usable at all** — `Scanner.tsx` shows a sign-in gate (`AuthGate.tsx`) instead of the camera UI until there's a signed-in user. Skip this section entirely to keep the app anonymous-only, exactly as in Quick start above.

1. **Create a Supabase project** at supabase.com (free tier).
2. **Run the schema**: Dashboard → SQL Editor → New query → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → Run. This creates the `profiles`/`scans` tables, row-level security policies, and the point/streak-awarding functions.
3. **Create Google OAuth credentials** (separate from Supabase): [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth client ID → Application type "Web application". Add this Authorized redirect URI (find your exact one in Supabase → Authentication → Providers → Google, it auto-fills):
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   Copy the resulting Client ID and Client Secret.
4. **Enable the Google provider in Supabase**: Dashboard → Authentication → Providers → Google → paste the Client ID/Secret from step 3 → Save.
5. **Set env vars**:
   - `server/.env` — add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Dashboard → Project Settings → API; the service role key is secret, server-only, never expose it to the client).
   - `client/.env` (copy `client/.env.example`) — add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same page; the anon key is safe to expose, it's protected by RLS).
6. Restart `npm run dev`. A "Sign in with Google" button now appears in the scanner header.

**Points**: +10 per scan, plus up to +20 more from a day streak (2 pts/day, capped at day 10), plus +5 for giving feedback (confirm or correct) on a result. Streaks, badges, and the top-20 leaderboard are all computed from real Supabase data server-side/RLS-protected — see `supabase/schema.sql` for the exact logic. **Tracking total users**: Supabase's own dashboard (Authentication → Users) already gives you this count; no extra code needed.

## Installing as an app (PWA)

Already wired up (`vite-plugin-pwa` in `client/vite.config.ts`, icons in `client/public/icons/`, generated via `npm run icons:generate` using `scripts/generate-icons.mjs`). Once the site is served over HTTPS (see deployment below — plain HTTP on a phone won't offer the install prompt, only `localhost` or HTTPS does), visiting it on a phone shows an "Add to Home Screen" / install prompt, and it opens full-screen like a native app.

## Deploying so you can share a link

Two pieces, deployed separately (client is static, server needs to run continuously and holds your secret keys):

**Server → [Render](https://render.com)** (free tier, spins down when idle — first request after idle has a ~30s cold start):
1. Push this repo to GitHub.
2. Render Dashboard → New → Blueprint → point it at your repo. It reads `render.yaml` automatically.
3. Fill in the secret env vars it asks for (`ANTHROPIC_API_KEY`, and `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` if you set up accounts).
4. Once deployed, copy the service URL (`https://wastely-api-xxxx.onrender.com`).

**Client → [Vercel](https://vercel.com)** (free tier):
1. Edit [`vercel.json`](vercel.json) — replace `REPLACE-WITH-YOUR-RENDER-URL.onrender.com` with the real Render URL from above (this is what makes `/api/*` calls from the deployed site reach your backend).
2. Vercel Dashboard → New Project → import the same repo → it picks up `vercel.json` automatically.
3. If using accounts, add `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` as Vercel environment variables.
4. Deploy. Vercel gives you a public `https://your-app.vercel.app` link — that's what you send to anyone, and it works on any device, including phones.

One more step if you added Google login: back in Google Cloud Console, add your real Vercel URL as an **Authorized JavaScript origin**, and in Supabase → Authentication → URL Configuration, add it to **Redirect URLs** — otherwise Google sign-in will only work on `localhost`.

## Notes

- Classification defaults to the household single-stream recycling rules baked into the system prompt (`server/src/lib/claude.ts`) — clean paper/cardboard, metal cans, rigid plastics, glass. Food waste, greasy items, plastic film, and anything ambiguous default to trash, since false "recyclable" calls cause real contamination at sorting facilities.
- Scanning requires a signed-in account whenever Supabase is configured on the client (see `AuthGate.tsx`/`Scanner.tsx`). With no Supabase config at all, there's no auth system to gate behind, so the app runs fully anonymous instead.
- Points/streaks are awarded server-side via a Postgres function called with Supabase's service-role key, not directly by the client — a signed-in user can't call it themselves to award arbitrary points (see `revoke execute` at the bottom of `supabase/schema.sql`).
