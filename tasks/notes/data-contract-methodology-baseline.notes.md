# Notes: data-contract-methodology-baseline

> **Last Updated**: 2026-06-20 13:34 +08
> **Plan**: `plans/plan-data-contract-methodology-baseline.md`
> **Baseline**: `docs/governance/data-contract-methodology-baseline.md`

## Decisions

- Used one baseline methodology version: `2026-06-20.phase0.v0`.
- Separated company, instrument, listing, and identifier history.
- Made `published_at` the point-in-time guardrail for historical questions.
- Kept raw prices immutable and modelled adjusted series as derived rows.
- Treated restatements as additional versions, never overwrites.
- Kept partner signature and physical schema implementation out of this slice.

## Evidence Reviewed

- `docs/researches/AiphaBee_PRD_v1.0.md` §10.1 through §10.8 and §11.5.
- `docs/AiphaBee_Sprint_Tracker_v1.0.md` Sprint 0.2.
- HKEX Securities Market trading hours.
- HKEX Calendar.
- HKEX Severe Weather Trading arrangements.

## Verification

- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Partner data contract is not signed.
- Actual partner field names, delivery samples, source IDs, and SLAs are missing.
- Physical migrations, ingestion jobs, and quality/golden sample tests are not
  part of this docs-only slice.
