# Task Contract: pre-tool-call-resolution-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-pre-tool-call-resolution-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-pre-tool-call-resolution
> **Last Updated**: 2026-06-21 03:34 +08
> **Notes File**:
> `tasks/notes/pre-tool-call-resolution-scaffold.notes.md`

## Goal

Create a no-model pre-tool-call resolution scaffold that resolves security,
time, currency, and methodology context before tool planning, and returns
blocking clarification for critical ambiguity.

## Scope

- In scope:
  - `createPreToolCallResolution()` in `@aiphabee/agent-runtime`;
  - Worker `POST /agent/runs/preflight`;
  - preflight result embedded in `POST /agent/runs/plan`;
  - explicit security symbol resolution;
  - prompt-based `00700.HK` / Tencent inference;
  - ambiguous `ABC` clarification with candidate list;
  - time/as_of resolution or latest-available assumption;
  - currency resolution or primary-security currency assumption;
  - methodology resolution or split-adjusted/latest-reported assumptions;
  - tool readiness flag and blocked tool list;
  - contract checker and tracker/governance updates.
- Out of scope:
  - real NLP/entity resolver;
  - actual `resolve_security` tool call;
  - live market/calendar data;
  - model calls;
  - frontend clarification UI.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/pre-tool-call-resolution.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/pre-tool-call-resolution-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-pre-tool-call-resolution-scaffold.md
  - scripts/check-pre-tool-call-resolution-contract.mjs
  - tasks/contracts/pre-tool-call-resolution-scaffold.contract.md
  - tasks/notes/pre-tool-call-resolution-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "POST /agent/runs/preflight resolves explicit 00700.HK to eq_hk_00700"
    - "POST /agent/runs/preflight resolves as_of, currency, and methodology when supplied"
    - "POST /agent/runs/preflight records assumptions for latest_available time, primary security currency, split_adjusted prices, and latest_reported financial facts when omitted"
    - "POST /agent/runs/preflight returns needs_clarification for ambiguous ABC instead of silently selecting a candidate"
    - "POST /agent/runs/plan embeds pre_tool_call_resolution"
    - "Tool readiness blocks requested tools while clarification is required"
    - "No model calls, actual tool calls, live data, or frontend changes are claimed"
  commands_succeed:
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:pre-tool-call-resolution
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /agent/runs/preflight returns ready for explicit 00700.HK/as_of/HKD/methodology"
    - "POST /agent/runs/preflight returns needs_clarification for ABC"
    - "POST /agent/runs/plan includes pre_tool_call_resolution"
```

## Acceptance Notes

- This task completes a deterministic AGT-02 scaffold for Sprint 1.3.
- It does not replace a future live entity resolver, model-driven clarification
  UI, or real tool execution.

## Rollback Point

- Revert the commit that adds pre-tool-call resolution behavior, Worker
  preflight route, preflight contract checker, and tracker/governance changes.
