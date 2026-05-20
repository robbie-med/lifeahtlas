# LifeAhtlas

A personal life-planning canvas. LifeAhtlas maps life phases, family, finances,
and longevity onto a single shared timeline so you can think through
long-horizon decisions in one place.

Live site: <https://lifeahtlas.robbiemed.org>

## What it does

- **Phase timeline** — lay out life chapters (school, jobs, sabbaticals,
  retirement, care) on a zoomable timeline.
- **Family lanes** — overlay spouse, kids, and parents with their own age and
  phase tracks.
- **Financial projection** — accounts, income streams, and expense rules
  project net worth month-by-month over a 80-year horizon.
- **Scenario compare** — duplicate a baseline plan and compare two scenarios
  side by side.
- **Longevity view** — actuarial-based life expectancy with optional spouse
  overlay.
- **Stress scoring** — highlights phases where projected cash flow gets tight.

## Privacy

All data stays in your browser. LifeAhtlas uses IndexedDB (via Dexie) for
local storage and never sends scenarios to a server. Clearing site data
deletes your plan.

## Tech

React 19, TypeScript, Vite 7, Tailwind 4, Zustand, Dexie, Recharts.

## Development

```sh
npm install
npm run dev       # http://localhost:3000
npm run build     # type-check + production bundle
npm test          # vitest
```

Requires Node 20.19+ or 22.12+ (Vite 7).

## Deployment

`main` is built and deployed to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The
[`public/CNAME`](public/CNAME) file pins the custom domain
`lifeahtlas.robbiemed.org`.

## License

[MIT](LICENSE) &copy; 2026 Robbie
