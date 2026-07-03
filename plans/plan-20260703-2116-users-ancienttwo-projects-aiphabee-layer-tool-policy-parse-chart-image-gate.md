# Plan: Layer Tool Policy Parse Chart Image Gate

> **Status**: Completed
> **Created**: 20260703-2116
> **Slug**: users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: plans/sprints/20260703-agent-control-plane-convergence.sprint.md#Layer tool policy + parse_chart_image research-only gate
> **Artifact Level**: work-package
> **Promotion Reason**: human_decision_boundary
> **Verification Boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md --strict`.
> **Rollback Surface**: Before execution remove `plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate` or the explicitly reviewed diff.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md`
> **Task Review**: `tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md`
> **Implementation Notes**: `tasks/notes/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: plans/sprints/20260703-agent-control-plane-convergence.sprint.md#Layer tool policy + parse_chart_image research-only gate
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md`
- Sprint contract: `tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md`
- Sprint review: `tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md`
- Implementation notes: `tasks/notes/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md`.

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
- Contract file: `tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md`
- Review file: `tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md`
- Implementation notes file: `tasks/notes/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Before execution remove `plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate` or the explicitly reviewed diff.
- **Verification boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md --strict`.
- **Review/acceptance boundary**: `tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: human_decision_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md`, `tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md`, and `tasks/notes/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Before execution remove `plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md`; after execution revert branch `codex/users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate` or the explicitly reviewed diff.

## Captured Planning Output

# Layer tool policy + parse_chart_image research-only gate

## Decision
Implement the third bounded slice after Worker route readback: add deterministic layer tool policy so Generic cannot request `parse_chart_image`, Research can request it only when explicit tenant/context/technical-analysis entitlement fields are present, and unknown tools remain blocked before planning.

## Scope
- Add or adjust policy contract and helper functions in existing `@aiphabee/agent-runtime`.
- Wire Worker `/agent/runs/dry-run` and `/agent/runs/plan` request handling to evaluate layer tool policy before creating skeleton/plans.
- Add focused runtime and Worker tests for Generic denial, Research allowance with required context, unknown tool/default-deny, and fail-closed Research missing context.
- Preserve existing parse-chart-image executor/tool tests and no-live-execution behavior.

## Non-goals
- Do not implement FastClaw/E2B runtime.
- Do not execute `parse_chart_image` from Generic or through Worker planning.
- Do not change production auth/session semantics.
- Do not infer tool layer from prompt text, image names, or requested tools.
- Do not introduce `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.

## Acceptance
- Generic request for `parse_chart_image` is blocked before skeleton/plan creation.
- Research request for `parse_chart_image` is allowed only with technical-analysis entitlement plus tenant context and image reference.
- Missing Research context or unknown tools fail closed with route/policy evidence.
- `npx vitest run packages/agent-runtime/src/index.test.ts` passes.
- `npx vitest run packages/agent-runtime/src/parse-chart-image` passes.
- `npx vitest run apps/worker/src/index.test.ts` passes.
- Contract verification passes after review/notes are updated.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Execute captured plan: Layer Tool Policy Parse Chart Image Gate
