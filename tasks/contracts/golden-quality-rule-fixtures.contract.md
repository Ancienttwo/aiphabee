# Task Contract: golden-quality-rule-fixtures

> **Status**: Verified
> **Plan**: `plans/plan-golden-quality-rule-fixtures.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-golden-quality-rules
> **Last Updated**: 2026-06-20 15:45 +08
> **Notes File**: `tasks/notes/golden-quality-rule-fixtures.notes.md`

## Goal

Turn the golden regression hook into an executable local quality-rule gate using
a no-secret synthetic fixture corpus.

## Scope

- In scope:
  - strict `npm run test:golden`;
  - golden fixture manifest and fixture files;
  - deterministic quality-rule evaluator;
  - `PASS` / `WARN` / `HOLD` assertions;
  - `DATA_QUALITY_HOLD` assertion for held data;
  - tracker/governance/todo updates.
- Out of scope:
  - partner-approved production golden corpus;
  - 50-100 security sample volume;
  - real market-data ingestion;
  - serving-store quarantine runtime;
  - commercial cost/pricing sign-off;
  - frontend.

## Allowed Paths

```yaml
allowed_paths:
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/golden-quality-commercial-baseline.md
  - docs/governance/golden-quality-rule-fixtures.md
  - docs/governance/golden-regression-hook.md
  - docs/governance/phase0-traceability-closeout.md
  - package.json
  - plans/plan-golden-quality-rule-fixtures.md
  - scripts/check-golden-regression.mjs
  - tasks/contracts/golden-quality-rule-fixtures.contract.md
  - tasks/notes/golden-quality-rule-fixtures.notes.md
  - tasks/todos.md
  - tests/golden/**
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - tests/golden/manifest.json
    - scripts/check-golden-regression.mjs
    - docs/governance/golden-quality-rule-fixtures.md
  content_checks:
    - "npm run test:golden requires fixtures"
    - "Synthetic fixtures cover PASS, WARN, and HOLD states"
    - "HOLD fixtures require DATA_QUALITY_HOLD"
    - "Docs do not claim production partner corpus completion"
  commands_succeed:
    - npm run test:golden
    - npm run check
    - scripts/check-task-workflow.sh --strict
```

## Acceptance Notes

- This task completes executable v0 golden fixtures and quality-rule assertions.
- Production partner golden corpus, serving-store quarantine behavior, and
  commercial cost review remain separate gates.

## Rollback Point

- Revert the commit that adds the fixture corpus and strict golden gate.
