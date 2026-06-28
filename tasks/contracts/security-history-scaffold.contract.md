# Task Contract: security-history-scaffold

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint31-security-history-scaffold
> **Last Updated**: 2026-06-21 19:18 +08
> **Notes File**:
> `tasks/notes/security-history-scaffold.notes.md`

## Goal

Close the Sprint 3.1 SEC-05 backend acceptance gap by proving historical
security names, industries, and index constituent memberships can be resolved
as of the requested date without using current classifications as fallback.

## Scope

- In scope:
  - `@aiphabee/security-tools` `getSecurityHistory()`;
  - `POST /tools/get-security-history`;
  - required `as_of` / `asOf` input;
  - active historical name, industry, and constituent membership output;
  - explicit no-latest fallback policy for name, classification, and
    constituents;
  - standard envelope success and error behavior;
  - empty `aiphabee_core.security_name_history`, `aiphabee_core.security_industry_history`,
    `aiphabee_core.index_constituent_history`, and governance table scaffold;
  - `check:security-history` and database contract update;
  - tracker, governance, and deferred-ledger updates.
- Out of scope:
  - live partner history rows;
  - MCP registration;
  - frontend display;
  - live screening/backtest execution;
  - DB reads or writes.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "POST /tools/get-security-history returns historical name, industry, and constituent memberships"
    - "as_of is required and missing as_of returns POINT_IN_TIME_UNAVAILABLE"
    - "Policy marks usesLatestName, usesLatestClassification, and usesLatestConstituents as false"
    - "Synthetic Tencent fixture shows 2017 industry differs from current industry"
    - "Synthetic Tencent fixture shows HSTECH membership appears only after 2020-07-27"
    - "Schema scaffold includes security name, industry, index constituent, and governance history tables"
    - "No live data access, MCP registration, frontend changes, arbitrary SQL, arbitrary URL, or persistent writes are introduced"
  commands_succeed:
    - npm run typecheck --workspace @aiphabee/security-tools
    - npm run typecheck --workspace @aiphabee/worker
    - npm run test -- packages/security-tools/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:security-history
    - npm run check:database
    - npm run typecheck
    - npm run test
    - git diff --check
    - git diff --name-only -- apps/web
    - scripts/check-task-workflow.sh --strict
  known_environment_blockers:
    - "npm run check reaches npm run build after passing lint/typecheck/tests/golden/contracts, then fails only at delegated @aiphabee/web Vite build because Node v22.12.0 lacks node:module.registerHooks"
```

## Acceptance Notes

- This task completes no-live backend contract coverage for SEC-05 only.
- It does not claim live historical constituent feeds or frontend history
  rendering.

## Rollback Point

- Revert the commit that adds security history package behavior, route,
  migration scaffold, contract/checker, and tracker/governance docs.
