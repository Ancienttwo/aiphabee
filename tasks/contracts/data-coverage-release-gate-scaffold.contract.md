# Data Coverage Release Gate Scaffold Contract

## Scope

Complete the Sprint 3.3 §19.1 backend scaffold for data freshness labels and
coverage release gates across realtime, delayed, EOD, corporate actions,
financial restatements, delistings, and identifier history.

## Required Surfaces

- `@aiphabee/data-access-gateway` exposes data coverage release gate
  capabilities.
- `GET /gateway/runtime` includes nested `data_coverage_release_gate`
  readiness.
- `GET /gateway/data-coverage/release-gate` returns freshness markers and
  coverage domain rows.
- Local contract checker: `npm run check:data-coverage-release-gate`.
- Empty schema scaffold:
  - `core.data_coverage_release_gate`
  - `governance.data_coverage_release_gate_contract`

## Behavioral Contract

- Freshness tiers must include `realtime`, `delayed`, and `eod`.
- Coverage domains must include `corporate_actions`,
  `financial_restatements`, `delistings`, and `identifier_history`.
- Each freshness tier requires an explicit display label.
- Each coverage domain remains blocked until live partner coverage files,
  live freshness policy, and golden coverage signoff are present.
- No live partner data reads, writes, SQL, or frontend UI.

## Non-Goals

- No live partner data loading.
- No final realtime licensing or cost decision.
- No production golden corpus signoff.
- No frontend release checklist UI.
