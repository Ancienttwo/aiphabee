# Handoff — Platform Umbrella Schema Foundation + finmodel Integration

> **Date**: 2026-06-24
> **Scope**: the `platform.*` umbrella identity/RLS foundation slice of PR #17, plus
> finmodel Phase-1/2 umbrella integration. NOT the full 362-file convergence PR.
> **Status**: code complete + verified offline; **blocked on an owner-run live remote
> dry-run against AMPACT-Terminal before Draft→Ready / merge**.

## TL;DR

One shared Supabase project (`AMPACT-Terminal`, ref `innqoumlqctqnryhyasw`) is co-owned by
**four** products: **aiphabee, aimpact, salesko, finmodel**. PR #17 lands the shared
`platform` / `platform_audit` identity + RLS foundation and a cross-product provisioning
primitive. RLS cross-tenant isolation, idempotent shared-DB apply, grants, and provisioning
are all verified against a disposable postgres:17. Remaining: the **live remote dry-run**
(owner-run, needs creds) and **finmodel-side adoption** of the provisioning primitive.

## Repos / branches / heads

| Repo | Path | Branch | Head | Role |
|---|---|---|---|---|
| aiphabee convergence | `/Users/chris/Projects/aiphabee-core-platform-convergence` | `codex/core-platform-convergence-draft` (PR #17, draft) | `8847f18` | `platform.*` foundation + provisioning primitive |
| aimpact-new | `/Users/chris/Projects/aimpact-new` | `codex/umbrella-coordination-and-dryrun` | `6a6abb7` | safe remote dry-run tooling |
| finmodel | `/Users/chris/Projects/finmodel` | `main` | (Phase-2 adoption pending) | product to integrate |

## What's DONE (PR #17, all pushed)

Migration `deploy/database/migrations/20260623010000_platform_umbrella_schema_foundation.sql`:

- `79dfe41` **P1 fix**: `valid_from <= now()` lower bound in the membership/entitlement
  temporal predicate (`is_workspace_member` + 2 self-read policies + `data_entitlement`) —
  closes a future-dated-active-member early-access leak. + RLS truth-table vitest.
- `b17eca9` Supabase grants (authenticated usage+select on the 16 read tables; anon nothing)
  + 17 service-role all-access policies.
- `4a4c15e` **Idempotent presence guards** on all 33 policies (shared DB co-owned with
  aimpact-new's already-live foundation; `create policy` has no `IF NOT EXISTS`).
- `9a0022a` Product seed → `on conflict do nothing` (never clobber another product's row).
- `8b77175` Governance doc: shared-DB apply safety + cross-product coordination.
- `e9a5ee4` **Codex external-acceptance remediation** (3 findings): (P1) service_role table
  grants `select/insert/update` on 17 tables; (P1) `alter policy` **force-convergence** of 4
  temporal policies onto pre-existing live policies; (P2) `entitlement_policy_member_read`
  now checks `workspace_product_access` valid_from/valid_to.
- `24a14da` External acceptance record (`tasks/reviews/core-platform-convergence-draft.review.md`).
- `103d914` **finmodel registered** in `platform.product` (4th product).
- `8847f18` **`platform.provision_personal_workspace()`** — cross-product provisioning primitive.

aimpact-new `scripts/dryrun-umbrella-migration.sh`: safe read-only remote dry-run
(`BEGIN…ROLLBACK`, ref-guarded, no commit path) + offline `--db-url` loopback mode;
`6a6abb7` added the service_role table-grant readback.

## Verified (and how)

`check:database` is **static string-matching only** (asserts enable/force RLS literals; no
policy logic, no apply). Everything was verified **behaviorally** against a disposable
`postgres:17` cluster (Homebrew `initdb` on a throwaway port — the Docker daemon is down here;
**never the running 5432**). See "How to verify" below.

- RLS truth table: workspace A member reads 0 of B's rows / entitlements / catalog; future-dated
  active member → `is_workspace_member=false`; audit table `permission_denied` to authenticated;
  anon `permission_denied`; service_role bypasses.
- P1 force-convergence: a simulated pre-existing live `workspace_membership_self_read` WITHOUT
  `valid_from` is hardened by `alter policy` on re-apply (DEGRADED=false → CONVERGED=true).
- P2: future-dated active product access no longer exposes `entitlement_policy` (member, but
  access window closed → 0).
- Idempotent double-apply: applying the umbrella migration twice → exit 0 (no duplicate-policy error).
- Provisioning: 3 calls across 2 products for one auth user → 1 account / 1 workspace / 1 owner
  membership / 2 product-access rows (`finmodel:active`, `aiphabee:trialing`); `is_workspace_member` true.
- vitest 22 passed; typecheck clean; CI `verify` green on prior heads.

## REMAINING

### 1. GATE — live remote dry-run against AMPACT-Terminal (blocks Draft→Ready / merge)

Owner-run; needs live creds (not present locally — no `_ops/` env / `SUPABASE_URL`).

```bash
UMBRELLA_DRYRUN_EXPECTED_REF=innqoumlqctqnryhyasw \
  ./scripts/dryrun-umbrella-migration.sh --dry-run \
    --migration-sql <aiphabee>/deploy/database/migrations/20260623010000_platform_umbrella_schema_foundation.sql \
    --env-file <env-with-SUPABASE_URL+DATABASE_PASSWORD>
```

Confirms: column drift on the 6 shared tables, `aiphabee_core`/`aiphabee_governance` schema
presence, the `BEGIN…ROLLBACK` apply, and the authenticated + service_role grant readback.

### 2. finmodel Phase-2 adoption (finmodel repo — needs a worktree off `main`)

finmodel = single-user-tenant (`user_id text` = auth uuid; 18 user-scoped RLS policies; per-user
billing; tables in `public` with `finmodel_` prefix). Its data isolation is already correct;
Phase-2 only *represents* finmodel users in the platform layer.

- **(a) Backfill (one-time)** — call the primitive per distinct finmodel user:
  ```sql
  do $$ declare r record; begin
    for r in
      select distinct user_id from (
        select user_id from public.finmodel_api_projects
        union select user_id from public.finmodel_agent_workspaces
        union select user_id from public.finmodel_api_billing_subscriptions
      ) u
      where user_id ~ '^[0-9a-f-]{36}$'
    loop
      perform platform.provision_personal_workspace(
        r.user_id::uuid, 'finmodel',
        coalesce((select case when s.plan_id in ('starter','pro') then 'active' else 'trialing' end
                  from public.finmodel_api_billing_subscriptions s where s.user_id = r.user_id), 'trialing'));
    end loop;
  end $$;
  ```
- **(b) Runtime** — finmodel API (service_role via Hyperdrive) calls
  `select platform.provision_personal_workspace($uid::uuid, 'finmodel', $status)` on login / billing change.
- **(c)** finmodel's 14 tables / 18 RLS policies UNCHANGED.
- **OPEN DECISION**: billing→access mapping (draft above: `starter`/`pro` → `active`, else `trialing`).

### 3. Phase-4 cleanup (later)

finmodel tables live in `public` — violates the umbrella "no product tables in `public`" rule.
Move to a `finmodel_*` schema in a maintenance migration.

## Coordination (one DB, four owners)

- **aimpact-new owner**: applying PR #17 `create or replace`s the SHARED
  `platform.is_workspace_member` / `current_account_id` (tightens `valid_from` + `status='active'`
  for ALL products) and `alter policy` force-converges 4 temporal policies onto whatever live
  policies exist. Acknowledge before any apply.
- **finmodel owner**: Phase-2 adoption (above) + public-schema cleanup + billing mapping.
- **All four**: stagger live apply windows; no two products applying to AMPACT-Terminal at once.

## Key files

- Migration + provisioning fn: aiphabee `deploy/database/migrations/20260623010000_platform_umbrella_schema_foundation.sql`
- Regression test: aiphabee `apps/worker/src/platform-umbrella-rls-isolation.test.ts`
- Governance doc: aiphabee `docs/governance/platform-umbrella-schema-foundation.md`
- External review: aiphabee `tasks/reviews/core-platform-convergence-draft.review.md`
- Dry-run tool: aimpact-new `scripts/dryrun-umbrella-migration.sh`
- finmodel billing: finmodel `apps/api/migration/0006_finmodel_api_billing_subscriptions.sql`
- Design authority: aiphabee `docs/researches/supabase-umbrella-scheme.md`

## How to verify (reproduce the offline behavioral checks)

Docker daemon is down → use Homebrew `postgresql@17`. `initdb` a throwaway cluster on a spare
port under `/tmp`; create Supabase-like `anon`/`authenticated`/`service_role` roles + an
`auth.uid()` shim reading `current_setting('request.jwt.claim.sub')`; apply the scaffold
(`20260620085000_*`) + umbrella migrations; run truth-table / provisioning / double-apply probes;
stop + `rm`. **Never touch the running 5432.** Probe assertions mirror
`apps/worker/src/platform-umbrella-rls-isolation.test.ts`.

## Residual risks

- No live apply against AMPACT-Terminal yet (only offline dry-run).
- `create table if not exists` won't reconcile column drift on the 6 shared tables — the remote
  dry-run's column-drift check is the gate.
- Two index names exceed 63 chars and are truncated by Postgres (catalog name ≠ contract name).
- finmodel `uuid`(text) boundary: provisioning casts `user_id::uuid`; non-uuid user_ids are
  skipped by the backfill filter.
