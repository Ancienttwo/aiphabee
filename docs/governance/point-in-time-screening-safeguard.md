# Point-in-Time Screening Safeguard

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 12:30 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**: `plans/plan-point-in-time-screening-safeguard.md`
> **Task Contract**: `tasks/contracts/point-in-time-screening-safeguard.contract.md`

This slice continues Sprint 2.1 by adding a backend-only guard that prevents
historical screens from using classification metadata dated after the requested
screening date.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/analytics-tools` | Owns deterministic analytics scaffolds and point-in-time screen guard |
| Runtime route | `GET /analytics/runtime` | Reports `screen_securities` guard capability |
| Screen route | `POST /analytics/screen-securities` | Accepts `classification_as_of` and returns guard metadata |
| Contract | `deploy/analytics/screen-securities.contract.json` | Guards ANA-03/ANA-04/SEC-05/US-W05 behavior |
| Checker | `npm run check:screen-securities` | Fails if guard fields or policy flags drift |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller submits `POST /analytics/screen-securities` with `as_of` and optional
   `classification_as_of`.
2. Worker normalizes both snake_case and camelCase request fields.
3. `screenSecurities()` derives `requested_as_of` from `asOf`.
4. If no classification date is supplied, the scaffold uses the requested
   as-of date and marks the guard `enforced`.
5. If `classification_as_of` is later than `requested_as_of`, the package
   returns `blocked_future_data`, zero preview universe, zero usage rows, and
   no live/synthetic universe evaluation.
6. Parsed editable conditions are still returned so the UI or agent can show
   what was blocked.
7. The Worker returns the result in the shared standard envelope.

## P3 Design Decision

Selected a blocking guard before implementing live historical classification
data.

Reason:

- PRD SEC-05 requires historical screens to avoid today's classification.
- The repo does not yet have live historical constituents, industry mappings,
  or security-name tables.
- A deterministic guard prevents the most dangerous future-data leak while
  keeping full live SEC-05 data as a separate data slice.

Tradeoff:

- Historical screens with future classification metadata are blocked instead of
  partially executed.
- The guard contract is now testable in package, Worker, and contract checks.
- Live historical security-master data remains explicitly open.

## Verification

Passed:

- `npm run check:screen-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- local Worker smoke for normal enforced screen guard
- local Worker smoke for blocked future classification

Observed blocked behavior:

```json
{
  "toolName": "screen_securities",
  "status": "blocked_future_data",
  "universe_size": 0,
  "point_in_time_guard": {
    "requested_as_of": "2024-12-31",
    "classification_as_of": "2026-01-07",
    "status": "blocked_future_data",
    "uses_latest_classification": false
  }
}
```

## Residual Gaps

- Live historical constituents are not implemented.
- Live historical industry mappings are not implemented.
- Historical security-name lookup data is not implemented.
- Frontend comparison, screening, ratios, returns/risk, and percentile UI
  remains delegated.
- Tool registry/MCP exposure remains pending.
