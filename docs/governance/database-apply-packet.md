# Database Apply Packet

> Status: local apply packet hash locked
> Last Updated: 2026-06-26
> Contract: `deploy/database/apply-packet.contract.json`

This slice locks the exact migration packet that passed local dry-run. It does
not apply SQL to PlanetScale. It gives the remote apply step a stable content
fingerprint, so a later password fix cannot accidentally apply a different SQL
inventory than the one already checked.

## P1 Architecture Map

| Surface | Authority | Boundary |
|---|---|---|
| Migration contract | `deploy/database/migrations.contract.json` | Lists the active SQL inventory |
| Local dry-run | `deploy/database/local-dry-run.contract.json` | Proves all listed SQL files apply to temporary local Postgres |
| Apply packet | `deploy/database/apply-packet.contract.json` | Locks file order, file count, total size, and aggregate content hash |
| Checker | `scripts/check-database-apply-packet.mjs` | Recomputes per-file hashes and aggregate packet hash |
| Package script | `npm run check:database-apply-packet` | Safe no-network verification |

Out of scope:

- Remote PlanetScale apply.
- Connection string handling.
- Data load or data migration.

## P2 Concrete Trace

1. The checker reads `deploy/database/migrations.contract.json`.
2. It confirms the migration list is sorted and matches `supabase/migrations`.
3. It hashes each SQL file as `{ file, sha256, size_bytes }`.
4. It joins those JSON rows with newline separators and hashes the packet.
5. It compares the count, first file, last file, total bytes, and aggregate hash
   against `deploy/database/apply-packet.contract.json`.

Current packet:

```json
{
  "first_file": "supabase/migrations/20260620071000_phase0_foundation.sql",
  "last_file": "supabase/migrations/20260625002000_hkex_news_ingest_foundation.sql",
  "migration_count": 66,
  "packet_hash": "sha256:12962e56e3d436227adf4d857c77e62a22730e62407323b3adb417e352ee1523",
  "total_size_bytes": 294237
}
```

## P3 Design Decision

This is intentionally a hash gate, not a migration runner. The invariant is:
remote apply must use the same SQL packet that passed `npm run
check:database-local-dry-run`. If any SQL file changes, the packet hash fails
until the local dry-run and packet contract are updated together.

At 10x scale, this still does not solve lock duration or PlanetScale-specific
behavior; it only removes apply-order and silent-drift risk.
