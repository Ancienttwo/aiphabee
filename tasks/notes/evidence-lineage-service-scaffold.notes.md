# Notes: evidence-lineage-service-scaffold

> **Last Updated**: 2026-06-21 02:54 +08
> **Plan**: `plans/plan-evidence-lineage-service-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/evidence-lineage-service-scaffold.md`

## Decisions

- Extended `@aiphabee/evidence-lineage` instead of creating a separate package,
  because Sprint 1.2 evidence tools and service planning share lineage/source
  record semantics.
- Added an explicit no-write planner before live persistence so tool-call
  lineage can be reviewed without creating a hidden DB side effect.
- Added empty DB tables and a governance contract row as schema readiness only;
  `live_db_writes`, `partner_source_records_loaded`, and `sql_emitted` remain
  false.
- Kept MCP protocol endpoints, runtime schema serving, live route replay,
  partner rows, live DB writes, and frontend out of scope.

## Verification

- `npm run test -- packages/evidence-lineage/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run check:evidence-service`
- `npm run check:database`
- `npm run typecheck`
- `npm run check` -> 14 files, 153 tests passed
- `npx wrangler dev --config apps/worker/wrangler.jsonc --port 8787`
- `GET /evidence/runtime` -> `200 OK`, `status=evidence_lineage_service_scaffold`,
  `live_db_writes=false`, `source_record_linking=true`
- `POST /evidence/records/plan` -> `200 OK`, `status=planned_no_write`,
  `sourceRefs=1`, `liveDbWrites=false`, `sqlEmitted=false`
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`
- No lingering current-repo `wrangler dev`, `workerd`, or workflow helper
  process after verification

## Residual Blockers

- Live DB writes are disabled.
- Partner/vendor source records are absent.
- MCP protocol endpoint integration is absent.
- Runtime schema serving is absent.
- Live route replay is absent.
- Frontend citation/evidence card rendering is out of scope for this Codex
  slice.
