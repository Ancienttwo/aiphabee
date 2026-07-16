# netquity_serving_writer_staging — operator runbook

Applies the 8 new Netquity live-domain promotion slices (`security_profile`,
`financial_facts`, `quote_snapshot`, `corporate_actions`, `sdi_disclosure`,
`directorate`, `ownership`, `related_warrants`) to the shared staging
umbrella PlanetScale database, using a scoped write role instead of the
production-only `database:planetscale:apply` path or a raw admin credential.

Read first: `deploy/database/roles/netquity-serving-writer-staging.sql`
(grant rationale, evidence-derived table list, and the role-targeted RLS
policies that make the entitlement writes work),
`deploy/database/netquity-staging-promotions.contract.json` (target/
credential shape, file allowlist), and
`docs/governance/aiphabee-planetscale-boundary.md` (staging vs. production
boundary).

## RLS write path — read before running step (c)

Verified end to end against a local scratch Postgres seeded with the real
netquity mirror: all 16 files (8 `deploy/ingest/netquity-*-staging.sql` +
8 `deploy/account/netquity-*-entitlement-staging.sql`) run cleanly under
`netquity_serving_writer_staging`, in one run. `aiphabee_governance.
data_entitlement` and `aiphabee_governance.workspace_entitlement` both have
`force row level security`; `deploy/database/roles/netquity-serving-writer-
staging.sql` adds four role-targeted policies
(`netquity_serving_writer_entitlement_select`,
`netquity_serving_writer_entitlement_insert`,
`netquity_serving_writer_entitlement_update`,
`netquity_serving_writer_workspace_entitlement_insert`, each
`TO netquity_serving_writer_staging` only) so those two INSERT/UPDATE
commands are no longer denied by the FORCE ROW LEVEL SECURITY default-deny.
The SELECT policy exists for a non-obvious reason: `INSERT ... ON CONFLICT
DO UPDATE` (data_entitlement's shape) requires SELECT-policy visibility into
the row identity even when nothing actually conflicts, and the pre-existing
member-scoped SELECT policy can't supply that for a brand-new entitlement_id
(its own workspace_entitlement mapping doesn't exist yet). The pre-existing
member-scoped SELECT policies (`data_entitlement_member_read`,
`workspace_entitlement_member_read`) are untouched, and the new policies do
not apply to any other role — no BYPASSRLS, no schema change beyond the
four new policies.

Practical effect on this runbook: step (c) applies all 16 files (8 ingest +
8 entitlement, in the packet's fixed order) through
`netquity_serving_writer_staging` in a single run. There is no separate
admin-channel step for the entitlement files.

## Preconditions

- `git pull` on `main`; confirm
  `deploy/database/roles/netquity-serving-writer-staging.sql`,
  `deploy/database/netquity-staging-promotions.contract.json`, and
  `scripts/apply-netquity-staging-promotions.mjs` are present.
- You hold an elevated staging admin credential — the same one already used
  to apply the sibling packets in this directory
  (`netquity-staging.sql`, `authenticated-web-identity-staging.sql`,
  `authenticated-netquity-web-resolver-staging.sql`,
  `netquity-security-serving-staging.sql`) and the platform RLS/runtime-role
  patches described in `docs/governance/aiphabee-planetscale-boundary.md`'s
  staging trace. That credential connects either directly
  (`ap-southeast-2.pg.psdb.cloud:5432/postgres?sslmode=require`, same
  PlanetScale connection proxy as production, differentiated only by the
  branch-qualified username for the `share-staging` branch — see
  `deploy/fastclaw/row10-migration-worker.ts`'s
  `fastclaw_aiphabee_staging.v20dtpdoz3ik` DSN for the pattern) or through
  the temporary `_ops/hyperdrive-apply-worker` relay when only the
  Cloudflare-managed Hyperdrive origin credential has `CREATE`. Pick
  whichever you actually hold; both are referred to below as "admin
  channel."
- `deploy/database/migrations/20260709180000_netquity_mirror_schema.sql`
  and the netquity mirror data (172 vendor tables) are already applied to
  staging (this predates this task — `plans/plan-netquity-pg-mirror.md`
  Phase 2).
- `deploy/account/authenticated-netquity-web-resolver-staging.sql` is
  already applied to staging (predates this task — confirm by running its
  own readback, or by the fact that
  `deploy/account/netquity-corporate-actions-entitlement-staging.sql` and
  earlier entitlement files were already shipped and depend on it).

## Step (a) — role SQL, password, Keychain

Run via the admin channel (`psql "<admin staging connection>"` or the
Hyperdrive relay):

```bash
psql "<admin staging connection>" \
  --set ON_ERROR_STOP=1 \
  -f deploy/database/roles/netquity-serving-writer-staging.sql
```

Then set a password on the role and store it in macOS Keychain under the
exact service/account the contract and apply script expect. Never let the
password land in shell history or a log file:

```bash
NETQUITY_SERVING_WRITER_PASSWORD="$(openssl rand -base64 32)"

psql "<admin staging connection>" \
  --set ON_ERROR_STOP=1 \
  -c "ALTER ROLE netquity_serving_writer_staging LOGIN PASSWORD '${NETQUITY_SERVING_WRITER_PASSWORD}';"

security add-generic-password -U \
  -s "AiphaBee PlanetScale Postgres chris-fung aiphabee-staging-serving-writer" \
  -a "netquity_serving_writer_staging.v20dtpdoz3ik" \
  -w "${NETQUITY_SERVING_WRITER_PASSWORD}"

unset NETQUITY_SERVING_WRITER_PASSWORD
```

Verify the account/service you just stored matches
`deploy/database/netquity-staging-promotions.contract.json`'s
`credential_source` exactly (`security find-generic-password -s "AiphaBee
PlanetScale Postgres chris-fung aiphabee-staging-serving-writer" -a
"netquity_serving_writer_staging.v20dtpdoz3ik" -w` should print the
password back, non-empty).

The `target.user` branch-qualifier (`.v20dtpdoz3ik`) is inferred from the
one directly observed AiphaBee staging DSN in this repo, not independently
confirmed for this new role. If your PlanetScale dashboard shows a
different branch-qualified username for a role created on `share-staging`,
use that instead, in both the `security add-generic-password -a` value
above and (if it differs) `deploy/database/netquity-staging-promotions.contract.json`'s
`target.user` / `credential_source.account` fields.

## Step (b) — 4 domain migrations (DDL, admin channel only)

The role from step (a) cannot run DDL by design. Apply these four files, in
this exact order, through the same admin channel:

```bash
psql "<admin staging connection>" \
  --set ON_ERROR_STOP=1 \
  --single-transaction \
  -f deploy/database/migrations/20260715150000_sdi_disclosure_domain.sql \
  -f deploy/database/migrations/20260716120000_directorate_domain.sql \
  -f deploy/database/migrations/20260716130000_ownership_domain.sql \
  -f deploy/database/migrations/20260716140000_related_warrants_domain.sql
```

Readback: confirm the domain CHECK constraint now includes all four new
values.

```bash
psql "<admin staging connection>" -c "
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'aiphabee_core.serving_dataset'::regclass
  AND contype = 'c'
  AND conname LIKE '%domain%';
"
```

Expect `sdi_disclosure`, `directorate`, `ownership`, and `related_warrants`
alongside the eight pre-existing values.

## Step (c) — 16 files (8 ingest + 8 entitlement), via the new writer role

```bash
node scripts/apply-netquity-staging-promotions.mjs
# expect: {"status":"ready_for_guarded_staging_promotion_apply", "file_count":16, ...}

node scripts/apply-netquity-staging-promotions.mjs --execute --use-keychain
```

This connects as `netquity_serving_writer_staging` and applies the full
16-file packet in the fixed order from
`deploy/database/netquity-staging-promotions.contract.json` in one run:
expect `status: "ok"`, `files_applied: 16`. Each file wraps its own
`BEGIN...COMMIT` plus an internal readback DO block, so the packet is
16 independently atomic promotions, not one transaction; if a later file
fails, do not re-run the earlier files that already committed
successfully — they are idempotent (`ON CONFLICT ... DO NOTHING` /
`DO UPDATE`) if you do, but re-running is simply unnecessary.

## Step (d) — 9 checkers + smoke

```bash
npm run check:netquity-security-resolution-staging
npm run check:netquity-security-profile-staging
npm run check:netquity-financial-facts-staging
npm run check:netquity-quote-snapshot-staging
npm run check:netquity-corporate-actions-staging
npm run check:netquity-sdi-disclosure-staging
npm run check:netquity-directorate-staging
npm run check:netquity-ownership-staging
npm run check:netquity-related-warrants-staging

npm run smoke:authenticated-netquity-web-resolver
```

The 9 checkers validate each promotion file's contract (static, no network).
The smoke script exercises the deployed `authenticated-netquity-web-resolver-staging`
path against the now-live data — confirm it reports live reads for the
newly promoted domains, not `no_released_data`.

## Rollback

Each of the 16 promotion files and the 4 domain migrations is additive-only
(no destructive statement anywhere in this packet — confirmed by scanning
all 16 files for `CREATE|ALTER TABLE|DROP|GRANT|REVOKE|TRUNCATE|DELETE`:
none found). Forward-fix is the expected rollback surface, matching
`plans/plan-netquity-pg-mirror.md`'s "PlanetScale staging uses forward
fixes" convention. To remove `netquity_serving_writer_staging` itself: drop
the four role-targeted policies first --
`DROP POLICY netquity_serving_writer_entitlement_select ON
aiphabee_governance.data_entitlement`, `DROP POLICY
netquity_serving_writer_entitlement_insert ON
aiphabee_governance.data_entitlement`, `DROP POLICY
netquity_serving_writer_entitlement_update ON
aiphabee_governance.data_entitlement`, `DROP POLICY
netquity_serving_writer_workspace_entitlement_insert ON
aiphabee_governance.workspace_entitlement` -- confirmed empirically that
`DROP ROLE` fails with `role ... cannot be dropped because some objects
depend on it / target of policy ...` while any of the four still name it in
a `TO` clause. Then `REVOKE ALL ... FROM netquity_serving_writer_staging` on
every object listed in the role SQL's grant sections, then `DROP ROLE
netquity_serving_writer_staging`, then delete the Keychain entry with
`security delete-generic-password -s "AiphaBee PlanetScale Postgres
chris-fung aiphabee-staging-serving-writer" -a
"netquity_serving_writer_staging.v20dtpdoz3ik"`.
