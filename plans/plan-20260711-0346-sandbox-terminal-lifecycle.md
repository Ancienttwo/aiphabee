# Plan: Sandbox Terminal Lifecycle

> **Status**: Complete
> **Created**: 20260711-0346
> **Slug**: sandbox-terminal-lifecycle
> **Planning Source**: waza-think
> **Source Ref**: sprint:plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md#sandbox-terminal-lifecycle
> **Verification Boundary**: One terminal record for success, execution failure, client cancellation, stream interruption, soft timeout, hard timeout, tenant/global kill and kill switch; idempotent destroy; inaccessible residual files/handles; observed rather than estimated usage; strict review and Sprint verification.
> **Rollback Surface**: Revert the single Row-5 stacked commit; no deploy, database write, migration, secret value or live resource is created.
> **Spec**: `docs/spec.md`
> **Task Contract**: `tasks/contracts/20260711-0346-sandbox-terminal-lifecycle.contract.md`
> **Task Review**: `tasks/reviews/20260711-0346-sandbox-terminal-lifecycle.review.md`
> **Implementation Notes**: `tasks/notes/20260711-0346-sandbox-terminal-lifecycle.notes.md`

## Approved Design Summary

Add one provider-neutral terminal lifecycle orchestrator inside the existing
Agent Runtime authority. It owns create, execute consumption, stop arbitration,
kill, destroy and one terminal-record callback. It does not translate to public
Agent events, persist billing rows, register a backend, activate FastClaw or
invent provider resource data. Usage records contain only observed wall-clock,
output-byte/event and exit-code facts; CPU, memory, disk, egress and cost remain
Row-10 live measurements.

The user approved this next slice by saying `go on` after Row 4 named Row 5 as
the concrete next bottleneck.

## Not Building

- No Worker route, public API, FastClaw dispatch, backend registration, grant or
  Tool Gateway token mint.
- No database/audit/usage-ledger implementation. The orchestrator requires one
  terminal-record callback so Row 7/9 can supply the existing authorities.
- No estimated credits, price, CPU, memory, disk, network or billable usage.
- No automatic artifact promotion, workspace sync or durable memory.
- No compatibility event shape, retry parser or second lifecycle framework.

## P1: Architecture Map

```text
future AgentRunner (Row 7, disabled)
  -> runSandboxTerminalLifecycle (Agent Runtime authority)
       -> SandboxBackend.create
       -> SandboxBackend.execute stream
       -> AbortSignal / soft-hard timeout / tenant-global kill arbitration
       -> SandboxBackend.kill when required
       -> SandboxBackend.destroy exactly once for the lifecycle
       -> recordTerminal(record with observed usage)
            |
            v
       future audit/usage sink (Rows 7/9; not wired here)

CloudflareSandboxBackend remains a thin provider implementation.
```

Authoritative components:

1. Agent Runtime owns terminal policy, kill reasons, lifecycle record and
   observed-usage shape.
2. `SandboxBackend` owns provider operations and idempotent destroy semantics.
3. Cloudflare adapter remains the sole concrete backend and reuses the Agent
   Runtime termination-grace constant.
4. Future AgentRunner/audit/usage integrations remain off and out of scope.

This slice touches more than eight files only because code, tests, capability
truth, Sprint truth and mandatory workflow artifacts must move together. It
adds no dependency, service, route, database surface or config variable.

## P2: Concrete Trace

1. A future trusted caller supplies the branded sandbox access grant, run ID,
   argv, fixed egress access, optional `AbortSignal` control reason and a
   required terminal-record callback.
2. The orchestrator rejects malformed run/control input and any run ID that
   does not match the run-owned branded grant before provider work.
   A pre-aborted request records one cancellation terminal without creating
   compute.
3. Create is bounded to 30 seconds. Control during create waits only through
   that deadline, destroys a created lease, and keeps cleanup unconfirmed when
   no lease can be recovered. The adapter retains a pending tombstone and
   reconciles a late provider success with a second destroy before removal.
4. After create, it consumes the untrusted execution stream and counts UTF-8
   stdout/stderr bytes and output events without retaining output content.
5. The first authoritative terminal cause wins: exit, backend failure, stream
   interruption, external control, soft timeout or hard timeout. Soft timeout
   requests graceful kill; hard timeout, cancellation and kill controls force
   the cleanup path. Kill promises are bounded by termination grace.
6. The lifecycle calls provider destroy once. `destroyed` and
   `already_destroyed` are terminal cleanup success; failure/timeout is recorded
   explicitly and never fabricated as clean.
7. After destroy, it bounded-waits both producer `closed` and the execution
   consumer before freezing usage. A non-quiescent producer/consumer keeps
   `execution_closed=false` and `release_safe=false`.
8. After cleanup, exactly one callback receives a terminal record containing
   the cause, cleanup status and observed durations/bytes/events/exit code with
   `estimated=false`. Callback failure is explicit after cleanup; there is no
   local fallback recorder.
9. Repeated cleanup is verified by calling the backend's existing idempotent
   destroy again: no second provider destroy and no authorized file/handle read.

Async/error boundaries: execute iteration, kill, destroy and terminal record are
Promises. Timer/listener resources are always released. A detached execution
iterator is closed best-effort after the terminal decision, while destroy is the
provider authority for residual compute.

## P3: Decision Rationale

- Put orchestration in Agent Runtime, not the Cloudflare adapter, so runner
  semantics do not become provider authority.
- Use standard `AbortSignal`, `Promise.race`, timers and `TextEncoder`; no new
  dependency or scheduler wrapper is justified.
- Add one focused source file because the concurrent state machine would make
  the already-large `index.ts` harder to review. Export it from the existing
  package root rather than adding a package or extension framework.
- Require a record callback instead of writing a new audit store. This protects
  the cross-module invariant while leaving persistence to existing Row-9
  authorities.
- Centralize the existing 15-second provider termination grace in Agent Runtime
  and bump the sandbox port contract. The adapter and orchestrator must not
  diverge on how long kill/destroy confirmation may block.
- Keep cleanup outcome separate from terminal cause. A destroy failure cannot
  erase the execution cause, and it cannot claim release-safe cleanup.

At 10x, provider/container quotas and the future durable terminal sink fail
before this local state machine. Rollback is one code commit with no state
migration. The most fragile assumption is that `SandboxBackend.kill` and
`destroy` respect the declared termination grace; the Cloudflare adapter
enforces it, while lifecycle timeouts record unconfirmed cleanup fail-closed.

## Public Contract Changes

- Sandbox backend contract v2 adds create timeout, shared termination grace and
  an execution-handle `closed` completion invariant.
- Kill reasons add `tenant_kill`, `global_kill` and `stream_interrupted` without
  changing existing meanings.
- Agent Runtime exports the terminal lifecycle input/result/record and observed
  usage types plus `runSandboxTerminalLifecycle()`.
- Runtime capability readback says lifecycle/observed-usage contract implemented
  while terminal persistence, backend registration, runner dispatch and live
  execution remain false.

## Expected File Surface

Product/test files:

- `packages/agent-runtime/src/index.ts`
- `packages/agent-runtime/src/index.test.ts`
- `packages/agent-runtime/src/sandbox-terminal-lifecycle.ts` (new focused state machine)
- `packages/agent-runtime/src/sandbox-terminal-lifecycle.test.ts` (new matrix)
- `apps/sandbox-bridge/src/cloudflare-sandbox-backend.ts`
- `apps/sandbox-bridge/src/cloudflare-sandbox-backend.test.ts`
- `.ai/context/capabilities.json`
- `.ai/context/capability-source-map.json`
- active Sprint and Row-5 workflow artifacts.

Dependencies: none added. The implementation uses language/runtime standards and
the already-existing Agent Runtime/Cloudflare adapter boundary.

## Test Matrix

- Success and non-zero exit.
- Typed execution failure and stream rejection/end-without-terminal.
- Client cancellation while running.
- Tenant kill, global kill and kill switch.
- Soft timeout with confirmed graceful kill.
- Soft kill failure followed by hard-timeout escalation.
- Provider-emitted hard timeout.
- Destroy failure/timeout remains non-release-safe and is not rewritten clean.
- Terminal recorder failure occurs after cleanup and is not retried locally.
- Exactly one terminal callback, monotonic non-negative observed durations,
  exact UTF-8 output bytes/events and no output content in the record.
- Cloudflare adapter integration proves one provider destroy, destroyed registry
  state, inaccessible files/handles and repeated destroy without a second
  provider call.
- Full regression, typecheck, lint, capability JSON, bridge dry-run, exact diff
  review/fingerprint, strict contract and Sprint verification.

## Dependency, Rollback and Live Boundary

- Dependency failure: kill/destroy/record failures remain explicit; no clean or
  recorded state is synthesized.
- Scale explosion: no global registry or in-memory cross-run coordinator is
  introduced; each run owns its own local timer/listener state.
- Rollback: revert Row 5; no external state cleanup is needed.
- Local evidence proves lifecycle semantics and observed local usage only.
  Credentialed residual-resource and CPU/memory/disk/network/cost evidence stays
  Row 10.

## Task Breakdown

- [x] Capture the approved Row-5 plan/contract in a stacked isolated worktree.
- [x] Add the failing lifecycle matrix and Cloudflare adapter integration tests.
- [x] Implement the provider-neutral lifecycle orchestrator and port v2 grace/kill contract.
- [x] Record observed usage and one terminal callback without adding persistence or estimates.
- [x] Update capability truth while keeping registration, dispatch and live execution off.
- [x] Run targeted/full/type/lint/dry-run/strict verification and Deep review.
- [x] Backfill Sprint row 5, bind the final fingerprint and commit one stacked slice.

## Unknowns

- Provider CPU, memory, disk, egress, log and billable usage are unavailable on
  the current process port and are explicitly owned by Row 10 live evidence.
- Durable terminal/audit/usage sink implementation is owned by Rows 7/9. Row 5
  requires the callback contract and proves one call, but does not invent a DB.
