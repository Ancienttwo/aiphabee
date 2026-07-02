# Task Contract: provider-secret-stores-contract

> **Status**: Verified
> **Plan**: `plans/plan-provider-secret-stores-contract.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-provider-secret-stores
> **Last Updated**: 2026-06-20 15:20 +08
> **Notes File**: `tasks/notes/provider-secret-stores-contract.notes.md`

## Goal

Create a verified provider secret stores, rotation, and emergency revocation
contract for Cloudflare and GitHub Actions without storing or mutating real
secrets.

## Scope

- In scope:
  - provider store manifest;
  - rotation cadence and emergency revocation SLA;
  - no-secret runbook;
  - checker that matches secret variables in `deploy/env/env.schema.json`;
  - Worker no-secret runtime route;
  - tracker/governance updates.
- Out of scope:
  - writing real provider secrets;
  - listing or downloading existing provider secrets;
  - running `wrangler secret` or `gh secret` against live accounts;
  - production cutover;
  - secret scanning SaaS integration.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - .gitignore
  - apps/worker/**
  - deploy/README.md
  - deploy/runbooks/secret-rotation-emergency-revocation.md
  - deploy/secrets/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/env-secrets-contract.md
  - docs/governance/phase0-traceability-closeout.md
  - docs/governance/provider-secret-stores-contract.md
  - package.json
  - plans/plan-provider-secret-stores-contract.md
  - scripts/check-secret-stores-contract.mjs
  - tasks/contracts/provider-secret-stores-contract.contract.md
  - tasks/notes/provider-secret-stores-contract.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - deploy/secrets/stores.contract.json
    - deploy/runbooks/secret-rotation-emergency-revocation.md
    - scripts/check-secret-stores-contract.mjs
    - docs/governance/provider-secret-stores-contract.md
  content_checks:
    - "Contract covers Cloudflare Workers and GitHub Actions"
    - "Contract secret_names match secret variables in env schema"
    - "Rotation cadence is <= 180 days"
    - "Emergency revocation SLA is <= 30 minutes"
    - "No secret values, tokens, database URLs, or provider IDs are committed"
  commands_succeed:
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /secrets/runtime returns 200 and secret_values_available=false"
```

## Acceptance Notes

- This task completes the provider secret-store contract and runbook leaf only.
- Live provider provisioning and rotation smoke remain later backend/runtime
  tasks.

## Rollback Point

- Revert the commit that adds this scaffold and status update.
