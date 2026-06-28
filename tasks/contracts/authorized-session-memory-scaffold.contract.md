# Task Contract: authorized-session-memory-scaffold

> **Status**: Verified
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint31-authorized-session-memory-scaffold
> **Last Updated**: 2026-06-21 19:07 +08
> **Notes File**:
> `tasks/notes/authorized-session-memory-scaffold.notes.md`

## Goal

Close the Sprint 3.1 AGT-10 backend acceptance gap by proving session memory can
only contain authorized preference/consent information and can be viewed,
edited, or deleted through explicit user-visible controls.

## Scope

- In scope:
  - `GET /account/runtime` `authorized_memory` capability;
  - `POST /account/authorized-memory/plan`;
  - allowed memory keys for locale, response depth, currency, workspace,
    tool/MCP consent, retention acknowledgement, and briefing consent;
  - forbidden payload classes for prompts, generated answers, financial values,
    raw email, passwords, OAuth material, and session secrets;
  - unsupported-key blocking before planned writes;
  - empty `aiphabee_core.authorized_session_memory` and governance table scaffold;
  - `check:authorized-session-memory` and database contract update;
  - tracker, governance, and deferred-ledger updates.
- Out of scope:
  - live memory reads or writes;
  - frontend settings UI;
  - generated-answer memory extraction;
  - credential storage;
  - prompt or research-result persistence.

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /account/runtime advertises authorized_memory"
    - "POST /account/authorized-memory/plan supports view, upsert, and delete"
    - "Allowed memory keys are explicit and authorization/consent scoped"
    - "Unsupported memory keys block before planned writes"
    - "Policy marks raw prompts, generated answers, financial values, and credential material as not stored"
    - "Schema scaffold includes aiphabee_core.authorized_session_memory and aiphabee_governance.authorized_session_memory_contract"
    - "No live memory reads, persistent writes, SQL execution, frontend changes, or credential storage are introduced"
  commands_succeed:
    - npm run typecheck --workspace @aiphabee/account-runtime
    - npm run typecheck --workspace @aiphabee/worker
    - npm run test -- packages/account-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:authorized-session-memory
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

- This task completes no-live backend contract coverage for AGT-10 only.
- It does not claim real memory persistence or frontend user controls.

## Rollback Point

- Revert the commit that adds authorized memory runtime behavior, route,
  migration scaffold, contract/checker, and tracker/governance docs.
