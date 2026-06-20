# Task Contract: cloudflare-bindings-contract

> **Status**: Verified
> **Plan**: `plans/plan-cloudflare-bindings-contract.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-cloudflare-bindings
> **Last Updated**: 2026-06-20 15:10 +08
> **Notes File**: `tasks/notes/cloudflare-bindings-contract.notes.md`

## Goal

Create a validated Cloudflare binding contract covering Workers, Workflows,
Queues, Cron, Durable Objects, R2, KV, AI Gateway, and Hyperdrive without
provisioning real resources.

## Scope

- In scope:
  - binding manifest;
  - validation script;
  - root and CI check wiring;
  - tracker/todo/governance updates.
- Out of scope:
  - creating Cloudflare resources;
  - adding fake resource IDs;
  - production/staging deployment;
  - provider smoke tests.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - deploy/cloudflare/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/cloudflare-bindings-contract.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/phase0-traceability-closeout.md
  - package.json
  - plans/plan-cloudflare-bindings-contract.md
  - scripts/check-cloudflare-bindings-contract.mjs
  - tasks/contracts/cloudflare-bindings-contract.contract.md
  - tasks/notes/cloudflare-bindings-contract.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - deploy/cloudflare/bindings.contract.json
    - scripts/check-cloudflare-bindings-contract.mjs
    - docs/governance/cloudflare-bindings-contract.md
  content_checks:
    - "Every required Cloudflare binding type is represented"
    - "Contract contains smoke test text for each binding"
    - "Contract contains no IDs, tokens, secrets, or values"
    - "CI includes Cloudflare Bindings Contract"
  commands_succeed:
    - npm run check:bindings
    - npm run check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes binding planning/contract validation only.
- Resource provisioning and smoke tests remain deployment tasks.

## Rollback Point

- Revert the commit that adds the binding contract and status update.
