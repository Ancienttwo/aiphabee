# Data Coverage Release Gate Scaffold Notes

## Summary

Implemented the Sprint 3.3 §19.1 backend scaffold for realtime/delayed/EOD
freshness labels and required data coverage domains.

## Current State

- `@aiphabee/data-access-gateway` exposes data coverage release gate
  capabilities.
- `GET /gateway/runtime` includes nested `data_coverage_release_gate`
  readiness.
- `GET /gateway/data-coverage/release-gate` returns:
  - freshness markers for realtime, delayed, and EOD;
  - coverage domains for corporate actions, financial restatements,
    delistings, and identifier history;
  - a blocked release gate for missing partner coverage, live freshness policy,
    and golden signoff.
- `core.data_coverage_release_gate` and
  `governance.data_coverage_release_gate_contract` exist as empty schema
  scaffolds.

## Non-Goals

- No live partner data reads.
- No production coverage files.
- No live freshness policy.
- No frontend release surface.

## Verification

Passed on 2026-06-21:

- `npm run check:data-coverage-release-gate`
- `npm run check:database`
- `npm run typecheck --workspace @aiphabee/data-access-gateway`
- `npm run typecheck --workspace @aiphabee/worker`
- `npx vitest run packages/data-access-gateway/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run build --workspace @aiphabee/data-access-gateway`
- `npm run build --workspace @aiphabee/worker`

Root check caveat:

- `npm run check` is expected to retain the existing frontend Vite runtime
  caveat unless the delegated frontend runtime is fixed separately.
