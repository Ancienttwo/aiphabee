# Task Contract: truth-convergence-fastclaw-planning

> **Status**: Fulfilled
> **Plan**: plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md
> **Task Profile**: docs-only
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: agent_control_plane
> **Last Updated**: 2026-07-10 17:51
> **Review File**: `tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md`
> **Notes File**: `tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

The repository currently has an untracked GPT planning bundle and raw chat dump
that define their own precedence, runner vocabulary, programme plan, and release
gates. If those artifacts are adopted directly, future agents can read a parallel
truth source, re-plan completed work, or fork existing runtime contracts. This
slice preserves the source material outside Git and publishes one repository-
native truth path before FastClaw implementation begins.

## Goal

Deliver coherent tracked artifacts: a source distillation, a concise stable
product spec, an implementation-status capability registry plus source map, a valid Draft
dual-agent v3 PRD, and a valid Draft ten-row FastClaw Sprint. The artifacts must
agree that layer and execution family are independent, that workflow/service are
not Agent runner families, that FastClaw remains behind AiphaBee authority, and
that live acceptance cannot pass on fixtures alone.

## Scope

- In scope:
  - Preserve the raw GPT pack and raw v3 chat output under ignored `_ref/` with
    deterministic hashes recorded in the tracked distillation.
  - Distil accepted decisions, rejected governance, current-code reconciliation,
    and deferred contract work into one research artifact.
  - Rewrite `docs/spec.md` to contain stable product outcomes and invariants only.
  - Register current Agent Control Plane and planned FastClaw capability state in
    `.ai/context/capabilities.json` and bind their source/test surfaces in
    `.ai/context/capability-source-map.json`.
  - Create a repository-format Draft PRD and Draft ten-row Sprint.
  - Complete the linked plan, contract, notes, and review evidence.
- Out of scope:
  - No FastClaw adapter, sandbox backend, provisioning service, database schema, billing integration, or runtime code.
  - No Netquity mirror rewrite, PlanetScale apply, rights activation, or Data Access Gateway wiring.
  - No adoption of the GPT pack RACI, release-gate bureaucracy, internal precedence rules, or duplicate programme plan.
  - No wholesale copy of the pack's card schemas, error-code set, or rights matrix into runtime contracts.
  - No modification of the existing archived dual-agent sprints or the completed control-plane Sprint.
  - No external credential use, deployment, or Cloudflare mutation.
- Taste constraints: Keep root context concise; prefer existing authority files;
  add no compatibility fallback, runtime abstraction, dependency, or speculative
  implementation claim.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.
- Stop rather than mark the future live Sprint row complete if Cloudflare
  credentials or live evidence are unavailable.

## Falsifier

The direction is wrong if repository policy permits raw external planning packs to
become committed product authority or permits a Sprint to source its PRD from
`docs/researches/`. The cheapest proof is `.ai/harness/policy.json`; its current
rules explicitly assign raw external material to ignored `_ref/` and PRDs to
`plans/prds/`, so the chosen direction remains valid.

## Root Cause Evidence

Not applicable; this is a docs-only truth-convergence task.

## Workflow Inventory

- Source plan: `plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md`
- Notes file: `tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - docs/spec.md
  - docs/researches/20260710-gpt-planning-pack-distillation.md
  - .ai/context/capabilities.json
  - .ai/context/capability-source-map.json
  - plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md
  - plans/prds/20260710-1702-dual-agent-v3.prd.md
  - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  - tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md
  - tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md
  - tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md
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
      purpose: documentation_and_planning_convergence
    verifier:
      mode: read_only
      purpose: exit_criteria_review
  runner:
    preferred:
      - subagent
      - codex-exec
      - main-thread
    fallback: main-thread
    brief_is_authoritative: true
```

## Exit Criteria (Machine Verifiable)

```yaml
exit_criteria:
  files_exist:
    - docs/spec.md
    - docs/researches/20260710-gpt-planning-pack-distillation.md
    - .ai/context/capabilities.json
    - .ai/context/capability-source-map.json
    - plans/prds/20260710-1702-dual-agent-v3.prd.md
    - plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
  artifacts_exist:
    - .ai/harness/checks/latest.json
    - tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md
    - tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md
  tests_pass: []
  commands_succeed:
    - jq empty .ai/context/capabilities.json
    - jq empty .ai/context/capability-source-map.json
    - npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts
    - npm run check:answer-evidence-contract
    - bash -lc 'test ! -e docs/AiphaBee_MD_Document_Pack_2026-07-10'
    - bash -lc '! git ls-files docs plans | rg -q "AiphaBee_MD_Document_Pack|AiphaBee_Planning_Master"'
    - bash -lc '! rg -n "implemented \\+ file:line|\\[[^]]*implemented[^]]*\\]" docs/spec.md'
    - bash -lc 'test "$(rg -c "^\\| [0-9]+ \\| \\[ \\] \\|" plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md)" -eq 10'
    - bash -lc 'basename plans/prds/20260710-1702-dual-agent-v3.prd.md | rg -q "^[0-9]{8}-[0-9]{4}-[a-z0-9-]+\\.prd\\.md$"'
    - bash -lc 'rg -q "Status.*Draft$" plans/prds/20260710-1702-dual-agent-v3.prd.md && rg -q "Source PRD.*20260710-1702-dual-agent-v3.prd.md" plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md'
    - bash -lc 'rg -q "Status.*Draft$" plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md && test ! -e .ai/harness/sprint/active-sprint'
    - bash -lc 'rg -q "live-security-load-cost-release-evidence" plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md && rg -q "without credentials or any required live field the row stays blocked and the feature remains off" plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md'
    - bash -lc 'rg -n "^\\| 1 \\| \\[ \\] \\| runner-selection-contract \\| contract \\|" plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md'
    - bash -lc 'set -euo pipefail; marker=.ai/harness/sprint/active-sprint; test ! -e "$marker"; mkdir -p "$(dirname "$marker")"; printf "%s" "plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md" > "$marker"; trap '\''rm -f "$marker"'\'' EXIT; repo-harness run sprint-backlog next | rg -q "^task: runner-selection-contract$"'
  qa_scores:
    - dimension: functionality
      min: 8
  manual_checks:
    - "Evaluator review file recommends pass"
```

## Acceptance Notes (Human Review)

- Functional behavior: repository truth flows from spec to PRD to Sprint; raw
  GPT material is reference-only and absent from tracked product paths.
- Edge cases: product execution-family terminology does not create a duplicate
  runtime enum; workflow/service remain explicitly outside the runner family.
- Regression risks: malformed Sprint metadata could make the backlog invisible;
  copied pack schemas could fork existing response/error authorities.

## Rollback Point

- Commit / checkpoint: single commit on
  `codex/truth-convergence-fastclaw-planning` after review passes.
- Revert strategy: revert that commit; restore local raw source from
  `_ref/gpt-planning-pack-20260710/` only if forensic comparison is needed.
