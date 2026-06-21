# Screen Securities Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 06:00 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-screen-securities-scaffold.md`
> **Task Contract**: `tasks/contracts/screen-securities-scaffold.contract.md`

This slice continues Sprint 2.1 with a backend-only `screen_securities`
scaffold. It turns deterministic supported phrases into editable structured
conditions, previews results on a synthetic universe, and returns why each hit
matched or why each rejected row failed.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/analytics-tools` | Owns deterministic analytics scaffolds |
| Runtime route | `GET /analytics/runtime` | Reports compare and screen capabilities |
| Screen route | `POST /analytics/screen-securities` | Returns parsed conditions and preview results |
| Source surface | `compareSecurities()` | Reuses security/profile/quote/financial fanout |
| Contract | `deploy/analytics/screen-securities.contract.json` | Guards ANA-03/ANA-04/US-W05 behavior |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /analytics/screen-securities` with `natural_language`
   or explicit `conditions`.
2. The package parses deterministic supported phrases into editable conditions.
3. Each condition includes field, operator, value, time basis, source tool, and
   missing-value rule.
4. The package evaluates a synthetic universe through `compareSecurities()`.
5. Hits return matched condition IDs and `why` strings.
6. Non-hits return rejection reasons such as missing values or failed thresholds.
7. The Worker returns the result in the shared standard envelope.

## P3 Design Decision

Selected a deterministic scaffold over broad NLP.

Reason:

- Sprint 2.1 requires conditions to be inspectable and editable before execution.
- Model-driven parsing would be premature before frontend confirmation and
  high-cost execution policy exist.
- Reusing `compareSecurities()` keeps security resolution, quality holds, and
  source-record behavior aligned with the first analytics slice.

Tradeoff:

- Supported phrases are intentionally narrow.
- The contract and tests prove the shape required for future UI and agent
  integration.
- Live universe execution and high-cost queueing remain separate slices.

## Verification

Passed:

- `npm run check:screen-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for `POST /analytics/screen-securities`

Observed screen behavior:

```json
{
  "toolName": "screen_securities",
  "status": "planned_with_preview",
  "parsed_conditions": ["revenue_gte_100000", "net_income_gte_0"],
  "hit_count": 1,
  "top_hit": "00700.HK"
}
```

## Residual Gaps

- Frontend screening UI remains delegated.
- Broad NLP and model-assisted parsing are not implemented.
- Live universe execution and high-cost queueing are not implemented.
- Financial ratios are covered by `docs/governance/financial-ratios-scaffold.md`;
  return/risk/Beta engines are covered by
  `docs/governance/returns-risk-scaffold.md`.
- Tool registry/MCP exposure remains pending.
