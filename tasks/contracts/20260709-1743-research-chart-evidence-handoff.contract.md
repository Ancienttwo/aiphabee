# Task Contract: research-chart-evidence-handoff

> **Status**: Fulfilled
> **Plan**: plans/plan-20260709-1743-research-chart-evidence-handoff.md
> **Task Profile**: code-change
> <!-- legal values: code-change | docs-only | ledger-closeout | migration | eval-only | delegated-run | bugfix (omit for legacy passthrough); see docs/reference-configs/sprint-contracts.md -->
> **Owner**: ancienttwo
> **Capability ID**: root
> **Last Updated**: 2026-07-09 17:45
> **Review File**: `tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md`
> **Notes File**: `tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md`
> **Exemplar**: `docs/reference-configs/contract-brief-example.md`

## Why

Sprint Row 4 (`plans/sprints/20260703-agent-control-plane-convergence.sprint.md`): the answer layer needs a consumable evidence candidate + data status from every chart parse, but today `ParseChartImageOutcome` exposes only the route decision string — the routing `reason`, versions, and calibration context stay trapped in the executor. Without this handoff, the Research TA cutover sprint would have to reassemble routing semantics outside the module (a second authority), or worse, ship chart claims without evidence binding. If it ships wrong (candidate synthesized on failure, bytes/confidence leaking into the candidate), it breaks the fail-closed evidence contract and the `confidence_score_display: false` compliance rule.

## Goal

`ParseChartImageOutcome` exposes two new additive fields — `data_status` (closed set: `parsed` / `parsed_pending_confirmation` / `visual_reference_only` / `unavailable`) and `evidence_candidate` (null when `unavailable`; never synthesized) — derived by a new pure function `deriveChartEvidenceHandoff({ record, routing, repair_applied, retrieved_at })` in `packages/agent-runtime/src/parse-chart-image/evidence.ts`, called by the executor at outcome assembly. `parse_chart_image` is registered in `deploy/agent/answer-evidence-contract.contract.json` `required_planned_card_sources` AND in `scripts/check-answer-evidence-contract.mjs` `requiredPlannedCardSources`, so the binding cannot regress. The plan's Captured Planning Output (key decisions 1–5, test plan, candidate field list) is the execution source of truth.

## Scope

- In scope:
  - `packages/agent-runtime/src/parse-chart-image/`: `types.ts` (extend outcome + handoff types), new `evidence.ts` + `evidence.test.ts`, `executor.ts` (call derive, attach fields), `executor.test.ts`, `index.ts` (exports), `tool.ts` + `tool.test.ts` only if the tool reshapes the outcome and must thread the two new fields.
  - `deploy/agent/answer-evidence-contract.contract.json`: add `parse_chart_image` to `required_planned_card_sources`.
  - `scripts/check-answer-evidence-contract.mjs`: add `parse_chart_image` to `requiredPlannedCardSources`.
- Out of scope:
  - Answer renderer / user-visible answer templates (PRD Module 3, reserved for Research TA cutover sprint).
  - Worker route changes, UI, FastClaw consumer side.
  - Calibration logic, chart-parse zod schema changes, image-store semantics changes.
- Taste constraints: strength mapping lives in ONE exported const (`auto_match→medium`, `user_confirm→weak`, `visual_only→unknown`; never `strong`); claim label fixed `inference`; `data_points` carry field values only — strip per-field self-reported confidence; fail-closed (`unavailable` → candidate `null`), no synthesized fallback.

## Stop Conditions

- Stop and hand back to the parent if the change would require editing a path outside Allowed Paths.
- Stop if an Exit Criteria command cannot be run in this environment.
- Stop if Goal, Scope, or Exit Criteria are internally contradictory.

## Falsifier

If the answer layer could already obtain `route_reason` + versions + calibration context from the existing outcome without this derivation layer, the slice is unnecessary. Cheapest proof: `ParseChartImageOutcome` in `packages/agent-runtime/src/parse-chart-image/types.ts:45` — it carries `route_decision: ChartParseRouteDecision | null` (decision string only); `ChartParseRoutingDecision.reason` is dropped at `executor.ts:199`. Verified 2026-07-09: the gap is real.

## Root Cause Evidence

Required when Task Profile is `bugfix`; leave as-is otherwise.

- root_cause: one sentence naming file:line/condition (testable, not "a state issue").
- repro: the command or UI path that reproduces the symptom.
- regression_guard: path to a test that fails on the unfixed code and passes after the fix (must also appear under exit_criteria.tests_pass).
- pre_fix_failure_artifact: path to a captured run of regression_guard on the UNFIXED code. Capture with `bun test <regression_guard> > <artifact> 2>&1; echo "PRE_FIX_EXIT=$?" >> <artifact>` (no pipes — pipes swallow the exit status). The gate requires a non-zero `PRE_FIX_EXIT=` line plus the regression_guard path string in the artifact (see the Root Cause Evidence Gate section in docs/reference-configs/sprint-contracts.md).

## Workflow Inventory

- Source plan: `plans/plan-20260709-1743-research-chart-evidence-handoff.md`
- Deferred-goal ledger: `tasks/todos.md`
- Review file: `tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md`
- Notes file: `tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md`
- Checks file: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope gate: edit only paths listed under `allowed_paths`; update this contract before widening scope.
- Completion gate: `repo-harness run verify-sprint` must see this contract pass, the review recommend pass, and `## External Acceptance Advice` pass or record a manual override.

## Allowed Paths

```yaml
allowed_paths:
  - packages/agent-runtime/src/parse-chart-image/
  - deploy/agent/answer-evidence-contract.contract.json
  - scripts/check-answer-evidence-contract.mjs
  - plans/plan-20260709-1743-research-chart-evidence-handoff.md
  - tasks/todos.md
  - tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md
  - tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md
  - tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md
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
    - packages/agent-runtime/src/parse-chart-image/evidence.ts
    - packages/agent-runtime/src/parse-chart-image/evidence.test.ts
  artifacts_exist:
    - tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md
  tests_pass:
    - path: packages/agent-runtime/src/parse-chart-image/evidence.test.ts
  commands_succeed:
    - npx vitest run packages/agent-runtime/src/parse-chart-image
    - npm run check:answer-evidence-contract
    - npm run typecheck
  qa_scores:
    - dimension: functionality
      min: 7
  manual_checks:
    - "Evaluator review file recommends pass"
    - "Serialized evidence_candidate contains no bytes, no confidence, no data:image"
    - "unavailable outcomes carry evidence_candidate: null (fail-closed, never synthesized)"
```

## Acceptance Notes (Human Review)

- Functional behavior: auto_match → `parsed` + strength `medium`; user_confirm → `parsed_pending_confirmation` + `weak`; visual_only → `visual_reference_only` + `unknown`; parse_failed / image unavailable → `unavailable` + candidate `null`; candidate carries all three versions verbatim, calibration status/run id, route_decision + route_reason, warnings (degraded, repair_applied, route-reason-derived, chart_time_unverified).
- Edge cases: five non-auto reasons (`no_ready_calibration`, `version_mismatch`, `sample_count_below_minimum`, `missing_p0_field`, `no_calibration_lookup`) each stay non-`parsed` with strength ∈ {weak, unknown}; wrong tenant / inactive ref keeps `model_call_count === 0`.
- Regression risks: existing outcome consumers (tool.ts, worker fixtures) must remain green — fields are additive only; contract check tightening must not break `npm run check:answer-evidence-contract` after the JSON edit lands with it.

## Rollback Point

- Commit / checkpoint: `fa7540f` (worktree base on branch `codex/research-chart-evidence-handoff`)
- Revert strategy: pure additive fields + new module — revert the branch commit(s) or drop the worktree; no data/migration surface.
