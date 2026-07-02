# AiphaBee PlanetScale Boundary

> Status: accepted architecture boundary
> Last Updated: 2026-06-26
> Supersedes: `docs/governance/aiphabee-independent-supabase-boundary.md`

This decision makes PlanetScale Postgres the AiphaBee production
system-of-record target behind Cloudflare Hyperdrive. Production remains
AiphaBee-owned: it must not share the same database, database role, Hyperdrive
origin, service path, or migration target with AIMPACT, Salesko, or any other
sibling product.

Staging is the exception. AiphaBee staging now uses the shared platform
umbrella database surface through Cloudflare Hyperdrive config
`1e83eb563db44746a168175e065cc958`, matching sibling-product integration
testing while preserving production isolation.

## P1 Architecture Map

| Surface | Decision | Boundary |
|---|---|---|
| Database provider | PlanetScale Postgres | Product-owned relational system of record |
| PlanetScale organization | `chris-fung` | Billing and database operations stay under the Cloudflare/PlanetScale integration |
| PlanetScale database | `aiphabee-prod` | AiphaBee-only production database |
| Staging database | shared platform umbrella database | Shared with sibling projects for non-production integration only |
| Primary region | AWS `ap-southeast-1` | Region confirmed by PlanetScale dashboard; connection hostname is not region authority |
| Cloudflare binding | `AIPHABEE_HYPERDRIVE` | Production points to the AiphaBee runtime Hyperdrive config; staging points to the staging runtime config |
| Production runtime Hyperdrive | `2ddc2108d072420c9263ff6923b4f2c3` | Bound at top level as `AIPHABEE_HYPERDRIVE`; connects to AiphaBee production with the non-bypass runtime login |
| Production apply/admin Hyperdrive | `54d5e09484534f29b22099035f071b31` | Preserved only for guarded ops apply/readback; not exposed to production Worker runtime |
| Staging runtime Hyperdrive | `755ab0a9b0404e10be1f8ab1c736358a` | Bound under `env.staging.hyperdrive` as `AIPHABEE_HYPERDRIVE`; connects to the shared staging DB with the AiphaBee runtime login role |
| Staging shared Hyperdrive alias | `1e83eb563db44746a168175e065cc958` | Preserved as `HYPERDRIVE` compatibility alias for the shared umbrella config; not used by AiphaBee runtime code |
| Worker runtime | `GET /database/runtime` | Reports `planetscale_postgres` via `cloudflare_hyperdrive`; default mode remains no-DB-read |
| Worker DB live readiness | `GET /database/runtime?live=1` | Guarded by `x-aiphabee-smoke`; performs read-only Hyperdrive schema inventory |
| IPO screen API | `POST /analytics/screen-ipos` | User-visible read path; reads released IPO serving data from PlanetScale when present |
| IPO calendar API | `GET /ipos/calendar` / `POST /ipos/calendar` | User-visible read path; reads released IPO timetable data from PlanetScale when present |
| Platform RLS smoke | `POST /cloudflare/hyperdrive/platform-rls-fixture-smoke` | Guarded by `x-aiphabee-smoke`; inserts rollback-only fixtures, demotes SELECT checks to `aiphabee_runtime_rls`, and verifies claim-scoped RLS |
| Platform runtime role smoke | `POST /cloudflare/hyperdrive/platform-runtime-role-smoke` | Guarded by `x-aiphabee-smoke`; verifies the actual Hyperdrive login is non-bypass, non-owner, no-`CREATE`, and has platform read privileges |
| Hyperdrive runtime origin user | `aiphabee_runtime_rls.bpvsmvgwkutr` | PlanetScale branch-qualified login; PostgreSQL `current_user` resolves to `aiphabee_runtime_rls`, which has no bypass, no superuser, and no database/schema `CREATE` |
| Hyperdrive apply/admin origin user | `pscale_api_9jnxj6nh3nb8.bpvsmvgwkutr` | Cloudflare-managed origin credential retained for guarded schema apply only; has `CREATE` on `postgres` |
| Direct apply user | `pscale_api_yn66uahpa46b.bpvsmvgwkutr` | Local Keychain-backed credential for direct smoke and readback; lacks `CREATE` |
| Database identity claim | `aiphabee.account_id` | Set per transaction by Worker/Better Auth paths before RLS-scoped reads |
| Direct preflight | `npm run check:planetscale-direct-preflight` | Verifies direct PlanetScale readiness without printing credentials |
| Local schema dry-run | `npm run check:database-local-dry-run` | Applies all SQL migrations to a temporary local Postgres cluster before direct PlanetScale apply |
| Apply packet | `npm run check:database-apply-packet` | Locks the exact SQL packet hash before remote apply |
| Remote apply | `_ops/hyperdrive-apply-worker` via `wrangler dev --remote` | One-time guarded schema apply through Hyperdrive origin credential |
| Migration inventory | `deploy/database/migrations/*` | Existing Postgres-compatible SQL inventory retained until a later directory rename |
| Raw large objects | R2 | Raw documents, MDB dumps, PDFs, large HTML/JSON blobs stay outside Postgres where practical |
| AIMPACT/Salesko | External systems | Production integration happens through APIs or explicit federation; staging may use the shared umbrella database |

Authoritative repo surfaces:

- `deploy/database/migrations.contract.json`
- `deploy/database/planetscale-direct-preflight.contract.json`
- `deploy/database/local-dry-run.contract.json`
- `deploy/database/apply-packet.contract.json`
- `deploy/database/planetscale-remote-apply.contract.json`
- `apps/worker/wrangler.jsonc`
- `_ops/env/aiphabee-planetscale-prod.env`
- `deploy/database/migrations/*`
- `docs/governance/postgres-hyperdrive-migration-scaffold.md`

Out of scope:

- Deleting the old Supabase project before the retirement packet's cold-backup
  gate passes; see `docs/governance/aiphabee-supabase-retirement.md`.
- Renaming the existing `deploy/database/migrations` directory.
- Applying schema/data to PlanetScale without a direct connection secret.
- Finalizing auth federation between products.

## P2 Concrete Trace

Current AiphaBee live database path:

1. PlanetScale database `aiphabee-prod` is provisioned in organization
   `chris-fung`.
2. Cloudflare Hyperdrive config `aiphabee-prod-runtime`
   (`2ddc2108d072420c9263ff6923b4f2c3`) connects to that PlanetScale origin
   using `aiphabee_runtime_rls.bpvsmvgwkutr`.
3. Worker binds that config as `AIPHABEE_HYPERDRIVE`.
4. `wrangler dev --remote --config apps/worker/wrangler.jsonc` exposes the
   current Worker with the remote Hyperdrive binding.
5. `POST /cloudflare/hyperdrive/smoke` runs `SELECT 1 AS
   hyperdrive_smoke_result`.
6. The smoke passed on 2026-06-25 with hash-only evidence recorded in
   `_ops/env/aiphabee-planetscale-prod.env`.
7. The direct apply preflight builds a connection from macOS Keychain for
   `pscale_api_yn66uahpa46b.bpvsmvgwkutr`.
8. `node scripts/check-planetscale-direct-preflight.mjs --smoke-select-1
   --use-keychain` runs read-only `SELECT 1` against PlanetScale.
9. The direct smoke passed on 2026-06-25T16:40:55Z with hash-only evidence.
10. `npm run database:planetscale:apply` is guarded by remote inventory and
    `has_database_privilege(current_user, current_database(), 'CREATE')`.
11. On 2026-06-25T16:50:55Z, remote inventory showed only the allowed
    `pscale_extensions.*` helper tables, but `database_create_privilege=false`.
12. Wrangler Hyperdrive readback then showed the Cloudflare-managed origin user
    had `database_create_privilege=true`.
13. A temporary `_ops/hyperdrive-apply-worker` preview Worker applied the locked
    packet `sha256:92047c671809c1772648030a10ae3d4e26048f09c2e9bc9b99f00a22b75373c8`
    through Hyperdrive in one transaction.
14. The apply passed with 66 migrations, 6 non-system schemas, and 227
    non-system tables.
15. `POST /evidence/records/live-db-smoke` then inserted, selected, and deleted
    rows through `core.evidence_record` and `core.evidence_source_ref`.
16. `npx wrangler deploy --env="" --config apps/worker/wrangler.jsonc`
    deployed production Worker version
    `0a98ac0c-8185-4779-9644-251caefaf07f` at
    `https://aiphabee-worker.metalabs.workers.dev` with `APP_ENV=prod`.
17. Deployed `/database/runtime` returned `provider=planetscale_postgres`,
    `connection_path=cloudflare_hyperdrive`, and `binding_configured=true`.
18. Deployed `/cloudflare/hyperdrive/smoke` returned `status=ok`,
    `database_create_privilege=true`, and response hash
    `sha256:abf17d15510ec0721efcbedbaa4bfde28145770c3336a76ca3125db30f7cf5ea`.
19. Deployed `/evidence/records/live-db-smoke` returned `status=ok`, inserted
    and deleted two smoke rows, and produced response hash
    `sha256:0edd3a8d376d4a880a1c1188d39c0283d45ce9b7c274989bb43692e404f035bd`.
20. `npx wrangler deploy --env="" --config apps/worker/wrangler.jsonc`
    deployed production Worker version
    `a565865c-050b-4624-96d0-332fcfc548d1`.
21. Deployed default `/database/runtime` still returned HTTP 200 with
    `live_queries=false` and response hash
    `sha256:e12a03c843031de9695bbb610a7f5b696ee4c815ebb4dc90c2e9fa39d90a37e5`.
22. Deployed guarded `/database/runtime?live=1` returned HTTP 200 with
    `hyperdrive.status=live_readiness_passed`, `live_queries=true`, 2/2
    platform schemas, 9/9 platform umbrella tables, `platform.product`
    containing `aiphabee`, and response hash
    `sha256:84af7840b2abd0932824e2db3af674ba392dd006c650b7b47e966d8133d8f53b`.
23. `npx wrangler deploy --env="" --config apps/worker/wrangler.jsonc`
    deployed production Worker version
    `1c82f4ba-b651-4051-848f-920d8649b766`.
24. Deployed `POST /analytics/screen-ipos` returned HTTP 200 with
    `liveDataAccess=true`, `status=no_released_data`, 0 rows, provenance source
    `postgres-ipo-serving`, and response hash
    `sha256:7b1d825382212497f70bcd58db1e0cb0f20665b8ab1d22854d153298ab4ce82b`.
25. Deployed `GET /ipos/calendar?event_type=listing` returned HTTP 200 with
    `liveDataAccess=true`, `status=no_released_data`, 0 events, provenance
    source `postgres-ipo-serving`, and response hash
    `sha256:68486194985639c29021bba520856d7b42d481fed256a4eea55d7849b3921f5c`.
26. Deployed `POST /cloudflare/hyperdrive/platform-rls-fixture-smoke` first
    returned HTTP 424 with rollback confirmed. The inserted fixture workspace
    was visible without an `aiphabee.account_id` claim and with a wrong claim,
    confirming that the Cloudflare-managed Hyperdrive origin role has
    `rolbypassrls=true` and must not be treated as the app authorization
    subject.
27. A guarded `_ops/hyperdrive-apply-worker` preview applied runtime role packet
    `sha256:4405e504180008be589fbd15e2d0f84819daf10c9ab120b8d3ac33a402fef907`,
    creating/granting `aiphabee_runtime_rls` with `rolbypassrls=false` and
    `rolsuper=false`.
28. The same guarded preview applied RLS helper packet
    `sha256:240861073f6958235159f5b2bf0fbc36766638ae177d24f01100e78ac6758fb9`.
    `platform.is_workspace_member(text)` is now `SECURITY DEFINER` with an empty
    `search_path`, owned by the Hyperdrive origin role, so RLS policies can
    check membership without recursively applying RLS to their own helper read.
29. `npx wrangler deploy --env="" --config apps/worker/wrangler.jsonc` first
    deployed production Worker version `2f58ec66-deeb-4cd1-b045-6aae09a7e2a5`.
30. Deployed `POST /cloudflare/hyperdrive/platform-rls-fixture-smoke` returned
    HTTP 200 with rollback confirmed, inserted 6 synthetic fixture rows,
    activated `aiphabee_runtime_rls` for SELECT checks, and confirmed:
    no claim saw 0 workspace rows, wrong claim saw 0 workspace rows, and correct
    claim saw 1 row each for workspace, membership, workspace product access,
    entitlement policy, and workspace entitlement. Response hash:
    `sha256:7736bfea7af39fb2dc7aa3e34e1a445937ba2e97c4b75629eac80c718feec48c`.
31. On 2026-06-25T19:15:38Z, `npx wrangler deploy --env="" --config
    apps/worker/wrangler.jsonc` deployed production Worker version
    `d113e131-d759-4b9a-924e-2dffc0cfd532` with
    `platform-runtime-role-smoke` corrected to inspect the actual Hyperdrive
    login rather than a transaction-local `SET ROLE`.
32. Deployed `POST /cloudflare/hyperdrive/platform-runtime-role-smoke`
    returned HTTP 424 with response hash
    `sha256:4b46570dedfc71b8c5cb7eef2613e8d1f357bca27d60196275a4b4f99f3c201e`.
    The gate reported `runtime_role_ready=false`, `rolbypassrls=true`,
    database/schema `CREATE=true`, and workspace table owner=true for the
    old production Hyperdrive origin. That result became the production rebind
    blocker.
33. Deployed default `/database/runtime` still returned HTTP 200 with
    `live_queries=false`, preserving the no-live-query default path.
34. On 2026-06-25T19:46:15Z, the guarded production apply preview upgraded
    `aiphabee_runtime_rls` itself to `LOGIN` with a Keychain-held password under
    `aiphabee-planetscale-prod-runtime-role`. The branch-qualified PlanetScale
    username remains `aiphabee_runtime_rls.bpvsmvgwkutr`, while PostgreSQL
    `current_user` resolves to the base role `aiphabee_runtime_rls`.
35. The direct auth probe for `aiphabee_runtime_rls.bpvsmvgwkutr` passed with
    `current_user=aiphabee_runtime_rls`, `is_superuser=off`, and
    `database_create_privilege=false`.
36. `npx wrangler hyperdrive create aiphabee-prod-runtime` created production
    runtime Hyperdrive config `2ddc2108d072420c9263ff6923b4f2c3` with SQL cache
    disabled and origin user `aiphabee_runtime_rls.bpvsmvgwkutr`.
37. `apps/worker/wrangler.jsonc` now binds top-level production
    `AIPHABEE_HYPERDRIVE` to `2ddc2108d072420c9263ff6923b4f2c3`. The old
    elevated Hyperdrive config `54d5e09484534f29b22099035f071b31` is no longer
    exposed to production Worker runtime.
38. `npx wrangler deploy --env="" --config apps/worker/wrangler.jsonc`
    deployed production Worker version
    `0ab3f7d0-517e-4fa3-91b7-1ccc92e90a88`.
39. Deployed `POST /cloudflare/hyperdrive/platform-runtime-role-smoke`
    returned HTTP 200. It reported `runtime_role_ready=true`,
    `rolbypassrls=false`, `rolsuper=false`, `database_create_privilege=false`,
    `platform_schema_create_privilege=false`, workspace table owner=false,
    platform read privileges true, and `platform.workspace` forced RLS true.
    Response hash: `sha256:6193531f7ab4a6f0f5dfbbe34fca5590750d884b0179cadaccf149792cc21a03`.
40. Deployed `POST /cloudflare/hyperdrive/schema-inventory` returned HTTP 200
    with 2/2 schemas, 9/9 tables, 12/12 indexes, 9/9 forced-RLS tables,
    `database_create_privilege=false`, and response hash
    `sha256:d22fe1501e284fab169d8e051d98201687d950c5b2367aee119471c838c2e881`.
41. Deployed `POST /cloudflare/hyperdrive/smoke` returned HTTP 200 with
    `database_create_privilege=false`, `row_count=1`, and response hash
    `sha256:39701a96a519ffc42069ee0a4dca588180b0cacf164354f819609febd4bbb1c1`.
42. Deployed default `/database/runtime` returned HTTP 200 with response hash
    `sha256:7e71121a405ef075762cc87db8236df2525874f2f62f4a7e6cd65d083b9c81e4`.

Staging path:

1. `wrangler deploy --env staging --config apps/worker/wrangler.jsonc` creates
   or updates `aiphabee-worker-staging`.
2. Wrangler uses the non-inherited `env.staging.vars` block, so `APP_ENV` is
   explicitly `staging`.
3. Wrangler uses `env.staging.hyperdrive` instead of the top-level production
   Hyperdrive binding.
4. `AIPHABEE_HYPERDRIVE` points to the staging runtime Hyperdrive config
   `755ab0a9b0404e10be1f8ab1c736358a`, while `HYPERDRIVE` points to the shared
   umbrella compatibility alias `1e83eb563db44746a168175e065cc958`.
5. Existing Worker code reads `env.AIPHABEE_HYPERDRIVE`; the `HYPERDRIVE` alias
   exists only to keep this repo aligned with the shared umbrella binding shape
   used by sibling projects.
6. On 2026-06-25T17:33:22Z, `npx wrangler deploy --env staging --config
   apps/worker/wrangler.jsonc` deployed `aiphabee-worker-staging` version
   `5817caee-bb53-496a-a610-4432b15dceae`.
7. The guarded `POST /cloudflare/hyperdrive/smoke` returned HTTP 200 with
   `status=ok`, `hyperdrive_select_1_smoke=passed`, `row_count=1`, and
   hash-only response `sha256:7ee250593422c25b248da40c38281759f457f919a2e9b3ef9bfbe8ca20d8dcfa`.
8. The same smoke reported `database_create_privilege=true` for the staging
   Hyperdrive origin user.
9. The staging shared DB precheck showed 91 existing non-system tables in
   sibling-owned `public.*` and `drizzle.*` schemas, so the production
   empty-database apply path was intentionally not used.
10. A temporary `_ops/hyperdrive-apply-worker` staging preview applied only
    `deploy/database/migrations/20260623010000_platform_umbrella_schema_foundation.sql`
    through Hyperdrive, preserving existing sibling tables.
11. The migration contract now uses PostgreSQL's actual 63-byte index
    identifiers for the two long umbrella indexes, so repo-local verification
    and live `pg_indexes` readback agree.
12. Deployed `POST /cloudflare/hyperdrive/schema-inventory` returned HTTP 200
    with `status=ok`, 2/2 schemas, 9/9 tables, 12/12 indexes, 9/9 forced-RLS
    tables, `platform.product` containing `aiphabee`, and response hash
    `sha256:427fd932a849a883788a584e87ae88a61492d6003b6b1ab5ca03fe0dc7416b31`.
13. On 2026-06-25T18:28:53Z, a temporary `_ops/hyperdrive-apply-worker`
    staging preview replaced `platform.current_account_id()` and
    `platform.is_workspace_member(text)` so the account claim helper does not
    recursively read `platform.account`.
14. `POST /cloudflare/hyperdrive/platform-rls-fixture-smoke` first confirmed
    the Hyperdrive origin role has `rolbypassrls=true` and owns the platform
    workspace table, so the origin role itself is not a valid RLS enforcement
    subject.
15. The same smoke then created a transaction-local low-privilege fixture role,
    granted only SELECT/EXECUTE, inserted six synthetic platform fixture rows,
    switched to that role, and verified `aiphabee.account_id` behavior.
16. The RLS fixture smoke returned HTTP 200 with rollback confirmed: no claim
    saw 0 workspace rows, wrong claim saw 0 workspace rows, correct claim saw
    1 row each for account, workspace, membership, workspace product access,
    entitlement policy, and workspace entitlement. Response hash:
    `sha256:5d33c14a209c582ba813aa7282ccfd33039cb2f45dd05b58fca8aba4218b5a1f`.
17. On 2026-06-25T18:46:58Z, staging Worker version
    `fc68b466-6a65-45c0-809f-91ad2477bdf0` deployed the read-only runtime role
    gate.
18. Staging `POST /cloudflare/hyperdrive/platform-runtime-role-smoke` returned
    HTTP 424 with response hash
    `sha256:e90cbda7c3c67f8abad8c970b0e5bcf716c05db64c3b95a8fb9549aaa06574db`.
    The shared staging origin has the same runtime-role blocker:
    `runtime_role_ready=false`, `rolbypassrls=true`, database/schema
    `CREATE=true`, and workspace table owner=true.
19. Staging schema inventory still returned HTTP 200 after the gate, with 2/2
    schemas, 9/9 platform tables, 12/12 indexes, 9/9 forced-RLS tables, and
    response hash
    `sha256:53798b23aa2721a15662df8dbbd26a2470f7dcf777705069eee09ab97c98f0c2`.
20. On 2026-06-25T19:08:54Z, the staging apply preview upgraded a
    PlanetScale branch-qualified runtime login role for AiphaBee. The role can
    login, has `rolbypassrls=false`, `rolsuper=false`, no database/schema
    `CREATE`, and platform schema/table read privileges. The generated password
    is stored in macOS Keychain under
    `aiphabee-planetscale-staging-runtime-role`; it is not written to tracked
    docs.
21. `npx wrangler hyperdrive create aiphabee-staging-runtime` created
    Hyperdrive config `755ab0a9b0404e10be1f8ab1c736358a`, pointing to the same
    shared staging PlanetScale database but authenticating as the AiphaBee
    runtime login role. SQL cache is disabled for this dedicated config.
22. `apps/worker/wrangler.jsonc` now binds staging `AIPHABEE_HYPERDRIVE` to
    `755ab0a9b0404e10be1f8ab1c736358a` and keeps the original shared
    `1e83eb563db44746a168175e065cc958` as the `HYPERDRIVE` alias.
23. On 2026-06-25T19:11:54Z, staging Worker version
    `a17f1221-adbe-4a9d-8ac5-68333245f695` deployed the corrected actual-login
    runtime gate.
24. Staging `POST /cloudflare/hyperdrive/platform-runtime-role-smoke` returned
    HTTP 200 with response hash
    `sha256:41bc8f133a9724827d7541560e5b2c127ebf0410ac0ed4359e19e7ad721461d3`.
    It reported `runtime_role_ready=true`, `rolbypassrls=false`, no
    database/schema `CREATE`, workspace table owner=false, platform read
    privileges true, and `platform.workspace` forced RLS true.
25. Staging schema inventory and basic Hyperdrive smoke still returned HTTP
    200 after the rebind. Schema inventory response hash:
    `sha256:c9d05f818d65b4fe67cf77c9b2ffe7cfbf3d55d99662505422d6cea45b3b0542`;
    basic smoke response hash:
    `sha256:c55c2d089d355d7f6bf4ba3a28310468ce6935049e269e32b35bd3f05f1ea93c`.

Denied production path:

1. A production migration, env file, runbook, or smoke packet points AiphaBee at
   an AIMPACT or Salesko database.
2. The run is invalid even if schema names do not collide.
3. The failure reason is migration pressure: AiphaBee must be independently
   movable when data volume, compliance, plan, PITR, read replicas, or database
   engine choice changes.

## P3 Decision Rationale

Why this shape exists:

- AiphaBee is Cloudflare-first: Workers, Hyperdrive, R2, Queues, Workflows, and
  Better Auth own the application boundary.
- Supabase Storage and Supabase Auth are not part of the intended runtime.
- PlanetScale provides a smaller database-only dependency surface with
  Cloudflare billing and Hyperdrive integration.
- IPO and HK F10 data will create product-specific storage, indexing, and
  backup pressure; the database boundary must remain independently movable.

Invariant to preserve:

- AiphaBee production can be dumped, restored, replicated, upgraded, or migrated
  without copying AIMPACT/Salesko data and without coordinating their app
  migrations.
- Staging can exercise the shared umbrella schema with sibling products, but it
  must not be used as production durability or compliance evidence.
- The elevated Hyperdrive apply/admin origin can bootstrap schema and guarded
  smoke fixtures, but production and staging Worker runtime bindings must use a
  non-bypass runtime login such as `aiphabee_runtime_rls` before any
  user-scoped platform SELECT.
- A transaction-local `SET ROLE` smoke proves policy semantics only. It does
  not prove the Worker Hyperdrive origin login is least-privilege; runtime
  readiness requires the bound origin itself to be non-bypass, non-owner, and
  without database/schema `CREATE`.
- Staging preserves sibling safety by creating an AiphaBee-specific Hyperdrive
  config for the runtime login role instead of mutating the shared
  `share-staging` Hyperdrive config.
- Production preserves apply safety by keeping the elevated Hyperdrive config
  available only for guarded ops apply/readback while binding Worker runtime to
  the dedicated runtime Hyperdrive config.

Tradeoff:

- We give up Supabase Auth/RLS/Data API convenience.
- We gain a cleaner Cloudflare-centered operational model and avoid keeping an
  unused Supabase BaaS project alive only for Postgres.

10x scale first failure:

- The first production pressure point will be Postgres database size, index
  bloat, WAL, backup/PITR window, and analytical query IO, not TypeScript
  routing. Dedicated PlanetScale production ownership keeps the first
  capacity-driven migration bounded.
- The first staging pressure point will be accidental reliance on sibling
  fixtures or shared state. Staging evidence must therefore prove the Worker
  binding and umbrella schema route, not production data isolation.

## Verification Surface

Before first schema apply:

1. Confirm PlanetScale target ownership is AiphaBee-only.
2. Confirm direct connection secret exists outside tracked repo files.
3. Run `npm run check:database`.
4. Confirm the SQL inventory has no Supabase Auth/Data API dependencies.
5. Run `npm run check:planetscale-direct-preflight`.
6. Run `npm run check:database-local-dry-run`.
7. Run `npm run check:database-apply-packet`.
8. Run a direct `SELECT 1` with the direct apply user.
9. Confirm the direct apply user has `CREATE` on database `postgres`, or use the
   Cloudflare-managed Hyperdrive origin path when direct credentials are
   intentionally read-only.
10. Apply or dry-run the SQL inventory against PlanetScale.
11. Run guarded Hyperdrive `SELECT 1`.
12. Run guarded write smoke through a table created by the migration packet.
13. Deploy the production Worker with explicit top-level target `--env=""`.
14. Verify `aiphabee_runtime_rls` has `rolbypassrls=false` and `rolsuper=false`.
15. Run guarded platform RLS fixture smoke and require rollback, 0 rows without
    claim, 0 rows with wrong claim, and 1 row with the correct claim.
16. Run `POST /cloudflare/hyperdrive/platform-runtime-role-smoke`; require HTTP
    200 and `runtime_role_ready=true` before any app-level platform SELECT
    depends on DB-enforced RLS.
17. Capture hash-only evidence before enabling live Serving or ingest writes.
