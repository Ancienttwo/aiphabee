# Plan: Engineering Runtime Scaffold

> **Status**: Verified
> **Created**: 2026-06-20 14:20 +08
> **Slug**: engineering-runtime-scaffold
> **Spec**: `docs/spec.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Source Closeout**: `docs/governance/phase0-traceability-closeout.md`
> **Task Contract**: `tasks/contracts/engineering-runtime-scaffold.contract.md`
> **Implementation Notes**: `tasks/notes/engineering-runtime-scaffold.notes.md`

## Agentic Routing

- Selected route: non-frontend runtime scaffold
- Routing reason: Phase 0 needs an installable/testable Worker and shared
  contract package before later backend slices; user explicitly delegated
  frontend work to Claude.
- Due diligence:
  - P1 map: root workspace, Worker app, shared packages, CI, env template,
    explicit out-of-scope frontend/product data surfaces.
  - P2 trace: Wrangler local server -> Hono `/health` -> no-store JSON response;
    root route -> shared response envelope.
  - P3 decision rationale: keep a small backend scaffold while Gate 0 blocks
    market-data/MCP surfaces and frontend is owned elsewhere.

## Workflow Inventory

- Active plan: `plans/plan-engineering-runtime-scaffold.md`
- Task contract: `tasks/contracts/engineering-runtime-scaffold.contract.md`
- Implementation notes: `tasks/notes/engineering-runtime-scaffold.notes.md`
- Runtime evidence: `docs/governance/engineering-runtime-scaffold.md`
- Deferred-goal ledger: `tasks/todos.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

Implement the smallest runnable backend foundation:

- root npm workspaces and lockfile;
- strict TypeScript baseline and Vitest test discovery;
- Hono Worker with Wrangler local config and `/health`;
- shared data-contracts package with response envelope and default-deny errors;
- GitHub Actions CI matching local commands;
- names-only env template.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Include TanStack Start now | Completes more of Sprint 0.4 | Conflicts with user direction to hand frontend to Claude | Rejected |
| Implement AI SDK runtime now | More visible agent progress | Premature before bindings, budgets, and rights gates | Rejected |
| Backend/runtime scaffold only | Produces verified foundation without product surface | Leaves Sprint 0.4 exit gate open | Selected |

## File Changes

| File / Path | Action | Description |
|---|---|---|
| `package.json`, `package-lock.json` | Add | npm workspace and locked dependency graph |
| `tsconfig.base.json`, `vitest.config.ts` | Add | Shared TypeScript/test config |
| `.github/workflows/ci.yml` | Add | install/lint/typecheck/test/build CI |
| `apps/worker/` | Add | Hono Worker runtime, tests, Wrangler config |
| `packages/data-contracts/` | Add | Shared response envelope and error codes |
| `deploy/env/.env.example` | Add | names-only env template |
| `docs/governance/engineering-runtime-scaffold.md` | Add | Verified scaffold closeout |
| `docs/AiphaBee_Sprint_Tracker_v1.0.md` | Update | Mark only completed non-frontend Sprint 0.4 leaves |
| `tasks/todos.md` | Update | Replace broad scaffold blocker with precise remaining surfaces |

## Evidence Contract

- State/progress path: tracker Sprint 0.4 and `tasks/todos.md`.
- Verification evidence: `npm run check`, Wrangler `/health` smoke test,
  `scripts/check-task-workflow.sh --strict`.
- Evaluator rubric: frontend remains absent; no market-data/MCP route exists;
  worker/data-contracts/CI/env are executable and documented.
- Stop condition: local checks pass, `/health` returns expected JSON, tracker
  reflects partial Sprint 0.4 progress without marking Gate 0 green.
- Rollback surface: revert this commit.

## Task Breakdown

- [x] Add root npm workspace and shared TypeScript/test config.
- [x] Add Hono Worker with `/health` and root envelope route.
- [x] Add shared `packages/data-contracts` envelope/error contracts.
- [x] Add CI workflow for install/lint/typecheck/test/build.
- [x] Add names-only env example.
- [x] Verify local checks and Worker health.
- [x] Update tracker/todos/notes without claiming frontend completion.
