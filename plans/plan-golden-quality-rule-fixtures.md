# Plan: Golden Quality Rule Fixtures

> **Status**: Verified
> **Created**: 2026-06-20 15:45 +08
> **Slug**: golden-quality-rule-fixtures
> **Spec**: `docs/spec.md`
> **Source Baseline**: `docs/governance/golden-quality-commercial-baseline.md`
> **Task Contract**: `tasks/contracts/golden-quality-rule-fixtures.contract.md`
> **Implementation Notes**: `tasks/notes/golden-quality-rule-fixtures.notes.md`

## Agentic Routing

- Selected route: executable golden fixture smoke corpus
- Routing reason: Sprint 0.3/0.4 already had a golden hook, but CI still
  reported `not_configured`. A local synthetic corpus can make quality-rule
  enforcement executable without pretending partner-approved market data exists.
- Due diligence:
  - P1 map: root `test:golden`, `scripts/check-golden-regression.mjs`,
    `tests/golden`, quality baseline, PRD §10.7 / §9.6.
  - P2 trace: `npm run test:golden` -> manifest -> fixture JSON -> deterministic
    quality rules -> expected state/error-code assertions.
  - P3 decision rationale: commit synthetic smoke fixtures now; keep production
    partner corpus and commercial review blocked until external evidence exists.

## Workflow Inventory

- Active plan: `plans/plan-golden-quality-rule-fixtures.md`
- Task contract: `tasks/contracts/golden-quality-rule-fixtures.contract.md`
- Implementation notes: `tasks/notes/golden-quality-rule-fixtures.notes.md`
- Runtime evidence: `docs/governance/golden-quality-rule-fixtures.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Make `npm run test:golden` require fixtures.
- Add a synthetic v0 manifest and fixture corpus under `tests/golden`.
- Extend the checker to run deterministic quality rules with no new dependency.
- Assert expected `PASS` / `WARN` / `HOLD` states and `DATA_QUALITY_HOLD`.
- Update tracker and closeout docs without marking production golden corpus or
  commercial sign-off complete.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Wait for partner samples | Avoids synthetic data | Leaves CI quality gate non-executable | Rejected |
| Add synthetic executable smoke corpus | Creates a real local gate now | Does not satisfy final production sample counts | Selected |
| Mark full golden corpus complete | Simplifies tracker | Misrepresents PRD §10.7 volume and partner evidence | Rejected |

## Task Breakdown

- [x] Add executable golden fixture manifest and fixture files.
- [x] Extend checker with deterministic quality rules.
- [x] Make `npm run test:golden` strict.
- [x] Update tracker, deferred ledger, and governance docs.
- [x] Verify local commands and workflow strict check.
