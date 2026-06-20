# Sprint: Phase 0 Gate 0 Foundation

> **Status**: Executing
> **Slug**: phase0-gate0-foundation
> **Created**: 2026-06-20 13:07 +08
> **Updated**: 2026-06-20 13:18 +08
> **Source PRD**: `plans/prds/20260620-1302-aiphabee.prd.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **Source Spec**: `docs/spec.md`
> **Goal Mode**: gate-first

Program-level sprint container for PRD Phase 0. This sprint must close the
right-to-distribute, regulatory, data-methodology, quality, commercial, and
engineering-foundation gates before Phase 1 product implementation begins.

## PRD

Authoritative product truth lives in
`docs/researches/AiphaBee_PRD_v1.0.md`; this sprint uses the compact harness PRD
at `plans/prds/20260620-1302-aiphabee.prd.md` for execution routing and the
program tracker at `docs/AiphaBee_Sprint_Tracker_v1.0.md` for status rollup.

### Problem

AiphaBee cannot safely ship Web or MCP market-data features until the product
has field-level data rights, a concrete Type 4 / research-tool regulatory
classification, fixed financial data methodology, quality gates, and a runnable
engineering foundation.

### Users

- Product, compliance, data, and business owners who must approve Gate 0.
- Engineers who need stable contracts before implementing the Web Agent, Tool
  Registry, MCP surface, or data gateway.
- Future internal alpha users whose research output must be evidence-bound.

### Success Criteria

- P0 data fields have explicit authorization states across Web, MCP/API,
  export, derived data, time range, user type, and geography.
- MVP product wording and feature boundaries have written regulatory review.
- Core data models, time/version rules, adjustment methodology, restatement
  rules, metric definitions, quality rules, and golden samples are reviewable.
- Repo implementation baseline is audited against PRD section 23.
- Tracker and sprint artifacts show which evidence is complete and which items
  remain blocked by external decisions.

### Acceptance Scenarios

- Given an unconfirmed field, when any Web/MCP/export use is evaluated, then the
  decision package marks it default-deny until authorization is explicit.
- Given a feature that might be interpreted as advice, when Gate 0 is reviewed,
  then the feature has a written classification or is removed/deferred.
- Given a Phase 1 task request, when Gate 0 is not green, then the tracker still
  blocks large-scale product code and routes work to missing evidence.

### Non-goals

- No Phase 1 product feature implementation.
- No live market-data ingestion, production database mutation, or Cloudflare
  deployment cutover.
- No legal conclusion invented from product notes; legal/regulatory items need
  external written evidence.

## Architecture Notes

### Capabilities Touched

- Program planning: PRD, tracker, sprint backlog, task contracts.
- Compliance/data governance: rights matrix, regulatory decision packet, data
  contract, methodology versions.
- Engineering foundation: repo audit, Cloudflare binding plan, CI/check gates,
  future monorepo scaffold boundary.

### Dependency Order

1. Gate 0 rights and regulatory decision package.
2. Data contract and methodology baseline.
3. Golden samples, quality rules, and commercial model.
4. Engineering foundation audit and scaffold plan.
5. Traceability closeout and tracker status update.

### Risks

- External data or legal owners may not provide enough evidence to mark Gate 0
  green; in that case the correct result is `Blocked`, not a partial product
  build.
- MCP/API scope can collapse if machine-readable redistribution is denied.
- Engineering work before Gate 0 can create sunk-cost pressure against the PRD's
  explicit gate-first invariant.

## Backlog

Ordered execution queue. Each row should expand into one task contract before
implementation or evidence closeout.

| # | Status | Task | Mode | Acceptance | Plan |
|---|--------|------|------|------------|------|
| 1 | [x] | gate0-rights-regulatory-decision-pack | contract | A Gate 0 packet records field-level rights, default-deny gaps, HKEX/vendor licensing status, Type 4 review status, MVP boundary copy, PCPD path, commercial settlement dimensions, and signature state. | `plans/plan-gate0-rights-regulatory-decision-pack.md` |
| 2 | [ ] | data-contract-methodology-baseline | contract | Data partner contract, security master, time/version model, point-in-time rule, adjustment methodology, financial restatement model, metric library v0, HK calendar model, and pipeline design are documented with methodology versions. | (pending) |
| 3 | [ ] | golden-quality-commercial-baseline | contract | Golden sample design, quality rules, data hold/correction workflow, package-entitlement matrix, weighted credits, unit economics model, and Free abuse limits are documented and reviewable. | (pending) |
| 4 | [ ] | engineering-foundation-audit | contract | Repo baseline is audited against PRD section 23, including package/runtime/deploy topology, Cloudflare bindings, CI hooks, secrets, observability, and design-system reuse path. | (pending) |
| 5 | [ ] | phase0-traceability-closeout | contract | Program tracker, PRD mapping, `tasks/todos.md`, and traceability matrix reflect completed evidence, blocked items, and the next executable Phase 0 slice. | (pending) |

## Execution Log

Keep this section last; `.ai/harness/scripts/sprint-backlog.sh complete-task`
or a manual equivalent appends rows here.

| When | Task | Plan | Result |
|------|------|------|--------|
| 2026-06-20 13:18 +08 | gate0-rights-regulatory-decision-pack | `plans/plan-gate0-rights-regulatory-decision-pack.md` | Completed docs-only Gate 0 packet; external approvals remain pending/default-deny |
