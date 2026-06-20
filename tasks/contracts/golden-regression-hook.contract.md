# Task Contract: golden-regression-hook

> **Status**: Verified
> **Plan**: `plans/plan-golden-regression-hook.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-golden-regression
> **Last Updated**: 2026-06-20 14:45 +08
> **Notes File**: `tasks/notes/golden-regression-hook.notes.md`

## Goal

Install the CI mount point for future golden sample regression without claiming
that golden fixtures already exist.

## Scope

- In scope:
  - root `test:golden` command;
  - manifest validator script;
  - CI hook step;
  - fixture directory README;
  - tracker/todo/governance updates.
- Out of scope:
  - real fixture data;
  - quality rule engine;
  - market-data tool implementation;
  - partner sample approval;
  - commercial cost review.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/golden-quality-commercial-baseline.md
  - docs/governance/golden-regression-hook.md
  - docs/governance/phase0-traceability-closeout.md
  - package.json
  - plans/plan-golden-regression-hook.md
  - scripts/check-golden-regression.mjs
  - tasks/contracts/golden-regression-hook.contract.md
  - tasks/notes/golden-regression-hook.notes.md
  - tasks/todos.md
  - tests/golden/README.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - scripts/check-golden-regression.mjs
    - tests/golden/README.md
    - docs/governance/golden-regression-hook.md
  content_checks:
    - "npm run test:golden exists"
    - "CI includes Golden Regression Hook"
    - "Missing fixtures report not_configured instead of fake pass"
    - "Tracker keeps executable fixtures pending"
  commands_succeed:
    - npm run test:golden
    - npm run check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes only the golden regression hook/mount point.
- Real fixtures and executable quality rules remain required before Sprint 0.3
  exit gates can turn green.

## Rollback Point

- Revert the commit that adds this hook and status update.
