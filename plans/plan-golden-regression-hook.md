# Plan: Golden Regression Hook

> **Status**: Verified
> **Created**: 2026-06-20 14:45 +08
> **Slug**: golden-regression-hook
> **Spec**: `docs/spec.md`
> **Source Baseline**: `docs/governance/golden-quality-commercial-baseline.md`
> **Task Contract**: `tasks/contracts/golden-regression-hook.contract.md`
> **Implementation Notes**: `tasks/notes/golden-regression-hook.notes.md`

## Agentic Routing

- Selected route: CI hook scaffold
- Routing reason: Sprint 0.4 has CI in place, but golden regression has no
  command surface. A hook can be installed without inventing fixtures.
- Due diligence:
  - P1 map: root npm scripts, CI workflow, golden baseline, future fixture path.
  - P2 trace: `npm run check` -> `npm run test:golden` -> manifest validation
    or explicit `not_configured` result.
  - P3 decision rationale: verify the hook now; keep Sprint 0.3 fixture DoD
    blocked until real samples exist.

## Workflow Inventory

- Active plan: `plans/plan-golden-regression-hook.md`
- Task contract: `tasks/contracts/golden-regression-hook.contract.md`
- Implementation notes: `tasks/notes/golden-regression-hook.notes.md`
- Runtime evidence: `docs/governance/golden-regression-hook.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add a Node-based manifest validator with no new dependencies.
- Add a root `test:golden` script.
- Wire the command into `npm run check` and CI.
- Add `tests/golden/README.md` describing the future manifest.
- Update tracker to distinguish hook completion from fixture completion.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Fail CI until fixtures exist | Strong gate | Blocks all unrelated work before data arrives | Rejected |
| Skip golden hook entirely | Simple | CI has no regression mount point | Rejected |
| Pass with explicit `not_configured` until manifest exists | Verifies hook without faking samples | Requires clear docs and tracker split | Selected |

## Task Breakdown

- [x] Add golden regression validator script.
- [x] Add fixture directory documentation.
- [x] Add root `test:golden` and CI step.
- [x] Update tracker and deferred ledger.
- [x] Verify local commands and workflow strict check.
