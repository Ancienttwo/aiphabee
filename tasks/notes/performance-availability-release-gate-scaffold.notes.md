# Performance Availability Release Gate Scaffold Notes

## Summary

Added a no-write Observability release gate that encodes PRD §12.1 SLO targets and validates synthetic release-gate observations for API availability, MCP latency, Web first token, simple research completion, and MCP tool success rate.

## Decisions

- The gate lives in `@aiphabee/observability` because it owns telemetry, eval, and runtime observability surfaces.
- The worker only exposes the gate through a standard response envelope and normalizes optional observation overrides.
- User-input and authorization-denied failures are excluded from tool success-rate accounting, matching PRD wording.
- The gate remains blocked on live APM/provider reads, probe scheduling, SLO-store writes, load-test artifacts, frontend first-token measurement, and ops/SRE signoff.

## Verification

- `npm run typecheck --workspace @aiphabee/observability`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/observability/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:performance-availability-release-gate`
- `npm run check:database`
