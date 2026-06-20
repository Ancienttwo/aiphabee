# Financial Restatement Golden Engine Scaffold

> **Status**: Verified deterministic engine scaffold
> **Last Updated**: 2026-06-20 17:02 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-financial-restatement-golden-engine-scaffold.md`
> **Task Contract**:
> `tasks/contracts/financial-restatement-golden-engine-scaffold.contract.md`

This slice creates a deterministic financial restatement engine with synthetic
golden cases. It does not read live financial facts, load partner statement
taxonomy, or enable Serving Gateway responses.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Engine package | `packages/financial-facts` | Deterministic restatement timeline, as-of selection, deltas, identity guard |
| Worker runtime route | `GET /data/runtime` | Reports engine capability and golden case status |
| Schema target | `core.financial_statement`, `core.financial_fact`, `core.financial_restatement` | Existing storage scaffold; not read by this slice |
| Golden cases | package tests | Two synthetic restatement timelines plus identity-break rejection |
| Live partner data | Absent | No partner taxonomy, source rows, raw filings, or Serving reads |

## P2 Concrete Trace

Synthetic restatement trace:

1. Test passes original and restated financial statement versions into
   `buildFinancialRestatementTimeline`.
2. Engine validates publication timestamps, stable statement dimensions, and
   balance sheet identity.
3. Engine preserves every statement version, marks latest version, and emits a
   restatement event with changed fact deltas.
4. `selectFinancialStatementAsOf` returns the original version before the
   restatement publication timestamp and the restated version after it.
5. `runSyntheticFinancialRestatementGolden()` verifies two synthetic cases.

Runtime capability trace:

1. Client calls `GET /data/runtime`.
2. Worker returns `financial_facts.engine.status=engine_scaffold`,
   `golden_cases.passed=true`, `sample_count=2`, and
   `live_partner_data=false`.
3. No route reads live tables or serves financial facts.

## P3 Design Decision

Selected deterministic synthetic engine scaffold instead of partner-backed live
financial fact reads.

Reason:

- Partner statement taxonomy and field contract are not signed.
- Hyperdrive live database smoke is not complete.
- Serving Store live reads are not enabled.

Tradeoff:

- Sprint 1.1 now has executable DAT-03 restatement semantics and golden checks.
- It still cannot claim partner data parity or serve financial facts.

## Verification

Passed:

- `npm run test -- packages/financial-facts/src/index.test.ts`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /data/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/data/runtime` fields:

```json
{
  "financial_facts": {
    "engine": {
      "status": "engine_scaffold",
      "golden_cases": {
        "passed": true,
        "sample_count": 2
      },
      "live_partner_data": false,
      "point_in_time_selection": true,
      "preserve_prior_versions": true
    }
  }
}
```

## Residual Gaps

- Partner-signed statement taxonomy and field contract are absent.
- Partner financial source samples are absent.
- Serving Gateway does not read financial facts.
- Financial ratio engine remains future work.
