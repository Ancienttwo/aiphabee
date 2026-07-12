# Sprint: FastClaw Dedicated Agent Runner and Ephemeral Sandbox

> **Status**: Complete
> **Slug**: fastclaw-dedicated-agent-runner-sandbox
> **Created**: 2026-07-10 17:02 +0800
> **Updated**: 2026-07-11 14:21
> **Source PRD**: `plans/prds/20260710-1702-dual-agent-v3.prd.md`
> **Source Spec**: `docs/spec.md`
> **Goal Mode**: incremental

Program-level Sprint container. The Source PRD summary and ordered backlog
decompose product intent into execution rows. Every row is `contract` mode and
must be expanded with `$think` before code edits, then captured through the plan
→ contract → isolated-worktree flow. `tasks/todos.md` remains the deferred-goal
ledger and never carries this backlog.

## PRD

Full PRD: `plans/prds/20260710-1702-dual-agent-v3.prd.md` (Approved).

### Problem

- Agent Control Plane convergence established one run/event/tool authority, but
  no concrete FastClaw runner dispatch, dedicated identity lifecycle, or live
  ephemeral sandbox exists.
- The execution path must add personal state and custom compute without turning
  FastClaw into a capability layer, public API, rights authority, or permanent
  per-user sandbox.

### Users

- Entitled paid research users needing long, stateful, or custom-code work.
- Runtime/platform engineers implementing one strict runner and sandbox path.
- Support/compliance/admin operators owning lifecycle, audit, kill, and cost.

### Success Criteria

- One entitled user/tenant maps to at most one active durable personal Agent
  profile; provisioning is idempotent and has no shared fallback.
- Generic/Research policy remains independent of `edge|fastclaw` execution
  family and is enforced before runner/tool use.
- Every terminal path destroys ephemeral compute and records semantic/audit/
  usage state.
- Sandbox credentials and egress are job scoped and deny-by-default.
- Approved memory/artifacts live in AiphaBee-owned storage with tenant isolation.
- Credentialed live evidence measures isolation, latency, resources, cleanup,
  and cost before the feature can leave its off-by-default state.

### Acceptance Scenarios

- Paid standard-profile request → `generic + edge`, no FastClaw provisioning.
- Permitted personal custom-code request → `research + fastclaw`, same Tool
  Gateway and evidence authority.
- Generic request for Research-only tool → denied under either runner family.
- Concurrent provisioning → one active identity or retryable blocked state.
- Success/failure/cancel/timeout/kill → terminal semantic event plus destroy.
- Fixture pass without live credentials → row 10 remains blocked externally.

### Non-goals

- No trading, broker write, personalised recommendation, unrestricted network,
  public FastClaw API, permanent sandbox, second Agent contract package,
  Sandbank Cloud production integration, or boxlite adapter.
- No wholesale adoption of GPT pack cards, error codes, rights, RACI, or gates.

## Architecture Notes

### Capabilities Touched

- `agent_control_plane`: existing Agent layer/mode/request/event/runner/tool-policy
  authority and Worker route readback.
- `fastclaw_personal_runner`: planned dedicated identity, runner, sandbox,
  artifact/memory, entitlement, billing/admin, and live-evidence path.
- Existing account, usage, kill-switch, evidence, secret, Tool Registry, Data
  Access Gateway, object-storage, and audit surfaces must be reused rather than
  duplicated.

### Dependency Order

```text
1 runner selection authority
  -> 2 sandbox port
      -> 3 live backend adapter
          -> 4 scoped token and egress
              -> 5 terminal lifecycle
                  -> 7 FastClaw semantic runner

1 -> 6 dedicated identity -> 7
7 -> 8 durable memory/artifacts -> 9 product/operator surfaces -> 10 live gate
5 -------------------------------------------------------------> 10
```

Rows 2 and 6 may be implemented in separate worktrees after row 1 lands because
they touch different ownership seams. Rows 3–5 stay sequential around the
sandbox implementation. Rows 7–10 are sequential integration and release work.

### Risks

- P0: a second runner/layer/mode authority appears instead of extending Agent
  Runtime.
- P0: provisioning failure or race creates a shared or cross-tenant identity.
- P0: cancellation, timeout, Worker interruption, or kill leaves an orphan
  sandbox or billable resource.
- P0: sandbox obtains App DB, provider, broker, payment, or long-lived secrets,
  or can reach arbitrary egress.
- P1: raw process output/private reasoning leaks into public events or final
  answers.
- P1: fixture-only verification is mistaken for credentialed live acceptance.
- P1: Cloudflare SDK/image drift invalidates transport, lifecycle, or cost
  assumptions; pin and revalidate at row execution.

## Backlog

Ordered execution queue. Each row becomes one independently reviewable task
contract and must leave the repository in a usable fail-closed state if later
rows never land.

| # | Status | Task | Mode | Acceptance | Plan |
|---|---|---|---|---|---|
| 1 | [x] | runner-selection-contract | contract | `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts` passes with one Agent Runtime-owned registered runner-selection representation; product families are exactly edge and FastClaw; workflow and service are rejected as runner families; invalid/disabled/mode-incompatible selection fails before execution; Worker readback exposes requested/selected family, concrete runner ID, reason, and runtime owner without replacing `AgentRunMode` | `plans/plan-20260710-1837-runner-selection-contract.md` |
| 2 | [x] | sandbox-backend-port | contract | Targeted Agent Runtime tests pass for a provider-neutral create/execute-output/write/read/destroy/kill contract; Generic cannot acquire sandbox capability; egress default-deny, 180s soft timeout, 600s hard timeout, kill, and idempotent destroy invariants are representable; no new sandbox package is added without a proven second implementation | `plans/plan-20260710-2129-sandbox-backend-port.md` |
| 3 | [x] | cloudflare-sandbox-adapter-spike | contract | Pinned official SDK and container image build; fixture/integration tests cover create, isolated run/session ownership, output streaming, read/write, destroy, provider errors, and version drift; a private server-side lease table binds every operation to the grant tenant/user/owner and rejects unknown or cross-owner IDs without treating the ID as authorization; the adapter does not enable FastClaw or mint production grants; the current official transport/session contract is recorded; no live-complete claim is made without credentialed readback | `plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md` |
| 4 | [x] | scoped-tool-gateway-token-egress | contract | Security tests prove the sandbox receives no App DB, Netquity, broker, payment, provider, or other long-lived credentials; job token is tenant/run/tool scoped and expires; only approved Tool Gateway egress succeeds; arbitrary DNS/IP/URL and wrong/expired token fail closed before tool execution | `plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md` |
| 5 | [x] | sandbox-terminal-lifecycle | contract | Lifecycle matrix covers success, execution failure, client cancellation, stream interruption, soft timeout, hard timeout, tenant/global kill, and repeated cleanup; each path emits one terminal semantic state, invokes idempotent destroy, leaves no residual handle/files, and records actual rather than estimated execution usage | `plans/plan-20260711-0346-sandbox-terminal-lifecycle.md` |
| 6 | [x] | dedicated-agent-provisioning | contract | Persistence/upstream fixtures prove one active identity per tenant/user under concurrent provision; create/reconcile/retry/disable/re-enable/delete/expiry are idempotent and audited; partial upstream success reconciles before retry; absent entitlement and upstream failure return blocked/retryable states with no shared identity fallback | `plans/plan-20260711-1045-dedicated-agent-provisioning.md` |
| 7 | [x] | fastclaw-agent-runner-adapter | contract | Executable `runner_remote` selection, FastClaw enablement, the private frozen sandbox-access grant mint, and activation integration land atomically; merely flipping registry `enabled` cannot mint a grant; adapter tests pass through existing `AgentRunner.run(request): AsyncIterable<AgentExecutionEvent>`; event indexes are monotonic and terminal state is unique; cancellation/error/budget/final semantics match Agent Runtime; raw terminal output/private reasoning never becomes public progress or final answer; all tool calls re-enter AiphaBee policy | `plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md` |
| 8 | [x] | durable-memory-artifact-handoff | contract | Tests prove only explicitly approved memory/artifacts leave the sandbox; records include tenant/owner, run, hash, classification, size, retention, scan, provenance, and evidence; rejected/oversize/unsafe artifacts do not persist; cross-tenant reads fail; sandbox residual state is absent after handoff and destroy | `plans/plan-20260711-1402-durable-memory-artifact-handoff.md` |
| 9 | [x] | entitlement-billing-admin-user-status | contract | Account/usage/admin integration tests show entitlement gates availability but does not route every paid request to FastClaw; model/tool/sandbox/storage usage is attributable by run; user sees provisioning/ready/retryable/blocked/disabled state; authorised admin retry/disable/delete/audit and kill actions are idempotent and recorded | `plans/plan-20260711-1512-entitlement-billing-admin-user-status.md` |
| 10 | [x] | live-security-load-cost-release-evidence | contract | Credentialed acceptance runs 10 concurrent cross-tenant sandboxes and records cold start, first progress, duration, CPU/memory/disk, egress, Worker/DO/log usage, total per-run cost, terminal cleanup, and kill-switch readback; FastClaw is VPS-hosted and CF is sandbox-only; security/compliance and independent review approve the packet; without credentials or any required live field the row stays blocked and the feature remains off | `plans/plan-20260711-1552-live-security-load-cost-release-evidence.md` |

### Row 10 live status — 2026-07-12

- Architecture is corrected and deployed as intended: FastClaw is persistent on
  the VPS; only the Sandbox Bridge, ephemeral Sandbox and authoritative scanner
  run on Cloudflare. The superseded Cloudflare-hosted FastClaw Worker, Container
  application and registry images have been deleted.
- VPS ingress, callback-before-execution, shared staging PostgreSQL migrations,
  scanner startup/ClamAV readback and exact cleanup paths have live evidence.
- The credentialed application gate now passes 10 distinct tenants/users/Agents
  and 10 simultaneously active Sandboxes. All ten callback-before-execution
  runs completed in one 31-second overlap window; cross-tenant probes, scanner,
  one kill-switch path, PG/R2 handoff, destroy and zero-row cleanup passed.
- Container, Durable Object, Worker, logs, R2 and Billing provider reads joined
  all ten runs. Complete raw list cost is `$0.029066052431813046` total and
  `$0.0029066052431813046/run` average. The account-period contracted cost is
  `$3.8600075`; it is not allocated to these runs, so invoice allocation stays
  null.
- Fresh independent FastClaw security and packet compliance reviews both pass.
  Row 10 and the Sprint are complete. Production/public dispatch, paid-plan
  auto-routing and feature enablement remain explicitly off and out of scope.

## Promotion Gates

- Rows 1–9 require their task contract, targeted/full regression commands,
  independent review, and strict repo-harness verification before completion.
- Row 10 additionally requires credentialed live evidence and external acceptance.
  Fixture-only success cannot be overridden into a live pass.
- The user approved the programme backlog on 2026-07-10. Row execution still
  requires `$think`, a task contract, isolated implementation, independent
  review, and strict verification; approval alone enables no runtime behavior.

## Execution Log

Keep this section last; `repo-harness run sprint-backlog complete-task` appends
rows here.

| When | Task | Plan | Result |
|---|---|---|---|
| 2026-07-10 19:06 | runner-selection-contract | `plans/plan-20260710-1837-runner-selection-contract.md` | done |
| 2026-07-10 22:19 | sandbox-backend-port | `plans/plan-20260710-2129-sandbox-backend-port.md` | done |
| 2026-07-11 00:57 | cloudflare-sandbox-adapter-spike | `plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md` | done |
| 2026-07-11 03:02 | scoped-tool-gateway-token-egress | `plans/plan-20260711-0147-scoped-tool-gateway-token-egress.md` | done |
| 2026-07-11 04:21 | sandbox-terminal-lifecycle | `plans/plan-20260711-0346-sandbox-terminal-lifecycle.md` | done |
| 2026-07-11 11:09 | dedicated-agent-provisioning | `plans/plan-20260711-1045-dedicated-agent-provisioning.md` | done |
| 2026-07-11 13:38 | fastclaw-agent-runner-adapter | `plans/plan-20260711-1308-fastclaw-agent-runner-adapter.md` | done |
| 2026-07-11 14:21 | durable-memory-artifact-handoff | `plans/plan-20260711-1402-durable-memory-artifact-handoff.md` | done |
