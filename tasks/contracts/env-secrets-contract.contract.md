# Task Contract: env-secrets-contract

> **Status**: Verified
> **Plan**: `plans/plan-env-secrets-contract.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-env-secrets
> **Last Updated**: 2026-06-20 14:58 +08
> **Notes File**: `tasks/notes/env-secrets-contract.notes.md`

## Goal

Create a repo-local dev/staging/prod environment contract and validation hook
without committing any real secret values.

## Scope

- In scope:
  - env schema;
  - names-only templates;
  - validator script;
  - root and CI check wiring;
  - tracker/todo/governance updates.
- Out of scope:
  - provider secret creation;
  - Cloudflare/GitHub/Supabase environment mutation;
  - rotation automation;
  - production deployment.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - deploy/env/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/env-secrets-contract.md
  - docs/governance/phase0-traceability-closeout.md
  - package.json
  - plans/plan-env-secrets-contract.md
  - scripts/check-env-contract.mjs
  - tasks/contracts/env-secrets-contract.contract.md
  - tasks/notes/env-secrets-contract.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - deploy/env/env.schema.json
    - deploy/env/dev.env.example
    - deploy/env/staging.env.example
    - deploy/env/prod.env.example
    - scripts/check-env-contract.mjs
    - docs/governance/env-secrets-contract.md
  content_checks:
    - "Every env example value is blank"
    - "Secret variables are flagged in schema"
    - "CI includes Env Contract"
  commands_succeed:
    - npm run check:env
    - npm run check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes repo-local env contract and validation only.
- Provider secret stores and rotation remain deployment tasks.

## Rollback Point

- Revert the commit that adds the env contract and status update.
