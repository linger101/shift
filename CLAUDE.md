# BarCrawl Boston — Project Context

## What this is
A React web app for discovering, rating, and sharing Boston bars with friends. Live at https://barcrawl-boston.vercel.app

## Repo
https://github.com/linger101/barcrawl-boston

## Tech Stack
- **Frontend**: React 18 + Vite
- **Map**: react-leaflet with CartoDB Voyager tiles
- **Backend/Auth**: Supabase (auth, profiles, reviews, friendships)
- **Deployment**: Vercel (auto-deploys on push to main)
- **Fonts**: Oswald (display), DM Sans (body) via Google Fonts

## Key Files
- `src/App.jsx` — main app, all UI components except map
- `src/components/BarMap.jsx` — map view with hover popups
- `src/data/bars.js` — 101 bar entries + BAR_WEBSITES map for real URLs
- `src/lib/supabase.js` — all Supabase auth/db helpers
- `src/index.css` — CSS variables and Leaflet overrides
- `supabase-schema.sql` — run in Supabase SQL Editor to set up tables

## Supabase Tables
- `profiles` — user accounts (id, username, favorites: int[])
- `reviews` — bar reviews (bar_id, user_id, username, rating, text)
- `friendships` — friend requests (requester_id, addressee_id, status: pending/accepted/declined)

## Design Decisions
- No emoji anywhere — use clean text labels only
- Filter panel uses draft state — changes only apply when user clicks Apply
- Map uses hover to show bar card, does NOT pan/fly on hover
- Detail modal z-index is 10000 (above map tiles and controls)
- Bar website URLs live in `BAR_WEBSITES` in bars.js keyed by bar id — bars without a known URL fall back to a Google Maps listing link
- Sort options: Top Rated, Most Popular, Nearest (geolocation), Price, A–Z
- All pushes to main auto-deploy to Vercel

## Vercel Env Vars Required
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Style Guide
- Colors defined as CSS variables in `index.css` (--green, --gold, --text, etc.)
- Dark modal style: bg #1C1710, text #E8DCC8
- Light card style: bg #fff, rounded corners (8-12px), subtle shadows
- Font display: Oswald, uppercase, tracked
- Font body: DM Sans
