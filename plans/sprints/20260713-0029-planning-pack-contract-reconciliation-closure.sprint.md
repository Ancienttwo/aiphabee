# Sprint: Planning Pack Contract Reconciliation Closure

> **Status**: Done
> **Approved**: user `go on`, 2026-07-13
> **Slug**: `planning-pack-contract-reconciliation-closure`
> **Created**: 2026-07-13
> **Updated**: 2026-07-13
> **Source PRD**: `plans/prds/20260713-0029-planning-pack-contract-reconciliation-closure.prd.md`
> **Source Spec**: `docs/spec.md`
> **Goal Mode**: incremental
> **Authority**: This Sprint orders authoring only. It does not authorise row implementation, external acceptance, live activation, signing, deployment, commit, or push.
> **Baseline Disposition**: `tasks/notes/20260713-planning-pack-contract-reconciliation-baseline-disposition.notes.md`

This Draft Sprint is derived only from the Source PRD as its detailed source of truth. It contains exactly three ordered contract rows. Each row must independently follow `$think` → `capture-plan` → human approval → `plan-to-todo` → preflight → fresh isolated worktree → verification → independent review. `tasks/todos.md` remains the deferred-goal ledger and is not an active backlog.

## PRD

### Problem

Close three accepted planning-pack reconciliation gaps through existing repository authorities: error ownership and public exposure, business-output composition over canonical response/evidence contracts, and exact signed/live field-channel rights. Preserve one semantic owner per concept, fail closed when authority or evidence is missing, and do not create a parallel contract stack.

### Users

- Product and Platform maintainers approving the bounded closure and row plans.
- Data Contracts, Agent Runtime, MCP Runtime, Tool Registry, Evidence Lineage, and Data Access Gateway owners preserving their existing semantic boundaries.
- Governance reviewers, external rights approvers, and authorised operators who separately own packet acceptance, signature authority, and live cutover.
- Web, Agent, FastClaw, and MCP consumers who require consistent errors, evidence-bound output, and default-deny rights.

### Success Criteria

- The execution queue contains exactly the three contract rows below in mandatory order.
- Each row receives its own approved plan, frozen task contract, allowed-path manifest, fresh isolated worktree, verification evidence, rollback evidence, and independent review.
- Row 2 consumes the accepted and frozen Row 1 contract; Row 3 consumes the accepted and frozen Rows 1–2 contracts.
- Existing response, evidence, error, Tool Registry, Data Access Gateway, and Gate 0 contracts remain authoritative unless a row's approved plan modifies an existing authority in place.
- Exact tool IDs and classifications are reconciled; matching aggregate counts cannot satisfy Row 3.
- Local readiness stays separate from external acceptance and live activation. Missing authentic signed evidence, authorised operator approval, or live cutover/readback yields exactly `local_readiness_complete + blocked_external_activation`, with default deny preserved.

### Acceptance Scenarios

- Given this Draft Sprint, structural verification finds exactly the three mandatory contract rows in dependency order and an exact Source PRD reference.
- Given Row 1 is not accepted and frozen, Row 2 cannot begin; given either earlier row is not accepted and frozen, Row 3 cannot begin.
- Given business evidence is missing or malformed, Row 2 fails closed through the Row 1-owned error and emits no invented replacement semantics.
- Given exact-ID local rights checks pass while authentic signed evidence or authorised live cutover is absent, Row 3 reports `local_readiness_complete + blocked_external_activation` and unresolved scopes stay denied.
- Given any proposal touches completed FastClaw work, a forbidden path, a parallel schema, or an unowned baseline failure, authoring/execution stops.

### Non-goals

- No RACI restoration, recurring programme, duplicate gate, twelve-card schema catalogue, wholesale seventeen-error list, second rights schema, compatibility fallback, shadow parser, or extra runner.
- No reopening or modification of completed FastClaw Sprints or implementation.
- No row implementation, live read, persistent write, signing, activation, deployment, credential use, commit, or push during Sprint authoring.
- No changes under `.claude/agents/**`, `.claude/worktrees/**`, `_ref/**`, `_ops/**`, or other user WIP.

## Architecture Notes

### Capabilities Touched

- Shared error contracts across Data Contracts, Agent Runtime, MCP Runtime, Tool Registry, and deployed MCP declarations.
- Canonical response/evidence composition across Data Contracts, Evidence Lineage, Agent answer contracts, and narrow Worker smokes.
- Exact tool identity and field/channel rights across Tool Registry, Data Access Gateway, field-rights contracts, and Gate 0 packet/transition authorities.
- Repo planning workflow across PRD, Sprint, later row plans, frozen task contracts, isolated worktrees, verification, and review.

### Dependency Order

1. Freeze Row 1 canonical ownership, public exposure, retry, version, and redaction semantics.
2. Compose Row 2 business output over Row 1 plus canonical response/evidence authorities.
3. Reconcile Row 3 exact IDs and rights using the frozen denial/error and evidence semantics from Rows 1–2.
4. Keep external acceptance and live activation blocked until authentic scoped evidence and operator authorisation exist.

### Risks

- Duplicate semantic owners or compatibility mappings can make channel behavior diverge.
- Business projections can copy evidence into a second schema and lose source, method, limitation, or version identity.
- Aggregate tool counts can hide missing/extra exact IDs across 23/24/25-tool authorities.
- Local fixtures can be misreported as signed acceptance unless states remain split and default deny is asserted.
- Existing workflow baseline failures can obscure attribution; every row must stop on an unowned delta.

### Authority and Dependency Order

1. `docs/spec.md` remains stable product truth; `.ai/harness/policy.json` remains workflow authority.
2. The Source PRD defines detailed scope, acceptance, rollback, and stop conditions for all three rows.
3. This Sprint orders work and does not replace the PRD.
4. An approved row plan and frozen task contract govern that row's execution.
5. Row 1 freezes canonical error ownership and exposure semantics before Row 2 begins.
6. Row 2 freezes output/evidence composition before Row 3 begins.
7. Row 3 may prove local readiness without external acceptance; no later state may be inferred from local fixtures.

### Authoring Preflight Evidence

- Both `.ai/harness/active-plan` and `.claude/.active-plan` were absent at authoring preflight.
- The authoritative Sprint marker `.ai/harness/sprint/active-sprint` points to `plans/sprints/20260711-0357-authenticated-netquity-web-resolver.sprint.md`; `repo-harness run sprint-backlog status` reports `Done`, `2/2`, and no next task, so it does not overlap this Draft.
- The pre-existing locked worktree `agent-a6df2b64b45595985` was clean at `ab624e7`, with no diff or untracked files; it owned no overlapping Sprint or contract path.
- `repo-harness run inspect-project-state --repo . --format text` passed with no drift signals or required decisions.
- `repo-harness run migrate-project-template --repo . --dry-run` passed without writing files.
- `repo-harness run check-agent-tooling --host both --json` exited 0; advisory output still reported Waza Codex drift, a timed-out Skills CLI probe, and disabled Claude-side gbrain MCP.
- Required repository checks were not green before authoring. Clean-HEAD reproduction confirmed the deploy SQL layout, legacy PRD parser failure, and completed FastClaw `Status: Complete` findings pre-existed this Sprint. `bun test` timed out with existing Cloudflare module, Vitest API, and `_ref` dependency failures. These failures are baseline evidence, not waived acceptance.
- No row may start while a required baseline failure prevents attribution. The row preflight must rerun current authoritative commands and stop on an unowned or workflow-breaking failure.

## Backlog

Ordered execution queue. Every item uses `Mode: contract`; rows cannot run in parallel or share a dirty worktree. Detailed dependencies, ownership, allowed-path candidates, exit criteria, verification, rollback, and stop conditions are fixed in the corresponding row sections below; each later `$think` plan must narrow them without changing semantics.

| # | Status | Task | Mode | Acceptance | Plan |
|---:|:---:|---|---|---|---|
| 1 | [x] | Error taxonomy reconciliation | contract | Exact existing-code matrix assigns one owner plus exposure, channel, retry, version, and redaction semantics; targeted positive/negative checks pass and the contract is accepted/frozen for Row 2 | `plans/plan-20260713-0329-error-taxonomy-reconciliation.md` |
| 2 | [x] | Business Output/Evidence composition | contract | After Row 1 is accepted/frozen, representative outputs compose canonical envelope/evidence refs, missing evidence fails closed through Row 1, and no second card/evidence authority exists | `plans/plan-20260713-0602-business-output-evidence-composition.md` |
| 3 | [x] | Signed/live field-channel rights | contract | After Rows 1–2 are accepted/frozen, exact-ID rights checks pass; without authentic signed evidence and authorised live cutover the terminal state is `local_readiness_complete + blocked_external_activation` under default deny | `plans/plan-20260713-1147-signed-live-field-channel-rights.md` |

## Contract Row 1 — Error Taxonomy Reconciliation

### Execution Route and Ownership

- Run row-specific `$think`, then write one detailed plan and obtain explicit human approval.
- Freeze that plan into one task contract with an exact allowed-path manifest; do not activate `tasks/todos.md`.
- Execute only in a fresh isolated worktree and obtain independent acceptance review before freezing Row 1 for Row 2.
- Canonical owners are Data Contracts for shared vocabulary, MCP Runtime/deployed MCP contract for its deliberate public subset, Agent Runtime for owner-specific execution failures, and Tool Registry for declared per-tool errors.
- Candidate allowed paths come only from Source PRD lines 281–294: `packages/data-contracts/src/**`, `packages/mcp-runtime/src/**`, narrowly proven `packages/agent-runtime/src/**`, narrowly proven `packages/tool-registry/src/**`, `deploy/mcp/error-codes.contract.json`, conditionally `deploy/tools/registry.contract.json`, targeted `scripts/check-*error*`, and row-specific planning/contract/note artifacts. `$think` must reduce this set before approval.

### Exit Criteria

- A directly machine-checkable matrix covers every exact code in the selected existing authorities.
- Every entry identifies code, one canonical owner, semantic category, internal/public exposure, channel mapping, retry owner/value, contract version, and redaction rule.
- Planning-pack-only proposals are rejected or deferred rather than silently adopted.
- MCP remains a deliberate public subset and leaks no private runner, provider, identity, sandbox, or security detail.
- Unknown or unmapped codes fail closed through an approved generic public error while retaining internal audit identity; no heuristic mapping, aliases, or semantic fallback are introduced.
- Targeted positive and negative tests pass, and the accepted contract is frozen for Row 2.

### Verification

At minimum, the approved plan must validate and run the current authoritative equivalents of:

```bash
npm run check:mcp-error-codes
npm run check:tool-registry
npx vitest run packages/data-contracts/src packages/mcp-runtime/src packages/agent-runtime/src
npm run check:task-sync
repo-harness run check-task-workflow --strict
```

Any replaced command must be justified in the plan; coverage may not be silently skipped. Evidence must include exact command lines, outputs, and attribution against the pre-row baseline.

### Rollback

Revert only Row 1's matrix, declarations, tests, checker, and row artifacts as one isolated diff. Restore prior published error contracts and versions atomically, rerun pre-row targeted checks, and retain failed plan/contract notes as audit evidence.

### Stop Conditions

Stop if ownership conflicts, public projection requires private detail, the planning-pack list becomes authority, retry semantics are inferred heuristically, compatibility aliases appear, unrelated implementation or completed FastClaw behavior must change, allowed paths must widen without approval, or baseline failures prevent attribution.

## Contract Row 2 — Business Output/Evidence Composition

### Execution Route and Ownership

- Start only after Row 1 is accepted and frozen; consume its failure contract without reinterpretation.
- Run row-specific `$think`, write and approve one plan, freeze one task contract, then execute in a new isolated worktree with independent review.
- Data Contracts owns the canonical response envelope; Evidence Lineage owns provenance; existing Agent answer/evidence contracts own answer binding; Agent Runtime may own only the frozen integration boundary.
- Candidate allowed paths come only from Source PRD lines 369–382: `packages/data-contracts/src/**`, `packages/evidence-lineage/src/**`, narrowly proven `packages/agent-runtime/src/**`, targeted Worker answer/tool evidence tests, existing `deploy/agent/*evidence*.contract.json`, existing `deploy/evidence/*.contract.json`, targeted `scripts/check-*evidence*`, and row-specific planning/contract/note artifacts. `$think` must narrow them. No frontend path is implied.

### Exit Criteria

- One composition contract distinguishes canonical envelope fields, canonical evidence references, and business projection fields.
- Representative fixtures cover direct factual output, deterministic derived output, contradictory evidence, partial/unavailable output, and rights denial without importing twelve card schemas.
- User-visible factual claims retain canonical source/evidence references; deterministic calculations expose evidenced inputs and methodology version.
- Applicable time, source, method, limitations, contradictory evidence, material unknowns, qualitative evidence strength, and data/methodology/rights-policy versions survive projection.
- Missing or malformed required evidence fails closed with a Row 1-owned error; no citation, confidence, evidence, or other semantics are reconstructed locally.
- Channel projections cannot mutate claim identity, source identity, methodology version, rights-policy version, or denial state.

### Verification

At minimum, the approved plan must validate and run the current authoritative equivalents of:

```bash
npm run check:answer-evidence-contract
npm run check:agent-generated-answer-evidence-smoke
npx vitest run packages/data-contracts/src packages/evidence-lineage/src packages/agent-runtime/src apps/worker/src/agent-generated-answer-evidence-smoke.test.ts apps/worker/src/agent-tool-execution-evidence-smoke.test.ts
npm run check:task-sync
repo-harness run check-task-workflow --strict
```

Evidence must include positive, negative, malformed, contradictory, and rights-denied fixtures plus exact command output and baseline attribution.

### Rollback

Revert Row 2's projection contract, fixtures, narrow integrations, and row artifacts as one unit. Restore prior answer/evidence contract versions, rerun Row 1 and pre-row evidence checks, and do not delete or rewrite canonical evidence records.

### Stop Conditions

Stop if Row 1 is not frozen, a new top-level response/evidence authority is required, evidence fields can drift from canonical records, missing evidence is replaced by local extraction or fabricated data, channel rendering changes semantics, scope expands into frontend/card/persistence work, allowed paths must widen without approval, or baseline failures prevent attribution.

## Contract Row 3 — Signed/Live Field-Channel Rights

### Execution Route and Ownership

- Start only after Rows 1–2 are accepted and frozen; consume their denial/error and evidence semantics without reinterpretation.
- Run row-specific `$think`, write and approve one plan, freeze one task contract, then execute in a fresh isolated worktree with independent governance review.
- Tool Registry owns exact tool identities; Data Access Gateway owns field/channel evaluation and default deny; existing Gate 0 contracts own packet intake, signed evidence, transition review, and activation blockers. External approvers and authorised operators retain signature and live-cutover authority.
- Candidate allowed paths come only from Source PRD lines 462–477: `packages/tool-registry/src/**`, `packages/data-access-gateway/src/**`, narrowly proven `packages/evidence-lineage/src/**`, existing Tool Registry/Gateway/field-rights/Gate 0 contracts, targeted rights/P0/Gate 0 checkers, and row-specific planning/contract/note artifacts. `$think` must narrow them. Real external packet files may enter only through the authorised human/external intake path.

### Exit Criteria — Local Readiness

- Checkers compare exact tool-ID sets across selected authorities and print missing/extra IDs per source; every exclusion or classification is named and justified.
- No unexplained 23/24/25 count drift remains, and changing only an aggregate count cannot pass.
- Every unresolved field/channel dimension remains default denied.
- Policy version participates in cache identity and evidence output where existing authority requires it.
- Local fixtures/runtime smokes cover allow, redaction, deny, scope mismatch, stale policy, export denial, and unknown tool/field behavior.
- While any required external evidence, operator authorisation, live source/read path, cutover approval, or readback is absent, the only valid terminal status is `local_readiness_complete + blocked_external_activation`; no live activation occurs.

### Exit Criteria — External Acceptance and Live Activation

- Authentic signed packets cover the exact accepted field/channel/tool scope and pass existing packet and transition-review checkers.
- Existing authorities validate approver identity and authority, signature/hash, source locator, observed/signed times, expiry, redaction, and rights-policy version.
- Legal, data-partner, privacy, regulatory, and commercial decisions required by the existing packet are accepted, not templated or merely present.
- Authorised operators separately approve and verify the live policy source/read path, cutover, rollback readiness, and versioned readback.
- Activation covers only the accepted scope; every other scope stays default denied.
- An absent, stale, rejected, mismatched, placeholder, self-authored, or unverifiable criterion cannot promote external acceptance.

### Verification

Local readiness must validate and run the current authoritative equivalents of:

```bash
npm run check:tool-registry
npm run check:p0-rights-matrix-coverage
npm run check:p0-field-distribution-status
npm run check:field-rights-runtime
npm run check:field-rights-live-policy-source
npm run check:gate0-external-evidence-intake
npm run check:gate0-signed-evidence-manifest
npm run check:gate0-signed-evidence-packets
npm run check:gate0-signed-evidence-transition-review
npm run check:traceability-matrix
npx vitest run packages/tool-registry/src packages/data-access-gateway/src packages/evidence-lineage/src
npm run check:task-sync
repo-harness run check-task-workflow --strict
```

External acceptance additionally requires the credentialed/live commands and readbacks selected from existing operational contracts by the approved plan. Missing credentials, authentic packets, signatures, approver authority, or operator authorisation are blockers and may not be replaced with fixtures.

### Rollback

For local-only work, revert exact-ID, policy, checker, fixture, documentation, and row artifacts as one isolated diff, then rerun prior rights/Gate 0 checks to prove default deny. Before any separately approved activation, require a tested operator rollback that disables live reads, restores the prior policy version, invalidates versioned caches, and returns affected scopes to default deny. Preserve signed packet audit history and record operator, reason, versions, timestamps, scope, and readback.

### Stop Conditions

Stop if exact IDs require an unapproved product-scope decision, only counts are changed, evidence is missing/placeholder/self-authored/stale/mismatched, live readback or operator approval is unavailable, unresolved dimensions could become allowed, Data Access Gateway could be bypassed, rights-policy version would be omitted, rights would be inferred locally, forbidden paths or completed FastClaw work would be touched, rollback cannot restore default deny, allowed paths must widen without approval, or baseline failures prevent attribution.

## Authoring Verification

The authoring owner must record actual results for:

```bash
git diff --check
repo-harness run check-task-sync
repo-harness run check-task-workflow --strict
```

A structural assertion must verify Draft status, exact Source PRD, exactly three backlog rows, and mandatory order. Existing baseline failures remain explicit; this Sprint cannot claim repository readiness until required workflow gates pass or receive a separately authorised, evidence-backed resolution.

## Execution Log

Keep this section last; `repo-harness run sprint-backlog complete-task` appends rows here. No rows were executed during Sprint authoring.

| When | Task | Plan | Result |
|---|---|---|---|
| 2026-07-13 | Error taxonomy reconciliation | `plans/plan-20260713-0329-error-taxonomy-reconciliation.md` | accepted and frozen; 80-entry exact matrix, MCP private mapping 36/36, public subset unchanged at 11; 245 tests and four workspace typechecks passed |
| 2026-07-13 | Business Output/Evidence composition | `plans/plan-20260713-0602-business-output-evidence-composition.md` | accepted and frozen; composition ledger over 3 families and 9 owner-shaped fixtures, evidence identity preserved, missing evidence fails closed through Row 1; 230 tests and four workspace typechecks passed |
| 2026-07-13 | Signed/live field-channel rights | `plans/plan-20260713-1147-signed-live-field-channel-rights.md` | accepted and frozen at local readiness; exact-ID reconciliation over 23/24/25 tool authorities with named exclusions (count kept 23), 8 fail-closed fixtures; Gate 0 accepted_packets 0/6, terminal `local_readiness_complete + blocked_external_activation` under default deny |