# Plan: Sandbox Backend Port Contract

> **Status**: Complete
> **Created**: 20260710-2129
> **Slug**: sandbox-backend-port
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#sandbox-backend-port
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Agent Runtime tests pin provider-neutral sandbox create/execute/file/kill/destroy contracts, Generic denial, default-deny egress, 180s/600s timeouts, no adapter/dispatch/live state, strict contract, review, and Sprint verification.
> **Rollback Surface**: Revert the single stacked contract commit; no sandbox, provider, data, credential, or deployment state exists.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260710-2129-sandbox-backend-port.contract.md`
> **Task Review**: `tasks/reviews/20260710-2129-sandbox-backend-port.review.md`
> **Implementation Notes**: `tasks/notes/20260710-2129-sandbox-backend-port.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#sandbox-backend-port
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260710-2129-sandbox-backend-port.md`
- Sprint contract: `tasks/contracts/20260710-2129-sandbox-backend-port.contract.md`
- Sprint review: `tasks/reviews/20260710-2129-sandbox-backend-port.review.md`
- Implementation notes: `tasks/notes/20260710-2129-sandbox-backend-port.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260710-2129-sandbox-backend-port.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260710-2129-sandbox-backend-port.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260710-2129-sandbox-backend-port.md`.

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
- Contract file: `tasks/contracts/20260710-2129-sandbox-backend-port.contract.md`
- Review file: `tasks/reviews/20260710-2129-sandbox-backend-port.review.md`
- Implementation notes file: `tasks/notes/20260710-2129-sandbox-backend-port.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260710-2129-sandbox-backend-port.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260710-2129-sandbox-backend-port.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the single stacked contract commit; no sandbox, provider, data, credential, or deployment state exists.
- **Verification boundary**: Agent Runtime tests pin provider-neutral sandbox create/execute/file/kill/destroy contracts, Generic denial, default-deny egress, 180s/600s timeouts, no adapter/dispatch/live state, strict contract, review, and Sprint verification.
- **Review/acceptance boundary**: `tasks/reviews/20260710-2129-sandbox-backend-port.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260710-2129-sandbox-backend-port.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260710-2129-sandbox-backend-port.contract.md`, `tasks/reviews/20260710-2129-sandbox-backend-port.review.md`, and `tasks/notes/20260710-2129-sandbox-backend-port.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260710-2129-sandbox-backend-port.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the single stacked contract commit; no sandbox, provider, data, credential, or deployment state exists.

## Captured Planning Output

# Sandbox Backend Port Contract

## Approved Design Summary

Build one provider-neutral `SandboxBackend` contract inside the existing
`@aiphabee/agent-runtime` authority. The contract makes create, streamed raw
execution output, bounded workspace file read/write, kill, and idempotent
destroy representable while fixing the policy invariants at default-deny
egress, 180-second soft timeout, and 600-second hard timeout. Access composes the
authoritative runner selector, and create requires its nominal grant. No grant
mint exists in this row: FastClaw is disabled and `runner_remote` is not yet an
executable selector mode. Row 7 must activate selector/dispatch semantics and
the private grant mint atomically; merely flipping `enabled` is insufficient.
No backend is registered or invoked in this row.

This plan is approved by the user's `go on` instruction for the next ordered
Sprint row. It executes as a stacked, independently reviewable contract slice
from commit `2be96ce982e4b665c2490f1ef86f473367303f9c`.

## Building

- Versioned Agent Runtime constants for the sandbox port and mandatory policy.
- One `SandboxBackend` interface with exactly `create`, `execute`, `writeFile`,
  `readFile`, `kill`, and `destroy`.
- Provider-neutral lease, execution-event, file, kill, and destroy contracts.
- A pure `evaluateSandboxBackendAccess()` guard that first rejects Generic, then
  delegates runner admission to `selectAgentRunner()` and exposes blocked-only
  decisions until the later runner activation row.
- Agent Runtime capability readback showing the port ready while adapter,
  registration, dispatch, and live execution remain false.
- Focused tests and capability metadata proving the contract and its negative
  boundaries.

## Not Building

- No Cloudflare SDK, container image, provider adapter, sandbox instance, Worker
  binding, network call, persistence, token, credential, database, deployment,
  or billing change.
- No terminal-path lifecycle orchestrator; row 5 owns success/failure/cancel/
  timeout/kill cleanup sequencing and audit evidence.
- No FastClaw `AgentRunner` adapter or raw-output-to-semantic-event mapping; row
  7 owns that translation.
- No arbitrary egress allowlist, URL, environment-variable, shell-string, or
  compatibility alias surface.
- No new package or dependency. `packages/sandbox-runtime` and a sandbank layer
  remain absent.

## P1 - Architecture Map

```text
future FastClaw AgentRunner (Agent Runtime authority)
        |
        v
evaluateSandboxBackendAccess(layer, mode, requestedFamily)
  generic/*              -> blocked_layer_not_allowed
  research/edge dry_run  -> blocked_runner_family_not_allowed
  research/fastclaw      -> blocked_runner_selection (disabled/non-executable)
  row 7 activation       -> selector + private frozen-grant mint, atomically
        |
        v
SandboxBackend port (contract only in this row)
  create(opaque access grant) -> lease; backend reads fixed policy constant
  execute(argv)               -> untrusted output/exit events
  writeFile/readFile          -> sandbox-workspace bytes
  kill(reason)                -> killed/already_terminal
  destroy()                   -> destroyed/already_destroyed
        |
        v
provider adapter (absent until Sprint row 3)
```

Real components:

- `packages/agent-runtime/src/index.ts` owns AgentRunner, runner registry,
  routing vocabulary, policy contracts, and the new sandbox port.
- `packages/agent-runtime/src/index.test.ts` is the executable contract surface.
- `.ai/context/capabilities.json` and
  `.ai/context/capability-source-map.json` report implementation truth.
- `apps/worker` is explicitly out of scope because there is no adapter or
  public sandbox route in this row.

Scale signal: Agent Runtime's current index is a large central authority. The
smallest coherent change keeps this one port beside `AgentRunner` rather than
creating a new package or dependency. The four product files are joined by the
required plan/contract/notes/review artifacts and Sprint backfill, so the total
review surface is nine paths even though runtime behavior changes in none.

## P2 - Concrete Trace

The first authoritative negative trace is
`{ layer: "generic", runnerFamily: "fastclaw" }` into
`evaluateSandboxBackendAccess()`. It returns a blocked decision with no backend
handle and no fallback to Research. The second negative trace is
`research + edge`, which consumes a successful edge selection and returns
runner-family blocked. `research + fastclaw + runner_remote` consumes the
authoritative selector's disabled result and remains blocked; no raw family
input can override the registry.

For the compile-time future path, `SandboxCreateInput` requires an opaque,
readonly FastClaw access grant that binds tenant, user, and a run/session owner;
callers cannot override the fixed policy. This row intentionally exposes no
runtime mint because selector/dispatch activation belongs to row 7. The
conformance fixture preserves a supplied grant on its lease, streams untrusted
output or an explicit abnormal terminal event, validates branded
workspace-relative paths, returns explicit file failures, supports kill, and
returns `destroyed` followed by `already_destroyed` on repeated cleanup. There
is no async provider or network boundary in production in this row.

## P3 - Design Decision

The provider seam belongs below `AgentRunner` but inside Agent Runtime because
FastClaw is a runner implementation, not an authority. The port is necessary to
keep the approved Cloudflare adapter from leaking provider types upward; a new
package, registry, factory, or generic adapter framework is not necessary with
one backend.

Core invariants:

1. Layer policy is checked before port access and runner admission is delegated
   to `selectAgentRunner()`; FastClaw never upgrades Generic permission or
   bypasses registry enablement.
2. `SandboxCreateInput` requires the opaque readonly grant, which represents an
   atomic tenant/user/run-or-session binding. Its private mint is deliberately
   absent until row 7 can create it only after executable runner selection.
3. Execution accepts argv, not a shell command string, and marks every process
   chunk untrusted; semantic/final output remains Agent Runtime-owned.
4. Egress v0 is deny-only with no arbitrary URL or incomplete target surface.
   Row 4 must version the policy with a discriminated Tool Gateway branch that
   atomically requires its opaque scoped grant, scope, and expiry.
5. Kill and repeated destroy have explicit terminal result unions; row 5 later
   supplies sequencing, retries, and observable cleanup evidence.
6. Capability readback says `port_ready=true` but adapter/registration/dispatch/
   live execution are all false.
7. Port operations carry a lease ID because provider implementations own the
   lease table. Row 3 must bind every ID to the grant identity server-side and
   reject unknown or cross-owner IDs on every operation; the ID is never itself
   authorization.

At 10x load, this contract adds no runtime bottleneck. The first failure surface
will be provider lifecycle/concurrency in row 3, not the static port. If a real
second backend appears, the same interface supports it; only then is file or
package extraction justified.

## Public Contract

Add these versioned constants beside the current Agent runner contract:

- `SANDBOX_BACKEND_CONTRACT_VERSION = "2026-07-10.sandbox-backend-port.v0"`
- `SANDBOX_SOFT_TIMEOUT_MS = 180_000`
- `SANDBOX_HARD_TIMEOUT_MS = 600_000`
- `SANDBOX_BACKEND_POLICY`, fixing:
  - `egress.default_action = "deny"`
  - `egress.direct_internet_access = false`
  - `egress.allowed_target_kinds = []`
  - exact soft and hard timeout values
- `SANDBOX_BACKEND_REQUIRED_CAPABILITIES`, fixing streamed execution output,
  workspace read/write, kill, and idempotent destroy to true.

Add provider-neutral types:

- `SandboxBackendAccessDecision`
- `SandboxBackendAccessGrant`, `SandboxCreateInput`, `SandboxOwnership`,
  `SandboxLease`
- `SandboxExecuteInput`, `SandboxExecutionEvent`
- `SandboxBackendFailure`, `SandboxWorkspacePath`, and its validator
- `SandboxWriteFileInput`, `SandboxWriteReceipt`
- `SandboxReadFileInput`, `SandboxReadResult`
- `SandboxKillInput`, `SandboxKillResult`
- `SandboxDestroyInput`, `SandboxDestroyResult`
- `SandboxBackend`

`SandboxExecuteInput.argv` is a non-empty readonly tuple. Cancellation crosses
the provider-neutral port through `kill()`; provider adapters may keep their
runtime-specific abort primitive private. Output events use monotonic-capable sequence fields and the exact
classification `untrusted_process_output`; an exit event carries `exit_code`
and `terminal: true`. This row does not promise uniqueness or ordering at
runtime; row 5 owns lifecycle enforcement.

## File Changes

| File | Change |
|---|---|
| `packages/agent-runtime/src/index.ts` | Add the port constants, types, access guard, and capability readback; no implementation |
| `packages/agent-runtime/src/index.test.ts` | Pin policy values, negative access decisions, full fixture method surface, raw-output classification, kill, repeated destroy, and type-level Generic denial |
| `.ai/context/capabilities.json` | Mark sandbox port implemented while adapter/dispatch/live state remain false |
| `.ai/context/capability-source-map.json` | Map the port to Agent Runtime source/tests and targeted acceptance command |
| `plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md` | Backfill row 2 plan/result only after verification |
| generated plan/contract/notes/review | Record scope, evidence, review, and rollback |

No manifest, lockfile, package, schema, migration, Worker, deploy, or generated
runtime artifact changes.

## Test-First Matrix

1. Capability readback exposes exact contract version, frozen default policy, required methods,
   and all four false implementation/live flags.
2. `generic + fastclaw` and `generic + edge` return
   `blocked_layer_not_allowed`.
3. `research + edge` returns `blocked_runner_family_not_allowed`.
4. `research + fastclaw + runner_remote` remains blocked by the authoritative
   disabled-runner selection; no current allowed grant is fabricated.
5. A type-level `@ts-expect-error` rejects create input without an access grant.
6. The create contract requires an opaque access grant and represents run and
   session ownership without a runtime grant mint while FastClaw is disabled and
   `runner_remote` remains non-executable.
7. Fixture `execute` covers stdout, stderr, normal exit, and explicit hard-timeout failure.
8. Workspace validation rejects absolute/traversal/empty/NUL/backslash paths;
   missing reads return `file_not_found`, never empty-byte success.
9. Fixture kill covers soft timeout, kill-switch, and already-terminal results.
10. Repeated destroy represents `destroyed` then `already_destroyed`.
11. Contract commands prove no `packages/sandbox-runtime` or manifest/lockfile
    dependency change was added.

## Verification

- `npx vitest run packages/agent-runtime/src/index.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run check:answer-evidence-contract`
- `repo-harness run check-context-files`
- capability JSON assertions for port true and adapter/dispatch false
- `test ! -d packages/sandbox-runtime`
- `git diff --check`
- Waza `/check`, architecture/security specialist review, current-diff
  fingerprint, Claude cross-model review, strict contract, and Sprint
  verification before commit

No API key, token, provider account, MCP server, external API, or third-party CLI
is required for this contract-only row.

## Most Fragile Assumption

This plan assumes `SandboxBackend` can remain a sealed contract beside
`AgentRunner` without a concrete implementation until row 3 and without a grant
mint until row 7. Row 3 may prove provider mechanics but must not enable access;
row 7 must add executable selection, the private frozen-grant mint, and an
activation integration test together. If the port cannot express the adapter
without provider leakage, revise the port rather than add a second authority.

## Rejected Alternatives

- New `packages/sandbox-runtime`: rejected because one implementation does not
  justify another package/authority boundary.
- sandbank unified SDK: rejected because it duplicates the seam and adds an
  immature dependency on a compliance-critical path.
- Provider-shaped interface mirroring Cloudflare methods: rejected because it
  would make the approved backend an architectural authority.
- Raw-family access guard: rejected after review because it could authorize a
  disabled runner; the guard now composes authoritative runner selection and
  create requires its grant.

## Rollback

Revert the single stacked row-2 commit. The slice creates no sandbox, network,
data, credential, deployment, or provider state.

### Captured Task Breakdown

- [x] Capture this approved design into a code-change plan and contract on a stacked branch.
- [x] Add failing Agent Runtime tests for policy constants, access decisions, port methods, and negative type contracts.
- [x] Implement the minimal provider-neutral port and capability readback in Agent Runtime.
- [x] Update capability truth without claiming an adapter, dispatch, or live execution.
- [x] Run targeted, typecheck, lint, full regression, answer-evidence, context, and strict contract gates.
- [x] Run Waza deep review plus architecture/security specialists and Claude cross-model review; close every in-scope finding.
- [x] Backfill Sprint row 2, verify the final fingerprint, and commit one stacked reviewable slice.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Capture this approved design into a code-change plan and contract on a stacked branch.
- [x] Add failing Agent Runtime tests for policy constants, access decisions, port methods, and negative type contracts.
- [x] Implement the minimal provider-neutral port and capability readback in Agent Runtime.
- [x] Update capability truth without claiming an adapter, dispatch, or live execution.
- [x] Run targeted, typecheck, lint, full regression, answer-evidence, context, and strict contract gates.
- [x] Run Waza deep review plus architecture/security specialists and Claude cross-model review; close every in-scope finding.
- [x] Backfill Sprint row 2, verify the final fingerprint, and commit one stacked reviewable slice.
