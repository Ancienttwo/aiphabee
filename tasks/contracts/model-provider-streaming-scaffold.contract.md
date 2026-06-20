# Task Contract: model-provider-streaming-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-model-provider-streaming-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: gate0-model-provider-streaming
> **Last Updated**: 2026-06-20 15:25 +08
> **Notes File**: `tasks/notes/model-provider-streaming-scaffold.notes.md`

## Goal

Create a verified no-secret model provider and streaming execution scaffold for
AI SDK v7 on Cloudflare Workers, while preventing live model calls until AI
Gateway and safety dependencies are provisioned.

## Scope

- In scope:
  - Cloudflare AI Gateway provider contract;
  - AI SDK v7 execution API declaration;
  - guarded streaming route;
  - model-provider contract checker;
  - shared model-provider-not-configured error code;
  - tracker/governance updates.
- Out of scope:
  - real `generateText` / `streamText` calls;
  - real Cloudflare AI Gateway requests;
  - provider API keys or account IDs;
  - token/cost ledger persistence;
  - evidence-binding validation against generated output;
  - UI streaming.

## Allowed Paths

```yaml
allowed_paths:
  - .github/workflows/ci.yml
  - apps/worker/**
  - deploy/README.md
  - deploy/model-providers/**
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/agent-runtime-scaffold.md
  - docs/governance/engineering-runtime-scaffold.md
  - docs/governance/model-provider-streaming-scaffold.md
  - docs/governance/phase0-traceability-closeout.md
  - package.json
  - packages/data-contracts/**
  - plans/plan-model-provider-streaming-scaffold.md
  - scripts/check-model-provider-contract.mjs
  - tasks/contracts/model-provider-streaming-scaffold.contract.md
  - tasks/notes/model-provider-streaming-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  files_exist:
    - deploy/model-providers/providers.contract.json
    - scripts/check-model-provider-contract.mjs
    - docs/governance/model-provider-streaming-scaffold.md
  content_checks:
    - "Contract uses AI SDK v7 generateText and streamText names"
    - "Cloudflare AI Gateway is planned, not provisioned"
    - "Dry-run is wired, generateText is planned, streamText is guarded"
    - "Live model calls and streaming are disabled"
    - "No API keys, account IDs, provider keys, or secret values are committed"
  commands_succeed:
    - npm run check
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "GET /agent/model-provider returns model_calls_enabled=false"
    - "POST /agent/runs/stream returns MODEL_PROVIDER_NOT_CONFIGURED"
```

## Acceptance Notes

- This task completes the model provider / streaming scaffold leaf only.
- Live model execution remains blocked until AI Gateway, secret stores, budget
  ledger, and evidence-binding checks are provisioned and smoke-tested.

## Rollback Point

- Revert the commit that adds this scaffold and status update.
