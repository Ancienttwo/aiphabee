# Notes: golden-quality-commercial-baseline

> **Last Updated**: 2026-06-20 13:51 +08
> **Plan**: `plans/plan-golden-quality-commercial-baseline.md`
> **Baseline**: `docs/governance/golden-quality-commercial-baseline.md`

## Decisions

- Defined golden samples as immutable manifests, not ad hoc spreadsheets.
- Separated rule outcomes into `PASS`, `WARN`, `HOLD`, and `REJECT_RAW`.
- Made `DATA_QUALITY_HOLD` a Gateway-visible state before bad data reaches users.
- Kept commercial entitlements subordinate to Gate 0 rights.
- Used weighted credits instead of flat per-call pricing.
- Kept Free tier intentionally constrained to avoid becoming a data mirror.

## Evidence Reviewed

- `docs/researches/AiphaBee_PRD_v1.0.md` §10.7, §10.8, and §15.1-§15.5.
- `docs/AiphaBee_Sprint_Tracker_v1.0.md` Sprint 0.3.
- `plans/sprints/20260620-1307-phase0-gate0-foundation.sprint.md` row 3.

## Verification

- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Actual sample IDs, fixture files, and expected values are not created.
- Quality rules are not executable in CI yet.
- Pricing and margin assumptions have not been reviewed against partner data
  costs, LLM costs, Cloudflare costs, and conversion assumptions.
