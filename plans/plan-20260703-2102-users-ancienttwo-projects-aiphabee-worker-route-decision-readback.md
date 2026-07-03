# Plan: Worker Route Decision Readback

> **Status**: Executing
> **Created**: 20260703-2102
> **Slug**: users-ancienttwo-projects-aiphabee-worker-route-decision-readback
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: plans/sprints/20260703-agent-control-plane-convergence.sprint.md#Worker route decision readback
> **Artifact Level**: work-package
> **Promotion Reason**: human_decision_boundary
> **Verification Boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md --strict`.
> **Rollback Surface**: Before execution remove `plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-worker-route-decision-readback` or the explicitly reviewed diff.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md`
> **Task Review**: `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md`
> **Implementation Notes**: `tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: plans/sprints/20260703-agent-control-plane-convergence.sprint.md#Worker route decision readback
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md`
- Sprint contract: `tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md`
- Sprint review: `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md`
- Implementation notes: `tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md`.

## Approach
### Strategy
Use the captured planning output below as the execution source of truth.

### Trade-offs
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Captured plan | Preserves the approved Codex Plan or Waza think decision | Requires the captured text to be concrete enough to execute | Use |

## Detailed Design
### File Changes
| File | Action | Description |
|------|--------|-------------|
| See captured planning output | Follow | Implement only the approved scope named below |

### Code Snippets
See captured planning output.

### Data Flow
See captured planning output.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Captured plan lacks enough detail | Medium | Execution may need clarification | Stop before implementation if the captured output contradicts repo rules or lacks concrete file targets |

## Task Contracts
- Contract file: `tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md`
- Review file: `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md`
- Implementation notes file: `tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Before execution remove `plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-worker-route-decision-readback` or the explicitly reviewed diff.
- **Verification boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md --strict`.
- **Review/acceptance boundary**: `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: human_decision_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.contract.md`, `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md`, and `tasks/notes/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Before execution remove `plans/plan-20260703-2102-users-ancienttwo-projects-aiphabee-worker-route-decision-readback.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-worker-route-decision-readback` or the explicitly reviewed diff.

## Captured Planning Output

# Worker route decision readback

## Decision
Implement the second bounded slice after Agent control-plane contract convergence: Worker `/agent/*` route planning responses should read route/layer semantics from `@aiphabee/agent-runtime` and expose requested layer, selected layer, and route reason without defining a competing Worker-owned contract.

## Scope
- Use the existing `AgentLayer`, `AgentRunMode`, and control-plane capability exported from `packages/agent-runtime`.
- Update Worker route planning/readback code and focused Worker tests only where the existing `/agent/*` scaffold already returns runtime or route-plan data.
- Preserve dry-run/no-live-execution behavior.

## Non-goals
- Do not implement FastClaw/E2B runtime.
- Do not enable Generic guarded-live model execution.
- Do not wire Generic to `parse_chart_image`.
- Do not change production auth/session semantics.
- Do not introduce `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.

## Acceptance
- Worker route-plan/readback response includes `requested_layer`, `selected_layer`, and `route_reason` for the relevant `/agent/*` planning surface.
- Route decisions are derived from runtime contract constants/capability instead of Worker-local enum copies.
- Existing Worker targeted tests pass: `npx vitest run apps/worker/src/index.test.ts`.
- Runtime targeted tests still pass: `npx vitest run packages/agent-runtime/src/index.test.ts`.
- Contract verification passes after review/notes are updated.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Execute captured plan: Worker Route Decision Readback
