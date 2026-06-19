---
name: aiphabee-design
description: Use this skill to generate well-branded interfaces and assets for AiphaBee, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. AiphaBee is an AI-powered HKEX (港股) IPO research & insight platform — a 投研 agent with a busy research-bee mascot.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation
- **Brand:** AiphaBee — honey-and-navy fintech. Mascot: a bespectacled research bee in a honeycomb hexagon hunting "honey" (alpha) for investors.
- **Product:** HKEX (港股) IPO research / insight platform / 投研 agent — valuation, risk scoring, sentiment, cornerstone & institution analysis.
- **Anchors:** Honey Yellow `#FBCB0A` (primary), Deep Navy `#1A2242` (ink). Green = profit/bullish, Violet = AI, Red = risk/bearish.
- **Type:** Inter (UI + display), JetBrains Mono (all numbers/prices/tickers, tabular), Noto Sans SC (Chinese). The product is **bilingual zh + en**.
- **Icons:** Lucide. **Cards:** white, 12px radius, hairline border, soft navy-tinted shadow.

## Files
- `styles.css` → links all tokens + fonts (link this one file).
- `tokens/` → colors, typography, spacing, fonts.
- `components/` → Button, Badge, Card, Input, StatCard, ScoreMeter, RatingStars (React; mount from `window.AiphaBeeDesignSystem_599c13`).
- `ui_kits/ipo-agent/` → interactive full-product recreation to copy patterns from.
- `guidelines/` → foundation specimen cards.
- `assets/` → logo lockup + mascot.

Honor the bilingual voice, lead with quantified findings + a recommendation, and keep numbers in the mono/tabular face.
