# Notes: pre-tool-call-resolution-scaffold

> **Last Updated**: 2026-06-21 03:34 +08
> **Plan**: `plans/plan-pre-tool-call-resolution-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/pre-tool-call-resolution-scaffold.md`

## Decisions

- Added deterministic preflight resolution to `@aiphabee/agent-runtime` so it
  can run before the no-model ToolLoopAgent planner.
- Kept ambiguous security resolution blocking; `ABC` returns candidate
  clarification instead of silent selection.
- Returned explicit assumptions for omitted time, currency, and methodology.
- Kept real NLP/entity resolution, actual tool calls, model calls, live data,
  and frontend clarification UI out of scope.

## Verification

- `npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:pre-tool-call-resolution`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run test`
- `npm run test:golden`
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `POST /agent/runs/preflight` explicit 00700/HKD/as_of/methodology -> `200 OK`,
  `status=ready`, `tool_readiness.can_plan_tools=true`
- `POST /agent/runs/preflight` ambiguous ABC -> `200 OK`,
  `status=needs_clarification`, `tool_readiness.can_plan_tools=false`
- `POST /agent/runs/plan` -> `200 OK`, includes `pre_tool_call_resolution`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`
- No lingering current-repo `wrangler dev`, `workerd`, or workflow helper
  process after verification

## Residual Blockers

- Real NLP/entity resolver is absent.
- Actual `resolve_security` tool execution is absent.
- Model-driven clarification UI is absent.
- Live market/calendar data is absent.
- Frontend Ask and evidence cards remain out of scope.
- Root all-workspace build remains blocked by the frontend Vite/Cloudflare
  plugin runtime mismatch until the frontend lane aligns Node/tooling.
