# Task Contract: get-security-profile-tool-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-get-security-profile-tool-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint12-get-security-profile-tool
> **Last Updated**: 2026-06-21 01:05 +08
> **Notes File**:
> `tasks/notes/get-security-profile-tool-scaffold.notes.md`

## Goal

Create a no-live `get_security_profile` tool scaffold that returns synthetic
company/security profile, listing status, currency, lifecycle, and coverage
metadata for stable `instrument_id` inputs.

## Scope

- In scope:
  - `@aiphabee/security-tools` profile fixture rows;
  - `instrument_id` profile lookup;
  - listed, suspended, and delisted fixture states;
  - coverage metadata for profile, quote, price, facts, actions, lineage, and
    entitlements;
  - `POST /tools/get-security-profile` Worker route;
  - standard success/error envelope usage;
  - registry entry update for `get_security_profile`;
  - repo-level security tools contract checker update;
  - tracker/governance updates.
- Out of scope:
  - live security master DB reads;
  - partner market data rows;
  - MCP endpoint implementation;
  - Evidence/Lineage service implementation;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/tools/get-security-profile.contract.json
  - deploy/tools/registry.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/get-security-profile-tool-scaffold.md
  - docs/governance/p0-traceability-ledger.md
  - docs/governance/resolve-security-tool-scaffold.md
  - docs/governance/shared-tool-registry-scaffold.md
  - package-lock.json
  - package.json
  - packages/security-tools/**
  - packages/tool-registry/**
  - plans/plan-get-security-profile-tool-scaffold.md
  - scripts/check-security-tools-contract.mjs
  - scripts/check-tool-registry-contract.mjs
  - tasks/contracts/get-security-profile-tool-scaffold.contract.md
  - tasks/notes/get-security-profile-tool-scaffold.notes.md
  - tasks/notes/resolve-security-tool-scaffold.notes.md
  - tasks/notes/shared-tool-registry-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "Known instrument_id returns a synthetic profile with currency and coverage metadata"
    - "Listed, suspended, and delisted states are covered by fixtures"
    - "Unknown instrument_id returns NOT_FOUND through the Worker route"
    - "Empty instrument_id returns SCOPE_DENIED through the Worker route"
    - "Registry marks get_security_profile as scaffold while liveDataAccess remains false"
    - "No live DB reads, arbitrary SQL, partner rows, MCP endpoint, or frontend changes are committed"
  commands_succeed:
    - npm run test -- packages/security-tools/src/index.test.ts packages/tool-registry/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:security-tools
    - npm run check:tool-registry
    - npm run typecheck
    - npm run test
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /tools/get-security-profile with eq_hk_00700 returns listingStatus=listed"
    - "POST /tools/get-security-profile with eq_hk_08001 returns listingStatus=suspended"
    - "GET /tools/runtime reports get_security_profile handlerReady=true"
```

## Acceptance Notes

- This task completes a no-live `get_security_profile` scaffold only.
- It does not replace partner-approved security master data or live database
  reads.
- Other Sprint 1.2 tools remain unimplemented.

## Rollback Point

- Revert the commit that adds profile fixtures, the Worker
  get-security-profile route, registry status update, contract checker update,
  and tracker update.
