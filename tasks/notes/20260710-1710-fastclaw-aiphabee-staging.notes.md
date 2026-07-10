# Implementation Notes: fastclaw-aiphabee-staging

> **Status**: Complete

## P1 Map

- AiphaBee Worker owns entitlement and lifecycle orchestration.
- `fastclaw-aiphabee-staging` owns the private lifecycle HTTP allowlist and one Container.
- PlanetScale schema `fastclaw_aiphabee` owns FastClaw SQL state.
- R2 bucket `aiphabee-fastclaw-staging` owns FastClaw workspace objects.
- Cloudflare Service Binding is the only caller path; production stays closed.

## P2 Trace

`POST /internal/research-agent/lifecycle` reads the dedicated AiphaBee control
Hyperdrive, calls `FASTCLAW_CONTROL_SERVICE`, passes the route allowlist, wakes
the singleton Container, then FastClaw reconciles its dedicated Postgres state.
After one minute idle the Container sleeps; the next request rebuilds only the
process and reuses PlanetScale/R2 authority.

## P3 Decision

The shared database is reused because the isolation unit is a schema plus a
non-inheriting role. FastClaw's schema-unaware column probe was the only found
cross-schema migration hazard and is fixed at its authority query. At 10x,
the singleton Container is the first limit; that is acceptable for low-volume
lifecycle control and intentionally separate from the future execution plane.

## Verification Log

- FastClaw targeted packages: PASS.
- Container route allowlist: 2/2 PASS.
- Wrangler full image build/dry-run: PASS; deploy build context reduced from
  about `197 MB` to `145 KB` by excluding deployment `node_modules`.
- Shared PlanetScale role/schema: provisioned. Direct login readback returned
  `current_schema=fastclaw_aiphabee`, exact pinned search path, all elevated
  role attributes false, schema owner exact, and forbidden table writes `0`.
  Post-integration cleanup readback also proved database `CREATE=false`.
- Dedicated R2 bucket `aiphabee-fastclaw-staging`: created.
- Bucket-scoped R2 token `fastclaw-aiphabee-staging`: `Object Read & Write`
  on only `aiphabee-fastclaw-staging`; the Access Key/Secret were uploaded as
  Worker secrets without printing or committing plaintext.
- Private Worker/Container target `fastclaw-aiphabee-staging`: deployed with
  zero public targets and Container application max instances `1`. Final
  Worker version is `af5f851c-8728-4060-b6bd-fcab647e227b`; Container image is
  `sha256:10e3a2a6ee929acf550aa2fa794fd25f79f64ac4d43e243ca68ddf81d5113d07`.
- AiphaBee `staging` was redeployed with live Service Binding
  `FASTCLAW_CONTROL_SERVICE -> fastclaw-aiphabee-staging`; production remains
  unbound. Lifecycle feature enablement remains absent/off.
- Live edge readback: target public URL `404`; AiphaBee health `200`;
  unauthenticated lifecycle route `401`; Container application ID
  `a03c8edd-72d5-4c3c-b646-a7d09289f2ea`, state `active`, configured instances
  `1`.
- Deterministic cold-start bootstrap: template Agent
  `agt_1180f3adbf5bbf6608`, exactly one managed `aiphabee-control` admin key,
  and fail-closed R2 put/get/compare/delete before gateway readiness.
- Persistent staging acceptance: PASS. Activate replay preserved the same
  hashed user/Agent identities; acceptance observed one retryable initial
  activation and, after `80s` idle, one retryable cold-wake disable before
  succeeding. Remote
  readback proved `active -> disabled -> active -> deleted`, ending at users
  `0`, Agents `0`; local terminal state `deleted`; `6` audit events; `13`
  fixture rows removed; no sandbox was created.
- FastClaw full `go test ./...`: PASS. Live shared-PlanetScale schema-isolation
  regression: PASS. AiphaBee lint/typecheck/env/database/binding checks: PASS;
  targeted lifecycle/Worker tests `271/271`; full suite `1003 passed, 2 skipped`.
- Container route allowlist tests: `2/2` PASS. Final Worker secret inventory is
  exactly the five required secret names; AiphaBee retains only
  `FASTCLAW_ADMIN_API_KEY`, with all temporary lifecycle secrets removed.
- The authenticated one-shot database provisioning Worker was deleted after
  final readback; the lifecycle ops Worker was also deleted; its public URL now
  returns `404`.
