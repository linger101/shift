# 🍺 Shift Boston

A social bar discovery app for Boston and surrounding neighborhoods. Browse 76 curated bars, filter by vibe/type/area, view on an interactive map, rate and review with friends.

## Features

- **76 curated bars** across Boston, Cambridge, Somerville, Allston/Brighton, Brookline, Jamaica Plain, Dorchester, and Medford
- **Interactive map** with OpenStreetMap tiles and clickable pins
- **Smart filters** by area, bar type, vibe, rating, live music, and price
- **User accounts** with Supabase Auth (email/password)
- **Social reviews** — rate bars, leave reviews, see friends' activity
- **Favorites** — bookmark bars and filter to your saved list

## Tech Stack

- **Frontend**: React 18 + Vite
- **Map**: Leaflet + react-leaflet + OpenStreetMap (free, no API key)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (free tier)

---

## Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/shift-boston.git
cd shift-boston
npm install
```

### 2. Set Up Supabase (free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (pick any region, set a database password)
3. Wait for the project to finish setting up (~2 min)
4. Go to **SQL Editor** in the sidebar
5. Paste the contents of `supabase-schema.sql` and click **Run**
6. Go to **Settings → API** and copy your:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you should see the app!

---

## Deploy to Vercel (free)

### Option A: GitHub + Vercel (recommended)

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New Project"** → Import your repo
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**
6. Share the URL with friends!

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
```

---

## Adding New Bars

Edit `src/data/bars.js` and add entries to the `BARS` array:

```javascript
{
  id: 77,                          // unique number
  name: "New Bar Name",
  hood: "Neighborhood",           // e.g. "South Boston"
  area: "Boston",                  // broader area
  type: "Dive Bar",               // Dive Bar, Cocktail Bar, Pub, Sports Bar, etc.
  vibe: ["Cheap Drinks", "Chill"], // 2-4 vibe tags
  music: false,                    // true if live music
  rating: 4.5,                     // Google rating
  revCt: 200,                      // Google review count
  lat: 42.3400,                    // latitude
  lng: -71.0500,                   // longitude
  price: 1,                        // 1=$, 2=$$, 3=$$$
  desc: "Short description."
}
```

Push to GitHub → Vercel auto-deploys in ~30 seconds.

---

## Project Structure

```
shift-boston/
├── index.html              # Entry HTML
├── package.json
├── vite.config.js
├── .env.example            # Environment vars template
├── supabase-schema.sql     # Database setup script
├── src/
│   ├── main.jsx            # React entry
│   ├── App.jsx             # Main app component
│   ├── index.css           # Global styles + CSS vars
│   ├── components/
│   │   └── BarMap.jsx      # Leaflet map component
│   ├── data/
│   │   └── bars.js         # Bar database (76 bars)
│   └── lib/
│       └── supabase.js     # Supabase client + helpers
└── public/
```

---

## Customization

### Colors
All colors are CSS variables in `src/index.css`. Change the `:root` block to retheme the entire app.

### Fonts
Currently uses **Oswald** (headlines) + **DM Sans** (body). Change in `index.html` (Google Fonts link) and `index.css` (CSS variables).

### Adding Features
Some ideas for extending:
- **Bar crawl planner** — build a route for a night out
- **"Want to go" list** — separate from favorites
- **Photo uploads** — let users add photos to reviews
- **Happy hour info** — add time-based deals
- **Google Places API** — auto-import bars instead of manual curation

---

## License

MIT — do whatever you want with it.
