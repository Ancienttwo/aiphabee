# Task Contract: users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate

> **Status**: Fulfilled
> **Plan**: plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md
> **Task Profile**: code-change
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-03 21:33
> **Review File**: `tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md`
> **Notes File**: `tasks/notes/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.notes.md`

## Goal

Add deterministic Agent layer tool policy for `parse_chart_image`: Generic requests are blocked before planning, Research requests are allowed only with explicit technical-analysis entitlement plus tenant/image context, and unknown tools remain fail-closed.

## Scope

- In scope:
- `packages/agent-runtime/src/index.ts` policy contract/helpers and focused tests.
- `packages/tool-registry/` registration of `parse_chart_image` as a normal versioned tool name so valid Research requests can pass existing registry validation after layer policy.
- `packages/mcp-runtime/` channel-filtered schema/readback handling so non-MCP tools are not exposed through MCP snapshots.
- `packages/data-access-gateway/` default-deny P0 rights coverage count for the new registered tool.
- `apps/worker/src/index.ts` pre-planning policy enforcement for `/agent/runs/dry-run` and `/agent/runs/plan`.
- `apps/worker/src/index.test.ts` focused route/policy tests.
- Sprint plan/contract/review/notes artifacts for this captured work package.
- Out of scope:
- FastClaw/E2B runner implementation.
- Actual `parse_chart_image` execution through Worker planning.
- Generic access to `parse_chart_image`.
- Production auth/session semantics.
- Tool/layer inference from prompt text, image names, or requested tools.
- New package or app roots such as `packages/agent-contracts`, `packages/agent-generic`, or `apps/api-worker`.

## Workflow Inventory

- Source plan: `plans/plan-20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md`
- Notes file: `tasks/notes/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `scripts/verify-sprint.sh` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - docs/spec.md
  - plans/
  - tasks/todos.md
  - tasks/contracts/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.contract.md
  - tasks/reviews/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.review.md
  - tasks/notes/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.notes.md
  - .ai/context/capabilities.json
  - .claude/templates/
  - apps/worker/
  - packages/data-access-gateway/
  - packages/agent-runtime/
  - packages/mcp-runtime/
  - packages/tool-registry/
  - src/
  - tests/
```

## Delegation Contract

```yaml
delegation:
  budget:
    tokens: null
    tool_calls: null
    wall_time_minutes: null
  permission_scope:
    mode: inherit_allowed_paths
    writable_paths: []
    network: inherited
  roles:
    parent:
      mode: narrate_and_gatekeep
      purpose: approval_checkpoint_owner
    explorer:
      mode: read_only
      purpose: codebase_research
    worker:
      mode: edit_within_allowed_paths
      purpose: implementation
    verifier:
      mode: read_only
      purpose: exit_criteria_review
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - packages/agent-runtime/src/index.ts
    - apps/worker/src/index.ts
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260703-2116-users-ancienttwo-projects-aiphabee-layer-tool-policy-parse-chart-image-gate.notes.md
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/index.test.ts
    - npx vitest run packages/agent-runtime/src/parse-chart-image
    - npx vitest run packages/tool-registry/src/index.test.ts
    - npx vitest run packages/mcp-runtime/src/index.test.ts
    - npx vitest run packages/data-access-gateway/src/index.test.ts
    - npx vitest run apps/worker/src/index.test.ts
    - npm run typecheck --workspace @aiphabee/agent-runtime
    - npm run typecheck --workspace @aiphabee/tool-registry
    - npm run typecheck --workspace @aiphabee/mcp-runtime
    - npm run typecheck --workspace @aiphabee/data-access-gateway
    - npm run typecheck --workspace @aiphabee/worker
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior:
- Generic `parse_chart_image` requests are denied before skeleton/plan creation.
- Research `parse_chart_image` requests require technical-analysis entitlement plus tenant context and image reference.
- Unknown tools remain denied.
- Successful Research planning stays dry-run/no live tool execution.
- Edge cases:
- Missing tenant/image/entitlement on Research chart requests fails closed.
- Policy does not infer layer from requested tools or prompt content.
- Regression risks:
- Adding `parse_chart_image` to the registry must not make it available to Generic.
- Existing parse-chart-image executor/tool tests must remain green.
- Worker must continue deriving route/layer readback from runtime control-plane contract.

## Rollback Point

- Commit / checkpoint:
- Revert strategy:
