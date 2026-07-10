# Sprint Redirect: dual-agent-v2

> **Status**: Archived
> **Slug**: dual-agent-v2
> **Created**: 2026-07-03
> **Updated**: 2026-07-10 02:05 +0800
> **Superseded By**: `plans/prds/20260703-2042-agent-control-plane-convergence.prd.md`, `plans/sprints/20260703-agent-control-plane-convergence.sprint.md`

This file originally mixed a review memo, architecture recommendation, multi-phase plan, and sprint tracker. It is intentionally no longer the executable sprint artifact.

Use the replacement documents instead:

- PRD: `plans/prds/20260703-2042-agent-control-plane-convergence.prd.md`
- Sprint: `plans/sprints/20260703-agent-control-plane-convergence.sprint.md`

Decision carried forward:

- Do not create `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.
- Keep `@aiphabee/agent-runtime` as the single Agent Control Plane authority.
- Keep Worker `/agent/*` as the public API owner.
- Treat `parse_chart_image` as a Research-only technical-analysis tool, never a Generic tool.
- Treat FastClaw as a future `AgentRunner` implementation behind AiphaBee authority.
- Provision one dedicated FastClaw Agent identity/profile per entitled paid
  user. Keep the durable user/Agent mapping, entitlement, billing, audit,
  disable, and delete lifecycle in AiphaBee. Provisioning failure is
  fail-closed/retryable; there is no shared-Agent compatibility fallback.
- Keep the sandbox separate from the dedicated Agent identity: create it
  ephemerally per run/session, sync approved artifacts to AiphaBee-owned
  storage, then destroy it.
- FastClaw sandbox backend decision refreshed 2026-07-10: Cloudflare Sandbox
  SDK is the production-primary backend behind a thin `SandboxBackend` port;
  no sandbank abstraction layer. The alternative called "Cloudbank" in
  discussion is **Sandbank Cloud** (`sandbank.dev/cloud`), not the unrelated
  `cloudbank.org` research-cloud broker. Sandbank Cloud remains a cost
  comparator/data-free prototype option, not a compliance production path.
  Evidence and current official pricing:
  `docs/researches/20260709-fastclaw-sandbox-backend-selection.md`.

## Completion Readback

- Replacement sprint `agent-control-plane-convergence`: **Done, 4/4**.
- Fresh checks on 2026-07-10: targeted Agent runtime tests `99/99`, Worker
  tests `252/252`, answer/evidence contract `ok`.
- FastClaw adapter, dedicated-Agent provisioning, and sandbox backend:
  **not implemented**. `packages/agent-fastclaw` and
  `packages/sandbox-runtime` are absent.
- This redirect remains Archived. The next executable artifact must be a new
  FastClaw dedicated-Agent runner/sandbox sprint; do not reopen this file or
  point back to the already-complete convergence Task 1.
