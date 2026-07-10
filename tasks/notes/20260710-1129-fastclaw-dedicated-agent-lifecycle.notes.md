# Implementation Notes: fastclaw-dedicated-agent-lifecycle

> **Status**: Complete
> **Plan**: plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md
> **Contract**: tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md
> **Review**: tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md
> **Last Updated**: 2026-07-10 15:30
> **Lifecycle**: notes

## Design Decisions

- **P1 map**: AiphaBee owns entitlement and desired/observed lifecycle state in
  `platform.*`, `aiphabee_core.research_agent_profile`, and
  `aiphabee_audit.research_agent_lifecycle_event`. The Worker owns the protected
  control route and Postgres lease. A dedicated least-privilege
  `AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE` owns lifecycle database access;
  `FASTCLAW_CONTROL_SERVICE` is the Worker-to-FastClaw service boundary.
  `@aiphabee/agent-runtime` owns FastClaw wire types and the bounded HTTP client.
  FastClaw owns app-user and Agent records. Cloudflare Sandbox and production
  `runner_remote` stay out of scope.
- **P2 trace**: `POST /internal/research-agent/lifecycle` authenticates the
  server-side bearer and feature flag, parses `(workspace_id, account_id,
  intent, reason, x-request-id)`, reads live account/workspace/membership/
  subscription/product/policy/entitlement rows, claims a 45-second profile
  lease, reconciles the idempotent FastClaw user/Agent, then commits terminal
  profile state and an append-only audit row. Disable/delete write a local
  non-runnable pending state before HTTP. Failures clear the lease into
  `blocked_retryable`; no DB transaction spans FastClaw HTTP.
- **P2 live route**: shared staging PlanetScale had the existing seven-table
  umbrella authority but was missing only `subscription_plan` and
  `workspace_subscription`. The guarded ops Worker added exactly those two
  tables, applied the lifecycle migration, created a dedicated BYPASSRLS role
  with table-scoped grants, and provisioned caching-disabled Hyperdrive
  `2c08f46ff87343bfbdd7cd9c0d62f10d`. A temporary FastClaw Cloudflare
  Container was reached through a service binding; direct Worker egress to a
  local Quick Tunnel was rejected as `FASTCLAW_UNAVAILABLE` and was not kept as
  a compatibility path.
- **P3 rationale**: synchronous control-plane orchestration is sufficient for
  infrequent provisioning and preserves the existing Worker/package boundary.
  The crash window is closed by stable FastClaw external identities plus
  owner-scoped Agent `external_id`; a queue/outbox is deferred until a real
  billing event source and measured provisioning volume exist.
- Remote responses are streamed under a 1 MiB limit, raw remote bodies are not
  surfaced, request ids cannot be reused across lifecycle intents, and unique
  partial indexes prevent two profiles from accepting the same FastClaw user
  or Agent id.
- FastClaw prerequisite is committed separately at
  `826d306aaa7861776b532e7be5e936a839afcbae` on
  `codex/aiphabee-dedicated-agent-lifecycle`.

## Deviations From Plan Or Spec

- No product-scope deviation. Staging acceptance followed the plan's explicit
  credentialed branch after the operator authorized shared staging PlanetScale
  and Cloudflare provisioning. The earlier `not_run_missing_credentials`
  record is superseded by the live PASS below.
- `claude-review` was attempted twice on the full and narrowed AiphaBee diff;
  both read-only runs reached the 330-second timeout without a final finding.
  Those attempts are not counted as review evidence; final external acceptance
  must be independently bound to the current diff fingerprint.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| New lifecycle service/package | Reject | Existing Worker plus `@aiphabee/agent-runtime` already own the boundary. |
| Shared Agent fallback | Reject | Missing or invalid remote authority must fail closed. |
| DB transaction across HTTP | Reject | A bounded lease plus remote idempotency survives crash/retry without holding a connection transaction. |
| Provision Cloudflare Sandbox here | Reject | Sandbox is execution-plane ephemeral state, not durable identity state. |
| Public `workers.dev` hop to FastClaw | Reject | Cloudflare Worker egress could not resolve the temporary endpoint; a service binding is the fail-closed in-account boundary. |

## Open Questions

- Production promotion still needs a durable FastClaw control service and
  storage topology. The temporary acceptance Container and service binding were
  deleted after smoke; this task does not authorize production cutover.

## Verification

- FastClaw: `go test ./...` PASS; targeted auth/api/setup/store/users packages
  PASS; worktree clean; commit
  `826d306aaa7861776b532e7be5e936a839afcbae`.
- AiphaBee: `npm run lint` PASS; final `npm test` PASS with 1003 passed and
  2 skipped; lifecycle/route suite PASS with 265 tests after requiring the
  FastClaw service binding; `npm run typecheck`
  PASS; `npm run check:env` PASS; `git diff --check` PASS.
- Strict task contract verification: 26/26 PASS, status `Fulfilled`.
- Sprint verification command: `REPO_HARNESS_DIFF_BASE=3ac36e6 repo-harness
  run verify-sprint`. The authoritative final result and immutable run snapshot
  are recorded in `.ai/harness/checks/latest.json` and `.ai/harness/runs/` after
  live acceptance and cross-model review are bound to the final diff.
- Real PostgreSQL 17 integration: actual migration applied in an ephemeral
  Docker database named `aiphabee_lifecycle_test`; activate replayed to one
  remote user/Agent, disable observed `disable_pending` before remote call,
  closed-account delete cleared remote ids and wrote three audit events; PASS.
- Staging acceptance: **PASS**. Activate + same-request replay converged to one
  FastClaw app-user and one Agent; disable produced live FastClaw HTTP 403;
  reactivate preserved both remote-id hashes and the 1/1 counts; closed-account
  delete reduced remote user/Agent counts to 0/0, left a local `deleted`
  tombstone with remote ids absent, and produced four audit events. Fixture
  cleanup removed 11 rows. Evidence hashes:
  `fixture=sha256:a0c6b5c0e043cb8d7c95b6cef7a8d72bc221d0c90ecfc44218eeb73644a2ce12`,
  `user=55d4b1d8c5cbbd60294422a5c128dfeab38c1f234255a064764f94e754bd6f9f`,
  `agent=0c23e5195cb0c9128ca5aa20b3f26c853b48b72797ccb528938757c2f002337a`.
- Cleanup readback: lifecycle staging secrets `0`; temporary ops Worker HTTP
  `404`; temporary FastClaw Container applications/images `0/0`; canonical
  staging Worker redeployed without the temporary service binding and the
  protected route returns HTTP `401`. The persistent staging resources are the
  additive schema, dedicated DB role, and dedicated Hyperdrive only.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
