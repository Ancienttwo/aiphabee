# Corporate Action Adjustment Engine Golden Scaffold

> **Status**: Verified deterministic engine scaffold
> **Last Updated**: 2026-06-20 16:55 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-corporate-action-adjustment-engine-golden-scaffold.md`
> **Task Contract**:
> `tasks/contracts/corporate-action-adjustment-engine-golden-scaffold.contract.md`

This slice creates a deterministic corporate-action adjustment engine with
synthetic golden cases. It does not read live price bars, load partner
corporate-action rows, or prove external benchmark parity.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Engine package | `packages/corporate-actions` | Deterministic adjustment logic and synthetic golden cases |
| Worker runtime route | `GET /data/runtime` | Reports engine capability and golden case status |
| Schema target | `aiphabee_core.corporate_action`, `aiphabee_core.price_adjustment_factor` | Existing storage scaffold; not read by this slice |
| Golden cases | package tests | Split, consolidation, and cash dividend cases |
| Live partner data | Absent | No partner rows, raw bars, benchmark comparison, or Serving reads |

## P2 Concrete Trace

Synthetic adjustment trace:

1. Test passes price observations and corporate actions into `adjustPriceSeries`.
2. Engine validates action dates, positive split/consolidation ratio, and
   dividend reinvestment assumptions.
3. For bars before the action effective date:
   - split/consolidation factor is `1 / ratio`;
   - cash dividend total-return factor is
     `(reinvestment_price - cash_amount) / reinvestment_price`.
4. Engine returns raw, split-adjusted, and total-return-adjusted closes with
   applied action IDs and source record IDs.
5. `runSyntheticCorporateActionGolden()` verifies three synthetic cases.

Runtime capability trace:

1. Client calls `GET /data/runtime`.
2. Worker returns `corporate_actions.engine.status=engine_scaffold`,
   `golden_cases.passed=true`, `sample_count=3`, and
   `live_partner_data=false`.
3. No route reads live tables or serves adjusted market data.

## P3 Design Decision

Selected deterministic synthetic engine scaffold instead of partner-backed live
adjustment computation.

Reason:

- Partner corporate-action rows and raw price bars are not loaded.
- Hyperdrive live database smoke is not complete.
- External benchmark parity cannot be proven from synthetic-only samples.

Tradeoff:

- Sprint 1.1 now has executable DAT-04 adjustment logic and golden checks.
- It still cannot claim production parity or serve adjusted price history.

## Verification

Passed:

- `npm run test -- packages/corporate-actions/src/index.test.ts`
- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npx wrangler dev --config wrangler.jsonc --port 8787`
- `GET /data/runtime` -> `200 OK`
- `scripts/check-task-workflow.sh --strict`

Observed `/data/runtime` fields:

```json
{
  "corporate_actions": {
    "engine": {
      "status": "engine_scaffold",
      "direction": "backward_adjusted",
      "golden_cases": {
        "passed": true,
        "sample_count": 3
      },
      "live_partner_data": false
    }
  }
}
```

## Residual Gaps

- Partner corporate-action source samples and raw price bars are absent.
- Serving Gateway does not read adjusted series.
- Public/partner benchmark parity is not proven.
- Usage ledger live writes are not wired to adjusted data reads.
