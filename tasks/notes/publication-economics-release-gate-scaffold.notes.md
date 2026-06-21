# Publication Economics Release Gate Scaffold Notes

## Summary

Added a no-write release gate that composes public status/docs, support help center, and account package pricing into one Sprint 3.3 publication/economics validation plan.

## Decisions

- The gate lives in `@aiphabee/public-ops` because that package owns the public status/docs runtime surface.
- Unit economics are derived from `@aiphabee/account-runtime` package pricing and PRD §15.5 expected direct-cost assumptions.
- The gate remains blocked for live deployment, final privacy/terms legal approval, finance signoff, live pricing provider, and frontend public release surface.

## Verification

- `npm run typecheck --workspace @aiphabee/public-ops`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:publication-economics-release-gate`
- `npx vitest run packages/public-ops/src/index.test.ts apps/worker/src/index.test.ts`
