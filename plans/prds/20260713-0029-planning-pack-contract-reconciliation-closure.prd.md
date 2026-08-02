# PRD: Planning Pack Contract Reconciliation Closure

> **Status**: Draft
> **Slug**: `planning-pack-contract-reconciliation-closure`
> **Created**: 2026-07-13
> **Updated**: 2026-07-13
> **Source Spec**: `docs/spec.md`
> **Source Memo**: `docs/researches/20260710-gpt-planning-pack-distillation.md`
> **Source Sprint**: `plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md` (completed; reference only)
> **Source Governance Contracts**: `deploy/governance/p0-field-distribution-status.contract.json`, `deploy/governance/gate0-external-evidence-intake.contract.json`, `deploy/governance/gate0-signed-evidence-manifest.contract.json`, `deploy/governance/field-rights-live-policy-source.contract.json`
> **Tier**: standard
> **Authority**: Detailed source context for a future bounded `/goal`; this Draft PRD authorises no execution, activation, signature, deployment, or status promotion.

## AI Quick-Read Card

- **Problem**: The planning-pack distillation accepted three useful ideas but left their shared-contract reconciliation deliberately open: error ownership, business-output composition over existing evidence contracts, and signed/live field-channel rights.
- **Users**: Product and Platform maintainers, Agent Runtime/MCP/Data Gateway owners, governance reviewers, and external rights approvers.
- **Platform**: Repository contracts spanning data contracts, Agent Runtime, MCP Runtime, Tool Registry, Evidence Lineage, Data Access Gateway, Worker integration, and Gate 0 governance.
- **P0 surface**: One Draft Sprint with exactly three ordered contract rows: error taxonomy → business output/evidence composition → signed/live field-channel rights.
- **Core metric**: All three rows close their named gap through existing authorities, machine-checkable acceptance, and fail-closed negative scenarios without creating a parallel contract stack.
- **Hard constraint**: Local readiness and external acceptance are separate. Missing signed external evidence yields `local_readiness_complete + blocked_external_activation`; it never permits live activation.
- **Key risk**: Count- or fixture-based checks can appear green while exact tool IDs, public error exposure, evidence provenance, or signed channel rights still disagree.
- **Unknowns**: Current exact drift and packet state must be re-verified at execution time; the baseline below is an audit observation, not a fresh verification claim.
- **Acceptance scenarios**: Each row has a positive composition/reconciliation scenario and a negative scenario that rejects duplication, fabricated authority, or activation without evidence.
- **Suggested next step**: Run `repo-harness-check`, then author one Draft Sprint from this PRD; execute rows only through the repository plan/contract/worktree gates.

## Problem

The planning-pack distillation accepted three cross-module directions but deliberately left their implementation contracts unresolved. Existing error sets overlap without one ownership/public-exposure map; business-facing output concepts can duplicate the canonical response/evidence stack; and rights artifacts can report incompatible tool counts without proving exact field/channel permission or external signature. A later `/goal` needs one detailed, bounded authority that preserves these gaps, their dependency order, their negative constraints, and the repository workflow without carrying the original oversized prompt.

If execution begins from the memo alone, likely failure modes are wholesale adoption of the pack's seventeen errors or twelve cards, count-only reconciliation of rights, fixture-based claims of signed/live acceptance, and accidental reopening of completed FastClaw work. This PRD defines the minimum closure contract and the evidence needed to reject those outcomes.

## Goal

Close the three accepted gaps recorded in the distillation memo through one bounded Sprint containing exactly three ordered contract rows:

1. **Error taxonomy reconciliation** — establish ownership, public exposure, retry semantics, and versioning deltas across existing error authorities.
2. **Business output/evidence composition** — define how business-facing outputs compose existing response-envelope and evidence authorities without duplicating them.
3. **Signed/live field-channel rights** — reconcile exact tool IDs and field/channel rights into the existing rights authority, while separating local readiness from signed external acceptance and live activation.

The order is mandatory. Row 2 consumes Row 1's error contract. Row 3 consumes the output/evidence and failure semantics produced by Rows 1–2. A later row must not reinterpret an earlier row.

## Product Direction

### Thesis

Close only the three accepted reconciliation gaps at their existing ownership boundaries, with exact machine-checkable composition and default-deny external activation, instead of importing the planning pack as a second architecture.

### High-格局 Direction

Treat the planning pack as design input and the repository as authority. Contract closure means one canonical owner per semantic concept, explicit adapters/composition at channel boundaries, and evidence-backed state transitions. The work succeeds when future Web, Agent, FastClaw, and MCP paths can consume one reconciled contract chain without semantic translation or local guesses.

### Bold Takes

- A gap matrix that ends in explicit ownership decisions is more valuable than adopting a larger “complete” taxonomy.
- Business cards are projections over evidence-bound runtime output; they are not independent response schemas.
- Rights readiness can be complete while activation remains blocked. That split is a valid terminal delivery state.
- Tool coverage must compare exact IDs and classifications. Matching counts alone is insufficient.

### What Not To Do

- Do not restore the planning pack's RACI, recurring programmes, duplicated gates, or alternate precedence.
- Do not adopt twelve card schemas, the wholesale seventeen-error list, or a second rights schema.
- Do not add another runner or reopen the completed FastClaw Sprint.
- Do not turn missing signatures, packets, credentials, or live reads into fixtures that claim acceptance.

### First Proof Point

A Draft Sprint generated from this PRD contains exactly the three ordered rows, each names existing authoritative modules, has a fail-closed negative acceptance scenario, and preserves external activation as blocked until authentic signed evidence is present.

### Falsifier

This direction is falsified if any row needs a new parallel semantic authority, allows count-only rights reconciliation, changes completed FastClaw scope, or can report live/signed acceptance from local fixtures alone. Stop and revise the row contract rather than widening scope.

## Background and Authority

### Background

`docs/researches/20260710-gpt-planning-pack-distillation.md` accepted evidence-first output, default-deny rights, and strict runner boundaries, then identified three unresolved contract areas:

- the pack's seventeen errors overlap existing global and MCP sets but do not map ownership or public exposure;
- twelve proposed business cards risk duplicating existing response and evidence contracts;
- the seventeen-entry rights review template does not prove redistribution rights or activate mirrored data.

The memo explicitly authorises no runtime, database, credential, deployment, or external-service change. This PRD converts those unresolved areas into a bounded product contract for later Sprint authoring. It does not execute them.

### Authority Order

1. `docs/spec.md` is stable product truth.
2. `.ai/harness/policy.json` defines repository planning and workflow rules.
3. This PRD defines bounded intent and acceptance for the three-gap closure.
4. The future Draft Sprint orders the work but does not replace this PRD.
5. Each approved plan and frozen task contract governs one row's execution.
6. Existing runtime/governance contracts remain semantic authorities unless an approved row modifies them in place.
7. `tasks/current.md` is status only; `tasks/todos.md` is the deferred-goal ledger, not an active backlog.
8. The distillation memo is reconciled reference input, and `_ref/**` is never authority.

### Users and Owners

| Actor | Need | Ownership / success signal |
|---|---|---|
| Product and Platform maintainer | One bounded closure with no imported bureaucracy | Approves this PRD, Sprint order, and each row plan |
| Data Contracts owner | Stable shared response and error semantics | Canonical code ownership and versioning are explicit |
| Agent Runtime owner | Agent/FastClaw failures and final output compose shared contracts | No parallel public taxonomy or final-answer semantics |
| MCP Runtime owner | Public protocol errors remain a deliberate subset | Every exposed code has owner, retry, and version rules |
| Evidence Lineage owner | Business claims preserve source/method/version lineage | Composition cannot drop required evidence or limitations |
| Data Access Gateway / Tool Registry owner | Exact tools, fields, channels, and rights decisions agree | Exact-ID checks pass; unresolved rights remain denied |
| Governance reviewer | Local readiness is distinguishable from external acceptance | Status pair and packet evidence are machine-checkable |
| External legal/data partner approver | Only authentic signed decisions activate rights | No repository actor fabricates, self-signs, or infers approval |
| End user / API consumer | Consistent errors and evidence-bound results | Same semantics across Web, Agent, FastClaw, and MCP channels |

## P1: Architecture Map

### System Boundary

The boundary is the shared contract chain from tool/agent execution failure or result through public channel projection and rights enforcement. It includes repository-owned contracts and tests. It excludes provider negotiation, legal conclusions, production credentials, deployment, and live activation.

### Major Modules and Ownership

| Boundary | Existing authority | Responsibility in this PRD |
|---|---|---|
| Product truth | `docs/spec.md` | Evidence-first, default-deny, runner/tool authority invariants |
| Global data contract | `packages/data-contracts/src/index.ts` | Shared response envelope and global data error vocabulary |
| Agent execution | `packages/agent-runtime/src/**` | Agent/FastClaw-specific failures, retryability, run states, final semantics |
| MCP public protocol | `packages/mcp-runtime/src/**`, `deploy/mcp/error-codes.contract.json` | Deliberate public subset and protocol mapping |
| Tool catalogue | `packages/tool-registry/src/index.ts`, `deploy/tools/registry.contract.json` | Canonical tool identities and per-tool schemas/channels |
| Evidence | `packages/evidence-lineage/src/index.ts`, `deploy/evidence/service.contract.json` | Provenance, source references, methodology/data versions |
| Answer composition | `deploy/agent/answer-evidence-contract.contract.json`, Worker agent evidence smokes | Existing answer/evidence binding and channel integration |
| Rights decisions | `packages/data-access-gateway/src/index.ts`, `deploy/gateway/**` | Field/channel decision, default deny, policy version |
| Gate 0 evidence | `deploy/governance/gate0-*.contract.json` and packet directories | External intake, signed packet validation, activation blockers |
| Workflow | `.ai/harness/policy.json`, `plans/**`, `tasks/contracts/**` | PRD → Sprint → plan → approved contract → isolated execution |

### Strong and Weak Dependencies

- **Strong**: Row 2 depends on Row 1's canonical errors and mappings. Row 3 depends on Rows 1–2 for denial/error output and evidence projection.
- **Strong**: All rows depend on `docs/spec.md` invariants and existing contract owners.
- **Strong**: Rights activation depends on authentic external signatures and accepted packets, not repository completion.
- **Weak**: Business card names and presentation may vary if they remain projections over the canonical envelope/evidence model.
- **Weak**: Checker implementation details may follow existing repository patterns as long as exit criteria stay exact and fail closed.

### Explicit Out of Scope

The global non-goals below apply to every module and row. No physical-directory inference grants additional ownership. Frontend design, database migration, provider selection, and runtime deployment are outside this PRD unless a later approved row proves a narrowly required existing-contract edit.

## P2: Concrete Flow

### End-to-End Contract Flow

1. A Web, Agent, FastClaw, or MCP request selects a registered tool under Agent Control Plane and Tool Registry policy.
2. Data Access Gateway evaluates workspace, plan, channel, dataset, field, time range, and export rights. Unresolved dimensions return denial; they are not inferred.
3. Tool/runtime execution returns either a canonical result or an owner-specific failure.
4. Row 1's mapping classifies the failure by canonical owner, public exposure, retry semantics, and contract version. MCP receives only its approved public subset; private Agent/FastClaw failures are not leaked.
5. On success, Evidence Lineage binds source records, data/methodology/rights-policy versions, time, and limitations.
6. Row 2's composition projects the canonical result and evidence into the requested business output without replacing the response envelope or copying evidence into a divergent schema.
7. Row 3's rights state governs whether fields may be displayed, returned through MCP/API, exported, derived, cached, persisted, or used by a model. Local fixtures can prove evaluator readiness only.
8. Live field/channel access is enabled only when signed external packets are authentic, accepted, complete for the exact scope, and the existing activation path has explicit approval.
9. If signatures or required packets are absent, the final governance state is `local_readiness_complete + blocked_external_activation`; default deny remains the user-visible behavior.

### Contracts Crossed

- Input source of truth: registered tool ID plus request identity, entitlement, channel, dataset/field scope, time range, and export intent.
- Synchronous boundaries: validation, registry lookup, rights decision, response/error mapping.
- Asynchronous boundaries: agent/runner execution, evidence persistence/readback where already supported, external packet arrival and review.
- Ownership transformations: runtime-private failure → approved public error; deterministic result → evidence-bound response → business projection; signed packet → reviewed rights policy activation.
- Error paths: unknown error ownership, unmapped public exposure, missing evidence, exact-ID drift, missing signature, stale packet, scope mismatch, unavailable live read, and failed rollback all stop promotion.
- Final side effect: a reconciled contract set and verified governance status. Runtime or live activation is not implied by local closure.

### Pressure Points

- Error names currently overlap without one explicit cross-owner gap matrix.
- Business output can accidentally duplicate lower-level envelope/evidence fields and drift.
- Rights artifacts can disagree at 23, 24, and 25 tools while count-based checks obscure exact IDs.
- Local readiness fixtures can be mistaken for signed/live authority unless status is split and default deny is asserted.

## P3: Decision Rationale

### Why the Current Shape Exists

Separate global, Agent, MCP, evidence, and rights contracts protect genuine ownership boundaries: internal execution needs richer failures than public protocols; business views need domain presentation while evidence remains reusable; rights require external authority that code cannot manufacture. The planning pack flattened these distinctions into comprehensive lists, which would create a second semantic stack if adopted wholesale.

### Invariants to Preserve

- One Agent Control Plane owns public execution semantics.
- Existing response, evidence, error, Tool Registry, and Data Gateway contracts remain authoritative.
- FastClaw is an internal runner and owns none of these semantics.
- Unresolved identity, quality, evidence, or rights fail closed.
- Local readiness cannot promote external acceptance.
- Exact IDs and scoped rights matter more than aggregate counts.

### Smallest Coherent Change

Use three ordered reconciliation rows, modifying existing authorities in place only where a verified delta exists. Do not create a framework or universal schema. Each row must land a matrix/composition/transition contract plus targeted tests and evidence sufficient for the next row.

### Trade-off and 10× Scale

The design accepts more explicit mapping and review work in exchange for stable ownership and safer public contracts. At 10× tools, channels, and partners, manually duplicated lists fail first: tool IDs drift, error mappings omit new codes, and rights packets become stale. Exact-set comparison, versioned mappings, compositional schemas, and scoped packet validation are therefore P0 acceptance, while a new abstraction layer is not.

## Success Criteria

| Metric | Target | Measurement method | Degradation threshold |
|---|---:|---|---:|
| Ordered closure rows | Exactly 3 | Draft Sprint inspection and strict workflow check | Any missing, extra, or reordered row |
| Existing semantic authorities retained | 100% | Diff review against authoritative modules | Any parallel error/evidence/rights owner |
| Error codes classified | 100% of codes in compared existing sets | Exact code-set matrix checker | One unowned or unmapped code |
| Business outputs composed | 100% of approved outputs use canonical envelope/evidence refs | Schema/fixture tests | Any duplicated divergent evidence authority |
| Tool reconciliation | Exact ID sets agree across selected authorities | Set-diff checker printing missing/extra IDs | Count-only success or any unexplained ID |
| Rights safety | 100% unresolved field/channel dimensions denied | Negative tests and runtime smoke | One implicit allow or inferred right |
| External activation integrity | 0 activation without accepted signed evidence | Packet/transition checker | Any fixture/self-signed/missing packet activates |
| Workflow isolation | Every row uses approved contract and isolated worktree | Harness checks and review record | Direct execution from PRD/Sprint/todos |

## Global Scope

### In Scope

- Author one Draft Sprint sourced only from this PRD, with the three rows in mandatory order.
- Reconcile existing error authorities through an explicit gap/ownership/public/retry/version matrix.
- Define business output as composition over existing response and evidence contracts.
- Reconcile exact Tool Registry IDs and existing field/channel rights artifacts.
- Make local readiness and external acceptance separate machine-checkable states.
- Add or adjust targeted checkers, fixtures, contracts, tests, and narrow documentation only through each later approved row.
- Record rollback and stop evidence for every row.

### Global Non-goals

- Do not restore the 156-cell RACI, synthetic roles, recurring meetings, or other RACI machinery.
- Do not recreate duplicate release gates, programmes, programme plans, or overlapping Sprints.
- Do not adopt or implement the planning pack's twelve-card schema catalogue.
- Do not adopt the wholesale seventeen-error list.
- Do not create a second rights schema, shadow rights evaluator, or compatibility translation layer.
- Do not add an extra runner, runner family, execution axis, control plane, or tool stack.
- Do not modify, reopen, reclassify, or append work to the completed FastClaw Sprint at `plans/sprints/20260710-1702-fastclaw-dedicated-agent-runner-sandbox.sprint.md`.
- Do not infer redistribution rights from storage, ingestion, provider output, historical fixtures, or the local Netquity mirror.
- Do not fabricate legal approval, partner signature, evidence packets, source IDs, hashes, timestamps, or live readback.
- Do not enable live rights, live DB reads, live partner matrix reads, persistent writes, deployment, credentials, or production/public activation unless an explicitly approved later contract and authentic external evidence require them.
- Do not treat `tasks/todos.md` as an active backlog.
- Do not touch `.claude/agents/**`, `.claude/worktrees/**`, `_ref/**`, or `_ops/**`.

## Ordered Backlog

| Order | Contract row | Depends on | Required terminal result |
|---:|---|---|---|
| 1 | Error taxonomy reconciliation | Existing Data Contracts, Agent Runtime, MCP Runtime, Tool Registry errors | One explicit ownership/exposure/retry/version matrix with targeted contract tests |
| 2 | Business output/evidence composition | Row 1 accepted and frozen | Business outputs compose canonical envelope and evidence refs; no duplicate card authority |
| 3 | Signed/live field-channel rights | Rows 1–2 accepted and frozen | Exact-ID rights contract plus separate local/external states; default deny until authentic acceptance |

A row may finish as locally complete with an external blocker only where its exit criteria explicitly permit that state. Rows may not run in parallel because later contracts consume earlier semantics.

## Row 1 — Error Taxonomy Reconciliation

### Goal

Close the memo's error-code gap by reconciling existing error sets into one explicit matrix that identifies canonical owner, internal/public visibility, channel mapping, retryability, and versioning. The output is a reconciliation of current authorities, not adoption of the planning pack's seventeen-code list.

### Scope

- Inventory exact codes from `packages/data-contracts`, `packages/mcp-runtime`, Agent Runtime/FastClaw failures, Tool Registry declarations, and deployed MCP error contract.
- Classify each code by canonical owning module and semantic category.
- Record whether it is internal-only, shared, MCP-public, Web-public, or mapped to a safer public code.
- Define retryability from the owning contract; do not infer retry from HTTP status or name.
- Define additive/breaking version rules and unknown-code fail-closed behavior.
- Add targeted fixtures for overlap, owner-specific codes, omitted existing cases, retryability, and private-detail redaction.

### Non-goals

- No wholesale seventeen-error import.
- No deletion or renaming solely to make sets visually identical.
- No universal mega-enum that makes MCP or business channels expose internal Agent/FastClaw details.
- No compatibility aliases or regex-based semantic mapping.
- No changes to runner selection, transport, or completed FastClaw behavior.

### Authoritative Modules and Files

- `packages/data-contracts/src/index.ts`
- `packages/mcp-runtime/src/**`
- `deploy/mcp/error-codes.contract.json`
- `packages/agent-runtime/src/**` for Agent/FastClaw owner-specific failures
- `packages/tool-registry/src/index.ts` for per-tool declared standard errors
- `deploy/tools/registry.contract.json`
- `docs/spec.md` for fail-closed and authority invariants

### Suggested Allowed Paths

The future row contract should narrow its allowlist after `$think`. Candidate paths:

- `packages/data-contracts/src/**`
- `packages/mcp-runtime/src/**`
- `packages/agent-runtime/src/**` only where the gap matrix proves an owner-specific delta
- `packages/tool-registry/src/**` only for declared-code reconciliation
- `deploy/mcp/error-codes.contract.json`
- `deploy/tools/registry.contract.json` only if exact declarations are stale
- `scripts/check-*error*`
- row-specific `plans/**`, `tasks/contracts/**`, and `tasks/notes/**`

No path under a global non-goal is allowed.

### Exit Criteria

- A machine-readable or directly machine-checkable matrix covers every exact code in all selected existing sets.
- Every matrix row includes: code, canonical owner, semantic category, internal/public exposure, channel mapping, retryability owner/value, contract version, and redaction rule.
- The matrix identifies pack-only proposals as rejected/deferred rather than silently adopting them.
- Existing ambiguity, point-in-time, not-found, provider-configuration, Agent, and sandbox cases are intentionally represented or explicitly out of scope with owner evidence.
- MCP's public subset remains deliberate and does not leak private messages or runner/provider details.
- Unknown/unmapped codes fail closed to an approved generic public error while preserving internal audit identity; no semantic fallback is synthesized.
- Targeted positive and negative tests pass and Row 2 can reference a frozen error composition contract.

### Verification Commands

Run the exact commands selected by the approved plan, including at minimum:

```bash
npm run check:mcp-error-codes
npm run check:tool-registry
npx vitest run packages/data-contracts/src packages/mcp-runtime/src packages/agent-runtime/src
npm run check:task-sync
repo-harness run check-task-workflow --strict
```

If a listed command's current project shape has changed, the plan must replace it with the current authoritative command and record why; it may not silently skip coverage.

### Stop Conditions

- More than one module claims canonical ownership of the same semantic code.
- Public exposure requires leaking internal provider, sandbox, identity, or security detail.
- The proposed matrix depends on the planning pack's list as authority.
- An unmapped code is made retryable by heuristic or translated through compatibility aliases.
- The row requires unrelated implementation changes or changes completed FastClaw semantics.
- Baseline tests reveal pre-existing failures that prevent attribution; record and stop rather than masking them.

### Rollback

Revert only Row 1's matrix, declarations, tests, and checker changes through its isolated diff. Restore the previous published error contracts and versions together; do not leave a partially updated MCP subset or Tool Registry declaration. Re-run pre-row targeted checks and retain the failed plan/contract notes as audit evidence.

## Row 2 — Business Output and Evidence Composition

### Goal

Define a small composition contract showing how approved business-facing outputs project existing response-envelope and evidence-lineage authorities. Preserve source, time, method, limitations, contradictory evidence, material unknowns, qualitative strength, and version references without creating twelve independent card schemas.

### Scope

- Inventory the current response envelope, answer-evidence binding, generated-answer smoke, and Evidence Lineage references.
- Define a canonical composition boundary between runtime result, evidence bundle, and business projection.
- Select only representative output families needed to prove the pattern; do not enumerate twelve planning-pack cards.
- Require claim-to-evidence references and preserve data/methodology/rights-policy versions.
- Use Row 1 errors for failed, partial, denied, and unavailable composition paths.
- Add fixtures for complete evidence, contradictory evidence, material unknowns, rights-denied fields, and missing required evidence.
- Prove Web/Agent/FastClaw/MCP channel projections cannot change the underlying claim or evidence identity.

### Non-goals

- No twelve-card catalogue or card-specific storage model.
- No replacement response envelope, duplicate evidence record, or second citation format.
- No invented confidence percentages, authorised-feed claims, or personalised trading instructions.
- No frontend redesign or visual component programme.
- No local deterministic reconstruction when authoritative evidence is absent or malformed.

### Authoritative Modules and Files

- `packages/data-contracts/src/index.ts`
- `packages/evidence-lineage/src/index.ts`
- `deploy/evidence/service.contract.json`
- `deploy/agent/answer-evidence-contract.contract.json`
- `deploy/agent/generated-answer-evidence-smoke.contract.json`
- `apps/worker/src/agent-generated-answer-evidence-smoke.test.ts`
- `apps/worker/src/agent-tool-execution-evidence-smoke.test.ts`
- `packages/agent-runtime/src/**` for final-answer and Row 1 error composition
- `docs/spec.md` for evidence and compliance boundaries

### Suggested Allowed Paths

The future row contract should narrow its allowlist after `$think`. Candidate paths:

- `packages/data-contracts/src/**`
- `packages/evidence-lineage/src/**`
- `packages/agent-runtime/src/**` only for the frozen composition boundary
- `apps/worker/src/*answer*evidence*` and `apps/worker/src/*tool*evidence*`
- `deploy/agent/*evidence*.contract.json`
- `deploy/evidence/*.contract.json`
- targeted `scripts/check-*evidence*`
- row-specific `plans/**`, `tasks/contracts/**`, and `tasks/notes/**`

No frontend path is implied by this PRD.

### Exit Criteria

- One composition contract distinguishes canonical envelope fields, evidence references, and business projection fields.
- Representative fixtures prove at least: direct factual output, deterministic derived output, contradictory evidence, partial/unavailable output, and rights denial.
- Every user-visible factual claim points to canonical evidence/source references; deterministic calculations expose evidenced inputs and methodology version.
- Time, source, method, limitations, contradictory evidence, material unknowns, and qualitative evidence strength survive projection when applicable.
- Missing required evidence or malformed authority fails closed with a Row 1-owned error; no replacement semantics are generated.
- A business projection cannot mutate canonical claim identity, source identity, methodology version, rights-policy version, or denial state.
- Existing answer/evidence smoke and targeted tests pass without creating a second card or evidence schema.

### Verification Commands

```bash
npm run check:answer-evidence-contract
npm run check:agent-generated-answer-evidence-smoke
npx vitest run packages/data-contracts/src packages/evidence-lineage/src packages/agent-runtime/src apps/worker/src/agent-generated-answer-evidence-smoke.test.ts apps/worker/src/agent-tool-execution-evidence-smoke.test.ts
npm run check:task-sync
repo-harness run check-task-workflow --strict
```

The approved plan must confirm these commands still match current scripts before execution.

### Stop Conditions

- Composition requires a new top-level response or evidence authority.
- A business output duplicates evidence fields that can drift independently from canonical records.
- Missing evidence is replaced by regex, heuristics, local extraction, or fabricated citation data.
- Channel-specific rendering changes claim meaning, rights state, or evidence identity.
- The row expands into frontend design, twelve-card implementation, or unrelated persistence work.
- Row 1 is not accepted/frozen or its public failure mapping remains ambiguous.

### Rollback

Revert Row 2's projection contract, fixtures, and narrow integration changes as one unit. Restore the prior answer/evidence contract versions and rerun Row 1 plus pre-row evidence checks. Do not delete or rewrite canonical evidence records as a rollback mechanism; this row must not require destructive data migration.

## Row 3 — Signed/Live Field-Channel Rights

### Goal

Close the rights gap by reconciling exact registered tool IDs with existing field/channel rights contracts, proving local evaluator readiness, and defining an authenticated transition to signed external acceptance and live activation. Until that transition is genuinely satisfied, report `local_readiness_complete + blocked_external_activation` and preserve default deny.

### Scope

- Re-verify exact tool-ID sets across the Tool Registry source, deployed registry contract, P0 rights coverage, and field distribution status artifacts.
- Resolve drift by named IDs and classifications, not by changing counts alone.
- Reuse the existing Data Access Gateway rights model and Gate 0 packet/transition contracts.
- Cover the required dimensions already represented by repository authority: workspace, plan, channel, dataset, field, time range, export, plus source/redistribution/cache/persistence/history/region/attribution/audit/expiry/approval where the existing signed packet contract owns them.
- Define two distinct states:
  - **Local readiness**: exact-ID contracts, compilation, default-deny evaluator, versioned cache, and fixture/runtime smoke pass without live rights.
  - **External acceptance/live activation**: authentic partner/legal packets are accepted for the exact field/channel scope; approved live source/read path and cutover evidence exist.
- Validate packet identity, hash/signature, approver authority, scope, timestamp/expiry, redaction, and rights-policy version through existing contracts.
- Use Rows 1–2 to expose denied rights and their evidence without leaking packet secrets.

### Non-goals

- No second rights schema, alternate evaluator, or shadow parser.
- No inference of rights from the Netquity mirror, storage, ingestion, fixture presence, provider output, or commercial expectation.
- No self-signing, generated signature, placeholder approval, or copied hash presented as external evidence.
- No live activation, live DB reads, partner matrix reads, persistent writes, SQL execution, deployment, or credentials merely because local checks pass.
- No reopening of completed FastClaw work and no additional runner.
- No broad rewrite of all Gate 0 governance.

### Authoritative Modules and Files

- `packages/tool-registry/src/index.ts`
- `deploy/tools/registry.contract.json`
- `packages/data-access-gateway/src/index.ts`
- `deploy/gateway/p0-rights-matrix-coverage.contract.json`
- `deploy/governance/p0-field-distribution-status.contract.json`
- `scripts/check-p0-field-distribution-status-contract.mjs`
- `deploy/governance/field-rights-live-policy-source.contract.json`
- `deploy/governance/field-rights-runtime.contract.json`
- `deploy/governance/gate0-external-evidence-intake.contract.json`
- `deploy/governance/gate0-signed-evidence-manifest.contract.json`
- `deploy/governance/gate0-signed-evidence-packets/**`
- existing Gate 0 transition-review contract/checkers
- `packages/evidence-lineage/src/index.ts` for rights-policy evidence references

### Suggested Allowed Paths

The future row contract should narrow its allowlist after `$think`. Candidate paths:

- `packages/tool-registry/src/**`
- `packages/data-access-gateway/src/**`
- `packages/evidence-lineage/src/**` only for existing rights-policy evidence composition
- `deploy/tools/registry.contract.json`
- `deploy/gateway/*.contract.json`
- `deploy/governance/p0-field-distribution-status.contract.json`
- `deploy/governance/field-rights-*.contract.json`
- existing `deploy/governance/gate0-*.contract.json`, templates, and packet README/checker surfaces only as required by the approved transition design
- targeted `scripts/check-*rights*`, `scripts/check-p0-field*`, and `scripts/check-gate0*`
- row-specific `plans/**`, `tasks/contracts/**`, and `tasks/notes/**`

Packet files containing real external evidence may be added only by an authorised human/external intake path under the existing redaction and secret policy. An execution agent must not fabricate them.

### Exit Criteria

#### Local Readiness

- Exact tool IDs are compared across all selected authorities, and checker failures print missing/extra IDs per source.
- Every intentional tool exclusion or classification is named and justified; no unexplained 23/24/25 count remains.
- Existing field/channel rights evaluate default deny for every unresolved dimension.
- Policy version participates in cache identity and evidence output where already required.
- Local fixture and runtime-smoke tests prove allow, redaction, deny, scope mismatch, stale policy, export denial, and unknown tool/field behavior.
- Local completion reports exactly `local_readiness_complete + blocked_external_activation` while required external evidence or live read/cutover approval is absent.

#### External Acceptance and Live Activation

- Authentic signed external packets exist for the exact field/channel/tool scope and pass the existing packet and transition-review checkers.
- Approver authority, signature/hash, source locator, observed/signed time, expiry, redaction, and rights-policy version are validated.
- Required legal/data-partner/commercial decisions are accepted, not merely templated or present.
- Live policy source/read path and operational cutover are separately approved and verified through readback.
- Activation remains default-deny for any field/channel outside the accepted scope.
- If any external criterion is absent, stale, rejected, mismatched, or unverifiable, the valid terminal result remains `local_readiness_complete + blocked_external_activation`; no live activation occurs.

### Verification Commands

Local readiness commands must include:

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

External acceptance also requires credentialed/live commands and readbacks selected by the approved row plan from existing operational contracts. A missing credential, packet, signature, or external approver is a blocker, not permission to substitute a fixture.

### Stop Conditions

- Exact IDs cannot be reconciled without deciding a product-scope change not approved by this PRD.
- Any proposal changes only `required_p0_tool_count` while leaving set differences unexplained.
- A signed packet is absent, placeholder, self-authored by the executor, stale, scope-mismatched, or fails authenticity/redaction checks.
- Live source/readback or cutover approval is unavailable.
- A path would allow unresolved fields/channels, bypass Data Access Gateway, omit rights-policy version, or infer rights locally.
- External acceptance would require touching ignored `_ref/**`/`_ops/**`, agent configuration, or the completed FastClaw Sprint.
- Rollback cannot restore default deny before activation.

### Rollback

- **Local-only rollback**: revert exact-ID, policy, checker, fixture, and documentation changes as one isolated row diff; rerun the previous rights and Gate 0 checks to confirm default deny.
- **Activation rollback**: before any approved live activation, require a tested switch/cutover reversal that disables live reads, restores the prior rights-policy version, invalidates versioned caches, and returns all affected fields/channels to default deny.
- Preserve signed packet audit history; never delete or mutate external evidence to simulate rollback.
- Record rollback operator, reason, policy versions, timestamps, affected scopes, and readback evidence through the existing audit path.

## Acceptance Scenarios

### Scenario 1 — Ordered Sprint authoring

- **Given** this Draft PRD is the detailed source of truth and `repo-harness-check` passes,
- **When** the goal author creates the execution backlog,
- **Then** one Draft Sprint contains exactly the three ordered rows and each row points back to this PRD.
- **Machine-checkable evidence**: Sprint source metadata, exact row count/order, and `repo-harness run check-task-workflow --strict`.

### Scenario 2 — Row 1 positive: owned public mapping

- **Given** overlapping global, MCP, Tool Registry, and Agent/FastClaw error sets,
- **When** the reconciliation matrix is generated and tested,
- **Then** every exact code has one canonical owner, explicit exposure, retry owner/value, mapping, redaction, and version rule.
- **Machine-checkable evidence**: exact-set fixtures and targeted contract tests.

### Scenario 3 — Row 1 negative: wholesale import rejected

- **Given** a proposed implementation copies the planning pack's seventeen errors or exposes private runner failures publicly,
- **When** Row 1 validation runs,
- **Then (must NOT)** the proposal pass or become canonical.
- **Machine-checkable evidence**: forbidden/unowned code fixture, private-detail redaction fixture, and matrix coverage failure.
- **Tied non-goal**: no wholesale seventeen-error list or universal public mega-enum.

### Scenario 4 — Row 2 positive: evidence-bound projection

- **Given** a canonical tool result with evidence, methodology, rights-policy version, limitations, and contradictory evidence,
- **When** a business-facing output is composed,
- **Then** the projection preserves canonical identities and required evidence while adding only presentation/domain projection fields.
- **Machine-checkable evidence**: representative golden fixture and cross-channel identity assertions.

### Scenario 5 — Row 2 negative: missing evidence fails closed

- **Given** a factual claim lacks required canonical evidence or contains malformed source references,
- **When** composition runs,
- **Then (must NOT)** it synthesize citations, infer evidence, emit invented confidence, or create an alternate card schema; it returns the Row 1-approved failure.
- **Machine-checkable evidence**: malformed/missing evidence fixtures and no-output assertions.
- **Tied non-goal**: no twelve-card schema and no semantic fallback fabrication.

### Scenario 6 — Row 3 positive: local readiness without activation

- **Given** exact tool-ID reconciliation and local rights smoke tests pass but external signed packets or live cutover approval are absent,
- **When** status is evaluated,
- **Then** it reports `local_readiness_complete + blocked_external_activation` and all unresolved field/channel rights remain default denied.
- **Machine-checkable evidence**: exact-set checker output, local readiness report, packet checker, and denial smoke.

### Scenario 7 — Row 3 positive: scoped external acceptance

- **Given** authentic accepted packets and approved live read/cutover evidence cover an exact subset of fields and channels,
- **When** the existing transition contract is executed by authorised operators,
- **Then** only that scope can activate; every other scope remains denied and the policy version/readback is audited.
- **Machine-checkable evidence**: accepted packet validation, transition review, versioned runtime readback, and out-of-scope denial probe.

### Scenario 8 — Row 3 negative: fabricated or count-only closure rejected

- **Given** counts are edited to match without exact-ID agreement, or templates/placeholders are presented as signed evidence,
- **When** rights acceptance runs,
- **Then (must NOT)** local readiness or live activation be promoted.
- **Machine-checkable evidence**: missing/extra ID output, placeholder/invalid signature fixtures, and activation-status assertion.
- **Tied non-goal**: no second rights schema, fabricated signature, inferred right, or fixture-based live claim.

### Scenario 9 — Completed FastClaw isolation

- **Given** the FastClaw dedicated runner Sprint is complete,
- **When** any of the three rows is planned or executed,
- **Then (must NOT)** its Sprint, runner topology, or completed acceptance be modified.
- **Machine-checkable evidence**: allowed-path enforcement and diff review excluding the completed Sprint and FastClaw implementation unless a row's existing-authority test imports it read-only.

## Baseline Evidence to Re-verify

The following is **historical baseline evidence from the 2026-07-12 audit**. It has not been rerun for this PRD and must not be reported as current verified state. Every claim below must be rechecked in the isolated execution worktree before a row plan is approved:

- `check:p0-field-distribution-status` was observed against three disagreeing tool authorities:
  - **23**: `required_p0_tool_count` in P0 rights/field-distribution artifacts;
  - **24**: `deploy/tools/registry.contract.json` required tools, including `analyze_public_technical_signal` but not `parse_chart_image`;
  - **25**: `RegisteredToolName` in `packages/tool-registry/src/index.ts`, including both `analyze_public_technical_signal` and `parse_chart_image`.
- Closure must print and resolve the **exact IDs** missing/extra in each authority. Updating 23 → 24 → 25 or weakening the checker without an explicit classification decision does not satisfy this PRD.
- Gate 0 external packet directories were reported missing/incomplete in the audit. When required external packets are absent, the system must remain default deny and report blocked external activation.
- Existing local readiness contracts intentionally reported no signed partner matrix, no live partner matrix reads, and no live activation. Re-run their checkers; do not carry these statements forward as current facts without evidence.
- The completed status of the FastClaw Sprint is authoritative in its tracked Sprint file and is a scope boundary, not a target for revalidation or extension in this closure.

## Dependencies

### Required Before Sprint Authoring

- This PRD exists with Draft status and remains the detailed source of truth.
- `repo-harness-check` is run against the current repository.
- Current policy, template, capability map, and authoritative contract paths are re-read.
- No user WIP or forbidden path is included in the goal manifest.

### Row Dependencies

- Row 1: current exact error sets and owners.
- Row 2: approved/frozen Row 1 contract plus existing response/evidence authorities.
- Row 3: approved/frozen Rows 1–2, exact Tool Registry sources, Data Gateway rights model, Gate 0 packet/transition contracts, and external approvers for any activation phase.

### External Dependencies

- Signed partner field/channel rights matrix.
- Required legal/regulatory/privacy/commercial approvals represented by existing Gate 0 packets.
- Authorised approver identity and verifiable signature/hash/source locator.
- Approved live rights source/read path, credentials, operations cutover, and rollback operator for activation.

These dependencies can block external activation without invalidating a correctly completed local-readiness row.

## Workflow and Governance

### Goal Entry

1. Run `repo-harness-check` before authoring execution artifacts.
2. Use this file as the only detailed source of truth for the bounded `/goal`.
3. Author one **Draft Sprint** with exactly the three ordered rows.
4. Do not execute a row while authoring the Sprint.
5. Do not place active work in `tasks/todos.md`; it remains the deferred-goal ledger.

### Per-Row Execution Route

Each row independently follows this sequence:

1. `$think` performs row-specific architecture and risk analysis against current code/contracts.
2. `capture-plan` writes the detailed plan with exact files, invariants, tests, and rollback.
3. A human explicitly approves the plan.
4. `plan-to-todo` freezes the approved plan into one task contract; it does not convert `tasks/todos.md` into the active backlog.
5. Preflight verifies repository status, allowed paths, baseline commands, credentials/evidence availability, and forbidden user WIP.
6. Execute in a fresh isolated worktree with one row goal manifest.
7. Run targeted checks plus strict workflow verification.
8. Review against the row exit criteria, negative scenarios, scope, rollback, and actual diff.
9. Accept the row only after review; freeze its contract before starting the dependent row.

No row may skip approval, share a dirty worktree, or use a later row to repair an unaccepted earlier contract.

### Delegation

- Delegate bounded implementation, tests, checker updates, and documentation to an execution worker only after contract freeze.
- Delegate architecture/risk judgment to a reasoning reviewer during `$think` where needed.
- Use an independent acceptance reviewer after implementation; the implementer does not self-promote external acceptance.
- External signatures, legal decisions, and live cutover approval remain with authorised human/external owners.
- Every delegation includes this PRD, the row contract, exact allowed paths, verification commands, stop conditions, and forbidden paths.

### Reporting

For each row, report separately:

- source/contract state;
- local checks and exact command output;
- artifact/package/runtime state where applicable;
- local readiness status;
- external packet/signature status;
- live activation/readback status;
- rollback readiness;
- remaining blocker with owner and evidence path.

Never collapse “source complete,” “local readiness complete,” “external acceptance,” and “live activation” into one “done” claim.

## Verification Strategy

### PRD and Sprint Layer

- Markdown structure/lint for new planning artifacts.
- `git diff --check`.
- `repo-harness run check-task-workflow --strict`.
- Exact assertion that the Draft Sprint has three rows in the required order and references this PRD.

### Contract Layer

- Exact set comparison, not aggregate counts.
- Positive, negative, malformed, stale, unknown, and scope-mismatch fixtures.
- Existing checker reuse before adding a new checker.
- Contract versions and source paths included in machine-readable output.

### Runtime/Integration Layer

- Targeted package tests for touched authorities.
- Cross-channel error and evidence identity assertions.
- Default-deny rights probes for unknown/unaccepted dimensions.
- Credentialed live readback only in the external-acceptance phase and only under an approved contract.

### Review Layer

- Diff restricted to row allowed paths.
- No duplicate authority or compatibility fallback.
- No forbidden path or completed FastClaw Sprint change.
- Rollback command/path tested before any live activation.
- External evidence authenticity reviewed independently of the executor.

## Rollback and Recovery

### Sprint-Level Rollback

If Sprint authoring broadens beyond the three rows, changes their order, or imports rejected planning-pack material, discard/revert the Draft Sprint and regenerate it from this PRD. No runtime state should exist at this layer.

### Cross-Row Rollback

- Roll back the latest row before its dependants. A dependent row cannot remain accepted against a reverted contract.
- Restore contract versions, code declarations, fixtures, and checkers atomically per row.
- Re-run all earlier accepted row checks after rollback.
- Preserve plans, task contracts, notes, review findings, and external packet audit history.
- If live rights were activated, execute the pre-approved default-deny cutover rollback before code/document rollback.

### Recovery Rule

After any stop condition, gather new evidence and revise the row plan/contract. Do not retry the same failed route, weaken checks, invent fallback semantics, or widen the Sprint without human approval.

## Known Unknowns

| Item | Impact | Resolution path | Owner |
|---|---|---|---|
| Current exact 23/24/25 tool-ID state | Determines Row 3 delta | Re-run source extraction and exact-set checker in isolated worktree | Tool Registry / Data Gateway owner |
| Current Gate 0 packet inventory and acceptance | Determines whether Row 3 ends local-only or can enter activation review | Run existing manifest/packet/transition checks; inspect authorised evidence locators | Governance reviewer |
| Canonical owner for each overlapping error | Determines Row 1 mappings and versioning | `$think` with exact source inventory and module-owner review | Data Contracts + channel owners |
| Minimum representative business output families | Bounds Row 2 proof without twelve schemas | Select during Row 2 `$think`, justified by current product paths | Product + Evidence owner |
| Live activation command/readback surface | Required only if authentic external acceptance exists | Derive from current operational contract; no speculative command | Operations / Data Gateway owner |

## Developer Handoff

You are closing three contract gaps, not implementing the planning pack.

- **Build first**: Row 1 exact ownership matrix and tests; then Row 2 composition; then Row 3 exact-ID/local-vs-external rights transition.
- **Do not reinterpret**: authority order, row order, global non-goals, default deny, `local_readiness_complete + blocked_external_activation`, or completed FastClaw scope.
- **You may improve**: checker diagnostics, fixture coverage, and narrow documentation where they directly prove a row exit criterion.
- **Verify with**: the row commands, strict workflow check, diff review, and external readback only when approved evidence exists.
- **Stop rather than guess**: unknown ownership, missing evidence, external signatures, current tool IDs, or activation paths must be resolved from current authorities.

## Adjacent Patterns

No external prior-art research is required. This is an internal contract reconciliation and governance closure. The adopted pattern is already present in the repository: one owner per contract, deliberate public subsets, evidence references rather than duplicated evidence, exact checker assertions, isolated row contracts, and default-deny external transitions.

## Final Acceptance Checklist

- [ ] `repo-harness-check` passed before Draft Sprint authoring.
- [ ] One Draft Sprint references this PRD and has exactly three ordered rows.
- [ ] Row 1 reconciles current exact error sets without adopting the wholesale seventeen-error list.
- [ ] Row 2 composes existing envelope/evidence authorities without twelve card schemas.
- [ ] Row 3 resolves exact tool IDs and rights classifications, not counts alone.
- [ ] Local readiness and external acceptance are separate machine-checkable states.
- [ ] Missing external signatures/packets produce `local_readiness_complete + blocked_external_activation`.
- [ ] Default deny remains active until authentic, scoped, approved live acceptance.
- [ ] No extra runner, duplicate rights schema, RACI, programme, or duplicate gate was added.
- [ ] Completed FastClaw Sprint and forbidden paths were untouched.
- [ ] Every row followed think → capture-plan → approval → plan-to-todo → preflight → isolated worktree → check → review.
- [ ] Every row has tested rollback and preserved audit evidence.
- [ ] Reports distinguish source, local readiness, external acceptance, and live activation.
