# Adapark — Smart Parking System (Frontend Mock)

> **Adapark** — _ada_ ("island" in Turkish) + _park_. A network for the whole island: Lefkoşa, Girne, Gazimağusa, İskele, Güzelyurt and Lefke.

A fully interactive React frontend for a drone-monitored, subscription-friendly smart parking network across **North Cyprus (KKTC)**. Frontend-only — all data is mocked locally.

Built with **React 18 + Vite + React Router v6 + Lucide Icons**.
Visual language inspired by the Starbucks design system (`DESIGN.md`): warm-cream canvas, four-tier brand greens, pill buttons, layered whisper-soft shadows.

---

## Quick start

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

Login is mocked — any email/password works. Pick the **Driver** tab for the user app or the **Admin** tab for the operator dashboard.

---

## Driver experience

| Page | Path | What it does |
|------|------|--------------|
| Login | `/login` | Driver / Admin role switch, mock sign-in |
| Map | `/app` | Live map of garages with drone-numbered pins, sidebar list of nearest parkings, occupancy %, crowd level |
| Parking detail | `/app/parking/:id` | Virtual lot map (red filled / green empty / gold booked / drone violation hatched), spot picker, hours selector, reservation flow |
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
| Parking edit | `/admin/parkings/:id` | Edit hourly rate / crowd state, **click any spot to cycle status**, see assigned drones + recent violations, one-click apply suggested rate change |
| Drones | `/admin/drones` | **Drone control center** — fleet panel, live map with drones + parking pins, **D-pad piloting**, **WASD/arrow-key keyboard control**, click anywhere on the map to fly there, dispatch buttons per garage, capture image, record patrol, return-home, manual ↔ auto mode toggle |
| Auto-detection | (within drones) | Simulate auto-issued penalties from drone patrols (overstay / wrong-spot / no-booking) |
| Violations | `/admin/violations` | All auto-detected + manual penalties, evidence preview modal (mock drone-frame), pay / dispute / issue manually |
| Pricing | `/admin/pricing` | Edit network base rate, per-garage rates, all 4 subscription tiers, all penalty rules |
| Users | `/admin/users` | Driver directory with subscription tier, lifetime spend, penalty count, suspend/reactivate |

---

## Architecture

- **State** — single React `Context` (`AppContext`) holds all mock data: parkings, spots, drones, violations, user, tiers, penalty rules. All admin actions mutate the same store the user sees, so booking from one page locks the spot for the other immediately.
- **Routing** — `react-router-dom` with two protected layouts: `UserShell` (driver nav) and `AdminShell` (gold-accented operator nav).
- **Styling** — design tokens in `src/styles/tokens.css`, global utilities in `src/styles/global.css`. Each page composes its own scoped CSS via inline `<style>` blocks for portability.
- **Charts** — pure-SVG/HTML lightweight `BarChart`, `LineChart`, `Donut` in `src/components/Charts.jsx` (no chart library dependency).
- **Map** — abstract SVG city map with parking pins, drone markers (rotor animation), "you are here" pulse, and click-to-fly support for drone control.

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
