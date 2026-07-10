# Plan: Runner Selection Contract

> **Status**: Complete
> **Created**: 20260710-1837
> **Slug**: runner-selection-contract
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#runner-selection-contract
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Agent Runtime and Worker tests pin the exact edge/FastClaw registry, blocked selection matrix, public readback, unchanged dry-run-only execution, typecheck, answer-evidence, strict contract, review, and sprint verification.
> **Rollback Surface**: Revert the single stacked runner-selection commit; no database, credential, network, deployment, or external state rollback exists.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260710-1837-runner-selection-contract.contract.md`
> **Task Review**: `tasks/reviews/20260710-1837-runner-selection-contract.review.md`
> **Implementation Notes**: `tasks/notes/20260710-1837-runner-selection-contract.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#runner-selection-contract
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260710-1837-runner-selection-contract.md`
- Sprint contract: `tasks/contracts/20260710-1837-runner-selection-contract.contract.md`
- Sprint review: `tasks/reviews/20260710-1837-runner-selection-contract.review.md`
- Implementation notes: `tasks/notes/20260710-1837-runner-selection-contract.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260710-1837-runner-selection-contract.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260710-1837-runner-selection-contract.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260710-1837-runner-selection-contract.md`.

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
- Contract file: `tasks/contracts/20260710-1837-runner-selection-contract.contract.md`
- Review file: `tasks/reviews/20260710-1837-runner-selection-contract.review.md`
- Implementation notes file: `tasks/notes/20260710-1837-runner-selection-contract.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260710-1837-runner-selection-contract.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260710-1837-runner-selection-contract.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the single stacked runner-selection commit; no database, credential, network, deployment, or external state rollback exists.
- **Verification boundary**: Agent Runtime and Worker tests pin the exact edge/FastClaw registry, blocked selection matrix, public readback, unchanged dry-run-only execution, typecheck, answer-evidence, strict contract, review, and sprint verification.
- **Review/acceptance boundary**: `tasks/reviews/20260710-1837-runner-selection-contract.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260710-1837-runner-selection-contract.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260710-1837-runner-selection-contract.contract.md`, `tasks/reviews/20260710-1837-runner-selection-contract.review.md`, and `tasks/notes/20260710-1837-runner-selection-contract.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260710-1837-runner-selection-contract.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the single stacked runner-selection commit; no database, credential, network, deployment, or external state rollback exists.

## Captured Planning Output

# Approved Design Summary

## Building

Implement Sprint Row 1, `runner-selection-contract`, as a pure static registry
and selector owned by `@aiphabee/agent-runtime`, then make Worker `/agent/*`
routes consume that decision and expose runner-selection readback. The contract
names exactly two product execution families (`edge`, `fastclaw`), maps each to
one concrete registered runner ID, keeps `AgentRunMode` as the independent mode
axis, and fails closed before planning or execution for unknown families,
disabled runners, incompatible family/mode pairs, and supported-but-not-yet-
executable modes.

## Not Building

- No `AgentRunner.run()` dispatch, live model/tool execution, FastClaw adapter,
  sandbox backend, provisioning, persistence, billing, network, or credential
  path.
- No third execution enum and no `workflow` or `service` runner registration.
- No public route family beyond existing Worker `/agent/*` endpoints.
- No compatibility alias for old/unknown runner-family values and no silent
  fallback after an explicit invalid or unavailable request.
- No dynamic database/config registry; the two-entry registry is code-owned and
  versioned until a real operational need proves otherwise.

## Approach

Add `AGENT_RUNNER_FAMILIES`, one versioned two-entry registry, selection result
types, and `selectAgentRunner()` beside the existing Agent control-plane types in
`packages/agent-runtime/src/index.ts`. The default family is explicitly `edge`
only when the request omits the family. An explicit family always resolves or
fails; it never falls back. Worker validates the layer and mode, delegates family
selection to Agent Runtime, translates a blocked decision into the existing
fail-closed route error surface, and adds requested/selected family, concrete
runner ID, selection reason, owner, and contract version to successful route
readback.

The static registry has these initial semantics:

| Family | Concrete ID | Registered modes | Enabled |
|---|---|---|---|
| `edge` | `edge.worker-v0` | `dry_run`, `guarded_live` | yes |
| `fastclaw` | `fastclaw.personal-v0` | `runner_remote` | no |

`AGENT_EXECUTABLE_RUN_MODES` remains `dry_run`. Therefore `edge + dry_run`
selects successfully; `edge + guarded_live` remains `runner_required`;
`edge + runner_remote` is family/mode incompatible; `fastclaw + runner_remote`
is disabled; and `workflow`/`service` are invalid families. No decision here
enables dispatch.

## Architecture Map (P1)

```text
request body
  layer/mode validation (Worker, existing)
       |
       v
selectAgentRunner({ requestedFamily, mode })
  authority: @aiphabee/agent-runtime
  registry: edge.worker-v0 | fastclaw.personal-v0
       |
       +-- blocked -> AgentWorkerRouteInputError -> no planning/execution
       |
       v
route readback (Worker /agent/*)
  requested/selected layer + mode (existing)
  requested/selected family + runner ID + owner/version (new)
       |
       v
existing dry-run skeleton / no-model plan only
```

Authoritative implementation files are `packages/agent-runtime/src/index.ts`
and `apps/worker/src/index.ts`; tests in their sibling `index.test.ts` files are
the executable contract. Capability registry/source-map files report selection
implemented while preserving `runtime_dispatch_implemented=false` and
`live_model_execution_enabled=false`.

## Concrete Trace (P2)

For an omitted family and omitted mode, Worker defaults mode to `dry_run`, Agent
Runtime defaults family to `edge`, selects `edge.worker-v0`, and Worker returns
the existing dry-run result plus the runner readback. For explicit
`runner_family=fastclaw, run_mode=runner_remote`, runtime finds the registered
pair but returns `blocked_runner_disabled`; Worker returns the existing structured
route error before tool policy or planning. For `runner_family=workflow`, runtime
returns `blocked_invalid_runner_family`; nothing translates it into `edge`.

## Decision Rationale (P3)

- The registry belongs in Agent Runtime because that package already owns layer,
  mode, runner interface, route decisions, and capability readback.
- Worker remains the public adapter and does not define a second registry.
- Family and mode stay orthogonal; the selector checks compatibility but does not
  replace `AgentRunMode`.
- The current edge dry-run path receives a concrete execution ID for audit/readback
  without claiming `AgentRunner.run()` dispatch exists.
- A two-entry immutable array is sufficient at current and 10x scale; dynamic
  configuration would add invalidation, rollout, and split-authority risk before
  there is a real second live runner.

## Key Decisions

1. Exactly `edge | fastclaw`; explicit `workflow`, `service`, and unknown strings
   fail with `blocked_invalid_runner_family`.
2. Registry selection is pure and returns a discriminated result; it performs no
   model, tool, persistence, or network work.
3. Check order is registry existence -> family/mode compatibility -> enabled
   state -> globally executable mode. This makes each blocked reason stable and
   testable.
4. Missing family uses the documented `edge` default. Explicit invalid,
   incompatible, or disabled family requests never fall back.
5. `AgentRunner` gains the registered family/ID contract, but this row does not
   instantiate or dispatch a FastClaw runner.

## Most Fragile Assumption

This plan assumes the existing Worker dry-run path can be named
`edge.worker-v0` for selection/audit without implying that an `AgentRunner.run()`
implementation was invoked. If reviewers reject that semantic distinction, the
row must stop rather than fabricate an edge runner; the alternative is to expose
only a nullable selected ID until an actual runner exists, which would fail the
Sprint acceptance requiring concrete runner readback.

## File Changes

| File | Change |
|---|---|
| `packages/agent-runtime/src/index.ts` | Add family/registry/version/result types, pure selector, route reasons, capability readback, and registered family/ID on `AgentRunner` |
| `packages/agent-runtime/src/index.test.ts` | Pin exact registry and selection matrix, default behavior, no workflow/service, and unchanged no-dispatch capabilities |
| `apps/worker/src/index.ts` | Accept optional runner family, consume runtime selector, extend route readback, and fail closed on blocked selection |
| `apps/worker/src/index.test.ts` | Verify runtime capability payload, successful default/explicit readback, and invalid/disabled/incompatible/non-executable HTTP paths |
| `.ai/context/capabilities.json` | Mark runner selection implemented while keeping live dispatch false |
| `.ai/context/capability-source-map.json` | Bind FastClaw selection-only state to the targeted tests and command |
| `plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md` | Back-fill Row 1 plan/result only after verification |
| generated plan/contract/review/notes | Record scope, evidence, independent review, and rollback |

No dependency, package, service, schema, migration, deployment, or generated
runtime artifact is added.

## Verification

- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run typecheck`
- `npm run check:answer-evidence-contract`
- `repo-harness run check-context-files`
- `git diff --check`
- Contract assertions pin exactly two families and two concrete IDs; prove
  `workflow`/`service` invalid, FastClaw disabled, `edge + runner_remote`
  incompatible, `edge + guarded_live` still `runner_required`, and no capability
  claims live dispatch/model/tool execution.
- Waza `/check`, current-diff fingerprint, and independent Claude review before
  commit; a peer timeout or session limit is not a pass.

## Rollback and Failure Handling

The slice has no external state. Revert its single stacked commit to restore the
prior layer/mode-only route readback. Any ambiguity in selection precedence,
registry ownership, or existing route compatibility is a stop condition; do not
add aliases or Worker-side fallback logic.

## Explicitly Deferred Unknowns

- Enabling `fastclaw.personal-v0` and adding `runner_remote` to executable modes
  belongs to Sprint Row 7 after sandbox/provisioning contracts exist; Agent
  Runtime owner.
- Whether a future live edge implementation keeps `edge.worker-v0` or registers
  a new ID belongs to the first live edge-dispatch slice; Agent Runtime owner.
- Dynamic operational enable/disable configuration is deferred until a live
  runner proves the need; platform owner.

### Captured Task Breakdown

- [x] Project this approved plan into a code-change contract and isolated stacked worktree.
- [x] Add failing Agent Runtime tests for the exact registry and selection matrix.
- [x] Implement the Agent Runtime registry, selector, types, reasons, and capability readback.
- [x] Add failing Worker tests for successful readback and blocked HTTP selection paths.
- [x] Wire Worker request parsing/readback to the Agent Runtime selector without dispatch.
- [x] Update capability status/source-map truth without claiming live FastClaw execution.
- [x] Run targeted tests, typecheck, answer-evidence, context, strict contract, and sprint verification.
- [x] Run Waza `/check` plus independent Claude review and close every in-scope P1.
- [x] Commit one reviewable stacked branch and back-fill Sprint Row 1 evidence.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Project this approved plan into a code-change contract and isolated stacked worktree.
- [x] Add failing Agent Runtime tests for the exact registry and selection matrix.
- [x] Implement the Agent Runtime registry, selector, types, reasons, and capability readback.
- [x] Add failing Worker tests for successful readback and blocked HTTP selection paths.
- [x] Wire Worker request parsing/readback to the Agent Runtime selector without dispatch.
- [x] Update capability status/source-map truth without claiming live FastClaw execution.
- [x] Run targeted tests, typecheck, answer-evidence, context, strict contract, and sprint verification.
- [x] Run Waza `/check` plus independent Claude review and close every in-scope P1.
- [x] Commit one reviewable stacked branch and back-fill Sprint Row 1 evidence.
