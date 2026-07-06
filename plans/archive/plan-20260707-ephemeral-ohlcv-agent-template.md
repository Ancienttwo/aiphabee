# Plan Evidence: Ephemeral OHLCV Agent Integration + Template

> **Status**: Completed
> **Completed**: 2026-07-07 03:41 HKT
> **Sprint**: `plans/sprints/20260703-2214-ephemeral-ohlcv-skill.sprint.md`
> **Row**: 6

## Scope

Implemented Row 6 in `packages/agent-runtime/src/index.ts` and
`packages/agent-runtime/src/index.test.ts`.

## Decision

`createEphemeralTechnicalAnalysisAgentPlan()` is the Research Agent planning
contract for `analyze_public_technical_signal`.

It runs layer policy first, then Row 5 guardrails. Generic Agent requests are
blocked before answer template creation. Successful Research plans include:

- `public_observation` label
- `public_observation_signal` data classification
- `retrieved_at`
- `delay_notice`
- signal summary
- `tool.started`, `tool.finished`, `answer.final` event names
- bounded bars in LLM context only when `detailLevel=with_bars`

This row does not add a live worker/SSE route.

## Verification

```sh
npx vitest run packages/agent-runtime/src
npm run typecheck
git diff --check
rg -n "public_observation|retrieved_at|delay_notice|with_bars|tool\\.started|tool\\.finished|answer\\.final|createEphemeralTechnicalAnalysisAgentPlan" packages/agent-runtime/src
```

Observed:

- Agent-runtime vitest: 9 files passed, 108 tests passed.
- `npm run typecheck`: all workspaces passed.
- `git diff --check`: clean.

## Next Dependency

Row 7 should post-check generated answers and enforce transcript mode using this
template output as the input contract.
