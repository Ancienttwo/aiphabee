# Plan: fastclaw-aiphabee persistent staging control service

> **Status**: Complete
> **Approved**: user `开干`, 2026-07-10
> **Contract**: `tasks/contracts/20260710-1710-fastclaw-aiphabee-staging.contract.md`

## Goal

Replace the deleted lifecycle smoke Container with a persistent private
`fastclaw-aiphabee-staging` control service. Reuse the shared PlanetScale
staging database without sharing tables or credentials: FastClaw owns schema
`fastclaw_aiphabee` through a dedicated non-BYPASSRLS role, and durable files
live in a dedicated R2 bucket.

## Task Breakdown

- [x] Prove shared-database collision risk and patch FastClaw schema discovery.
- [x] Add deterministic template bootstrap with `agents init --no-start`.
- [x] Define a singleton, private Cloudflare Container control Worker and route allowlist.
- [x] Provision/read back the dedicated PlanetScale role and schema.
- [x] Provision/read back dedicated R2 storage and bucket-scoped Container secrets.
- [x] Deploy `fastclaw-aiphabee-staging`, then deploy the AiphaBee staging binding.
- [x] Run activate/replay/cold-start/disable/reactivate/delete acceptance.
- [x] Disable the lifecycle feature after acceptance and bind final review evidence.

## Boundaries

- Production, public onboarding, provider billing, and `runner_remote` remain off.
- No public FastClaw route and no shared-Agent or local-disk persistence fallback.
- Target Worker deploys before the caller binding; secrets are never committed.
