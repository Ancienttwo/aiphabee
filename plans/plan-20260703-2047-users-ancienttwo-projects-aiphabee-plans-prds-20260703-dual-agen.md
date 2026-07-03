# Plan: Agent Control Plane Convergence Task 1

> **Status**: Executing
> **Created**: 20260703-2047
> **Slug**: users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: plans/sprints/20260703-agent-control-plane-convergence.sprint.md#Agent layer + runner contract convergence
> **Artifact Level**: work-package
> **Promotion Reason**: human_decision_boundary
> **Verification Boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md --strict`.
> **Rollback Surface**: Before execution remove `plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen` or the explicitly reviewed diff.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md`
> **Task Review**: `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md`
> **Implementation Notes**: `tasks/notes/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: plans/sprints/20260703-agent-control-plane-convergence.sprint.md#Agent layer + runner contract convergence
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md`
- Sprint contract: `tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md`
- Sprint review: `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md`
- Implementation notes: `tasks/notes/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md`.

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
- Contract file: `tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md`
- Review file: `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md`
- Implementation notes file: `tasks/notes/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Before execution remove `plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen` or the explicitly reviewed diff.
- **Verification boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md --strict`.
- **Review/acceptance boundary**: `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: human_decision_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.contract.md`, `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md`, and `tasks/notes/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Before execution remove `plans/plan-20260703-2047-users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-plans-prds-20260703-dual-agen` or the explicitly reviewed diff.

## Captured Planning Output

# Agent layer + runner contract convergence

## Decision
Implement the first executable slice from `plans/sprints/20260703-agent-control-plane-convergence.sprint.md`: converge the runtime contract for agent layer, run mode, execution request/event, and runner boundary inside existing `@aiphabee/agent-runtime`.

## Scope
- Add or adjust contract types in the existing `packages/agent-runtime` surface.
- Preserve the existing Worker `/agent/*` ownership and existing `parse_chart_image` module boundary.
- Add focused tests for `AgentLayer`, `AgentRunMode`, `AgentExecutionRequest`, `AgentExecutionEvent`, `AgentRunner`, and route-decision fixtures if this repo already has the local test pattern.

## Non-goals
- Do not add `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.
- Do not implement FastClaw/E2B runtime.
- Do not wire Generic to invoke `parse_chart_image`.
- Do not change production auth/session semantics.

## Acceptance
- `npx vitest run packages/agent-runtime/src/index.test.ts` passes.
- Existing `parse_chart_image` targeted tests still pass if present.
- No forbidden package/app paths are introduced.
- The new contract is exported from the existing runtime authority and can be consumed by Worker routes in the next slice.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Execute captured plan: Agent Control Plane Convergence Task 1
