# Plan: Edge Worker Generic Agent Runner

> **Status**: Approved
> **Approved**: user `go`, 2026-08-03
> **Created**: 20260803-0244
> **Slug**: edge-worker-generic-agent-runner
> **Planning Source**: repo-harness-plan
> **Orchestration Kind**: host-plan
> **Source Ref**: prd:plans/prds/20260710-1702-dual-agent-v3.prd.md#generic-edge
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Runner selection matrix, activation gate generalisation, checker literal interlock, generic runner fail-closed fixtures
> **Rollback Surface**: Single-commit revert; no live execution, provisioning, or persistent write
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260803-0244-edge-worker-generic-agent-runner.contract.md`
> **Task Review**: `tasks/reviews/20260803-0244-edge-worker-generic-agent-runner.review.md`
> **Implementation Notes**: `tasks/notes/20260803-0244-edge-worker-generic-agent-runner.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from repo-harness-plan planning output.
- Source ref: prd:plans/prds/20260710-1702-dual-agent-v3.prd.md#generic-edge
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260803-0244-edge-worker-generic-agent-runner.md`
- Sprint contract: `tasks/contracts/20260803-0244-edge-worker-generic-agent-runner.contract.md`
- Sprint review: `tasks/reviews/20260803-0244-edge-worker-generic-agent-runner.review.md`
- Implementation notes: `tasks/notes/20260803-0244-edge-worker-generic-agent-runner.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260803-0244-edge-worker-generic-agent-runner.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260803-0244-edge-worker-generic-agent-runner.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260803-0244-edge-worker-generic-agent-runner.md`.

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
- Contract file: `tasks/contracts/20260803-0244-edge-worker-generic-agent-runner.contract.md`
- Review file: `tasks/reviews/20260803-0244-edge-worker-generic-agent-runner.review.md`
- Implementation notes file: `tasks/notes/20260803-0244-edge-worker-generic-agent-runner.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260803-0244-edge-worker-generic-agent-runner.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan` and the owning worktree is written to `.ai/harness/active-worktree` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260803-0244-edge-worker-generic-agent-runner.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Single-commit revert; no live execution, provisioning, or persistent write
- **Verification boundary**: Runner selection matrix, activation gate generalisation, checker literal interlock, generic runner fail-closed fixtures
- **Review/acceptance boundary**: `tasks/reviews/20260803-0244-edge-worker-generic-agent-runner.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260803-0244-edge-worker-generic-agent-runner.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260803-0244-edge-worker-generic-agent-runner.contract.md`, `tasks/reviews/20260803-0244-edge-worker-generic-agent-runner.review.md`, and `tasks/notes/20260803-0244-edge-worker-generic-agent-runner.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260803-0244-edge-worker-generic-agent-runner.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Single-commit revert; no live execution, provisioning, or persistent write

## Captured Planning Output

## Decision

Give `edge.worker-v0` a real execution body by adding `runner_remote` to its
registry entry, and generalise the activation gate from a FastClaw-specific
`runner_id` check to a mode-based rule. `AGENT_EXECUTABLE_RUN_MODES` stays
exactly `["dry_run", "runner_remote"]`.

Approved by the product owner on 2026-08-03 after comparing three options:
adding `runner_remote` to edge, promoting `guarded_live` into the executable
set, or freezing generic at dry-run/plan-only.

## P1 · Map

Two orthogonal axes own an Agent request
(`plans/prds/20260710-1702-dual-agent-v3.prd.md:43`):

```
selected_layer         = generic | research
selected_runner_family = edge | fastclaw
```

Authorities in play:

- `packages/agent-runtime/src/index.ts` — the only run/event/tool authority.
  Owns `AGENT_RUNNER_REGISTRY` (:122), `AGENT_EXECUTABLE_RUN_MODES` (:118),
  `selectAgentRunner` (:3591), and the `AgentRunner` shape (:540).
- `packages/agent-runtime/src/fastclaw-agent-runner.ts` — the only concrete
  `AgentRunner` implementation today. `FastClawPersonalAgentRunner` (:227)
  hardcodes `layer = "research"` and `validateRequest` (:175) rejects any
  non-research request.
- `apps/worker/src/index.ts` — the only public `/agent/*` surface; consumes
  the selector and exposes `AgentWorkerRouteReadback` (:1301).
- `scripts/check-fastclaw-agent-runner-contract.mjs` — asserts registry and
  activation truth by literal source scanning (:43-54).
- `tasks/contracts/20260710-1837-runner-selection-contract.contract.md`
  (Fulfilled) — the Row 1 authority that created the registry.

Out of scope: tool policy, evidence lineage, budget accounting, billing,
sandbox lifecycle, and every FastClaw path. Those were built runner-agnostic
in the FastClaw sprint and are consumed as-is.

## P2 · Trace

Walk `generic + edge` through `selectAgentRunner` (index.ts:3591) today:

| Requested mode | Gate reached | Result |
|---|---|---|
| `dry_run` | passes all four gates | `selected` — but no runner object exists |
| `guarded_live` | in edge `supported_modes`, absent from `AGENT_EXECUTABLE_RUN_MODES` | `blocked("runner_required")` |
| `runner_remote` | not in edge `supported_modes` | `blocked("blocked_runner_mode_incompatible")` |

So generic's only selectable mode is `dry_run`, and `edge.worker-v0` resolves
to a registry string with no implementation: `grep -rn "edge.worker-v0"
--include="*.ts" packages apps` returns exactly one non-test hit, the
registration at index.ts:126.

The pressure point: the only executable path in the product is bound to
`FastClawPersonalAgentRunner`, which is research-only by construction. A paid
generic request has a contract, a tool policy, and a route readback, but
nothing that runs.

## P3 · Why the current shape exists, and what changes

`edge.worker-v0` being a bare name is deliberate, not an oversight. The Row 1
contract states it explicitly:

- Scope, out of scope: "No actual `AgentRunner.run()` dispatch"
- Stop Condition: "Stop if naming `edge.worker-v0` would be interpreted as
  claiming `AgentRunner.run()` dispatch rather than selection/audit identity."
- Stop Condition: "Stop if the implementation would require enabling
  `runner_remote` or live FastClaw execution in this row."

Row 1 was correct to fence that off — it was establishing selection semantics
before any dispatch existed. This plan consciously lifts that fence for the
`edge` family only, on the product decision recorded above. It does not
reopen or weaken the FastClaw side of those conditions.

The invariant that must survive: **flipping a registry entry is not
authorization.** The existing contract asserts
`activation.registry_flip_is_authorization !== false`
(`deploy/fastclaw/fastclaw-agent-runner.contract.json`, checked at
check-fastclaw-agent-runner-contract.mjs:28). Today that invariant is enforced
by a `runner_id`-specific gate:

```typescript
// packages/agent-runtime/src/index.ts:3625
if (registration.runner_id === "fastclaw.personal-v0" &&
    input.activatedRunnerId !== registration.runner_id) {
  return blocked("blocked_runner_activation_required");
}
```

Adding `runner_remote` to edge without touching this gate would let
`edge + runner_remote` reach `selected` with no activation proof at all — the
one mode that performs real remote execution, ungated. Generalising the gate
to "any selection resolving to `runner_remote` requires a matching
`activatedRunnerId`" preserves the invariant and covers both families.

### The interlock

The generalisation and the checker must land in one diff. Two of the four
literal assertions at check-fastclaw-agent-runner-contract.mjs:43-54 scan for
the FastClaw-specific gate text:

```js
!runtimeSource.includes('return blocked("blocked_runner_activation_required")') ||
!runtimeSource.includes('input.activatedRunnerId !== registration.runner_id')
```

Generalising the condition changes the second string, so the checker fails the
moment the gate is correct. Splitting this into two commits leaves a red
intermediate state. Same-diff or not at all.

The other two literals are safe under this plan: `AGENT_EXECUTABLE_RUN_MODES`
is untouched, and the multi-line fastclaw registry block is untouched. This is
precisely why `edge + runner_remote` was chosen over promoting `guarded_live`,
which would have broken the first literal.

### What fails first at 10x

The registry is a static two-entry array with a linear `find`. That holds well
past any realistic runner count. The real limit is the activation model: a
single `activatedRunnerId` scalar cannot express two runners activated at once
in the same process. If a third runner family ever ships, activation becomes a
set and `selectAgentRunner`'s signature changes. Not this plan's problem, but
the reason the gate should key on mode rather than accumulate `runner_id`
special cases.

## File Changes

| File | Action | Description |
|---|---|---|
| `packages/agent-runtime/src/index.ts` | Modify | Add `runner_remote` to the edge registry entry's `supported_modes` (:127); generalise the activation gate (:3625) to key on the resolved mode instead of `fastclaw.personal-v0` |
| `packages/agent-runtime/src/edge-worker-agent-runner.ts` | Create | `EdgeWorkerAgentRunner` with `layer = "generic"`, `family = "edge"`, `runner_id = "edge.worker-v0"`, `supported_modes = ["dry_run", "runner_remote"]`; mirrors the FastClaw runner's event/budget/post-check discipline |
| `packages/agent-runtime/src/edge-worker-agent-runner.test.ts` | Create | Fail-closed fixtures: research layer rejected, budget overrun, tool outside `allowed_tools`, cancellation, timeout, post-check denial, missing activation |
| `packages/agent-runtime/src/index.test.ts` | Modify | Selection matrix for `edge + runner_remote` with and without activation, and the unchanged fastclaw cases |
| `scripts/check-fastclaw-agent-runner-contract.mjs` | Modify | Update the two activation-gate literals to match the generalised condition; keep the executable-mode and fastclaw-registry literals byte-identical |
| `.ai/context/capabilities.json` | Modify | `agent_control_plane.invariants` gains a truthful generic-dispatch signal; `status` string reconciled |

Not touched: `apps/worker/src/**` (the readback already carries every field
this adds), the fastclaw registry entry, `AGENT_EXECUTABLE_RUN_MODES`,
`deploy/fastclaw/fastclaw-agent-runner.contract.json`, tool policy, and
evidence lineage.

## Reuse

`EdgeWorkerAgentRunner` consumes the runner-agnostic interfaces the FastClaw
sprint already froze — `FastClawToolPolicyExecutor`-shaped tool execution,
`FastClawFinalPostCheck`-shaped final authority, `AgentRunBudget` validation,
and the semantic progress/event sequence in `fastclaw-agent-runner.ts:238-525`.
If those interfaces need renaming out of the `FastClaw*` namespace to be shared
honestly, that rename is in scope; duplicating them under a second name is not.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Checker literal drift leaves a red intermediate state | High if split | Blocks all downstream work | Single diff; run `npm run check:fastclaw-agent-runner` first, before any other verification |
| Generalised gate accidentally loosens the FastClaw path | Low | Ungated real execution | Selection matrix test asserts fastclaw still requires activation, with the same blocked reason |
| Capability invariants overclaim | Medium | `check-durable-memory-artifact-handoff` and `check-research-agent-product-control` already fail on capability truth | Those two are a pre-existing baseline failure (verified against HEAD on 2026-08-03); do not let this plan's diff change their status either way without saying so |
| Reused interfaces keep FastClaw names and mislead | Medium | Future readers assume coupling | Rename inside this diff or document why not |

## Falsifier

The direction is wrong if generic already has an executable runner, or if
`edge.worker-v0` already dispatches. Cheapest proof, already run:
`grep -rn "edge.worker-v0" --include="*.ts" packages apps` yields one non-test
hit (the registration), and the only class implementing `AgentRunner` is
`FastClawPersonalAgentRunner`, gated to `layer === "research"` at
fastclaw-agent-runner.ts:175. The gap is real.

## Verification

```bash
npm run check:fastclaw-agent-runner
npx vitest run packages/agent-runtime/src
npm run typecheck
npm run check:task-sync
repo-harness run check-task-workflow --strict
git diff --check
```

Baseline note: `check-durable-memory-artifact-handoff` and
`check-research-agent-product-control` fail on HEAD before this plan
(both report "capability truth must distinguish ... from live dispatch").
They are not this plan's regressions and must not be silently absorbed.

## Rollback

Single-commit revert. No data, deployment, credential, or external-state
rollback exists — nothing in this plan performs live model execution,
provisioning, or persistent writes. `live_model_execution_enabled` stays
`false` throughout.

## Inspector Gap

`bun scripts/inspect-project-state.ts` is absent from this repo, so the
inspector could not classify state, and `.ai/harness/checks/latest.json` is
`{}`. Both are recorded here rather than assumed green; neither blocks this
plan's own verification, which runs the repo's real checkers directly.

## Annotations

Resolved during annotation:

- The Draft hold was the inspector gap alone. It is documented above and does
  not gate this plan, because every exit criterion below runs a concrete repo
  checker rather than reading inspector output.
- Approved by the user on 2026-08-03 (`go`), after the decision on generic
  execution semantics (`edge + runner_remote`) was taken in the same session.

## Task Breakdown
- [ ] Add `runner_remote` to the edge entry's `supported_modes` in `AGENT_RUNNER_REGISTRY` (`packages/agent-runtime/src/index.ts:127`); leave `AGENT_EXECUTABLE_RUN_MODES` and the fastclaw entry byte-identical
- [ ] Generalise the activation gate in `selectAgentRunner` (`packages/agent-runtime/src/index.ts:3625`) to key on the resolved `runner_remote` mode instead of `runner_id === "fastclaw.personal-v0"`
- [ ] Update the two activation-gate literals in `scripts/check-fastclaw-agent-runner-contract.mjs:43-54` to match the generalised condition, in the same diff; keep the executable-mode and fastclaw-registry literals unchanged
- [ ] Implement `EdgeWorkerAgentRunner` (`packages/agent-runtime/src/edge-worker-agent-runner.ts`) with `layer = "generic"`, reusing the runner-agnostic tool-policy, post-check, budget, and event discipline from `fastclaw-agent-runner.ts:238-525`
- [ ] Add fail-closed fixtures (`packages/agent-runtime/src/edge-worker-agent-runner.test.ts`): research layer rejected, budget overrun, tool outside `allowed_tools`, cancellation, timeout, post-check denial, missing activation
- [ ] Extend the selection matrix in `packages/agent-runtime/src/index.test.ts`: `edge + runner_remote` with and without activation, plus the unchanged fastclaw cases
- [ ] Reconcile `agent_control_plane` capability truth in `.ai/context/capabilities.json` without overclaiming; `live_model_execution_enabled` stays `false`
- [ ] Run the verification block and record results; confirm the two pre-existing baseline failures are unchanged
