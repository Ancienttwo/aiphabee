# PlanetScale Direct Preflight

> Status: Keychain-backed direct smoke passed
> Last Updated: 2026-06-26
> Boundary: `docs/governance/aiphabee-planetscale-boundary.md`

This slice adds a repeatable local preflight before any direct PlanetScale
schema dry-run or apply. It does not store a password, retrieve a password by
default, apply migrations, or print a database URL.

## P1 Architecture Map

| Surface | Authority | Boundary |
|---|---|---|
| Contract | `deploy/database/planetscale-direct-preflight.contract.json` | Non-secret target metadata, commands, and safe-output rules |
| Checker | `scripts/check-planetscale-direct-preflight.mjs` | Validates contract shape, package script wiring, local tool presence, and credential presence |
| Package script | `npm run check:planetscale-direct-preflight` | Safe default check; exits zero when only the direct credential is missing |
| Direct apply user | `pscale_api_yn66uahpa46b.bpvsmvgwkutr` | Local direct credential used for `SELECT 1` and schema apply |
| Hyperdrive origin user | `pscale_api_9jnxj6nh3nb8.bpvsmvgwkutr` | Cloudflare origin credential; not used by the direct apply preflight |
| Direct secret | `PLANETSCALE_DATABASE_URL` or macOS Keychain | Required only for direct `SELECT 1` and schema apply |
| Schema inventory | `deploy/database/migrations/*` | Existing Postgres-compatible SQL inventory retained until later directory rename |

Out of scope:

- Running schema apply against PlanetScale.
- Writing or committing the PlanetScale password.
- Replacing Hyperdrive smoke evidence.
- Renaming `deploy/database/migrations`.

## P2 Concrete Trace

The safe default path is:

1. `npm run check:planetscale-direct-preflight` reads the direct preflight
   contract, database migration contract, boundary doc, and `package.json`.
2. The checker verifies the contract points to `planetscale_postgres`, the
   `aiphabee-prod` target, the direct apply user, and the package script.
3. The checker probes whether `psql` exists without requiring it for CI.
4. The checker checks whether `PLANETSCALE_DATABASE_URL` exists without printing
   the value.
5. On macOS, it checks whether the named Keychain item exists without using
   `-w`, so the password value is not printed.
6. If neither source is present, the status is `blocked_missing_direct_secret`
   and exit code remains zero for readiness reporting.

The direct smoke path is explicit:

```bash
node scripts/check-planetscale-direct-preflight.mjs --smoke-select-1
```

That path requires `PLANETSCALE_DATABASE_URL` and runs a read-only `SELECT 1`
through `psql`. The checker parses the URL, passes the password through
`PGPASSWORD`, uses a local CA bundle for `sslmode=verify-full`, and does not
pass the full URL as a process argument. It returns only hashes and metadata.
On failure it emits a safe failure enum such as
`password_authentication_failed`, `missing_ssl_root_certificate`, or
`branch_required`; raw `psql` stderr is never printed.
To build the connection from Keychain, the operator must opt in:

```bash
node scripts/check-planetscale-direct-preflight.mjs --smoke-select-1 --use-keychain
```

Verified on 2026-06-25T16:40:55Z:

```json
{
  "credential_source": "macos_keychain",
  "operation": "select_1",
  "result_hash": "sha256:6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
  "row_count": 1,
  "status": "ok"
}
```

## P3 Design Decision

The checker is deliberately split into safe readiness and explicit remote smoke
because direct PlanetScale access is more privileged than Hyperdrive `SELECT 1`.
The invariant is that repo checks can prove wiring and blockers without needing
local production credentials, while any command that can touch PlanetScale must
be opt-in, avoid printing secret material, and avoid placing the database URL in
process arguments. The failure classifier is intentionally coarse: it is for
operator routing, not for exposing provider error payloads.

At 10x scale, this preflight is not the migration runner. The first failure would
be long-running DDL or lock behavior in the SQL inventory, so schema apply still
needs a separate migration execution policy after direct connectivity is proven.
