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

## 2026-07-11 final hardening re-acceptance

- FastClaw `dev@35cd5ad` was pushed and redeployed. The private control Worker is
  version `043776e2-23f0-4225-99fa-43a279a78ec8`; Container application
  `a03c8edd-72d5-4c3c-b646-a7d09289f2ea` is `ready`, one instance, on image
  `sha256:10e3a2a6ee929acf550aa2fa794fd25f79f64ac4d43e243ca68ddf81d5113d07`.
- AiphaBee hardening was accepted on temporary version
  `37dee220-6dd2-47ce-ad7a-4cab9d9db103`. Activate cold wake returned one
  `FASTCLAW_UNAVAILABLE` retryable result, then succeeded; replay preserved the
  exact user/Agent hashes and remote counts `1/1`. After `70s` idle, disable
  likewise retried once then converged to remote `disabled 1/1`. Reactivate
  preserved both hashes and returned remote `active 1/1`; closed-account delete
  ended at remote users/Agents `0/0`, local `deleted` with both remote IDs
  absent, two retryable plus four succeeded audit events, and
  `sandbox_created=false` throughout.
- Final cleanup deleted `14` fixture rows (six audit, one profile, seven
  authority rows). A transaction-scoped readback then proved profile/audit
  absent and remote counts still `0/0`; this avoids the shared Hyperdrive's SQL
  cache rather than accepting stale evidence.
- Public `workers.dev` propagation briefly served mixed old/new secret versions
  despite the deployment reporting `100%`. Final acceptance therefore used an
  authenticated temporary ops Worker with a native Service Binding to
  `aiphabee-worker-staging`, preserving the same AiphaBee -> FastClaw product
  boundary without relying on the public edge for credentialed control calls.
  The ops Worker was deleted after acceptance.
- The final fail-closed AiphaBee baseline is version
  `ab7ad06c-e91a-41da-a228-8bef38a43297`: health `200`, unauthenticated
  lifecycle `401`, temporary ops URL `404`, and secret inventory exactly
  `FASTCLAW_ADMIN_API_KEY`. FastClaw retains exactly its five required secrets,
  has no public target (`/api/status` returns `404`), and the lifecycle feature
  variables/token are absent from the baseline.
