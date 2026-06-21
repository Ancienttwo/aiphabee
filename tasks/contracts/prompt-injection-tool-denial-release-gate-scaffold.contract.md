# Task Contract: Prompt Injection Tool Denial Release Gate Scaffold

## Scope

Close the local no-write contract for Sprint 3.3 / PRD §19.4 item `Prompt injection 测试通过；任意 SQL/URL/未注册工具不可调用`.

## In Scope

- Add Agent runtime capability metadata for prompt-injection and arbitrary tool denial release readiness.
- Add `POST /agent/release-gates/prompt-injection/plan`.
- Reuse the existing document sanitizer malicious fixture as untrusted data evidence.
- Prove `sql.query`, `http.fetch`, and `admin.override` are denied before execution by the Agent planner guard.
- Add contract JSON, checker, empty Supabase schema scaffold, tests, tracker update, and task note.

## Out of Scope

- Frontend untrusted-content rendering UI.
- Live red-team harness execution.
- Live document fetch.
- Live tool execution proxy enforcement.
- Persistent writes, live DB writes, model calls, or SQL emission.

## Verification

- `npm run typecheck --workspace @aiphabee/agent-runtime`
- `npm run build --workspace @aiphabee/agent-runtime`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run build --workspace @aiphabee/worker`
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:prompt-injection-tool-denial-release-gate`
- `npm run check:database`
