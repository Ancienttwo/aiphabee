# Pre Tool Call Resolution Scaffold

> **Status**: Verified no-model preflight scaffold
> **Last Updated**: 2026-06-21 03:34 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-pre-tool-call-resolution-scaffold.md`
> **Task Contract**:
> `tasks/contracts/pre-tool-call-resolution-scaffold.contract.md`

This slice adds deterministic pre-tool-call resolution for security, time,
currency, and methodology context. It returns assumptions when safe and blocking
clarifications when critical ambiguity would otherwise force a silent guess.
It does not call a model, execute tools, use live data, or touch frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime package | `packages/agent-runtime` | Owns pre-tool-call resolution and clarification shape |
| Worker preflight | `POST /agent/runs/preflight` | Returns standard envelope with context resolution |
| Worker planner | `POST /agent/runs/plan` | Embeds preflight result before planned tool steps |
| Preflight contract | `deploy/agent/pre-tool-call-resolution.contract.json` | Requires dimensions, statuses, assumptions, clarifications, and no-live flags |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends prompt, optional securities, as_of, currency, methodology, and
   tool list to `POST /agent/runs/preflight`.
2. Worker calls `createPreToolCallResolution()`.
3. Runtime validates requested tool names against Tool Registry.
4. Runtime resolves:
   - security from explicit `securities` or prompt inference;
   - time from `as_of` / `time_range` or latest-available assumption;
   - currency from request or primary security currency assumption;
   - methodology from request or split-adjusted/latest-reported assumptions.
5. If security is ambiguous, runtime returns `needs_clarification` with candidate
   IDs and blocks tool planning.
6. `POST /agent/runs/plan` includes the same `pre_tool_call_resolution` before
   planned tool steps.

## P3 Design Decision

Selected deterministic preflight before real entity resolution.

Reason:

- AGT-02 requires no silent security/time/currency/methodology ambiguity before
  tool calls.
- Existing no-model planner can use a structured preflight result immediately.
- Real entity resolution and model-driven clarification UI require future live
  tool/model surfaces.

Tradeoff:

- The Agent runtime now has an enforceable pre-tool-call context contract.
- It only covers synthetic deterministic fixtures and assumptions, not full
  natural-language entity resolution.

What fails first at 10x scale:

- Fixture-based parsing must be replaced by the real security resolver and a
  persisted clarification loop before broad public prompts are supported.

## Verification

Passed:

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:pre-tool-call-resolution`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /agent/runs/preflight` explicit 00700/HKD/as_of/methodology -> `200 OK`
- `POST /agent/runs/preflight` ambiguous ABC -> `200 OK`
- `POST /agent/runs/plan` -> `200 OK`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` returned no changed files
- `scripts/check-task-workflow.sh --strict`

Observed route fields:

```json
{
  "ready": {
    "status": "ready",
    "security": "eq_hk_00700",
    "asOf": "2024-03-31",
    "currency": "HKD",
    "methodology": "split_adjusted",
    "canPlanTools": true
  },
  "ambiguous": {
    "status": "needs_clarification",
    "field": "security",
    "candidateCount": 2,
    "canPlanTools": false
  },
  "plan": {
    "preflightStatus": "ready_with_assumptions",
    "clarificationRequired": false
  }
}
```

## Residual Gaps

- Real NLP/entity resolver is absent.
- Actual `resolve_security` tool execution is absent.
- Model-driven clarification UI is absent.
- Live market/calendar data is absent.
- Frontend Ask and evidence cards remain out of scope.
- Root all-workspace build remains blocked by the frontend Vite/Cloudflare
  plugin runtime mismatch until the frontend lane aligns Node/tooling.
