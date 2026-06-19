# AiphaBee Design System

> The investment-research bee. A honey-and-navy design system for **AiphaBee** — an AI-powered **港股 (HKEX) IPO research & insight platform** and 投研 agent.

AiphaBee helps investors decide on IPOs through data-driven valuation, AI prospectus analysis, multi-dimensional risk scoring, cornerstone-investor evaluation and live market-sentiment signals. The brand is a busy, bespectacled **bee** hunting honey — *alpha* — for investors, framed inside a **honeycomb hexagon** with a candlestick chart and a rising arrow.

This system was rebuilt from the original (long-dormant) codebase: usable elements — the honey/navy palette, the data-viz semantic scales, the ShadCN-style card vocabulary, the mascot — were extracted and reorganized into a fresh, reusable system. The new product direction is a **港股 IPO MCP · 投研 agent · insight 平台**.

---

## Sources

- **GitHub:** `Ancienttwo/aiphabee` — monorepo, app at `apps/ipo-agent/` (Next.js 15 + Tailwind + Radix + Supabase + Anthropic Claude). Brand tokens lifted from `apps/ipo-agent/app/globals.css`; product views from `app/page.tsx`, `app/ipo/page.tsx`, `app/dashboard/page.tsx`, `app/ipo/[id]/page.tsx`; signature components from `components/ipo/*` (MarketSentimentCard, TierAnalysisCard, InstitutionRatingsCard, CornerstoneInvestorsCard, SubscriptionAnalysisCard).
- **Logo asset:** `apps/ipo-agent/public/AiphaBee.png` (the mascot + wordmark lockup).
- Explore the repo further to build higher-fidelity AiphaBee designs — the `components/ipo/*` cards and `app/api/*` routes describe the real research signals the product computes.

> The reader may not have access to the private repo; references are recorded here in case they do.

---

## Content fundamentals

**Bilingual by default.** The product mixes **Simplified Chinese and English** freely, often in the same line — Chinese for the human-facing analytical voice, English (and a parenthetical EN gloss) for product chrome and finance terms. Examples from the product:
- `市场情绪指标` / `Market Sentiment` · `综合评分 Overall` · `强力买入 Strong Buy` · `谨慎乐观 Cautious`
- `AI 驱动的市场情绪分析，帮助您把握 IPO 投资时机。`
- `数据驱动的港股 IPO 投研平台`

**Voice & tone.** Confident, analyst-grade, plain. It states findings and gives a recommendation rather than hedging endlessly — but always quantifies confidence (`置信度 86%`) and frames risk. It addresses the user as **您** (formal "you") in Chinese; English copy is direct and imperative ("Make informed IPO investment decisions", "Start Analysis").

**Casing.** Title Case for English headings and button labels (`Start Analysis`, `Browse IPOs`). UPPERCASE only for tiny eyebrow/label text with wide tracking. Chinese needs no casing.

**Numbers are first-class.** Prices, oversubscription multiples, scores and percentages are rendered in a **monospace, tabular** face: `HKD 24.80`, `128.4×`, `+18.6%`, `2769.HK`, `86%`. Scores are framed `72 / 100`.

**Emoji & glyphs.** The product uses a few **semantic emoji** in data labels — sentiment (`🐂 牛市`, `🐻 熊市`, `😐 中性`, `⚠️`) and star ratings (`⭐`). Otherwise restrained. Prefer the `RatingStars` component (`★`) over literal emoji where possible; reserve emoji for sentiment shorthand.

**Vibe.** Trustworthy fintech with warmth. The honey yellow keeps it optimistic and approachable (the friendly bee), the navy keeps it serious and credible. Not playful-cute, not cold-Bloomberg — *diligent and bright*.

---

## Visual foundations

**Color.** Two brand anchors: **Honey Yellow `#FBCB0A`** (primary — CTAs, highlights, the "alpha") and **Deep Navy `#1A2242`** (ink — text, dark surfaces, the bee's body). Functional hues are borrowed for meaning, not decoration: **Growth Green `#10B981`** = profit/bullish/success, **AI Violet `#8B5CF6`** = AI features, **Startup Red `#EF4444`** = risk/bearish, plus blue/orange/pink for info/warning/chart. A full slate neutral ramp carries text and surfaces. On top sit **data-viz semantic scales** — sentiment, demand level (oversubscription), institution rating, market-cap tier, and a 6-color chart palette — each a named token. Backgrounds are light and clean (white cards on `#F8FAFC`), with the occasional honey-tinted wash (`--surface-honey`) or full navy panel for AI-recommendation callouts. No heavy gradients.

**Type.** **Inter** for everything UI + display (the product's actual `next/font` choice); weights 400–800, tight tracking on large display. **JetBrains Mono** for all numeric/financial data (tabular figures). **Noto Sans SC** for Chinese. Hero sizes are large and bold (48–60px); body is 16px at 1.6 line-height; micro-labels are 11px uppercase with wide tracking.

**Spacing & layout.** 4px base rhythm. Centered `max-w-1280px` content with 24px gutters and a sticky 64px nav. Generous vertical padding on marketing sections (88px hero), denser 24px padding inside cards. Grids: 3-up features, 2-up listings, 4-up dashboard stats.

**Cards.** The workhorse. White surface, **12px radius** (`--radius-lg`), **1px hairline border** (`--border-subtle`), **soft navy-tinted shadow** (`--shadow-sm`). Interactive cards lift to `--shadow-md` and gain a **honey border** on hover. Card anatomy mirrors ShadCN: Header (title + description) / Content / Footer. Inner sub-panels use `--surface-muted` at `--radius-md`.

**Borders & radii.** Hairline 1px borders everywhere; radii step 6 → 8 (buttons/inputs) → 12 (cards) → 16 (large panels) → pill (badges, avatars, progress tracks, filter chips).

**Shadows.** Soft and low, tinted with navy (`rgba(26,34,66,…)`) rather than pure black. A special **honey glow** (`--shadow-honey`) lifts the primary CTA on hover; a **honey focus ring** (`--ring-glow`) marks focused inputs.

**Motion.** Restrained and quick. 150–220ms ease transitions on hover (background, shadow, a 1px `translateY(-1px)` lift on buttons). Score/progress fills animate to width over 400ms with an ease-out curve. No bounces, no infinite loops.

**Hover / press states.** Primary button → darker honey + honey-glow shadow + 1px rise. Secondary/ghost → muted-fill or darker navy. Cards → shadow + honey border. Links → navy, no underline by default. Filter chips → honey fill when active.

**Transparency & blur.** The sticky nav is `rgba(255,255,255,0.82)` with `backdrop-filter: blur(10px)`. Soft tinted backgrounds (`--green-50`, `--violet-50`, `--honey-50`) tint icon chips and callouts at low opacity.

**Imagery & motif.** The recurring motif is the **honeycomb hexagon** and the **research bee** mascot. Charts (radar / candlestick) are core imagery — the product *is* data-viz. Imagery skews warm (honey) over a credible navy. No stock photography in the source product.

---

## Iconography

- **Lucide** is the product's icon set (`lucide-react` in the codebase) — clean 2px-stroke outline icons. Common glyphs: `trending-up`, `trending-down`, `shield`, `sparkles` (AI), `rocket`, `calendar`, `alert-circle`, `arrow-up-right`, `target`, `layers`, `minus`, `search`. Use Lucide for all UI icons. In static HTML, load it from CDN (`unpkg.com/lucide`) and render `<i data-lucide="name">` then call `lucide.createIcons()` — see `ui_kits/ipo-agent/app.jsx`.
- **No bespoke icon font or SVG sprite** ships in the repo beyond the logo; Lucide covers UI. Do not hand-draw icons — use Lucide.
- **Semantic emoji** appear in a few data labels (sentiment 🐂🐻😐⚠️, rating ⭐). Use sparingly and only for those signals.
- **Star ratings** use the `RatingStars` component (★ glyphs, honey fill, fractional) rather than emoji where layout allows.
- **Brand assets** live in `assets/`: `aiphabee-logo-full.png` (mascot + wordmark lockup) and `aiphabee-mascot.png` (mascot only). A full **mascot pose set** lives in `assets/mascot/` — `greeting`, `forage`, `insight`, `thinking`, `success`, `empty`, `risk`, `avatar`, plus `compare` (head-to-head PK) and `honey-finish` (the 撒蜜 collection-complete frame) (transparent PNGs) — used by the `BeeNote` / `Hexvatar` / `ForageLoader` / `MascotState` / `ComparePanel` components to weave the worker bee through the product (insights, loading, empty/success states, onboarding, compare). Prompts to regenerate/extend the set are in `assets/mascot-prompts.md`.
- **Honeycomb hexagon** is the brand's signature geometry: `--clip-hex` clips elements to a pointy-top hexagon, and `--pattern-honeycomb` is a tileable faint watermark. Use hexagon status dots (`Badge dotShape="hex"`), hexagon avatars/icon chips (`Hexvatar`), and a honeycomb watermark on hero/empty surfaces.

---

## Index / manifest

**Root**
- `styles.css` — global entry point (imports only). Consumers link this.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`.
- `assets/` — `aiphabee-logo-full.png`, `aiphabee-mascot.png`.
- `SKILL.md` — Agent-Skills wrapper.

**Components** (`components/`) — React primitives, each with `.jsx` + `.d.ts` + `.prompt.md`, mounted from `window.AiphaBeeDesignSystem_599c13`:
- `core/` — **Button** (primary/secondary/outline/ghost/ai/danger), **Badge** (sentiment/status tones, hexagon status dot), **Card** (+ CardHeader/Title/Description/Content/Footer).
- `forms/` — **Input** (label, adornments, honey focus ring, error).
- `data/` — **StatCard** (KPI tile), **ScoreMeter** (0–100 gauge), **RatingStars** (5-star).
- `mascot/` — **Hexvatar** (hexagon avatar/icon chip), **BeeNote** (worker-bee AI-insight block), **ForageLoader** (“foraging” loading state; set `done` for the 撒蜜 collection-complete tail frame), **MascotState** (empty/success/onboarding illustration), **ComparePanel** (head-to-head PK view — the compare bee weighs two candidates metric-by-metric with a verdict). Pass `basePath` pointing at your copied `assets/mascot/` folder. Mascot **intensity** is tiered — Hero (120–200px: login/onboarding/empty/milestone) vs. Inline (≤52px: loaders, avatars, insight blocks); one Hero bee per screen, never in data-dense areas.

**UI kit** (`ui_kits/ipo-agent/`) — interactive recreation of the IPO Agent: Home, Dashboard, Browse IPOs, IPO detail (tier radar, sentiment, institution ratings, cornerstones, AI recommendation). See its `README.md`.

**Foundation cards** (`guidelines/`) — specimen cards for the Design System tab: colors (brand, honey ramp, neutrals, functional, data-viz), type (display, body & mono), spacing (scale, radius & shadow), brand (logo, mascot).

---

## Caveats

- **Fonts load from the Google Fonts CDN** (Inter / JetBrains Mono / Noto Sans SC) via `@import` in `tokens/fonts.css`, rather than self-hosted `.woff2`. If you need an offline or self-hosted build, download those families and swap in `@font-face` rules. Inter is the product's genuine font — no substitution was made.
- The **mascot crop** (`aiphabee-mascot.png`) is derived programmatically from the full lockup PNG (which has a white background, no transparency). For dark surfaces it's blended; a true transparent-PNG mascot would be cleaner — **please supply a transparent logo/mascot if you have one.**
- UI-kit data is **mock/illustrative**, not live listings.
