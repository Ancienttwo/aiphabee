# Implementation Notes: sandbox-terminal-lifecycle

> **Status**: Complete
> **Plan**: plans/plan-20260711-0346-sandbox-terminal-lifecycle.md
> **Contract**: tasks/contracts/20260711-0346-sandbox-terminal-lifecycle.contract.md
> **Review**: tasks/reviews/20260711-0346-sandbox-terminal-lifecycle.review.md
> **Last Updated**: 2026-07-11 04:21
> **Lifecycle**: notes

## Design Decisions

- P1 map: Agent Runtime owns terminal semantics and observed-usage truth;
  `SandboxBackend` owns provider operations; the Cloudflare adapter remains the
  only concrete implementation. Backend registration, runner dispatch,
  persistent terminal sink and live execution remain false.
- P2 trace: validate the run-owned grant, bounded-create a lease, consume the
  execution handle, arbitrate terminal event/control/soft-hard timeout, request
  kill where required, destroy, wait for both producer and consumer quiescence,
  then invoke exactly one required terminal-record callback.
- P3 invariant: terminal cause and cleanup truth remain independent. Failed or
  unconfirmed destroy, producer close or consumer settlement can never become
  release-safe. The record contains only observed durations, UTF-8 byte/event
  counts and exit code with `estimated=false`.
- Port v2 centralizes 30-second create timeout and 15-second termination grace.
  Every execution returns a handle with a required `closed` completion; this is
  the smallest seam that proves no detached producer survives terminal record.
- Create cancellation waits only through the declared create deadline. A late
  lifecycle success is destroyed without emitting a second record. The
  Cloudflare adapter additionally retains the pending registry tombstone and
  destroys again after a provider RPC settles late before removing authority.
- Run identity is derived from and checked against the branded run-owned grant.
  Session-owned grants are rejected by this run-specific lifecycle rather than
  translated through a compatibility path.
- No dependency, route, service, DB schema, config variable, credential,
  estimate or fallback was added.

## Deviations From Plan Or Spec

- Deep review proved two original assumptions too weak. Create could hang before
  control/timers existed, and producer `closed` alone did not prove the consumer
  stopped mutating usage. The final port therefore adds bounded create plus
  producer-and-consumer settlement before recording.
- Provider timeout does not cancel the underlying `createSession` Promise. The
  final adapter keeps a tombstone and reconciles late success with a second
  destroy instead of deleting authority after the first cleanup attempt.
- Full workspace typecheck initially exposed that DOM globals in the new source
  leaked into packages compiled with ES-only libs. The final public contract
  uses a structural abort signal, `Date.now`, and typed platform-global access;
  runtime behavior remains Node/Workers standard without a dependency.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Put lifecycle policy in Cloudflare adapter | Reject | It would make provider code own Agent terminal semantics. |
| Add scheduler/abort/deferred dependency | Reject | Standard promises, timers and structural signal are sufficient. |
| Record estimated CPU/memory/disk/cost | Reject | Current provider port does not authoritatively expose them; Row 10 owns live evidence. |
| Treat provider destroy as enough while stream remains open | Reject | Residual producer/consumer state can mutate usage after terminal record. |
| Remove registry after timed-out create cleanup | Reject | A late provider success could become an orphan without authority. |
| Add session compatibility to run lifecycle | Reject | The run ID must match the run-owned grant exactly. |

## Open Questions

- Provider CPU, memory, disk, egress and billable usage remain unavailable and
  intentionally unrecorded until Row 10.
- Row 7/9 must supply an existing persistent terminal/audit/usage sink; this
  slice proves the required callback but does not invent storage.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Targeted lifecycle/backend/index suite: 3 files, 105 tests passed.
- Full Vitest: 89 files passed, 2 skipped; 1077 tests passed, 3 skipped.
- All-workspace typecheck and lint passed.
- Bridge Wrangler dry-run passed with the existing container/service bindings.

## Promotion Filter

Promote a candidate only when it is hard to reverse, surprising without local
context, and backed by a repeated tradeoff. This slice introduced no repeated
cross-task rule that belongs outside the plan/contract/notes authority.

## Promotion Candidates

- None.
