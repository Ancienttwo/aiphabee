# Implementation Notes: fastclaw-dedicated-agent-cloudflare-sandbox-smoke

> **Status**: Complete
> **Plan**: plans/plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.md
> **Contract**: tasks/contracts/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.contract.md
> **Review**: tasks/reviews/20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke.review.md
> **Last Updated**: 2026-07-10 05:15
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
- Live staging was executed with Wrangler OAuth, Docker Desktop, a disposable
  FastClaw SQLite home and the deterministic model. The Worker and Container
  application were deleted after readback; no reusable secret or product
  mapping remains.
- Live execution exposed three concrete gaps that deterministic tests missed:
  the compatibility date was ahead of Cloudflare UTC, file URLs were resolved
  as `/workspace/workspace/...`, and a create response could precede runtime
  readiness. The final Bridge uses the accepted UTC date, explicit UTF-8 file
  reads plus absolute workspace URL paths, and a safe create-time readiness
  probe. It does not retry an ambiguous business exec.
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

- Cold-start and 10-way concurrency are now live-measured. Actual CPU duty
  cycle, included-usage allocation, egress/DO/log invoice attribution, and
  sustained-load behavior remain outside this wall-clock-bound smoke.
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
  `not_run_missing_credentials` when rerun after ephemeral secrets were
  destroyed; the separate live acceptance evidence below is authoritative for
  the completed staging run.
- Pre-live Wrangler Worker-only dry run: bundle 631.16 KiB, bindings
  `AIPHABEE_SANDBOX`, `RUN_GUARD`, RPC transport, container declaration read
  back. The later live pass completed the full image build, registry push,
  Worker deployment and Container application creation.
- FastClaw targeted `go test` and `go vet` for config/sandbox/api/gateway:
  passed. Focused Cloudflare/lifecycle race tests: passed.
- FastClaw branch base: exact merge-base
  `c4c4194e58ba2343d93e938a735e699e68d0d2fa`; no SalesKo commits above base.
- Deterministic model readback: first SSE response emitted one `exec` tool call;
  second emitted tool output + `AIPHABEE_SANDBOX_SMOKE_OK` + `[DONE]`.
- Independent architecture review initially found four blockers; all four were
  fixed and regression-tested. Final independent security recheck found no
  P1/P2 blockers.
- Live serial acceptance: 1/1 completed in 7.385 seconds with
  `sandbox_destroyed=true`; raw list-price bound
  `$0.0000780384-$0.0001519384`.
- Live final concurrency acceptance: 10/10 completed, ten distinct Agent and
  sandbox identities, 6.052-17.804 seconds per run, aggregate raw list-price
  bound `$0.0010399488-$0.0020247488`; every run completed receipt, direct
  artifact, destroy and terminal readback.
- Rollback readback: Worker health returned HTTP 404 and the exact-name
  Container application query returned an empty list.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- None. Durable provider/cost decisions are already in the research document;
  the one-off model-evidence correction remains local to these notes/review.
