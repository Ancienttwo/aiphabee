# Plan Evidence: Ephemeral OHLCV Beta Guardrails + Kill Switch

> **Status**: Completed
> **Completed**: 2026-07-07 03:50 HKT
> **Sprint**: `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
> **Row**: 9

## Scope

Implemented Row 9 in `packages/agent-runtime/src/index.ts` and
`packages/agent-runtime/src/index.test.ts`; produced release-gate evidence at
`plans/archive/20260707-ephemeral-ohlcv-release-gate.evidence.md`.

## Decision

`evaluateEphemeralTechnicalAnalysisBetaGuardrails()` is the final beta/kill
switch gate for `analyze_public_technical_signal`.

- beta flag: `ephemeral_ohlcv_skill_beta`
- beta disabled: `KILL_SWITCH_ACTIVE`
- kill switch active: `KILL_SWITCH_ACTIVE`
- background refresh: `BACKGROUND_REFRESH_BLOCKED`
- batch/full-market: `BATCH_FETCH_NOT_ALLOWED`
- raw batch export: `RAW_OHLCV_BATCH_EXPORT_BLOCKED`

`createEphemeralTechnicalAnalysisMonitoringEvent()` defines monitoring event
schema for rate-limit, violation, cost, provider, cache, and post-check events.

## Verification

```sh
npx vitest run packages/agent-runtime/src
npm run typecheck
git diff --check
rg -n "ephemeral_ohlcv_skill_beta|KILL_SWITCH_ACTIVE|RAW_OHLCV_BATCH_EXPORT_BLOCKED|ephemeral_ohlcv\\.(rate_limit|violation|cost|provider|cache|post_check)" packages/agent-runtime/src
test -f plans/archive/20260707-ephemeral-ohlcv-release-gate.evidence.md
```

Observed:

- Agent-runtime vitest: 9 files passed, 114 tests passed.
- `npm run typecheck`: all workspaces passed.
- `git diff --check`: clean.

## Next Dependency

This completes the approved 9-row sprint backlog.
