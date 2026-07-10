# Implementation Notes: cloudflare-sandbox-adapter-spike

> **Status**: Complete
> **Plan**: plans/plan-20260710-2237-cloudflare-sandbox-adapter-spike.md
> **Contract**: tasks/contracts/20260710-2237-cloudflare-sandbox-adapter-spike.contract.md
> **Review**: tasks/reviews/20260710-2237-cloudflare-sandbox-adapter-spike.review.md
> **Last Updated**: 2026-07-11 00:56
> **Lifecycle**: notes

## Design Decisions

- P1 map: `packages/agent-runtime` owns `SandboxBackend`, access grants and
  capability truth; `apps/sandbox-bridge` owns only the Cloudflare adapter,
  private lease-registry DO and provider configuration. The factory is exported
  but has no caller, public route, grant mint or runtime registration.
- P2 trace: create reserves a grant-bound pending record before touching the
  provider; execute atomically reserves `starting` with the final process ID,
  starts the provider process, transitions to `running`, streams bounded
  untrusted output, then clears only after terminal confirmation. Kill and
  destroy reserve state before provider effects and never infer success.
- P3 invariant: a lease ID is routing data, not authorization. Every transition
  compares backend, lease, tenant, user, owner and runner binding inside one DO
  storage transaction. A single lease has at most one starting/running process.
- The pinned provider contract is `@cloudflare/sandbox@0.12.3` plus
  `docker.io/cloudflare/sandbox:0.12.3@sha256:23f67e16131b780865a5fa5aa3c8607408a730105c248836409f4e02bb6bf042`.
  The source contract used was SDK commit
  `696388b24c1c59a19b484a9e8066dc431addf617`.
- Output completion follows `startProcess` callbacks through `onExit`; this
  avoids closing the adapter queue before the SDK's detached process-log stream
  has delivered preceding stdout/stderr. `execStream()` is not used.
- Process start resolves the created session with `getSession(sessionId)` and
  calls the session wrapper. In pinned 0.12.3, top-level `getSandbox().startProcess`
  does not forward `ProcessOptions.sessionId` into the server method's session
  argument, so using it would silently violate `enableDefaultSession:false`.
- The queue is bounded to 1 MiB / 1024 pending events. Overflow is a
  non-retryable execution failure and triggers bounded provider termination.
- Failed or timed-out destroy stays closed as `destroying`; repeated destroy is
  the reconciliation operation. Immediate fresh provider rejection may restore
  the exact prior `ready`/`killed` state. Provider success followed by registry
  failure never reopens the lease.
- Failed create cleanup removes the record only after provider destroy is
  confirmed. Otherwise the pending provider binding remains durable for Row 5
  cleanup/audit instead of becoming an untracked orphan.

## Deviations From Plan Or Spec

- The plan described retaining the process handle after `startProcess`. Review
  strengthened this to a pre-start transactional `starting` reservation so a
  concurrent second execute or destroy cannot create an unaddressable provider
  process.
- The plan's bounded destroy wait originally had no recovery transition. The
  final state machine makes repeated destroy recover `destroying` without
  reopening unknown provider state.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Reuse the HTTP/HMAC bridge guard as Agent authority | Reject | It is a separate smoke boundary and would duplicate Agent Runtime grant authority. |
| In-memory lease map | Reject | It loses isolation and lifecycle state across isolates/restarts. |
| Post-start process registration | Reject | Concurrent execute/destroy can create an untracked process before registration. |
| AbortSignal or buffered exec as kill | Reject | It closes transport, not necessarily provider work. |
| Reset destroy to ready after timeout | Reject | Provider terminal state is unknown; reopening would fabricate safety. |

## Open Questions

- None.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Cloudflare 2026 migration contract:
  <https://developers.cloudflare.com/sandbox/guides/2026-deprecation/>
- Process command contract:
  <https://developers.cloudflare.com/sandbox/api/commands/>
- Sandbox identity/lifecycle:
  <https://developers.cloudflare.com/sandbox/concepts/sandboxes/>
- Official minimal RPC example:
  <https://github.com/cloudflare/sandbox-sdk/blob/696388b24c1c59a19b484a9e8066dc431addf617/examples/minimal/src/index.ts>

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
