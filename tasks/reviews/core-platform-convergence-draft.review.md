# Review — AiphaBee platform umbrella schema RLS foundation (PR #17 slice)

> **Repo**: Ancienttwo/aiphabee
> **PR**: #17 (OPEN DRAFT → Ready) — "chore: converge core schema namespaces"
> **Branch**: codex/core-platform-convergence-draft @ e9a5ee4 (remediation commit on top of 8b77175)
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint (accepted, round 2)**: sha256:b8d37af6b6a0c13da15540dea9c123aa8d59f1e2cc6433a47e50a91cd8ac6ef1
> **Round-1 fingerprint (FAIL, pre-remediation)**: sha256:d72b2a5c481f81822e2bdc6e2a798f5cd8864bd78c45fda90b6cfcddb6a5513c
> **Reviewed Scope**: umbrella RLS slice — `79dfe41^..HEAD` (3 files). NOT the full 362-file convergence PR.
> **Reviewed**: 2026-06-24T04:0x+0800

## Scope

PR #17 is a large "converge core schema namespaces" PR. This acceptance review is scoped to the **platform umbrella schema RLS foundation** slice — 3 files:
- `deploy/database/migrations/20260623010000_platform_umbrella_schema_foundation.sql`
- `apps/worker/src/platform-umbrella-rls-isolation.test.ts`
- `docs/governance/platform-umbrella-schema-foundation.md`

The remaining convergence churn (`tasks/notes/*`, `tasks/todos.md`, namespace renames) is pre-existing and CI-green; out of scope here.

> Note: the parent harness session's diff fingerprint `sha256:5734…` covers an unrelated aimpact-new doc and does NOT apply to this aiphabee review.

## External Acceptance — Codex (round 2, after remediation)

> **External Acceptance**: pass
> **External Reviewer**: Codex
> **External Source**: codex-cli 0.142.0 — `codex exec --sandbox read-only` (slice diff via stdin)
> **External Completed**: 2026-06-24T04:3x+0800
> **Reviewed Diff Fingerprint**: sha256:b8d37af6b6a0c13da15540dea9c123aa8d59f1e2cc6433a47e50a91cd8ac6ef1

**External Acceptance**: pass
**Reviewer**: Codex (codex-cli, exec)

- P0/P1 blockers: none
- P2 advisories: none
- Acceptance checklist: pass — service_role has schema usage plus exact select/insert/update grants on all 17 forced-RLS tables incl. audit; withholding the destructive grant is acceptable under the Phase-0 contract forbidding `delete`/`grant all`/`drop`/`truncate` SQL tokens because no live destructive write path is enabled. Guarded `alter policy` convergence is ordered after guarded create and protected by `if exists`. The P2 window is complete: both create and alter bodies require `wpa.valid_from <= now()` and `valid_to`.

## Round 1 (FAIL) → remediation trail

Round 1 (fingerprint `d72b2a5c…`) returned **fail** with three findings, all verified against source and then fixed in commit `e9a5ee4`:

- **[P1] service_role had no table privileges.** `service_role` got only `grant usage on schema`; the `grant select` block was `to authenticated` only, so the for-all service_role policies were unreachable (`bypassrls` skips row filtering, not the table-privilege check). **Fix:** `grant select, insert, update on` all 17 forced-RLS tables (incl. `platform_audit.product_access_event`) `to service_role`. The destructive grant verb is withheld solely because the Phase-0 migration contract (`scripts/check-database-migrations-contract.mjs`) forbids it; the for-all policy still covers it at the RLS layer and a later write-enabling migration can add it.
- **[P1] inline membership self-read hardening did not reach an existing live policy.** The presence guard skips creating a policy that already exists on the shared foundation, so the `valid_from <= now()` clause only landed on a fresh DB. **Fix:** an idempotent `alter policy` (guarded by `if exists`) after the guarded create force-converges the canonical hardened body for `workspace_membership_self_read`, `workspace_membership_profile_self_read`, `data_entitlement_member_read`, `entitlement_policy_member_read` (owner-authorized; governance doc coordination item 2 updated).
- **[P2] `entitlement_policy_member_read` ignored the product-access validity window.** Gated only on `access_status`. **Fix:** added `wpa.valid_from <= now()` / `valid_to`.

Detection-gap closed (Claude): the remote dry-run script `aimpact-new/scripts/dryrun-umbrella-migration.sh` now also reads back **service_role** table grants, so it would surface a missing service_role grant against the live target.

## Verification evidence

- `npm run check:database` → `{ "status": "ok" }` (no forbidden SQL tokens introduced; alter/grant are contract-legal).
- `vitest run` (umbrella test) → **21 passed** (extended from 17: +service_role grants, +entitlement validity window, +alter-convergence; the 33-policy / 17-forced-RLS / guarded-create invariants still hold).
- `npm run typecheck` (all workspaces) → clean.
- Offline `postgres:17` `BEGIN…ROLLBACK` dry-run of the edited migration → clean target **pass** (readback incl. service_role grants), drifted target **BLOCKER**, all safety guards refuse. Nothing persisted.

## Verdict & remaining merge precondition

**External Acceptance: PASS.** Draft → Ready is appropriate.

**Still outstanding before MERGE / live apply** (target-state-dependent, owner-run, intentionally not executed here):
- Remote dry-run against `AMPACT-Terminal` via `aimpact-new/scripts/dryrun-umbrella-migration.sh --dry-run` must pass — clearing column drift on the 6 shared tables, `aiphabee_core`/`aiphabee_governance` existence, and the authenticated + **service_role** grant readback — and the foundation owner must acknowledge coordination items 1–2.
