# Task Contract: localized-response-contract

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint31-localized-response-contract
> **Last Updated**: 2026-06-21 18:56 +08
> **Notes File**:
> `tasks/notes/localized-response-contract.notes.md`

## Goal

Close the Sprint 3.1 backend acceptance gap for AGT-11, AGT-12, US-W07, and
PRD §12.4 by proving response language, response depth, and financial
terminology choices do not alter data, methodology, evidence, source records,
currency, units, or conclusions.

## Scope

- In scope:
  - `GET /agent/runtime` `response_presentation` capability;
  - `POST /agent/runs/plan` locale/depth request parsing;
  - `answer_evidence_contract.presentation` plan output;
  - supported locales: `zh-Hant`, `zh-Hans`, `en`;
  - supported response depths: `newbie`, `professional`;
  - bilingual/English glossary entries for ROE, free cash flow, operating
    profit, total-return adjustment, and abnormal return;
  - invariant rules for numeric values, source record IDs, evidence refs,
    methodology versions, currency, units, and conclusions;
  - `check:localized-response` contract checker and root `check` integration;
  - tracker, governance, and deferred-ledger updates.
- Out of scope:
  - frontend language or mode controls;
  - live model calls;
  - generated translation output;
  - post-generation text validation;
  - live tool execution or evidence binding.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /agent/runtime advertises response_presentation"
    - "POST /agent/runs/plan accepts locale/response_locale/language and response_depth"
    - "Plan output normalizes locales to zh-Hant, zh-Hans, or en"
    - "Plan output normalizes response depth to newbie or professional"
    - "Locale switching preserves data values, source_record_ids, evidence refs, methodology versions, currency, units, and numeric precision"
    - "Response depth switching preserves data values, source_record_ids, evidence refs, methodology versions, currency, units, and conclusions"
    - "Financial terminology glossary includes Chinese and English terms plus methodology-note requirements"
    - "No model calls, actual tool execution, frontend changes, or live translation are introduced"
  commands_succeed:
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run typecheck --workspace @aiphabee/worker
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:localized-response
    - npm run typecheck
    - npm run test
    - git diff --check
    - git diff --name-only -- apps/web
    - scripts/check-task-workflow.sh --strict
  known_environment_blockers:
    - "npm run check reaches npm run build after passing lint/typecheck/tests/golden/contracts, then fails only at delegated @aiphabee/web Vite build because Node v22.12.0 lacks node:module.registerHooks"
```

## Acceptance Notes

- This task completes backend contract coverage for language/depth/terminology
  invariants only.
- It does not claim user-visible frontend controls or production translation
  quality.

## Rollback Point

- Revert the commit that adds response presentation contract behavior,
  checker, tracker/governance docs, and Worker request parsing.
