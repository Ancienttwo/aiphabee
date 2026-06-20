# Task Contract: data-access-gateway-default-deny-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-data-access-gateway-default-deny-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint11-data-access-gateway-default-deny
> **Last Updated**: 2026-06-20 16:20 +08
> **Notes File**:
> `tasks/notes/data-access-gateway-default-deny-scaffold.notes.md`

## Goal

Create a repo-local Data Access Gateway scaffold that enforces default-deny
rights, field redaction, row/time limits, cache-key versioning, and
`DATA_QUALITY_HOLD` before any real market data is exposed.

## Scope

- In scope:
  - gateway evaluator package;
  - no-secret gateway contract;
  - contract checker;
  - Worker runtime/access-check routes;
  - unit tests and runtime smoke;
  - tracker/governance updates.
- Out of scope:
  - real securities master data;
  - partner field rights matrix;
  - real Serving Store reads;
  - persistent usage ledger;
  - MCP/API redistribution endpoint;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - apps/worker/**
  - deploy/README.md
  - deploy/gateway/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/data-access-gateway-default-deny-scaffold.md
  - package-lock.json
  - package.json
  - packages/data-access-gateway/**
  - plans/plan-data-access-gateway-default-deny-scaffold.md
  - scripts/check-data-access-gateway-contract.mjs
  - tasks/contracts/data-access-gateway-default-deny-scaffold.contract.md
  - tasks/notes/data-access-gateway-default-deny-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  commands_succeed:
    - npm run check:data-gateway
    - npm run test
    - npm run typecheck
    - npm run check
    - scripts/check-task-workflow.sh --strict
  content_checks:
    - "Default channel status is default_deny"
    - "Unapproved fields return DATA_NOT_LICENSED"
    - "Quality-held data returns DATA_QUALITY_HOLD"
    - "Cache key includes data/methodology/rights versions and allowed fields"
    - "Worker routes expose no live market data surface"
  smoke_tests:
    - "GET /gateway/runtime returns default_rights_status=default_deny"
    - "POST /gateway/access-check returns DATA_NOT_LICENSED by default"
    - "POST /gateway/access-check with HOLD returns DATA_QUALITY_HOLD"
```

## Acceptance Notes

- This task completes the gateway guard scaffold only.
- Sprint 1.1 real data persistence, rights execution from partner matrix, and
  usage ledger persistence remain separate tasks.

## Rollback Point

- Revert the commit that adds this gateway scaffold.
