# Implementation Notes: live-security-load-cost-release-evidence

> **Status**: Complete
> **Plan**: plans/plan-20260711-1552-live-security-load-cost-release-evidence.md
> **Contract**: tasks/contracts/20260711-1552-live-security-load-cost-release-evidence.contract.md
> **Review**: tasks/reviews/20260711-1552-live-security-load-cost-release-evidence.review.md
> **Last Updated**: 2026-07-12 15:20
> **Lifecycle**: notes

## Design Decisions

- FastClaw is an always-on VPS service. Cloudflare owns only ephemeral Sandbox,
  Sandbox Bridge and the ClamAV scanner container.
- The two FastClaw credentials have separate trust boundaries: Worker outbound
  overwrites any caller `Authorization` with `AIPHABEE_VPS_SHARED_TOKEN`; Caddy
  validates that ingress token on an explicit method/path allowlist, then
  overwrites upstream `Authorization` with the host-local
  `FASTCLAW_CONTROL_API_KEY`. The control key never leaves the VPS.
- The superseded `fastclaw-aiphabee-staging` Worker, Container application and
  all seven registry image tags were deleted on 2026-07-12. The deployed
  AiphaBee Worker has no `FASTCLAW_CONTROL_SERVICE` binding and targets the VPS.
- The shared staging PostgreSQL connection ceiling requires a FastClaw pool of
  two plus serialized lifecycle provisioning; `53300` is retried only inside
  the credentialed acceptance operator with a bounded backoff.
- Sandbox `sleepAfter=2m` remains the production cost invariant. The ten-way
  acceptance uses authenticated `true` keepalives while waiting for all ten
  cold starts instead of lengthening every production sandbox lifetime.
- The live operator admits two FastClaw runs every 75 seconds because the VPS
  intentionally holds the shared staging PG pool at two. Ten separate Durable
  Object jobs then wait on one eight-minute release barrier, producing ten
  simultaneous Sandboxes without queuing ten origin requests for headers.
- Sandbox Bridge hashes the Container Durable Object ID and the evidence runner
  joins that hash to GraphQL `instanceId`; provider usage is never assigned by
  timing/order inference.

## Deviations From Plan Or Spec

- The original placement assumption put FastClaw in a Cloudflare Container.
  It was corrected to VPS FastClaw plus Cloudflare Sandbox-only execution.
- The 12-minute operator poll deadline was below the observed shared-staging
  cold-start path and is now 25 minutes; this changes operator patience, not the
  runtime wall-clock/token authority.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| Increase global sandbox `sleepAfter` | Rejected | Would add avoidable billed idle time to every product run. |
| Acceptance-only authenticated keepalive | Selected | Preserves the two-minute production sleep policy while proving sustained concurrency. |
| Set staging Sandbox `max_instances` exactly to 10 | Rejected after live readback | Cloudflare pre-scheduled only seven instances and repeatedly failed the eighth cold start. |
| Set staging Sandbox `max_instances` to 20 | Selected | Provides scheduler headroom for the required ten active instances; unused pre-warmed capacity is not billed. |
| Mark partial live run complete | Rejected | Row 10 requires all ten sandboxes and all provider fields. |

## Open Questions

- None for this Sprint. Production/public enablement and invoice allocation are
  separate future scopes; neither is inferred from this staging release gate.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- VPS readback: `https://89-167-47-141.sslip.io/` (private bearer ingress).
- Latest packet: `_ops/fastclaw-row10/live-release-evidence.json`, hash
  `sha256:feeb1da01341f58bb1ba5a68fa41320d59be5ebf9e8826c305bd84a0c1215077`.
  It records 10/10 provider-linked runs, maximum concurrency 10, nine R2
  handoffs plus one kill-switch run, `residual_rows=0`, and R2 orphan cleanup.
- Measured complete raw list cost is `$0.029066052431813046` total and
  `$0.0029066052431813046/run` average. Components are Container
  `$0.02484286684618496`, Durable Object `$0.0040512255856`, R2
  `$0.00004374000002808381`, Worker `$0.000029819999999999996`, and logs
  `$0.00009839999999999999`. Billing Read returned 420 account-period records;
  the `$3.8600075` account figure remains unallocated, so every run keeps
  `allocated_invoice_cost_usd=null`.
- Final provider cleanup readback: Sandbox application
  `active=0, assigned=0, healthy=10`; scanner application
  `active=0, assigned=0, healthy=1`.
- VPS readback after cleanup: Caddy, deterministic model and FastClaw containers
  are running; model/FastClaw are healthy; authenticated `/api/status` returned
  HTTP 200 and unauthenticated ingress returned 404. The authenticated status
  path took about 33 seconds under shared-PostgreSQL staging pressure, so the
  shared DB remains a load-test constraint even though the service is healthy.
- Provider-correlation deployment readback: Sandbox Bridge version
  `38338600-8a67-4bb1-a181-8fd748af19a3`; AiphaBee Worker staging version
  `0a92756b-a9db-4981-afd5-da19bca3f84c` after acceptance-secret cleanup;
  `/health` returned `status=ok`.
- Two post-deploy recaptures were not promoted over the last valid packet. The
  first completed application/cleanup but hit an expired OAuth token at
  provider read; the runner now refreshes Wrangler OAuth and persists a
  provider-only recovery artifact. The second hit one transient operator GET
  `fetch failed` during `live_run`; read-only polling now tolerates four
  consecutive network/5xx failures before failing. Both attempts removed the
  operator, acceptance secret and local state; neither is claimed as PASS.

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
