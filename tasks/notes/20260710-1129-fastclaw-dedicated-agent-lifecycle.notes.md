# Implementation Notes: fastclaw-dedicated-agent-lifecycle

> **Status**: Complete
> **Plan**: plans/plan-20260710-1129-fastclaw-dedicated-agent-lifecycle.md
> **Contract**: tasks/contracts/20260710-1129-fastclaw-dedicated-agent-lifecycle.contract.md
> **Review**: tasks/reviews/20260710-1129-fastclaw-dedicated-agent-lifecycle.review.md
> **Last Updated**: 2026-07-10 12:20
> **Lifecycle**: notes

## Design Decisions

- **P1 map**: AiphaBee owns entitlement and desired/observed lifecycle state in
  `platform.*`, `aiphabee_core.research_agent_profile`, and
  `aiphabee_audit.research_agent_lifecycle_event`. The Worker owns the protected
  control route and Postgres lease. `@aiphabee/agent-runtime` owns FastClaw wire
  types and the bounded HTTP client. FastClaw owns app-user and Agent records.
  Cloudflare Sandbox and production `runner_remote` stay out of scope.
- **P2 trace**: `POST /internal/research-agent/lifecycle` authenticates the
  server-side bearer and feature flag, parses `(workspace_id, account_id,
  intent, reason, x-request-id)`, reads live account/workspace/membership/
  subscription/product/policy/entitlement rows, claims a 45-second profile
  lease, reconciles the idempotent FastClaw user/Agent, then commits terminal
  profile state and an append-only audit row. Disable/delete write a local
  non-runnable pending state before HTTP. Failures clear the lease into
  `blocked_retryable`; no DB transaction spans FastClaw HTTP.
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
  missing-credential branch and is recorded as `not_run_missing_credentials`,
  not PASS.
- `claude-review` was attempted twice on the full and narrowed AiphaBee diff;
  both read-only runs reached the 330-second timeout without a final finding.
  It is not counted as review evidence. The deterministic checks and the
  P1/P2/P3 review card below remain authoritative.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| New lifecycle service/package | Reject | Existing Worker plus `@aiphabee/agent-runtime` already own the boundary. |
| Shared Agent fallback | Reject | Missing or invalid remote authority must fail closed. |
| DB transaction across HTTP | Reject | A bounded lease plus remote idempotency survives crash/retry without holding a connection transaction. |
| Provision Cloudflare Sandbox here | Reject | Sandbox is execution-plane ephemeral state, not durable identity state. |

## Open Questions

- None.

## Verification

- FastClaw: `go test ./...` PASS; targeted auth/api/setup/store/users packages
  PASS; worktree clean; commit
  `826d306aaa7861776b532e7be5e936a839afcbae`.
- AiphaBee: `npm run lint` PASS; `npm test` PASS with 1001 passed and
  2 skipped; lifecycle target suite PASS with 269 tests; `npm run typecheck`
  PASS; `npm run check:env` PASS; `git diff --check` PASS.
- Strict task contract verification: 26/26 PASS, status `Fulfilled`.
- Sprint verification: PASS with diff base `3ac36e6`; contract, review, and
  allowed-path guards PASS; external acceptance is a documented manual override
  for the disabled implementation only. Snapshot:
  `.ai/harness/runs/run-20260710T122602-47354-20260710-1129-fastclaw-dedicated-agent-lifecycle.json`.
- Real PostgreSQL 17 integration: actual migration applied in an ephemeral
  Docker database named `aiphabee_lifecycle_test`; activate replayed to one
  remote user/Agent, disable observed `disable_pending` before remote call,
  closed-account delete cleared remote ids and wrote three audit events; PASS.
- Staging acceptance: `not_run_missing_credentials`. Exact missing inputs in
  the current operator environment:
  `PLANETSCALE_DATABASE_URL`, `CLOUDFLARE_ACCOUNT_ID`,
  `CLOUDFLARE_API_TOKEN`, `FASTCLAW_BASE_URL`,
  `FASTCLAW_ADMIN_API_KEY`, `FASTCLAW_TEMPLATE_AGENT_ID`, and
  `AIPHABEE_RESEARCH_AGENT_LIFECYCLE_TOKEN`.

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`

## Promotion Filter

Promote a candidate to `tasks/lessons.md`, `docs/researches/`, or harness asset files only when all three hold: hard to reverse, surprising without local context, and a real trade-off existed. If any one is missing, keep it in this notes file instead.

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
