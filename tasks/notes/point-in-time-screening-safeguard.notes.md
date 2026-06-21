# Point-in-Time Screening Safeguard Notes

## Summary

Implemented the Sprint 2.1 backend point-in-time screening safeguard for SEC-05
and ANA-03.

## Current State

- `screen_securities` accepts `classificationAsOf` in the package layer.
- `POST /analytics/screen-securities` accepts both `classification_as_of` and
  `classificationAsOf`.
- All screen results include `point_in_time_guard` with:
  - requested as-of date
  - security-master as-of date
  - classification as-of date
  - `future_data_policy: block_future_classification`
  - `uses_latest_classification: false`
- If `classification_as_of` is after `as_of`, the scaffold returns
  `blocked_future_data` and does not evaluate the synthetic universe.

## Non-Goals

- No live historical constituents.
- No live historical industry mappings.
- No historical security-name lookup data.
- No frontend screening UI.
- No MCP registration.
- No high-cost execution queue.

## Verification

Passed:

- `npm run check:screen-securities`
- `npm run test -- packages/analytics-tools/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck --workspace @aiphabee/analytics-tools`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/analytics-tools`
- `npm run build --workspace @aiphabee/worker`
- `POST /analytics/screen-securities` smoke with enforced guard
- `POST /analytics/screen-securities` smoke with blocked future classification

Observed residual:

- Root `npm run check` was run. All lint/typecheck/test/golden/contract checks
  passed before it failed at `@aiphabee/web` `vite build` under Node `v22.12.0`
  because `@cloudflare/vite-plugin` requires `node:module.registerHooks`.
- No `apps/web` files were changed in this backend slice.
