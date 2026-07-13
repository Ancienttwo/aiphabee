# Plan: Business Output Evidence Composition

> **Status**: Completed
> **Created**: 20260713-0602
> **Slug**: business-output-evidence-composition
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260713-0029-planning-pack-contract-reconciliation-closure.sprint.md#Business Output/Evidence composition
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Composition ledger, fixtures, existing evidence checks and strict workflow
> **Rollback Surface**: Row 2 ledger, fixtures, checker, tests and package wiring
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260713-0602-business-output-evidence-composition.contract.md`
> **Task Review**: `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md`
> **Implementation Notes**: `tasks/notes/20260713-0602-business-output-evidence-composition.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260713-0029-planning-pack-contract-reconciliation-closure.sprint.md#Business Output/Evidence composition
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260713-0602-business-output-evidence-composition.md`
- Sprint contract: `tasks/contracts/20260713-0602-business-output-evidence-composition.contract.md`
- Sprint review: `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md`
- Implementation notes: `tasks/notes/20260713-0602-business-output-evidence-composition.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260713-0602-business-output-evidence-composition.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260713-0602-business-output-evidence-composition.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260713-0602-business-output-evidence-composition.md`.

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
- Contract file: `tasks/contracts/20260713-0602-business-output-evidence-composition.contract.md`
- Review file: `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md`
- Implementation notes file: `tasks/notes/20260713-0602-business-output-evidence-composition.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260713-0602-business-output-evidence-composition.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260713-0602-business-output-evidence-composition.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Row 2 ledger, fixtures, checker, tests and package wiring
- **Verification boundary**: Composition ledger, fixtures, existing evidence checks and strict workflow
- **Review/acceptance boundary**: `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260713-0602-business-output-evidence-composition.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260713-0602-business-output-evidence-composition.contract.md`, `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md`, and `tasks/notes/20260713-0602-business-output-evidence-composition.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Row 2 ledger, fixtures, checker, tests and package wiring

## Captured Planning Output

## Agentic Routing
- Selected route: bounded contract implementation
- P1: canonical envelope, Evidence Lineage, Agent binding and Row 1 remain owners.
- P2: tool result → evidence refs → business projection; missing/malformed evidence fails closed through Row 1.
- P3: composition ledger only; no runtime DTO, card catalogue, storage, frontend or rights implementation.

## Approach

Add a Data Contracts-owned `cross_owner_composition_only` ledger, nine non-authoritative fixtures, mutation tests and an exact checker. Three representative families prove direct factual observation, deterministic derived metric, and multi-evidence synthesis. Immutable envelope/evidence/claim/calculation identities and existing denial state cannot change across Web/Agent/FastClaw/MCP projections.

## Detailed Design

### File Changes
- `packages/data-contracts/src/business-output-evidence-composition.contract.json`
- `packages/data-contracts/src/business-output-evidence-composition.fixtures.json`
- `packages/data-contracts/src/business-output-evidence-composition.contract.test.ts`
- `scripts/check-business-output-evidence-composition-contract.mjs`
- `package.json`
- Row plan/contract/notes/review artifacts

### Invariants
- `runtime_payload_schema=false`, `storage_model=false`, `channel_semantics_owner=false`.
- Frozen Row 1 version is exact.
- No duplicated evidence payload; projection stores refs only.
- Missing/dangling/malformed/version-mismatched evidence → `DATA_QUALITY_HOLD`.
- Existing `DATA_NOT_LICENSED`/`SCOPE_DENIED` remains denied.
- Unknown defects use Row 1 generic `INTERNAL_ERROR` policy.
- Evidence strength is qualitative only; confidence percentages forbidden.

## Risk Assessment
- Stop on runtime source modification, second schema, evidence reconstruction, rights inference, or identity mutation.

## Promotion Gate
- Merge unit: ledger, fixtures, checker, tests and artifacts.
- Verification: new checker, existing evidence/answer checks, targeted tests/typechecks, workflow gates.
- Rollback: delete Row 2 files and package wiring atomically; no data state.

## Task Breakdown
- [x] Add RED fixture/mutation assertions.
- [x] Add composition ledger and nine fixtures.
- [x] Add exact checker and self-tests.
- [x] Run existing evidence checks, tests and typechecks.
- [x] Record review and freeze Row 2.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

