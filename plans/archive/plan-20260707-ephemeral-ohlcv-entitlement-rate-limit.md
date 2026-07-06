# Plan Evidence: Ephemeral OHLCV Entitlement + Rate Limit

> **Status**: Completed
> **Completed**: 2026-07-07 03:38 HKT
> **Sprint**: `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
> **Row**: 5

## Scope

Implemented Row 5 in `packages/agent-runtime/src/index.ts` and
`packages/agent-runtime/src/index.test.ts`.

## Decision

`evaluateEphemeralTechnicalAnalysisGuardrails()` is the fail-closed policy gate
for `analyze_public_technical_signal` before agent/tool integration:

- Free tier is blocked with `ENTITLEMENT_REQUIRED`.
- Research and Pro plans are allowed when all other gates pass.
- Hourly >20, daily >100, or concurrent >2 returns `PROVIDER_RATE_LIMITED`.
- Batch symbol requests and full-market marker requests return
  `BATCH_FETCH_NOT_ALLOWED`.
- Non-user-initiated requests remain blocked.

This row does not execute provider fetches and does not add worker middleware.

## Verification

```sh
npx vitest run packages/agent-runtime/src
npm run typecheck
git diff --check
rg -n "ENTITLEMENT_REQUIRED|PROVIDER_RATE_LIMITED|BATCH_FETCH_NOT_ALLOWED|EPHEMERAL_TECHNICAL_ANALYSIS_RATE_LIMITS|evaluateEphemeralTechnicalAnalysisGuardrails" packages/agent-runtime/src
```

Observed:

- Agent-runtime vitest: 9 files passed, 106 tests passed.
- `npm run typecheck`: all workspaces passed.
- `git diff --check`: clean.

## Next Dependency

Row 6 can call this guardrail before building
`analyze_public_technical_signal` tool plans/templates.
