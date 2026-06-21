# Task Contract: agent-runtime-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-agent-runtime-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-agent-runtime
> **Last Updated**: 2026-06-20 14:47 +08
> **Notes File**: `tasks/notes/agent-runtime-scaffold.notes.md`

## Goal

Create a verified AI SDK v7 Agent Runtime skeleton on Cloudflare Worker without
configuring real model providers or market-data tools.

## Scope

- In scope:
  - AI SDK v7 beta dependency;
  - provider-agnostic runtime package;
  - stop condition and step-limit boundary;
  - registered tool allowlist policy;
  - Worker capability and dry-run routes;
  - tests and tracker/governance updates.
- Out of scope:
  - real model provider calls;
  - OpenAI/AI Gateway/Workers AI credentials;
  - market-data tool execution;
  - persistent run store;
  - OTel/eval logging;
  - Workflow handoff.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/agent-runtime-scaffold.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/phase0-traceability-closeout.md
  - package-lock.json
  - packages/agent-runtime/**
  - packages/data-contracts/**
  - plans/plan-agent-runtime-scaffold.md
  - tasks/contracts/agent-runtime-scaffold.contract.md
  - tasks/notes/agent-runtime-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - packages/agent-runtime/src/index.ts
    - apps/worker/src/index.ts
    - docs/governance/agent-runtime-scaffold.md
  content_checks:
    - "Runtime reports AI SDK v7 beta target"
    - "Runtime reports no model calls, market data, or MCP redistribution"
    - "Dry-run route rejects unregistered tools"
    - "No API keys or provider secrets are committed"
  commands_succeed:
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /agent/runtime returns 200"
    - "POST /agent/runs/dry-run returns 200 for registered tools"
    - "POST /agent/runs/dry-run returns 403 for unregistered tools"
```

## Acceptance Notes

- This task completes the Agent Runtime skeleton leaf only.
- Real streaming/model execution remains a later backend/runtime task.

## Rollback Point

- Revert the commit that adds this skeleton and status update.
