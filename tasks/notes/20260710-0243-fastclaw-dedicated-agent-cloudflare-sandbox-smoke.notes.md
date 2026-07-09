# Implementation Notes: fastclaw-dedicated-agent-cloudflare-sandbox-smoke

> **Status**: Complete
> **Plan**: plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md
> **Contract**: tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md
> **Review**: tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md
> **Last Updated**: 2026-07-10 04:14
> **Lifecycle**: notes

## Design Decisions

- P1 authority map: `packages/agent-runtime` remains the public run/event
  authority; `FastClawSandboxSmokeRunner` is an additive staging runner;
  FastClaw owns agent/tool loop; the Worker Bridge owns provider auth and
  lifecycle; Cloudflare SDK types never become public AiphaBee events.
- P2 concrete trace: smoke issues one identity-bound token, provisions an app
  user and forked Agent, calls FastClaw SSE, FastClaw `exec` crosses its
  existing `ExecutorPool` into the Bridge, RunGuard records argv/stdout hashes,
  AiphaBee reads the artifact directly, then AiphaBee alone destroys and reads
  terminal status.
- P3 invariant: an LLM completion is not execution evidence. Completion marker
  is necessary but insufficient; PASS requires Bridge-owned exec receipt plus
  direct artifact hash.
- Sandbox ID and RunGuard DO name bind `jti + tenant_hash + user_hash`; reused
  run ids across identities cannot collide. RunGuard state also pins the exact
  claims shape and scope set.
- AiphaBee is the single provider cleanup owner. FastClaw forgets the local
  executor after the turn and scrubs the token without a second destroy;
  externally-managed async chat is rejected.
- Active work is capped at 540 seconds while token TTL remains capped at 600
  seconds, reserving 60 seconds for receipt/artifact readback and cleanup.
- FastClaw pool creation uses per-scope in-flight coalescing. Network create no
  longer runs under the gateway-wide pool mutex, so distinct scopes can use the
  configured max-10 capacity concurrently.
- The Dockerfile extends the official version-matched image without replacing
  its entrypoint or user model; Cloudflare's container boundary remains the
  isolation authority.

## Deviations From Plan Or Spec

- The initial implementation treated the model-returned hash/marker as
  evidence. Architecture review rejected that authority leak; the final design
  adds argv/stdout receipt hashes and direct artifact readback.
- The initial cleanup shape allowed FastClaw timeout cleanup and AiphaBee
  finally cleanup to race. The final shape has one cleanup owner and an
  explicit FastClaw forget/scrub capability.
- Operator-only credentials were not added to the app runtime env schema.
  `.dev.vars.example`, strict CLI validation, Worker secret setup, and the
  runbook are the authoritative surfaces; this avoids mixing smoke secrets
  into production app configuration.
- No live Cloudflare deploy was attempted: Docker daemon and all five live
  credential inputs are absent. State is `not_run_missing_credentials`.
- FastClaw full `go test ./...` is not green on the pinned baseline: generated
  `internal/setup/web` embed assets are absent, and existing
  `internal/agentcli.TestRemoveDeletesAgentAndFiles` fails on SQLite column
  `agent_id`. All changed/relevant packages pass targeted tests and vet.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| AiphaBee-side parallel `SandboxBackend` | Reject | It would bypass FastClaw's real tool loop and create a second execution authority. |
| Direct Go import of Cloudflare SDK | Reject | The SDK runtime boundary is Workers; the Go service uses an authenticated internal Bridge. |
| Model completion as evidence | Reject | A model can echo expected text without executing; receipt + file readback are provider-owned facts. |
| Two cleanup owners | Reject | Timeout races and expired-token eviction create false leaks/stale pools; AiphaBee owns destroy, FastClaw forgets. |
| Sandbank fallback | Reject | No compatibility fallback; Cloudflare failure is explicit and fail-closed. |
| 24x7 sandbox per paid user | Reject | Durable Agent identity does not require durable compute and public list-price cost is materially higher. |

## Open Questions

- Live Cloudflare cold-start, 10-way concurrency, actual CPU duty cycle,
  egress/DO/log cost, and provider destroy latency remain unmeasured until
  Docker and staging credentials are available.
- Durable paid-user → FastClaw Agent mapping, entitlement/billing,
  disable/delete, and production runner cutover remain a separate product
  slice; the current provision is disposable smoke-only.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- AiphaBee full tests: 82 passed files + 1 skipped; 983 passed tests + 1 skipped.
- AiphaBee full workspace typecheck: passed.
- AiphaBee targeted auth/Bridge/runner: 3 files, 15 tests passed.
- Contract check: all 12 static invariants passed; live state
  `not_run_missing_credentials` with five missing inputs named.
- Wrangler Worker-only dry run: bundle 631.16 KiB, bindings
  `AIPHABEE_SANDBOX`, `RUN_GUARD`, RPC transport, container declaration read
  back. Full container dry run correctly failed because Docker is unavailable.
- FastClaw targeted `go test` and `go vet` for config/sandbox/api/gateway:
  passed. Focused Cloudflare/lifecycle race tests: passed.
- FastClaw branch base: exact merge-base
  `c4c4194e58ba2343d93e938a735e699e68d0d2fa`; no SalesKo commits above base.
- Deterministic model readback: first SSE response emitted one `exec` tool call;
  second emitted tool output + `AIPHABEE_SANDBOX_SMOKE_OK` + `[DONE]`.
- Independent architecture review initially found four blockers; all four were
  fixed and regression-tested. Final independent security recheck found no
  P1/P2 blockers.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- None. Durable provider/cost decisions are already in the research document;
  the one-off model-evidence correction remains local to these notes/review.
