# Task Contract: model-routing-audit-scaffold

> **Status**: Verified
> **Plan**: `plans/plan-model-routing-audit-scaffold.md`
> **Task Profile**: code-and-docs
> **Owner**: Codex
> **Capability ID**: sprint13-model-routing-audit
> **Last Updated**: 2026-06-21 04:39 +08
> **Notes File**: `tasks/notes/model-routing-audit-scaffold.notes.md`

## Goal

Create a no-live model routing audit scaffold proving how model tier selection,
Cloudflare AI Gateway logging, fallback, cache limits, and model-change audit
requirements will be enforced before live model execution is enabled.

## Scope

- In scope:
  - `model_routing_audit` in `GET /agent/runtime`;
  - `model_routing_audit` in `POST /agent/runs/plan`;
  - Cloudflare AI Gateway provider/linkage fields;
  - lightweight/main/deterministic-code routing tiers;
  - fallback triggers: `MODEL_TIMEOUT`, `RATE_LIMITED`, `UPSTREAM_5XX`;
  - model-change audit fields: `fallback_from_model` and `fallback_to_model`;
  - prompt/version/token/cost/latency/output-hash audit fields;
  - safe reusable non-sensitive cache policy;
  - validation rules blocking arbitrary model IDs and model-generated
    deterministic financial calculations.
- Out of scope:
  - live model execution;
  - real AI Gateway request smoke;
  - streaming transport;
  - live token/cost log writes;
  - frontend rendering.

## Allowed Paths

```yaml
allowed_paths:
  - apps/worker/**
  - deploy/agent/model-routing-audit.contract.json
  - docs/AiphaBee_Sprint_Tracker_v1.0.md
  - docs/governance/model-routing-audit-scaffold.md
  - package.json
  - packages/agent-runtime/**
  - plans/plan-model-routing-audit-scaffold.md
  - scripts/check-model-routing-audit-contract.mjs
  - tasks/contracts/model-routing-audit-scaffold.contract.md
  - tasks/notes/model-routing-audit-scaffold.notes.md
  - tasks/todos.md
```

## Exit Criteria

```yaml
exit_criteria:
  content_checks:
    - "GET /agent/runtime advertises model_routing_audit"
    - "POST /agent/runs/plan returns model_routing_audit"
    - "Model routing tiers include lightweight, main, and deterministic_code"
    - "Deterministic financial calculations remain model_calls=false"
    - "AI Gateway provider is cloudflare_ai_gateway and status is planned"
    - "Fallback triggers include MODEL_TIMEOUT, RATE_LIMITED, and UPSTREAM_5XX"
    - "Fallback policy records model changes"
    - "Audit contract requires prompt version, token, cost, latency, output hash, retry, and fallback fields"
    - "Cache policy is safe reusable non-sensitive only"
    - "No live model execution, frontend rendering, or token/cost log writes are claimed"
  commands_succeed:
    - npm run test
    - npm run test:golden
    - npm run check:model-routing-audit
    - npm run check:model-provider
    - npm run check:failure-recovery-policy
    - npm run check:agent-run-context
    - npm run check:tool-loop-agent
    - npm run test -- packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run typecheck --workspace @aiphabee/worker
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run build --workspace @aiphabee/worker
    - npm run build --workspace @aiphabee/agent-runtime
    - scripts/check-task-workflow.sh --strict
  smoke_tests:
    - "POST /agent/runs/plan returns model_routing_audit.status=model_routing_audit_scaffold"
    - "POST /agent/runs/plan returns fallback_policy.records_model_change=true"
```

## Acceptance Notes

- This task completes the Sprint 1.3 backend scaffold item for model routing and
  AI Gateway audit/fallback.
- It does not complete Sprint 0.4 live model provider execution smoke.

## Rollback Point

- Revert the commit that adds model routing audit behavior, checker, and
  tracker/governance updates.
