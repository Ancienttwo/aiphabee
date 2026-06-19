# IPO Agent — UI Kit

An interactive, high-fidelity recreation of **AiphaBee's IPO Agent** — the 港股 (HKEX) IPO research & insight platform. Built entirely from the AiphaBee design-system components and tokens.

## Run it
Open `index.html`. It loads React + Babel + Lucide + the compiled design-system bundle (`_ds_bundle.js`) and mounts an interactive click-through.

## Flow
- **Home** — hero, real-time market-sentiment panel, feature trio.
- **Dashboard** — KPI stat tiles, this-week pipeline list, sentiment panel. (Get Started / Dashboard nav)
- **Browse IPOs** — filterable grid of IPO cards (status, ticker, sector, offer, oversubscription, sentiment).
- **IPO detail** — the research view: key stats, 6-dimension tier-analysis radar + breakdown, sentiment gauge, institution ratings, cornerstone investors, and an AI recommendation block. Click any IPO card to open it.

## Files
| File | Role |
|------|------|
| `index.html` | Loads dependencies + bundle, mounts `<App/>` |
| `app.jsx` | App shell, top nav, Lucide `Icon` helper, mock HK IPO data |
| `home.jsx` | `HomeView`, `DashboardView`, shared `MarketSentimentPanel`, `Footer` |
| `research.jsx` | `ListingsView`, `DetailView`, SVG 6-dim `Radar` |

## Components used
`Button`, `Badge`, `Card` (+ parts), `StatCard`, `ScoreMeter`, `RatingStars` from the design system. Icons are [Lucide](https://lucide.dev) (the product's real icon set), loaded from CDN via `<i data-lucide>` + `lucide.createIcons()`.

## Notes
All figures (companies, tickers, prices, subscriptions, ratings) are **illustrative mock data** for design purposes — not real listings. The original product is bilingual (Simplified Chinese + English); this kit preserves that voice.
