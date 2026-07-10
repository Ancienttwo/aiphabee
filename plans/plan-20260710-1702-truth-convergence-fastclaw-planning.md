# Plan: Truth Convergence and FastClaw Planning

> **Status**: Complete
> **Created**: 20260710-1702
> **Slug**: truth-convergence-fastclaw-planning
> **Planning Source**: waza-think
> **Orchestration Kind**: waza-think
> **Source Ref**: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#(none)
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Tracked truth artifacts pass JSON/markdown structure checks, targeted Agent Runtime and Worker tests, answer-evidence contract, sprint discovery, and strict repo-harness contract verification.
> **Rollback Surface**: Revert the single codex/truth-convergence-fastclaw-planning branch commit; restore local raw GPT artifacts from _ref/gpt-planning-pack-20260710 without database or runtime rollback.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md`
> **Task Review**: `tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md`
> **Implementation Notes**: `tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#(none)
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md`
- Sprint contract: `tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md`
- Sprint review: `tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md`
- Implementation notes: `tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md`.

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
- Contract file: `tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md`
- Review file: `tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md`
- Implementation notes file: `tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Revert the single codex/truth-convergence-fastclaw-planning branch commit; restore local raw GPT artifacts from _ref/gpt-planning-pack-20260710 without database or runtime rollback.
- **Verification boundary**: Tracked truth artifacts pass JSON/markdown structure checks, targeted Agent Runtime and Worker tests, answer-evidence contract, sprint discovery, and strict repo-harness contract verification.
- **Review/acceptance boundary**: `tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260710-1702-truth-convergence-fastclaw-planning.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260710-1702-truth-convergence-fastclaw-planning.contract.md`, `tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md`, and `tasks/notes/20260710-1702-truth-convergence-fastclaw-planning.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260710-1702-truth-convergence-fastclaw-planning.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Revert the single codex/truth-convergence-fastclaw-planning branch commit; restore local raw GPT artifacts from _ref/gpt-planning-pack-20260710 without database or runtime rollback.

## Captured Planning Output

## Approved Design Summary

### Building

Converge the repository onto one documented truth path: preserve the raw GPT planning bundle only as ignored external reference material, commit one distilled research record, keep `docs/spec.md` limited to stable product invariants, register current/planned capability state in `.ai/context/capabilities.json`, replace the raw dual-agent v3 chat dump with a valid repository PRD, and create one Draft FastClaw execution Sprint whose ten rows preserve the full security, lifecycle, evidence, billing, and live-acceptance surface.

### Not building

Out of scope:
- No FastClaw adapter, sandbox backend, provisioning service, database schema, billing integration, or runtime code.
- No Netquity mirror rewrite, PlanetScale apply, rights activation, or Data Access Gateway wiring.
- No adoption of the GPT pack RACI, release-gate bureaucracy, internal precedence rules, or duplicate programme plan.
- No wholesale copy of the pack's card schemas, error-code set, or rights matrix into runtime contracts.
- No modification of the existing archived dual-agent sprints or the completed control-plane Sprint.
- No external credential use, deployment, or Cloudflare mutation.

### Approach

Use a six-artifact product-truth change in an isolated contract worktree. Raw source preservation is local-only under `_ref/`; the committed research memo records source hashes, accepted decisions, rejected material, and reconciliation gaps. The spec contains only stable outcomes and invariants. The PRD owns product scope and acceptance. The Sprint owns ordered future execution. Capability registry and source-map entries carry implementation status and traceability so neither leaks into the stable spec.

### Architecture Map

```text
raw GPT pack + raw v3 chat
        |
        v
_ref/gpt-planning-pack-20260710/        ignored, never authoritative
        | distil decisions and conflicts
        v
docs/researches/...distillation.md       evidence and rationale
        | stable product invariants
        v
docs/spec.md                             sole stable product truth
        | product scope and acceptance
        v
plans/prds/20260710-1702-dual-agent-v3.prd.md
        | ordered execution backlog
        v
plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md
        | each row
        v
$think -> capture-plan -> contract -> isolated worktree
```

### P1 Map

- Product-truth authority: `docs/spec.md`.
- Implementation-state authority: `.ai/context/capabilities.json`, code, tests, and task artifacts.
- Product-scope authority: `plans/prds/20260710-1702-dual-agent-v3.prd.md`.
- Execution authority: the new Sprint plus per-row approved plans/contracts.
- Raw external material: `_ref/`, excluded from Git.
- Existing run/event/tool contract authority: `packages/agent-runtime`.
- Existing public Agent route owner: `apps/worker`.
- Existing response/error authorities: `packages/data-contracts`, `packages/agent-runtime`, and `packages/mcp-runtime`.

### P2 Trace

Today the Worker validates requested layer and run mode, defaults to `dry_run`, rejects non-executable modes with `runner_required`, and applies layer tool policy. It does not dispatch a concrete runner. Therefore this slice records `edge` and `fastclaw` as product execution families but does not add a second code enum beside `AgentRunMode` and `AgentRunner.runner_id`. The future Sprint row 1 must trace and implement runner registration/selection before exposing selected-runner readback.

### P3 Decision Rationale

- Put the raw bundle in `_ref/`, not `docs/researches/`, because direct retrieval of inner files would otherwise preserve the parallel-truth hazard.
- Keep `docs/spec.md` concise and status-free because it is root context with a repository-wide total budget, not an implementation ledger.
- Rewrite rather than delete the v3 PRD because the harness requires Sprint `Source PRD` artifacts under `plans/prds/`.
- Preserve the ten execution surfaces from pack 07; the proposed six-row compression dropped durable artifacts, billing/admin, load/security, and release evidence.
- Keep missing live credentials as an external-acceptance blocker; fixture-only success cannot complete the final Sprint row.

### Key Decisions

1. Product-level execution families are `edge` and `fastclaw`; `workflow` is a trigger/orchestrator and `service` is a platform executor, not an Agent runner family.
2. No new runtime enum is introduced in this documentation slice. A strict code representation is decided inside the runner-dispatch contract row against current `AgentRunMode` and `runner_id` semantics.
3. FastClaw owns execution only. AiphaBee retains identity, entitlement, billing, tool policy, evidence, durable memory/artifacts, disable/delete, and audit authority.
4. One entitled user maps to one durable FastClaw identity/profile; each run/session gets an ephemeral sandbox that is destroyed on every terminal path.
5. Output cards, error codes, and Netquity rights require explicit reconciliation against existing authorities; they are not copied from the GPT pack.

### Most Fragile Assumption

This plan assumes the raw GPT artifacts are reference material rather than a deliverable that must be versioned in Git. If that assumption changes, the raw bundle needs an external artifact store with immutable hashes; it still must not become a competing product-truth hierarchy.

## File Changes

| File | Action | Purpose |
|---|---|---|
| `docs/researches/20260710-gpt-planning-pack-distillation.md` | create | Durable evidence, accepted decisions, rejected governance, hashes, and contract reconciliation gaps |
| `docs/spec.md` | rewrite | Stable product outcome, boundaries, Agent routing invariants, FastClaw invariants, data/evidence posture, and OHLCV boundary |
| `.ai/context/capabilities.json` | update | Discoverable current/planned capability status without polluting the spec |
| `.ai/context/capability-source-map.json` | update | Bind each added capability to its authority, planning, and verification surfaces |
| `plans/prds/20260710-1702-dual-agent-v3.prd.md` | create | Valid Draft product PRD replacing the raw chat dump |
| `plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md` | create | Draft ten-row executable backlog with repository columns and machine-checkable acceptance |
| generated plan/contract/review/notes/worktree metadata | create/update | Required repo-harness execution evidence |

Raw local-only move:
- `docs/AiphaBee_MD_Document_Pack_2026-07-10/` -> `_ref/gpt-planning-pack-20260710/document-pack/`.
- `plans/prds/20260710-dual-agent-v3.prd.md` raw chat dump -> `_ref/gpt-planning-pack-20260710/raw-dual-agent-v3-chat-output.md` before the clean tracked PRD is created in the isolated worktree.

More than eight physical files are involved because repo-harness generates workflow artifacts and the raw pack contains thirteen reference files. Product truth changes remain limited to six tracked artifacts; no new service, dependency, or runtime abstraction is introduced.

## Data and Contract Reconciliation

- Compare the GPT pack's 17 proposed error codes with the existing global and MCP code authorities; record additions/omissions but make no runtime change.
- Record that the pack rights template contains 17 required fields and remains a future rights-contract input above the raw Netquity mirror.
- Record that business output cards are product-schema proposals, distinct from existing evidence-card and response-envelope contracts.
- Mark the Netquity mirror as raw storage infrastructure only; no live tool-registry or gateway wiring is claimed.

## Test and Acceptance Design

```text
documentation/truth slice
  + JSON parse of capabilities registry
  + spec contains one product-level runner-family definition
  + spec contains no implementation-status tags or volatile file:line claims
  + PRD lives under plans/prds and is Draft
  + Sprint has Source Spec, Source PRD, Draft status, required columns, ten open rows
  + strict workflow validation parses the Draft Sprint and its ten rows
  + after later human Sprint approval/activation, sprint-backlog next selects row 1
  + raw GPT pack is absent from tracked docs/plans paths
  + targeted Agent Runtime + Worker tests stay green
  + answer-evidence contract stays green

future runtime Sprint
  - runner registry and unknown-runner denial
  - mode/runner compatibility
  - idempotent provisioning and concurrent provision race
  - semantic event ordering and raw-output non-leakage
  - exactly-once cleanup across success/failure/cancel/timeout/kill
  - job-token scope/expiry and deny-by-default egress
  - cross-tenant identity/memory/artifact isolation
  - live cold-start/first-progress/resource/cost evidence
```

## Verification Commands

- `jq empty .ai/context/capabilities.json`
- `rg -n 'implemented \+ file:line|\[[^]]*implemented[^]]*\]' docs/spec.md` must return no matches.
- `rg -n 'selected_runner|execution family|workflow|service' docs/spec.md plans/prds/20260710-1702-dual-agent-v3.prd.md` must show one consistent semantic model.
- `test ! -e docs/AiphaBee_MD_Document_Pack_2026-07-10` and `git ls-files docs plans | rg 'AiphaBee_MD_Document_Pack|AiphaBee_Planning_Master'` must return no tracked raw pack.
- Targeted PRD/Sprint validation must prove timestamped filenames, Draft status, required source metadata, ten parseable rows, and row 1 `runner-selection-contract`.
- A temporary worktree-local active-sprint marker must make `repo-harness run sprint-backlog next` select row 1, then be removed; this slice does not persistently activate a Draft Sprint.
- `LC_ALL=en_US.UTF-8 repo-harness run check-task-workflow --strict` is advisory here because the repository baseline reports unrelated legacy deploy-SQL placement and an older malformed PRD; it must add no finding for the new PRD/Sprint.
- `npx vitest run packages/agent-runtime/src/index.test.ts apps/worker/src/index.test.ts`.
- `npm run check:answer-evidence-contract`.
- `repo-harness run verify-contract --contract <generated contract> --strict`.
- Run the repository `/check` review flow against the complete worktree diff before commit.

## Rollback

- Tracked change: revert the single branch commit; no database, runtime, deployment, or external service rollback exists.
- Local raw source: move `_ref/gpt-planning-pack-20260710/document-pack/` and the raw v3 chat output back to their original paths only if forensic comparison is needed.
- If Sprint discovery fails, keep the Sprint Draft and fix its schema before commit; do not bypass the harness.

### Captured Task Breakdown

- [x] Preserve raw GPT artifacts under ignored `_ref/` and capture deterministic source hashes.
- [x] Create the durable GPT planning-pack distillation research memo.
- [x] Rewrite `docs/spec.md` as concise stable product truth with no volatile implementation status.
- [x] Update `.ai/context/capabilities.json` and `.ai/context/capability-source-map.json` with Agent control-plane and planned FastClaw capability state and traceability.
- [x] Replace the raw v3 chat dump with a valid Draft PRD under `plans/prds/`.
- [x] Create the compliant ten-row Draft FastClaw Sprint under `plans/sprints/`.
- [x] Fill the generated task contract, implementation notes, and review evidence with concrete allowed paths and exit criteria.
- [x] Run structure checks, targeted tests, sprint discovery, strict contract verification, and independent review.
- [x] Prepare the isolated truth-convergence branch as one commit after all checks pass.

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] Preserve raw GPT artifacts under ignored `_ref/` and capture deterministic source hashes.
- [x] Create the durable GPT planning-pack distillation research memo.
- [x] Rewrite `docs/spec.md` as concise stable product truth with no volatile implementation status.
- [x] Update `.ai/context/capabilities.json` and `.ai/context/capability-source-map.json` with Agent control-plane and planned FastClaw capability state and traceability.
- [x] Replace the raw v3 chat dump with a valid Draft PRD under `plans/prds/`.
- [x] Create the compliant ten-row Draft FastClaw Sprint under `plans/sprints/`.
- [x] Fill the generated task contract, implementation notes, and review evidence with concrete allowed paths and exit criteria.
- [x] Run structure checks, targeted tests, sprint discovery, strict contract verification, and independent review.
- [x] Prepare the isolated truth-convergence branch as one commit after all checks pass.
