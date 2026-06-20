# Golden Quality Rule Fixtures

> **Status**: Verified synthetic smoke corpus
> **Last Updated**: 2026-06-20 15:45 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-golden-quality-rule-fixtures.md`
> **Task Contract**: `tasks/contracts/golden-quality-rule-fixtures.contract.md`

This slice turns the golden regression hook into an executable quality-rule
gate. It uses synthetic fixtures only. It does not claim partner-approved market
data samples or PRD §10.7 production sample counts.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Golden command | `npm run test:golden` | Runs strict fixture mode |
| Checker | `scripts/check-golden-regression.mjs` | Reads manifest, loads fixtures, runs deterministic quality rules |
| Manifest | `tests/golden/manifest.json` | Defines 8 synthetic samples and expected states |
| Fixtures | `tests/golden/fixtures/*.json` | Synthetic source records, not partner data |
| Error contract | `DATA_QUALITY_HOLD` | Required for all `HOLD` samples |
| Runtime serving quarantine | Absent | No Serving Store or Gateway hold behavior is implemented here |

## P2 Concrete Trace

1. `npm run test:golden` executes
   `node scripts/check-golden-regression.mjs --require-fixtures`.
2. The checker reads `tests/golden/manifest.json`.
3. For each sample, it loads the referenced fixture JSON under
   `tests/golden/fixtures`.
4. It evaluates 12 deterministic rules:
   - `QK-001`, `QT-001`, `QT-002`, `QU-001`;
   - `QP-001`, `QP-002`, `QA-001`;
   - `QF-001`, `QF-002`, `QE-001`, `QE-002`, `QL-001`.
5. It aggregates rule states into `PASS`, `WARN`, `HOLD`, or `REJECT_RAW`.
6. It compares the actual state, failed rule IDs, fixture assertions, and
   `DATA_QUALITY_HOLD` expectations.
7. The command fails if the manifest, fixture files, assertions, lineage, or
   quality states drift.

## P3 Design Decision

Selected a synthetic executable smoke corpus instead of waiting for partner
sample data.

Reason:

- Sprint 0.3/0.4 already had a CI hook, but it was still `not_configured`.
- PRD §10.7 requires quality rules and golden samples before exposing data
  tools; a local deterministic gate reduces regression risk immediately.
- Real partner samples, 50-100 security coverage, and external commercial cost
  review are outside repo-local control.

Tradeoff:

- CI now proves the quality-rule machinery can execute.
- It still does not prove production market-data correctness, rights coverage,
  or cost viability.

## Fixture Coverage

| State | Count | Coverage |
|---|---:|---|
| `PASS` | 5 | valid OHLC, split reconciliation, financial restatement, identifier PIT, index PIT |
| `WARN` | 1 | dual-listing fixture missing FX source review |
| `HOLD` | 2 | invalid OHLC and broken financial identity |
| `REJECT_RAW` | 0 | reserved for malformed raw records in later ingestion slices |

## Verification

Passed:

- `npm run test:golden`
- `npm run check`
- `scripts/check-task-workflow.sh --strict`

Observed `npm run test:golden` output:

```json
{
  "quality_rule_count": 12,
  "sample_count": 8,
  "states": {
    "hold": 2,
    "pass": 5,
    "reject_raw": 0,
    "warn": 1
  },
  "status": "ok"
}
```

## Residual Gaps

- Partner-approved source sample corpus is not committed.
- PRD §10.7 target volume is not met.
- Serving Store quarantine and Data Access Gateway `DATA_QUALITY_HOLD` runtime
  behavior remain absent.
- Package/credits/unit-economics model has not been reviewed with real costs.
