# Notes: agent-run-context-scaffold

> **Last Updated**: 2026-06-21 03:04 +08
> **Plan**: `plans/plan-agent-run-context-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/agent-run-context-scaffold.md`

## Decisions

- Extended the existing dry-run skeleton instead of adding a parallel Agent
  runtime route, because `POST /agent/runs/dry-run` is already the verified
  no-model execution boundary.
- Used shared Tool Registry metadata for tool version/schema/scope expansion.
- Kept entitlement context synthetic/default-deny with no live policy source.
- Kept model tier fixed to `dry_run` and did not enable `streamText`,
  `generateText`, live entitlement reads, MCP redistribution, or frontend.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:agent-run-context`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run check` attempted: all lint/typecheck/test/golden/contract checks
  reached before build passed, then root build failed in out-of-scope
  `@aiphabee/web` Vite build on Node v22.12.0 because
  `node:module.registerHooks` is unavailable; `apps/web` has no diff.
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `GET /agent/runtime` -> `200 OK`, `run_context.status=agent_run_context_scaffold`,
  `context_ready=true`, `live_entitlement_reads=false`
- `POST /agent/runs/dry-run` -> `200 OK`, `run_context.user.user_id`,
  `workspace.workspace_id`, `subscription.plan`, `entitlements.data_rights_state=default_deny`,
  tool schema/version metadata, and `model.model_calls=false`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`
- No lingering current-repo `wrangler dev`, `workerd`, or workflow helper
  process after verification

## Residual Blockers

- ToolLoopAgent multi-step loop and streaming progress are absent.
- Real `streamText` / `generateText` model calls remain guarded.
- Live entitlement DB reads and partner rights matrix are absent.
- Financial-number evidence binding after generation is absent.
- Frontend Ask and evidence cards remain out of scope for this Codex slice.
- Root all-workspace build is blocked by the frontend Vite/Cloudflare plugin
  runtime issue until frontend ownership resolves it or the Node/toolchain is
  aligned.
