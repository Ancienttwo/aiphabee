# Plan: Research Chart Evidence Boundary Handoff

> **Status**: Executing
> **Created**: 20260709-1743
> **Slug**: research-chart-evidence-handoff
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: plans/sprints/20260703-agent-control-plane-convergence.sprint.md#Research chart evidence boundary handoff
> **Artifact Level**: work-package
> **Promotion Reason**: human_decision_boundary
> **Verification Boundary**: npx vitest run packages/agent-runtime/src/parse-chart-image && npm run check:answer-evidence-contract && npm run typecheck
> **Rollback Surface**: Pure additive outcome fields + new evidence.ts module; revert branch codex/research-chart-evidence-handoff or the reviewed diff; no data/migration surface.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md`
> **Task Review**: `tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md`
> **Implementation Notes**: `tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: plans/sprints/20260703-agent-control-plane-convergence.sprint.md#Research chart evidence boundary handoff
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260709-1743-research-chart-evidence-handoff.md`
- Sprint contract: `tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md`
- Sprint review: `tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md`
- Implementation notes: `tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260709-1743-research-chart-evidence-handoff.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260709-1743-research-chart-evidence-handoff.md`.

## Approach
### Strategy
Use the captured planning output below as the execution source of truth.

### Trade-offs
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Captured plan | Preserves the approved Codex Plan or Waza think decision | Requires the captured text to be concrete enough to execute | Use |

## Detailed Design
### File Changes
| File | Action | Description |
|------|--------|-------------|
| See captured planning output | Follow | Implement only the approved scope named below |

### Code Snippets
See captured planning output.

### Data Flow
See captured planning output.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Captured plan lacks enough detail | Medium | Execution may need clarification | Stop before implementation if the captured output contradicts repo rules or lacks concrete file targets |

## Task Contracts
- Contract file: `tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md`
- Review file: `tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md`
- Implementation notes file: `tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260709-1743-research-chart-evidence-handoff.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Pure additive outcome fields + new evidence.ts module; revert branch codex/research-chart-evidence-handoff or the reviewed diff; no data/migration surface.
- **Verification boundary**: npx vitest run packages/agent-runtime/src/parse-chart-image && npm run check:answer-evidence-contract && npm run typecheck
- **Review/acceptance boundary**: `tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: human_decision_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260709-1743-research-chart-evidence-handoff.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260709-1743-research-chart-evidence-handoff.contract.md`, `tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md`, and `tasks/notes/20260709-1743-research-chart-evidence-handoff.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260709-1743-research-chart-evidence-handoff.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Pure additive outcome fields + new evidence.ts module; revert branch codex/research-chart-evidence-handoff or the reviewed diff; no data/migration surface.

## Captured Planning Output

# Research Chart Evidence Boundary Handoff

Sprint Row 4 of `plans/sprints/20260703-agent-control-plane-convergence.sprint.md`.

## Decision

Add a pure derivation layer inside `packages/agent-runtime/src/parse-chart-image` that converts each chart parse result into an answer-layer-consumable evidence candidate + data status, attached directly onto `ParseChartImageOutcome` (acceptance wording: "outcome exposes handoff fields"). Register `parse_chart_image` into the answer-evidence contract planned card sources and lock the binding with the existing check script.

## Scope (Building)

- New pure function `deriveChartEvidenceHandoff({ record, routing, repair_applied, retrieved_at })` → `{ data_status, evidence_candidate }` in a new `evidence.ts` inside the parse-chart-image module.
- Executor calls it while assembling the outcome and attaches the two new fields (additive; existing consumers unaffected).
- Function input accepts only serializable record/routing data: `record: ChartParseResultRecord` (never contains bytes — types.ts doc contract), `routing: ChartParseRoutingDecision | null` (the full routing decision with `reason`, held only by the executor at `executor.ts` outcome assembly), `repair_applied: boolean`, `retrieved_at: number`. `FetchedChartImage.bytes` is unreachable by construction — pixels cannot leak as a type-level guarantee, not a test accident.
- Contract lock: add `parse_chart_image` to `required_planned_card_sources` in `deploy/agent/answer-evidence-contract.contract.json` AND to `requiredPlannedCardSources` in `scripts/check-answer-evidence-contract.mjs` (line ~33) — the check upgrades from "does not block" to "must be present"; the binding cannot regress.

## Non-goals (Not building)

- Answer renderer / user-visible answer templates (PRD Module 3 explicitly reserved for the Research TA cutover sprint).
- Worker route changes, UI, FastClaw consumer side.
- Calibration logic changes; any change to the chart-parse zod schema; image-store semantics changes.

## Rejected alternative

Standalone conversion function not attached to the outcome: rejected — does not satisfy the acceptance wording, and would force the answer layer to reassemble the routing reason itself. The executor is the only place holding the complete `ChartParseRoutingDecision` (`routing.ts:48`, consumed at `executor.ts:164-199` where today only `.decision` is exposed).

## Key Decisions (locked at approval)

1. **`data_status` closed set**: `parsed` (auto_match) / `parsed_pending_confirmation` (user_confirm) / `visual_reference_only` (visual_only) / `unavailable` (parse_failed or image unavailable). Fail-closed: when `unavailable`, `evidence_candidate` is `null` — never synthesized.
2. **Strength mapping table** (single exported const; changing the mapping = one place): `auto_match→medium`, `user_confirm→weak`, `visual_only→unknown`. Chart reading is model inference — never `strong`. Claim label fixed to `inference` (contract rule `inference_requires_evidence_strength: true`; the candidate satisfies it by construction).
3. **Values carry no confidence scores**: `data_points` takes only each top-level field's `value` from the chart-parse zod schema (`packages/agent-runtime/src/chart-parse/schema.ts`, `ChartParseResult`), stripping self-reported per-field `confidence` (contract states `confidence_score_display: false`; schema self-documents as uncalibrated). Raw confidence stays in `result_json` for internal/eval use.
4. **Candidate fields** (aligned to EvidenceCard needs):
   - `source_record_id` (chart_parse_results row id = `record.id`)
   - `source_tool` (`"parse_chart_image"`)
   - `tenant_id` (for answer-layer same-tenant evidence-binding assertions)
   - `image_ref` (R2 key locator; never bytes)
   - `claim_label` (`"inference"`)
   - `evidence_strength` (from mapping table)
   - `data_points` (values only, per decision 3)
   - `as_of` (parse timestamp from `retrieved_at` + `chart_time_unverified` warning)
   - `schema_version` / `prompt_version` / `model_version` — all three carried verbatim (no lossy concatenation)
   - `calibration_status` (`ready_used`/`not_used`) + `calibration_run_id`
   - `route_decision` + `route_reason` (PRD requires exposure to Research renderer)
   - `warnings` (degraded, repair_applied, route-reason-derived, chart_time_unverified)
5. **Contract lock** as in Scope: contract JSON + check script both list `parse_chart_image`; check must fail if either side regresses.

## Test Plan

New `evidence.test.ts` + extend `executor.test.ts` / `tool.test.ts`:

- auto_match full-green path → `data_status: "parsed"`, strength `medium`, candidate complete.
- Five non-auto reasons (`no_ready_calibration`, `version_mismatch`, `sample_count_below_minimum`, `missing_p0_field`, `no_calibration_lookup`) each assert `data_status !== "parsed"` and strength ∈ {`weak`, `unknown`} (all five exist in the `ChartParseRoutingDecision["reason"]` union at `routing.ts:52-62`).
- Wrong tenant / inactive ref → `unavailable` + candidate `null` + `model_call_count === 0` (preserves the "invalid ref means zero model calls" performance goal).
- `parse_failed` → `unavailable` + candidate `null`.
- degraded / repair_applied → `warnings` non-empty.
- Serialization assertion: `JSON.stringify(candidate)` contains no bytes, no `confidence`, no `data:image`.
- If `tool.ts` reshapes the outcome, thread the two new fields through (define via test first; if it fails, change tool.ts).

## File Changes (9 files — above the 8-file prompt threshold, declared honestly; all inside one module plus two contract files)

| File | Action |
|------|--------|
| `packages/agent-runtime/src/parse-chart-image/types.ts` | extend `ParseChartImageOutcome` with `data_status` + `evidence_candidate`; add handoff types |
| `packages/agent-runtime/src/parse-chart-image/evidence.ts` | new — `deriveChartEvidenceHandoff` + strength mapping const |
| `packages/agent-runtime/src/parse-chart-image/evidence.test.ts` | new — per Test Plan |
| `packages/agent-runtime/src/parse-chart-image/executor.ts` | call derive at outcome assembly; attach fields |
| `packages/agent-runtime/src/parse-chart-image/executor.test.ts` | extend per Test Plan |
| `packages/agent-runtime/src/parse-chart-image/index.ts` | export new symbols |
| `packages/agent-runtime/src/parse-chart-image/tool.ts` + `tool.test.ts` | only if outcome reshaping requires threading the new fields |
| `deploy/agent/answer-evidence-contract.contract.json` | add `parse_chart_image` to `required_planned_card_sources` |
| `scripts/check-answer-evidence-contract.mjs` | add `parse_chart_image` to `requiredPlannedCardSources` |

## Acceptance (Row 4 wording)

- Chart parse outcome exposes evidence candidate/data-status handoff fields without exposing pixels/raw bytes.
- Wrong tenant, inactive ref, no ready calibration, version mismatch, and insufficient sample count remain non-`auto_match`.
- `npx vitest run packages/agent-runtime/src/parse-chart-image` passes.
- `npm run check:answer-evidence-contract` passes.
- `npm run typecheck` passes.

## Rollback

Pure additive fields + one new module: revert the commit and the previous state returns; no data/migration surface. No new dependencies, no credentials, no MCP requirements. Single phase, independently mergeable.

## Fragile Assumption / Unknowns

- Most fragile: the strength/label mapping is a compliance judgment; this plan locks `medium`/`weak`/`unknown` + `inference`. If the compliance owner later changes it, the cost is contained in one exported const mapping table.
- Known unknown (owner assigned): production entitlement strings follow PRD Known Unknowns, owned by billing/account; does not block this slice (fixture constants already landed with Row 2).

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Execute captured plan: Research Chart Evidence Boundary Handoff
