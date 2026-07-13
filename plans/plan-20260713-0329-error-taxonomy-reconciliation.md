# Plan: Error Taxonomy Reconciliation

> **Status**: Completed
> **Created**: 20260713-0329
> **Slug**: error-taxonomy-reconciliation
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260713-0029-planning-pack-contract-reconciliation-closure.sprint.md#Error taxonomy reconciliation
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Exact source/matrix/deployed parity, targeted tests and strict workflow
> **Rollback Surface**: Row 1 matrix, checker, MCP mapping declaration and tests
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260713-0329-error-taxonomy-reconciliation.contract.md`
> **Task Review**: `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md`
> **Implementation Notes**: `tasks/notes/20260713-0329-error-taxonomy-reconciliation.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260713-0029-planning-pack-contract-reconciliation-closure.sprint.md#Error taxonomy reconciliation
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260713-0329-error-taxonomy-reconciliation.md`
- Sprint contract: `tasks/contracts/20260713-0329-error-taxonomy-reconciliation.contract.md`
- Sprint review: `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md`
- Implementation notes: `tasks/notes/20260713-0329-error-taxonomy-reconciliation.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260713-0329-error-taxonomy-reconciliation.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260713-0329-error-taxonomy-reconciliation.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260713-0329-error-taxonomy-reconciliation.md`.

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
- Contract file: `tasks/contracts/20260713-0329-error-taxonomy-reconciliation.contract.md`
- Review file: `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md`
- Implementation notes file: `tasks/notes/20260713-0329-error-taxonomy-reconciliation.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260713-0329-error-taxonomy-reconciliation.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260713-0329-error-taxonomy-reconciliation.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Row 1 matrix, checker, MCP mapping declaration and tests
- **Verification boundary**: Exact source/matrix/deployed parity, targeted tests and strict workflow
- **Review/acceptance boundary**: `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260713-0329-error-taxonomy-reconciliation.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260713-0329-error-taxonomy-reconciliation.contract.md`, `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md`, and `tasks/notes/20260713-0329-error-taxonomy-reconciliation.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260713-0329-error-taxonomy-reconciliation.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Row 1 matrix, checker, MCP mapping declaration and tests

## Captured Planning Output

## Agentic Routing

- Selected route: bounded contract implementation
- Routing reason: shared cross-module contract requiring an isolated worktree and independent acceptance
- Due diligence:
  - P1 map: Data Contracts owns the shared public envelope; MCP Runtime owns its private/public subset; Agent Runtime owns private execution failures; Tool Registry owns per-tool declarations.
  - P2 trace: `McpRuntimeInputError("TOOL_LIMIT_EXCEEDED")` → exact MCP mapping → `TOO_MANY_ROWS` → shared error envelope; unknown exceptions project to generic `INTERNAL_ERROR` without exposing raw identity.
  - P3 decision rationale: add a reconciliation ledger rather than a global enum; preserve owner-local types and only close the deployed MCP 12/36 mapping drift.

## Workflow Inventory

- Active Sprint: `plans/sprints/20260713-0029-planning-pack-contract-reconciliation-closure.sprint.md`
- Source PRD: `plans/prds/20260713-0029-planning-pack-contract-reconciliation-closure.prd.md`
- Deferred-goal ledger: `tasks/todos.md` remains non-active.
- Scope authority: the frozen task contract `allowed_paths`.
- Execution isolation: one fresh contract worktree; Rows 2–3 remain pending.

## Approach

### Strategy

Create `packages/data-contracts/src/error-taxonomy-reconciliation.contract.json` as a machine-checkable reconciliation ledger. It records source-set identities, one canonical owner, exposure, exact channel mapping, retry authority, contract versions, and redaction. It does not generate or replace owner enums.

Add a checker that uses exact TypeScript AST/JSON selectors to compare current source authorities against the matrix and deployed MCP contract. Complete `deploy/mcp/error-codes.contract.json` from 12 to 36 private mappings while preserving its 11-code public subset and version.

### Trade-offs

| Option | Pros | Cons | Decision |
|---|---|---|---|
| One global enum | Simple membership | Leaks private semantics and collapses ownership | Reject |
| Heuristic mapping | Less metadata | Violates fail-closed semantics | Reject |
| Reconciliation ledger | Exact drift detection; owner boundaries preserved | Explicit maintenance | Select |

## Detailed Design

### File Changes

| File | Action | Description |
|---|---|---|
| `packages/data-contracts/src/error-taxonomy-reconciliation.contract.json` | Add | Canonical cross-owner reconciliation ledger |
| `packages/data-contracts/src/error-taxonomy-reconciliation.contract.test.ts` | Add | Positive and mutation-based negative contract tests |
| `deploy/mcp/error-codes.contract.json` | Modify | Complete exact 36/36 internal mapping parity; keep public subset unchanged |
| `scripts/check-error-taxonomy-reconciliation-contract.mjs` | Add | AST/JSON exact-set and invariant checker with deterministic diagnostics |
| `package.json` | Modify | Add `check:error-taxonomy-reconciliation` and wire into root `check` |
| `tasks/notes/20260713-error-taxonomy-reconciliation.notes.md` | Add | Implementation evidence and rollback record |

### Contract Shape

- `schema_version: 1`
- `contract_version: 2026-07-13.error-taxonomy-reconciliation.v1`
- `authority.scope: cross_owner_reconciliation_only`
- `authority.global_runtime_enum: false`
- `source_sets[]`: exact source path, selector, owner, version, closed/open authority kind
- `entries[]`: identity, code, source sets, canonical owner, category, exposure, Web/MCP/Agent mapping, retry owner/mode/value/field, versions, redaction
- `unknown_policy`: exact lookup only; public `INTERNAL_ERROR`; generic route-owned message; non-retryable; raw identity internal-audit only; no semantic fallback
- `versioning_policy`: additive owner-private additions; public mapping/retry/redaction changes are breaking; rename/remove has no aliases
- planning-pack-only list recorded as rejected, non-authoritative input

### Data Flow

Owner-local closed sets → exact AST/JSON extraction → reconciliation ledger parity → deployed MCP private/public parity. Runtime modules continue consuming their existing authorities; the ledger is validation input only.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mega-enum emerges | Medium | High | `global_runtime_enum=false`; no owner source generation |
| Private detail leaks | Medium | High | explicit exposure/redaction plus negative tests |
| Retry inferred heuristically | Medium | High | required retry owner/mode; undeclared means fail-closed false |
| Checker parses TypeScript incorrectly | Medium | High | TypeScript compiler API; unresolved selector fails |
| Row 2/3 scope leaks in | Medium | High | exact allowlist; Agent/Tool/Worker sources read-only |

## Task Contracts

- Contract file: `tasks/contracts/20260713-error-taxonomy-reconciliation.contract.md`
- Review file: `tasks/reviews/20260713-error-taxonomy-reconciliation.review.md`
- Implementation notes: `tasks/notes/20260713-error-taxonomy-reconciliation.notes.md`
- Preflight: `repo-harness run contract-run preflight --contract tasks/contracts/20260713-error-taxonomy-reconciliation.contract.md`

## Promotion Gate

- **Merge/PR unit**: Row 1 matrix, checker, MCP declaration parity, tests, and workflow artifacts as one atomic unit.
- **Rollback surface**: revert matrix/checker/test/script wiring and restore MCP deployed contract together.
- **Verification boundary**: exact checker, existing MCP/Tool Registry checks, targeted tests/typechecks, task sync, strict workflow, diff/allowed paths.
- **Review/acceptance boundary**: independent reviewer must accept before Row 1 is frozen and Row 2 starts.
- **High-risk surface**: public error exposure and retry semantics; runtime behavior remains unchanged.
- **Why not checklist row**: shared contract and deployed declaration cross module boundaries.

## Evidence Contract

- **State/progress path**: this plan, frozen task contract, implementation note, review file, and Sprint Row 1.
- **Verification evidence**: exact commands and outputs recorded by the isolated executor.
- **Evaluator rubric**: complete exact sets, one owner, deliberate exposure, owner-bound retry, redaction, unknown fail-closed, no aliases or private leakage.
- **Stop condition**: ownership ambiguity, heuristic semantics, need for Worker/Agent runtime edits, Row 2/3 scope, or allowed-path breach.
- **Rollback surface**: no DB/live state; atomic file revert only.

## Task Breakdown

- [x] Write RED matrix/checker mutation tests.
- [x] Add reconciliation ledger and exact checker.
- [x] Complete deployed MCP 36/36 mapping parity without changing the public subset.
- [x] Run targeted checks/typechecks and allowed-path audit.
- [x] Record evidence and pass independent review.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->
