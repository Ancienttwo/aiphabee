# Plan: FastClaw Agent Runner Adapter

> **Status**: Complete
> **Created**: 20260711-1308
> **Slug**: fastclaw-agent-runner-adapter
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#fastclaw-agent-runner-adapter
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Deterministic unit and Worker fixtures prove runner_remote selection, authentic frozen grant mint, exact active identity, callback-only tool policy, monotonic unique-terminal events, cancellation/error/budget/post-check semantics and non-leakage; full test/type/lint, contract, independent review and strict Sprint verification pass without a live-complete claim.
> **Rollback Surface**: Revert the single stacked Row-7 AiphaBee commit; no Cloudflare deploy/resource, FastClaw checkout mutation, database write/migration, secret, public route or live Agent run is created.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md`
> **Task Review**: `tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md`
> **Implementation Notes**: `tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#fastclaw-agent-runner-adapter
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md`
- Sprint contract: `tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md`
- Sprint review: `tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md`
- Implementation notes: `tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md`.

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
- Contract file: `tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md`
- Review file: `tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md`
- Implementation notes file: `tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the single stacked Row-7 AiphaBee commit; no Cloudflare deploy/resource, FastClaw checkout mutation, database write/migration, secret, public route or live Agent run is created.
- **Verification boundary**: Deterministic unit and Worker fixtures prove runner_remote selection, authentic frozen grant mint, exact active identity, callback-only tool policy, monotonic unique-terminal events, cancellation/error/budget/post-check semantics and non-leakage; full test/type/lint, contract, independent review and strict Sprint verification pass without a live-complete claim.
- **Review/acceptance boundary**: `tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260711-1308-fastclaw-agent-runner-adapter.contract.md`, `tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md`, and `tasks/notes/20260711-1308-fastclaw-agent-runner-adapter.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260711-1308-fastclaw-agent-runner-adapter.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the single stacked Row-7 AiphaBee commit; no Cloudflare deploy/resource, FastClaw checkout mutation, database write/migration, secret, public route or live Agent run is created.

## Captured Planning Output

## Approved Design Summary

Land Row 7 as one fail-closed Agent Runtime change: make `runner_remote` and the
registered `fastclaw.personal-v0` family selectable, but make actual execution
depend on a separately activated runner capability which owns the only private
sandbox-grant mint. The registry remains descriptive routing truth; it is not
authorization. A caller that only changes `enabled: true` can select the family
but cannot construct the frozen branded sandbox grant or execute the runner.

The concrete adapter stays behind the existing
`AgentRunner.run(request): AsyncIterable<AgentExecutionEvent>` contract. It
resolves the Row-6 PostgreSQL dedicated-profile and temporal-entitlement
authority before every run, mints a run-owned sandbox grant only after that
read, issues bounded sandbox authorization, delegates all tool calls through an
injected AiphaBee policy/execution boundary, and exposes a final answer only
after an injected AiphaBee post-check approves a replacement answer. FastClaw
transport progress, raw completion text, tool inputs/results, provider errors,
and private reasoning are never copied into public events.

This row implements the adapter and private composition boundary but does not
add a public HTTP run route or claim live FastClaw protocol compatibility. A
transport must provide the callback-based tool-policy contract to activate; the
current opaque OpenAI-compatible FastClaw SSE shape is not silently treated as
compliant. Credentialed protocol/readback and production enablement remain Row
10. This preserves the Sprint's authority-first rule instead of fabricating a
tool-policy interception path that FastClaw has not proved.

The user approved continued execution by saying `go on` after Row 6 completed.

## Not Building

- No public FastClaw endpoint, public Agent run route, UI, billing, durable
  memory/artifact handoff, Cloudflare deployment, database migration, secret,
  staging write, or live-complete claim.
- No direct execution of opaque FastClaw SSE as a production transport; no
  prompt instruction, regex, tool-name heuristic, or post-hoc transcript scan
  is accepted as tool-policy enforcement.
- No shared Agent identity, on-demand lifecycle activation, compatibility
  fallback, raw upstream ID in events, second Agent contract package, or new
  sandbox authority.
- No product tool is executed by FastClaw itself. Every compliant transport
  must surface a tool call to the adapter callback, which re-enters the
  AiphaBee policy/execution dependency. A transport that cannot do so cannot be
  activated.

## P1: Architecture Map

```text
Agent Runtime registry/selection (routing truth)
  runner_remote -> fastclaw.personal-v0
       |
       | does not authorize
       v
private runner activation (internal capability)
  -> Row-6 dedicated profile + temporal entitlement authority (PostgreSQL)
  -> private frozen SandboxBackendAccessGrant mint (run ownership)
  -> bounded sandbox authorization issuer
  -> compliant FastClaw transport
       progress -> fixed semantic phase only
       tool call -> AiphaBee policy/execution callback -> result
       raw final -> AiphaBee post-check -> approved replacement answer
  -> monotonic AgentExecutionEvent stream with exactly one terminal event
```

Authority and ownership:

1. `packages/agent-runtime/src/index.ts` remains the only layer/mode/event/
   runner-selection authority. It enables the registered family and makes
   `runner_remote` executable, but does not export the grant mint.
2. A new internal Agent Runtime activation module owns the unexported brands,
   runtime authenticity set, and frozen grant construction. The public package
   root re-exports only the grant type already required by SandboxBackend.
3. A focused FastClaw runner module owns request validation, cancellation/
   budget normalization, callback-based transport orchestration, semantic event
   translation and post-check gating. It introduces no second control plane.
4. Worker PostgreSQL authority reads the existing Row-6 profile plus the same
   live account/workspace/membership/subscription/product/entitlement clocks;
   protected FastClaw IDs stay inside the private runner dependency.
5. The Sandbox authorization issuer, tool policy/executor, post-check and
   transport are explicit dependencies. Absence or mismatch blocks activation;
   there is no fallback to direct FastClaw execution.

Expected scale is one authority read and one remote stream per run. At 10x the
first pressure point is concurrent long-lived streams and FastClaw latency, not
the activation object or registry. Load, Durable Object/Worker limits and cost
remain Row 10 evidence.

## P2: Concrete Trace

1. A private caller builds an `AgentExecutionRequest` with a non-empty prompt,
   `research`, `runner_remote`, stable tenant/user/request/run IDs, budget and
   optional `AbortSignal`.
2. Agent Runtime selects `fastclaw.personal-v0`. Selection succeeds because the
   mode is executable and the registration is enabled, but selection alone has
   no sandbox-grant constructor.
3. The activated runner emits hidden `run.requested` index 0, validates prompt,
   layer/mode, positive bounded wall clock/tokens/steps and the activation
   dependencies. Invalid input emits one user-visible `run.blocked` terminal
   event; no authority, token or remote call occurs.
4. The runner re-reads PostgreSQL authority for the exact tenant/user. Missing,
   non-active, mismatched or temporally unentitled profiles emit one stable
   blocked terminal code. Remote user/Agent IDs never enter the event payload.
5. The internal activation capability mints a deeply frozen grant bound to
   `owner={kind:'run', run_id}`, research/runner_remote, FastClaw runner, tenant
   and user. The sandbox issuer receives that grant and returns a bounded
   authorization; failure stops before transport.
6. The runner emits hidden `run.started` with only runner ID. A single combined
   signal covers caller cancellation and the wall-clock budget. The compliant
   transport receives protected remote identity, prompt, sandbox authorization,
   allowed tools, budget and callbacks.
7. Transport progress can only select a fixed semantic phase; the adapter emits
   no free-form upstream text. Every tool callback first verifies the name is in
   the request allowlist, then invokes AiphaBee policy/execution. Denial is
   returned to the transport as a structured denial and is recorded only as a
   fixed hidden phase; raw inputs/results are not public.
8. Transport final text is temporary untrusted material. The AiphaBee
   post-check receives it privately and must return either an approved
   replacement answer or a stable denial. Only the replacement answer may
   appear in `run.completed`.
9. Cancellation, wall-clock timeout, budget overrun, tool denial, transport
   error and post-check denial normalize to stable codes and exactly one
   `run.failed` or `run.blocked` terminal event. Error messages/raw output are
   discarded. Event indexes increase by one; no callback can emit after the
   terminal result.

Async boundaries are PostgreSQL authority read, sandbox authorization, remote
transport, per-tool AiphaBee callback, post-check and abort/timeout racing. The
runner owns semantic termination even when a transport resolves after abort.

## P3: Decision Rationale

- Enable selection and authorization atomically but keep them separate. The
  registry answers “which implementation”; the private activation capability
  answers “may this configured implementation mint compute authority.” Combining
  them would let a config flip become a privilege escalation.
- Extend `AgentExecutionRequest` with the actual prompt and optional abort
  signal. Hiding the prompt in `context_refs` or inventing a second request
  shape would weaken the existing runner contract and make cancellation
  impossible to prove.
- Require a callback-capable transport. The currently observed FastClaw SSE
  returns only assistant content and hides tool execution, so adapting it
  directly would violate the accepted “all tool calls re-enter AiphaBee
  policy” invariant. Fail closed until Row 10 verifies a compliant live
  transport/version.
- Treat raw completion as untrusted input and require post-check replacement,
  rather than using a regex/redaction pass or returning the original on
  post-check failure. This keeps semantic authority with AiphaBee.
- Reuse the Row-6 profile and entitlement tables without schema changes. The
  runner needs a live read, not another lifecycle state machine.
- Do not add a private HTTP route in this row. A route would need product auth,
  persistence, usage/billing and user/admin state owned by Rows 8-9; exposing it
  now would create an unowned execution surface.

Rollback is one stacked AiphaBee commit. Because the slice creates no resource,
secret, route, migration or remote state, reverting restores remote selection
to disabled and removes the private adapter.

## Public Contract Changes

- `AGENT_EXECUTABLE_RUN_MODES` becomes `['dry_run', 'runner_remote']` and the
  FastClaw registration becomes enabled/selectable.
- `AgentExecutionRequest` gains required `prompt: string` and optional
  `signal?: AbortSignal`; existing runners continue to receive the same object.
- `SandboxBackendAccessGrant` remains a public type but its brand/mint move to
  an unexported internal module. Grants and nested ownership are frozen.
- A package subpath exports the activated `fastclaw.personal-v0` runner factory
  and dependency contracts. It does not export constructors for activation or
  grants.
- Stable adapter codes distinguish invalid request, inactive/unentitled
  identity, cancellation, timeout, budget exceeded, tool denied, transport
  failure and post-check denial. Public failures contain code/retryability only.
- Worker exports a private composition factory and PostgreSQL authority reader;
  no HTTP route or feature flag is enabled.

## Expected File Surface

Product/tests:

- `packages/agent-runtime/src/index.ts`
- `packages/agent-runtime/src/index.test.ts`
- `packages/agent-runtime/src/sandbox-access-grant.ts` (new, internal)
- `packages/agent-runtime/src/fastclaw-agent-runner.ts` (new)
- `packages/agent-runtime/src/fastclaw-agent-runner.test.ts` (new)
- `packages/agent-runtime/src/fastclaw-sandbox-smoke.test.ts`
- `packages/agent-runtime/package.json`
- `apps/worker/src/fastclaw-agent-runner.ts` (new)
- `apps/worker/src/fastclaw-agent-runner.test.ts` (new)
- `apps/worker/src/research-agent-lifecycle.ts`
- `apps/worker/src/index.ts`
- `apps/worker/src/index.test.ts`
- `deploy/fastclaw/fastclaw-agent-runner.contract.json` (new)
- `scripts/check-fastclaw-agent-runner-contract.mjs` (new)
- `package.json`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- active Sprint plus Row-7 plan/contract/review/notes artifacts.

No dependency, database migration or deploy binding is added.

## Test Matrix

- Registry: edge modes stay intact; FastClaw runner_remote selects; invalid
  family/mode still blocks; a registry-shaped object or forged activation cannot
  mint a valid grant.
- Grant: exact run/tenant/user/layer/mode/family/runner ownership; deeply frozen;
  generic/guarded_live/mismatched identity cannot mint or issue authorization.
- Authority: active+temporally entitled exact identity executes; absent,
  disabled, deleted, expired entitlement and tenant/user mismatch stop before
  token/transport.
- Events: requested/started/terminal indexes are strictly monotonic; success,
  invalid input, authority denial, issuer error, tool denial, transport error,
  post-check denial, cancel, timeout and budget overrun each have one terminal.
- Leakage: progress is fixed enum only; remote IDs, sandbox token, tool
  inputs/results, transport error text, raw final and private reasoning are
  absent from all events; approved replacement answer is the only final text.
- Tool policy: an allowed call goes through the AiphaBee callback and returns its
  structured result privately; an unlisted/denied call never executes and ends
  fail-closed. A transport without the callback contract cannot activate.
- Cancellation/budget: pre-aborted signal makes no remote call; in-flight abort
  wins the race; wall-clock timeout and reported token/step overrun normalize to
  stable codes; a late remote resolution emits nothing.
- Worker authority: SQL uses exact profile identity and current entitlement;
  protected IDs are returned only to the private runner and never logged/events.
- Contract checker: package export, registry/mode truth, private mint posture,
  capability truth and no-public-route/no-live-claim posture remain aligned.
- Targeted tests, full `npm test`, typecheck, lint, contract check, capability
  JSON validation, exact diff fingerprint, independent review, strict contract
  and Sprint verification pass.

## Task Breakdown

- [x] Move grant branding/minting behind an internal activation capability and
      prove registry changes alone cannot mint or forge a grant.
- [x] Enable `runner_remote`/FastClaw selection and add prompt/cancellation to
      the existing execution request without changing AgentRunMode authority.
- [x] Implement and test the callback-capable FastClaw AgentRunner event,
      cancellation, budget, tool-policy, post-check and leakage semantics.
- [x] Integrate the runner with the Row-6 PostgreSQL profile/temporal authority
      through a private Worker composition factory; add no route.
- [x] Add machine-readable contract/capability truth and run targeted/full/
      type/lint checks.
- [x] Complete independent review, strict contract/Sprint verification, one
      Row-7 commit and Sprint backlog completion.

## Verification Boundary

Deterministic unit/Worker fixtures must prove selection, authentic frozen grant,
exact active identity, callback-only tools, monotonic/unique-terminal events,
cancel/error/budget/final semantics and non-leakage. A machine contract must
state that opaque live FastClaw SSE is not compliant and production activation
is unclaimed until Row 10 credentialed readback. Full tests/type/lint, exact diff
review, strict task contract and Sprint verification must pass.

## Rollback Surface

Revert the single stacked Row-7 AiphaBee commit. No Cloudflare deploy/resource,
FastClaw checkout mutation, database write/migration, secret, public route or
live Agent run is part of this slice.
