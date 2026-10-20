# Wastely

**AI waste sorting, from the bin to the ESG report.** Wastely identifies waste items with computer vision, physically routes them to trash or recycling, and turns every sorted item into waste data an organization can report on.

**Live demo:** [wastely-client-ten.vercel.app](https://wastely-client-ten.vercel.app) · Diamond Challenge Semifinalist (2026)

---

## Why

Recycling contamination happens when people guess wrong. One greasy pizza box or plastic bag can ruin a whole batch at a sorting facility. Wastely makes the call for them, and logs what was thrown away so schools and offices can actually measure their waste.

## What I built

### Hardware prototype
- A sorting prototype in which a computer vision classifier drives an **Arduino-controlled servo mechanism** that routes each item to trash or recycling
- Iterated through multiple physical prototypes, testing on real waste items and refining both the hardware and the software
- In design: a smart sorting lid for school and office bins, with a load cell to weigh each item as it's sorted

### Web app (this repo)
- **Classify from a photo:** the client captures a camera frame (or an uploaded photo); the server sends it to Claude's vision API through a forced tool-use call with a typed schema (category, confidence, reason, estimated weight, material category), then validates every field server-side
- **Location-aware guidance:** classification factors in the user's US state, defaulting to "trash" when uncertain, since false "recyclable" calls are what cause contamination
- **Accounts and rewards:** Google sign-in via Supabase, with points, day streaks, badges, and a leaderboard. Points are awarded only by server-side Postgres functions behind row-level security, so users can't award themselves points
- **ESG reporting:** history exports as CSV or as a JSON report structured around the **GRI 306** waste-disclosure standard, grouped by material category with AI-estimated weights

## Architecture

```
client/    React + TypeScript (Vite): landing page, camera capture, results UI, history, auth
server/    Node/Express + TypeScript: classification via the Claude API, logins, point awards
supabase/  schema.sql: Postgres tables, row-level security policies, point/streak functions
```

**Deployment:** client on Vercel, API on Render, database and auth on Supabase.

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| AI | Claude vision API (structured tool-use output) |
| Data & auth | Supabase (PostgreSQL, row-level security, Google OAuth) |
| Hardware | Arduino, servo actuation, computer vision |

---

## Running it locally

### Core scanner (no accounts)

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

This starts the Express API (default port `4001`) and the Vite client (default `5183`); the client proxies `/api/*` to the server. Camera access requires `localhost` or HTTPS; otherwise use "Upload photo." Without Supabase configured, the app runs fully anonymous with local history only.

### Adding accounts, points, and the leaderboard

Requires a free [Supabase](https://supabase.com) project:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor to create the tables, row-level security policies, and point/streak functions.
3. Create Google OAuth credentials (Google Cloud Console → Credentials → OAuth client ID → Web application) with the redirect URI `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. Enable the Google provider in Supabase (Authentication → Providers → Google) with that Client ID and Secret.
5. Set environment variables:
   - `server/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only)
   - `client/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
6. Restart `npm run dev`. Once the client has Supabase configured, Google sign-in is required to use the scanner.

**Points:** +10 per scan, up to +20 more from a day streak, and +5 for confirming or correcting a result.

### Deploying

- **Server → Render:** New → Blueprint → point it at this repo (reads `render.yaml`), then fill in the secret env vars.
- **Client → Vercel:** set `vercel.json`'s rewrite target to your Render URL, import the repo, and add the `VITE_SUPABASE_*` env vars.
- If you use Google sign-in, add your Vercel URL as an Authorized JavaScript origin in Google Cloud and as a Redirect URL in Supabase.

## Notes

- **Installable as an app (PWA):** a hand-written web app manifest (`client/public/manifest.webmanifest`) and service worker (`client/public/sw.js`) make the site installable on phones and desktops. The service worker deliberately caches nothing and never touches `/api` calls, so classification results are always fresh. (`vite-plugin-pwa` is still a dev dependency but unused; its build step failed on Vercel.)
- AI-estimated weights are directional, not scale-verified, so the GRI 306 export is supporting documentation rather than a certified ESG filing. Measured weights from the hardware load cell are the planned fix.
