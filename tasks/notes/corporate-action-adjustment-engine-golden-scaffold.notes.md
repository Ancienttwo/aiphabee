# Notes: corporate-action-adjustment-engine-golden-scaffold

> **Last Updated**: 2026-06-20 16:55 +08
> **Plan**:
> `plans/plan-corporate-action-adjustment-engine-golden-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/corporate-action-adjustment-engine-golden-scaffold.md`

## Decisions

- Added `@aiphabee/corporate-actions` instead of embedding adjustment logic in
  Worker routes.
- Implemented backward-adjusted deterministic factors:
  - split/consolidation factor = `1 / ratio` for bars before effective date;
  - cash dividend total-return factor =
    `(reinvestment_price - cash_amount) / reinvestment_price`.
- Kept synthetic golden cases in package tests and capability output. No partner
  rows, live price bars, database URLs, or provider credentials are committed.
- Kept `/data/runtime` as capability reporting only; no live Serving read is
  introduced.

## Verification

- Passed: `npm run test -- packages/corporate-actions/src/index.test.ts`
- Passed: `npm run test`
- Passed: `npm run typecheck`
- Passed: `npm run check`
- Passed: Wrangler smoke for `GET /data/runtime`
- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Partner corporate-action source samples and raw price bars are absent.
- Live Supabase/Hyperdrive apply and `SELECT 1` smoke are absent.
- Serving Gateway does not read adjusted series.
- Public/partner benchmark parity is not proven.
