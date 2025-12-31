# AurumIQ — Car Pricing Intelligence (Frontend MVP)

A production-quality **frontend-only** MVP for a B2B car pricing intelligence tool (JATO-style market intelligence), with a premium analytics UX: fast, calm surfaces, crisp hierarchy, and data-heavy views that stay readable.

## What’s inside

- **Next.js (App Router) + TypeScript**
- **Tailwind + CSS-variable design tokens** with two theme modes:
  - **Office (default)**: restrained, enterprise neutral
  - **Colorful**: richer accents for charts/tags/highlights (without sacrificing contrast)
- **shadcn-style** component layer (Radix + Tailwind)
- **TanStack Table** for comparison/grid interactions
- **Recharts** for charts & sparklines
- **Zustand** state (mock auth, market, basket; basket persists)
- **Fake API layer** with simulated latency + error injection hooks
- **Accessible**: visible focus states, keyboard-friendly controls, usable on smaller screens

## Pages

1. **Model Picker** (`/`)
   - Left filter panel (brand/body type/powertrain/drivetrain/segment/price)
   - Search with typeahead
   - Sort (MSRP, range, newest, sales volume)
   - Hover preview for quick specs
   - Add-to-basket + optional drag-to-add (desktop)

2. **Product Data** (`/product-data`)
   - Basket-driven comparison table
   - Sticky first column + horizontal scroll
   - Column show/hide, pinning, reorder controls
   - CSV export
   - Specs view / Feature view toggle

3. **Strategic Pricing** (`/strategic-pricing`)
   - Value weighting sliders + presets
   - Scores + stacked breakdown chart
   - “What moved the needle” sensitivity callouts
   - Transparent methodology popover

4. **Tactical Pricing** (`/tactical-pricing`)
   - Campaign timeline (Gantt-style)
   - Price history chart (MSRP vs transaction vs incentives)
   - Filters (type, date range)
   - Promo intensity index + current deals cards

5. **Volume Analysis** (`/volume-analysis`)
   - Volume time series (absolute / indexed)
   - Segment share stacked area
   - Table with MoM/YoY/rank
   - Rule-based insight callouts

## Getting started (local)

### Prerequisites
- Node.js 20+

### Install & run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

### Mock authentication
This MVP uses a simple local “session”:
- Any valid email + any password works.
- Session persists in `localStorage`.

### Basket persistence
The basket (and saved baskets) persist across refresh and pages via `localStorage`.

## Theme modes (Office / Colorful)
- Toggle in the top navigation.
- Persists across sessions (`localStorage` key: `aurum-theme`).
- Both themes share **layout, spacing, typography** — only tokens for accents/emphasis change.
- Charts read colors from CSS variables: switching themes is instant.

## Repo structure
```
src/
  app/                # Next App Router pages & layouts
  components/
    app/              # app-shell and product components
    charts/           # Recharts components
    ui/               # shadcn-style primitives (Radix + Tailwind)
  data/               # mock dataset generator
  lib/
    api/              # fake async API layer
    models/           # TypeScript types
    store/            # Zustand stores (auth/market/basket/filters)
    theme/            # theme store + helpers
    utils/            # helpers (format, stats, async, etc.)
```

## Deploy to Azure (Static Web Apps)
This app is configured as a **static export** (`next.config.mjs` uses `output: 'export'`). It deploys cleanly to **Azure Static Web Apps**.

### 1) Create Azure Static Web App
- In Azure Portal: **Create → Static Web App**
- Choose your GitHub repo and `main` branch
- Framework preset: **Next.js** (or custom)

### 2) Add GitHub secret
In your GitHub repo:
- **Settings → Secrets and variables → Actions → New repository secret**
- Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Value: the deployment token from Azure SWA

### 3) Push to `main`
The workflow at:
- `.github/workflows/azure-static-web-apps.yml`

…builds the project and uploads the `out/` folder.

## Build
```bash
npm run build
```
The static site is output to `out/`.

## Notes / next steps
- Replace the `src/lib/api/*` layer with real endpoints.
- Replace mock auth with Azure AD / Entra ID.
- Add role-based access controls, audit logs, and saved dashboards.
- Introduce a proper query cache (React Query) once API integration starts.

---

**MVP promise:** premium UX, realistic mock data, interactive tables/charts, persistent basket, and a deployable Azure pipeline.
