# Plan: Resolve Security Tool Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 00:40 +08
> **Slug**: resolve-security-tool-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/resolve-security-tool-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/resolve-security-tool-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live `resolve_security` tool scaffold for Sprint 1.2.
- Routing reason: shared Tool Registry exists, but Sprint 1.2 needs the first
  atomic data tool contract with code/name/history parsing and ambiguity
  candidates.
- Due diligence:
  - P1 map: `@aiphabee/security-tools`, `@aiphabee/tool-registry`, Worker
    `/tools/resolve-security`, and tool contract checker.
  - P2 trace: request query -> synthetic security master resolver -> standard
    response envelope -> ambiguity/no-found error handling.
  - P3 decision rationale: use deterministic synthetic fixture rows to prove
    semantics before live security master reads or partner data.

## Workflow Inventory

- Active plan: `plans/plan-resolve-security-tool-scaffold.md`
- Task contract:
  `tasks/contracts/resolve-security-tool-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/resolve-security-tool-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/resolve-security-tool-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Add `@aiphabee/security-tools` with `resolveSecurity()`.
- Support synthetic code, symbol, Chinese name, English name, and historical
  name lookups.
- Return `resolved`, `ambiguous`, or `not_found` status.
- Never silently choose a security for ambiguous lookups.
- Return standard envelope metadata through Worker `POST /tools/resolve-security`.
- Mark `resolve_security` as the one scaffold-ready registry tool while all
  live data access remains disabled.
- Add `deploy/tools/resolve-security.contract.json` and
  `npm run check:security-tools`.

## Task Breakdown

- [x] Add no-live `resolveSecurity()` package and tests.
- [x] Promote `resolve_security` registry entry from planned to scaffold.
- [x] Add Worker `POST /tools/resolve-security` route.
- [x] Add tool contract and checker.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
