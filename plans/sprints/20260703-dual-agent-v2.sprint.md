# Sprint Redirect: dual-agent-v2

> **Status**: Archived
> **Slug**: dual-agent-v2
> **Created**: 2026-07-03
> **Updated**: 2026-07-11 23:00 +0800
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
- Treat FastClaw as an `AgentRunner` implementation behind AiphaBee authority;
  the 2026-07-10 contract branch implements a staging/smoke runner without
  enabling production `runner_remote`.
- Provision one dedicated FastClaw Agent identity/profile per entitled paid
  user. Keep the durable user/Agent mapping, entitlement, billing, audit,
  disable, and delete lifecycle in AiphaBee. Provisioning failure is
  fail-closed/retryable; there is no shared-Agent compatibility fallback.
- Keep the sandbox separate from the dedicated Agent identity: create it
  ephemerally per run/session, sync approved artifacts to AiphaBee-owned
  storage, then destroy it.
- Deploy the persistent AiphaBee FastClaw control plane on the existing VPS,
  not in a Cloudflare Container. Use the shared PS staging PostgreSQL with a
  bounded pool. Cloudflare is the Worker/R2/ephemeral Sandbox plane only.
- FastClaw sandbox backend decision refreshed 2026-07-10: Cloudflare Sandbox
  SDK is the production-primary backend through FastClaw's existing
  `sandbox.Executor` / `ExecutorPool` seam plus an internal Worker Bridge;
  no parallel AiphaBee `SandboxBackend` and no sandbank abstraction layer. The alternative called "Cloudbank" in
  discussion is **Sandbank Cloud** (`sandbank.dev/cloud`), not the unrelated
  `cloudbank.org` research-cloud broker. Sandbank Cloud remains a cost
  comparator/data-free prototype option, not a compliance production path.
  Evidence and current official pricing:
  `docs/researches/20260709-fastclaw-sandbox-backend-selection.md`.

## Completion Readback

- Replacement sprint `agent-control-plane-convergence`: **Done, 4/4**.
- Fresh checks on 2026-07-10: targeted Agent runtime tests `99/99`, Worker
  tests `252/252`, answer/evidence contract `ok`.
- Separate contract
  `plan-20260710-0243-fastclaw-dedicated-agent-cloudflare-sandbox-smoke`:
  deterministic staging implementation is complete in isolated AiphaBee and
  FastClaw branches. It provisions a disposable dedicated Agent per smoke,
  runs through the Cloudflare Bridge/Executor seam, verifies structured exec
  receipt + direct artifact hash, and terminally destroys the sandbox.
- Follow-on lifecycle contract
  `plan-20260710-1129-fastclaw-dedicated-agent-lifecycle` is complete through
  credentialed staging: durable `(workspace_id, account_id)` profile/audit,
  live entitlement, idempotent one-user/one-Agent activate + replay,
  disable/reactivate, closed-account delete, and full fixture cleanup all pass.
- Cloudflare live state is verified: Sandbox serial `1/1` and concurrency
  `10/10`. The temporary service-bound FastClaw Container was a spike and has
  been superseded by persistent VPS FastClaw; only ephemeral Sandbox/Scanner
  Containers remain in the target architecture.
- Row-10 credentialed readback now links all ten Sandbox provider objects to
  Container, Durable Object, Worker, logs and R2 provider reads. The complete
  raw list cost is `$0.029066052431813046` total and
  `$0.0029066052431813046/run` average. Billing Read proves `$3.8600075` of
  account-period contracted cost, but no approved policy allocates it to these
  runs, so per-run invoice allocation remains null.
- Production completeness remains **partial**: public onboarding/billing event source, production
  `runner_remote`, actual invoice attribution, and long-lived feature
  enablement are not shipped.
- This redirect remains Archived; executable truth lives in the new contract,
  not in the historical checklist below.
