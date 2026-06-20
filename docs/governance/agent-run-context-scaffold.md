# Agent Run Context Scaffold

> **Status**: Verified dry-run context scaffold
> **Last Updated**: 2026-06-21 03:04 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Plan**:
> `plans/plan-agent-run-context-scaffold.md`
> **Task Contract**:
> `tasks/contracts/agent-run-context-scaffold.contract.md`

This slice adds a complete backend Agent run context to the dry-run runtime
surface. It covers run/user/workspace, subscription plan, entitlement posture,
registered tool versions, budget limits, and model tier without making model
calls, streaming responses, reading live entitlements, enabling MCP
redistribution, or touching frontend code.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Agent runtime package | `packages/agent-runtime` | Owns run context, budget, toolset expansion, and no-model policy |
| Shared Tool Registry | `packages/tool-registry` | Source of tool names, versions, schema IDs, scopes, and live-data posture |
| Worker capabilities | `GET /agent/runtime` | Reports run-context readiness and live entitlement reads disabled |
| Worker dry-run | `POST /agent/runs/dry-run` | Returns standard envelope with `run_context` |
| Run context contract | `deploy/agent/run-context.contract.json` | Requires context sections, budget dimensions, tool fields, and no-live flags |
| Frontend | Out of scope | No `apps/web` files changed |

## P2 Concrete Trace

1. Caller sends `POST /agent/runs/dry-run` with prompt, tools, user, workspace,
   plan, channel, budget fields, and model tier.
2. Worker normalizes the request and calls `createAgentRunSkeleton()`.
3. The runtime validates prompt, step budget, channel, model tier, and registered
   tool names.
4. The runtime expands requested tools through the shared registry into
   version/schema/scope metadata.
5. The runtime returns `run_context` with:
   - run ID and request ID;
   - user and workspace IDs;
   - subscription plan;
   - synthetic default-deny entitlements;
   - toolset versions and schema IDs;
   - budget dimensions;
   - model tier `dry_run` and `model_calls=false`.

## P3 Design Decision

Selected deterministic context planning before ToolLoopAgent streaming.

Reason:

- Sprint 1.3 needs per-run context before tool loops can make safe tool and
  budget decisions.
- Model provider routes are still guarded, so a context-only no-model slice is
  the stable boundary.
- Tool metadata already has an authoritative shared registry; duplicating
  version/schema/scope data in Agent code would create drift.

Tradeoff:

- The Agent runtime can now prove complete context shape for a run.
- It still cannot execute a multi-step tool loop, stream progress, call a model,
  or render frontend evidence cards.

What fails first at 10x scale:

- Synthetic default-deny entitlements must be replaced by live policy snapshots
  and usage ledger writes before high-volume Agent runs can be billed or
  authorized accurately.

## Verification

Passed:

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:agent-run-context`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `GET /agent/runtime` -> `200 OK`
- `POST /agent/runs/dry-run` -> `200 OK`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` returned no changed files
- `scripts/check-task-workflow.sh --strict`

Attempted but blocked outside this slice:

- `npm run check` reached and passed lint/typecheck/test/golden/contract checks,
  then failed at `@aiphabee/web` build because the Cloudflare Vite plugin imports
  `node:module.registerHooks`, which is unavailable under the current Node
  v22.12.0 runtime. `apps/web` has no diff and remains frontend-owned.

Observed route fields:

```json
{
  "runtime": {
    "contextReady": true,
    "status": "agent_run_context_scaffold",
    "liveEntitlementReads": false
  },
  "dryRun": {
    "status": "dry_run",
    "user": "user_internal_alpha",
    "workspace": "workspace_research",
    "plan": "internal_alpha",
    "rightsState": "default_deny",
    "toolVersions": ["resolve_security@0.0.0", "get_financial_facts@0.0.0"],
    "modelCalls": false
  }
}
```

## Residual Gaps

- ToolLoopAgent multi-step loop and streaming progress are absent.
- Real `streamText` / `generateText` model calls remain guarded.
- Live entitlement DB reads and partner rights matrix are absent.
- Financial-number evidence binding after generation is absent.
- Frontend Ask and evidence cards remain out of scope for this Codex slice.
- Root all-workspace build remains blocked by the frontend Vite/Cloudflare
  plugin runtime mismatch until the frontend lane aligns Node/tooling.
