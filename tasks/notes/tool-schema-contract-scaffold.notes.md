# Notes: tool-schema-contract-scaffold

> **Last Updated**: 2026-06-21 02:39 +08
> **Plan**: `plans/plan-tool-schema-contract-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/tool-schema-contract-scaffold.md`

## Decisions

- Added one centralized schema contract file rather than scattering 18 schema
  files, because the registry already owns schema IDs and the current need is
  deterministic contract validation.
- Kept runtime request validation and MCP protocol schema serving out of scope.
- Required `additionalProperties=false` on inputs and blocked arbitrary
  `sql`/`sql_text`/`url`/`endpoint` input properties in the checker.

## Verification

- `npm run check:tool-schemas`
- `npm run check` -> 14 files, 148 tests passed
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, and `packages`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Runtime JSON Schema validation is absent.
- MCP protocol schema serving is absent.
- Per-tool golden fixture files and response validation remain absent.
- Durable Evidence/Lineage service storage is absent.
