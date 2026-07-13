# Plan: Signed Live Field-Channel Rights

> **Status**: Completed
> **Created**: 20260713-1147
> **Slug**: signed-live-field-channel-rights
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260713-0029-planning-pack-contract-reconciliation-closure.sprint.md#Signed/live field-channel rights
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Exact-ID rights reconciliation, default deny, gate0 blocked-external, strict workflow
> **Rollback Surface**: Row 3 P0 rights contracts, checkers, fixture; activation rollback reserved
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260713-1147-signed-live-field-channel-rights.contract.md`
> **Task Review**: `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md`
> **Implementation Notes**: `tasks/notes/20260713-1147-signed-live-field-channel-rights.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260713-0029-planning-pack-contract-reconciliation-closure.sprint.md#Signed/live field-channel rights
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260713-1147-signed-live-field-channel-rights.md`
- Sprint contract: `tasks/contracts/20260713-1147-signed-live-field-channel-rights.contract.md`
- Sprint review: `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md`
- Implementation notes: `tasks/notes/20260713-1147-signed-live-field-channel-rights.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260713-1147-signed-live-field-channel-rights.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260713-1147-signed-live-field-channel-rights.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260713-1147-signed-live-field-channel-rights.md`.

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
- Contract file: `tasks/contracts/20260713-1147-signed-live-field-channel-rights.contract.md`
- Review file: `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md`
- Implementation notes file: `tasks/notes/20260713-1147-signed-live-field-channel-rights.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260713-1147-signed-live-field-channel-rights.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260713-1147-signed-live-field-channel-rights.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Row 3 P0 rights contracts, checkers, fixture; activation rollback reserved
- **Verification boundary**: Exact-ID rights reconciliation, default deny, gate0 blocked-external, strict workflow
- **Review/acceptance boundary**: `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260713-1147-signed-live-field-channel-rights.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260713-1147-signed-live-field-channel-rights.contract.md`, `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md`, and `tasks/notes/20260713-1147-signed-live-field-channel-rights.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Row 3 P0 rights contracts, checkers, fixture; activation rollback reserved

## Captured Planning Output

## Agentic Routing
- Selected route: bounded contract implementation (rights/security boundary)
- P1: p0-tool-catalog is the canonical 23-ID P0 rights set; registry.contract=24, RegisteredToolName=25 are legitimate supersets; Data Access Gateway evaluator and Gate 0 are already-correct/read-only.
- P2: tool → Gateway field eval → default deny → signed packet → activation; with 0/6 packets the terminal is local_readiness_complete + blocked_external_activation.
- P3: reconcile 23/24/25 by exact IDs with named non-P0 exclusions grounded in frozen authority; never bump count; never weaken checker.

## Approach

Replace the failing count comparison in `check-p0-field-distribution-status` with exact-ID cross-source reconciliation anchored on the canonical `p0-tool-catalog` 23-ID set. Add `required_p0_tool_ids` (23) and `non_p0_rights_scoped_tools` (analyze_public_technical_signal, parse_chart_image) with authority basis to the field-distribution contract, keeping `required_p0_tool_count: 23` unchanged. Apply the same exact-ID symmetry to `p0-rights-matrix-coverage`. External activation remains blocked at 0/6 signed packets; default deny preserved.

### Classification dispositions
- 23 partner-licensed-dataset tools: P0 rights-scoped (canonical `p0-tool-catalog.required_tools`).
- `analyze_public_technical_signal`: NOT P0-rights-scoped — ephemeral public OHLCV, Research-only, no market storage/shared cache/redistribution (docs/spec.md §Ephemeral Public OHLCV; index.ts permissions); registry-required scaffold only.
- `parse_chart_image`: NOT P0-rights-scoped — tenant-owned chart image upload, not partner-licensed; registered-but-not-registry-required.

## Detailed Design

### File Changes
- `deploy/governance/p0-field-distribution-status.contract.json` — add `required_p0_tool_ids` (23) + `non_p0_rights_scoped_tools`; keep `required_p0_tool_count: 23`; bump version.
- `scripts/check-p0-field-distribution-status-contract.mjs` — replace count comparison with exact-ID reconciliation printing missing/extra per source; enforce catalog ⊆ registry ⊆ RegisteredToolName and every extra explained by a named exclusion; every exclusion exists in RegisteredToolName.
- `deploy/gateway/p0-rights-matrix-coverage.contract.json` — add `required_p0_tool_ids` (23).
- `scripts/check-p0-rights-matrix-coverage-contract.mjs` — validate exact IDs.
- one negative fixture / self-test proving fail-closed on an unclassified tool or a missing P0 id.

### Local readiness vs external acceptance
- Local readiness: exact-ID reconciliation passes; default deny on every unresolved dimension; rights_policy_version in cache identity; existing runtime/live-policy smokes intact; checker fails closed on drift. Terminal: `local_readiness_complete`.
- External acceptance: requires 6 authentic signed packets accepted + promoted + transition-reviewed + operator cutover/readback. Current 0/6, empty packet dir. Only lawful terminal without them: `local_readiness_complete + blocked_external_activation`, default deny preserved. Do not create/self-sign packets or infer rights from storage/ingestion/provider/fixtures/Netquity mirror.

## Risk Assessment
- Stop on: any exact ID needing an unapproved product-scope change; count-only change; checker weakening; Gateway bypass; omitted rights_policy_version; local rights inference; forbidden path or FastClaw touch; rollback cannot restore default deny; unattributable baseline failure.

## Promotion Gate
- Merge unit: field-distribution + rights-matrix contracts, both checkers, fixture, artifacts.
- Verification: Row 3 local-readiness command list + strict workflow + targeted package tests.
- Rollback: revert contracts/checkers/fixture atomically; rerun rights + gate0 checks to prove default deny; activation rollback reserved for a separately approved activation only.

## Task Breakdown
- [x] Verify canonical 23-ID set, count-23 consumers, and both drift tools' spec basis.
- [x] Add exact IDs + named exclusions to both P0 rights contracts (count stays 23).
- [x] Rewrite both checkers to exact-ID reconciliation with printed missing/extra.
- [x] Add fail-closed negative fixture/self-test.
- [x] Run Row 3 local-readiness commands, strict workflow, targeted tests; confirm default deny and blocked_external_activation.
- [x] Record review and freeze Row 3.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

