# Adapark — Smart Parking System

> **Adapark** — _ada_ ("island" in Turkish) + _park_. EMU campus parking: Electrical & Industrial Engineering lots in Gazimağusa.

React + Vite app backed by **Supabase** (auth, profiles, bookings, penalties, transactions, live spot occupancy). Lot layouts are static config in `src/data/parkingConfig.js`; spot status syncs via `spot_status`.

Built with **React 18 + Vite + React Router v6 + Lucide Icons**.
Visual language inspired by the Starbucks design system (`DESIGN.md`): warm-cream canvas, four-tier brand greens, pill buttons, layered whisper-soft shadows.

---

## Quick start

```bash
cd app
npm install
cp .env.example .env   # then paste Supabase URL + anon key (see below)
npm run dev            # http://localhost:5173
npm run build
npm run preview
```

### Local Supabase setup

Sign-in uses Supabase Auth. Vercel already has these env vars; locally you need them in `app/.env`:

1. Copy `app/.env.example` → `app/.env`
2. Paste **Project URL** and **anon public** key from [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings → API** (same values as in Vercel → Project → Settings → Environment Variables)
3. Restart `npm run dev` after creating or editing `.env`

In Supabase → **Authentication → URL Configuration**, add for local dev:

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:5173` (or keep production URL if you only test on Vercel) |
| Redirect URLs | `http://localhost:5173/**` |

Email/password sign-in works without redirect URLs; redirect URLs matter for email confirmation links and OAuth.

**If sign-in fails locally:** the login page shows a red banner when env vars are missing. With wrong keys you’ll see Supabase errors like “Invalid login credentials”. With missing `.env` the app was hitting a placeholder Supabase URL and every sign-in failed silently until the recent hardcoded fallback was removed.

**Cursor Simple Browser:** uses an embedded webview; password sign-in should work once `.env` is set. Sessions are stored in that webview’s storage (separate from Chrome), so you may need to sign in again there even if you’re logged in on adapark.vercel.app.

Use the **Driver** tab for the user app or the **Admin** tab for the operator dashboard.

---

## Driver experience

| Page | Path | What it does |
|------|------|--------------|
| Login | `/login` | Driver / Admin role switch, Supabase sign-in |
| Map | `/app` | Live map of garages, sidebar list, occupancy %, crowd level |
| Parking detail | `/app/parking/:id` | Lot map (empty / taken / booked), spot picker, reservation flow |
| Payment modal | (within parking) | Subscription / one-time card / wallet / Apple Pay options, locks the spot for everyone else once confirmed |
| Subscription | `/app/subscription` | 4-tier plans (₺499.99 → ₺2,499.99/mo) with monthly / annual (20% off) billing toggle, included hours, overage rates |
| Wallet | `/app/wallet` | Balance, top-up, transactions, Stars rewards |
| Penalties | `/app/penalties` | Outstanding fees, penalty-shield usage, dispute flow, fee reference table |
| History | `/app/history` | Active + past bookings |
| Account | `/app/account` | Edit personal & vehicle info |

**Pricing model**
- Pay-as-you-go: **₺50/hour** baseline (per-garage overrides supported)
- Subscriptions: **₺499.99 / 899.99 / 1,599.99 / 2,499.99** monthly tiers
- Annual billing: **20% discount** vs. monthly
- Penalty fees: editable rules (overstay, wrong-spot, no-booking, blocking, expired-doc)

---

## Admin experience

| Page | Path | What it does |
|------|------|--------------|
| Overview | `/admin` | KPIs, revenue bar chart, hourly-occupancy line chart, top-revenue ranking, network donut, pricing **suggestions** based on street crowdedness |
| Parkings | `/admin/parkings` | Master table — rate, occupancy, crowd, suggestion, monthly revenue per garage |
| Parking edit | `/admin/parkings/:id` | Edit hourly rate / crowd state, click spots to cycle status, clear all spots |
| Violations | `/admin/violations` | Penalties from Supabase, issue manually by plate |
| Pricing | `/admin/pricing` | Edit network base rate, per-garage rates, all 4 subscription tiers, all penalty rules |
| Users | `/admin/users` | Driver directory with subscription tier, lifetime spend, penalty count, suspend/reactivate |

---

## Architecture

- **State** — `AppContext` loads user data from Supabase; parkings from `parkingConfig.js` with live occupancy from `spot_status` (poll + realtime).
- **Routing** — `react-router-dom` with two protected layouts: `UserShell` (driver nav) and `AdminShell` (gold-accented operator nav).
- **Styling** — design tokens in `src/styles/tokens.css`, global utilities in `src/styles/global.css`. Each page composes its own scoped CSS via inline `<style>` blocks for portability.
- **Charts** — pure-SVG/HTML lightweight `BarChart`, `LineChart`, `Donut` in `src/components/Charts.jsx` (no chart library dependency).
- **Map** — live GPS map with parking pins and Google Maps directions.

## Design system mapping

The codebase mirrors the four-tier Starbucks-inspired system from `DESIGN.md`:

- `#006241` Starbucks Green → H1 / brand
- `#00754A` Green Accent → primary CTAs (`.btn--primary`, frap)
- `#1E3932` House Green → feature bands, footer, drone selector
- `#cba258` Gold → admin accent (logo mark, drone selection ring), Penalty-shield badges
- `#f2f0eb` Neutral Warm → page canvas
- `50px` pill radius universal · `scale(0.95)` press · whisper-soft layered shadows

---

## Notes

- Data resets on browser refresh (purely in-memory). To persist, swap `useState` in `AppContext.jsx` for `localStorage` or a real backend.
- Drone keyboard piloting: **WASD or Arrow keys** while a drone is selected and Manual mode is on.
- Click any **green spot** in a virtual lot to start a booking. Click **any spot** in the admin lot view to cycle: empty → filled → booked → blocked → empty.
- Click anywhere on the **drone map** to dispatch the selected drone to that point.
