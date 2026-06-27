# MVP Product Boundary Copy

Status: local Gate 0 copy review, not legal signoff.

## Source

- PRD source: `docs/researches/AiphaBee_PRD_v1.0.md#14.2`
- Tracker item: Sprint 0.1 `确认 MVP 产品边界文案`
- Contract: `deploy/public-ops/mvp-product-boundary-copy.contract.json`

## Confirmed Boundary

AiphaBee MVP copy uses research, analysis, and data explanation positioning.
It does not promise stock picks, smart-investment-adviser behavior,
personalized buy/sell/hold instructions, position sizing, automatic
rebalancing, stop-loss/take-profit orders, guaranteed returns, copy trading, or
order execution.

The product boundary also states that AiphaBee does not collect risk tolerance
answers to produce automated suitability conclusions.

## Reviewed Surfaces

The local checker scans public draft docs and current user-visible web source
copy:

- `docs/public/*.md`
- `apps/web/src/components/Disclaimer.tsx`
- `apps/web/src/components/MarketSentimentPanel.tsx`
- `apps/web/src/data/ipos.fixtures.ts`
- `apps/web/src/lib/api/endpoints.ts`
- `apps/web/src/lib/api/ipo-mock.ts`
- `apps/web/src/routes/dashboard.tsx`
- `apps/web/src/routes/index.tsx`
- `apps/web/src/routes/ipos/*`

Reference design material under `docs/AiphaBee Design System/**` is not treated
as current publication copy.

## Remaining Gate 0 Blockers

This review does not satisfy the external Type 4 requirement. Before launch,
Hong Kong legal/compliance counsel must still issue written classification
opinion for concrete pages, prompts, marketing copy, pricing, and charging
model. CEO, business, data, compliance, and legal signatures for the Gate 0
decision memo are still absent.
