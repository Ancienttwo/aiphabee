# Notes: tool-golden-fixtures-scaffold

> **Last Updated**: 2026-06-21 02:45 +08
> **Plan**: `plans/plan-tool-golden-fixtures-scaffold.md`
> **Runtime Evidence**:
> `docs/governance/tool-golden-fixtures-scaffold.md`

## Decisions

- Extended the existing golden regression hook instead of adding a separate
  command, so root `npm run check` continues to own golden enforcement.
- Added one synthetic expected-response fixture per registered tool.
- Kept live HTTP replay, partner-approved production corpus, and full JSON
  Schema response validation out of scope.

## Verification

- `npm run test:golden` -> 8 quality samples and 9 tool samples passed
- `npm run check` -> 14 files, 148 tests passed
- `git diff --check`
- Secret-like pattern scan across `apps`, `deploy`, `docs`, `plans`,
  `scripts`, `supabase`, `tasks`, `packages`, and `tests`
- `git diff --name-only -- apps/web` -> no changed files
- `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Partner-approved production golden corpus remains absent.
- Live route replay is absent.
- Full JSON Schema response validation is absent.
- Durable Evidence/Lineage service storage is absent.
