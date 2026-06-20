# Plan: Get Security Profile Tool Scaffold

> **Status**: Verified
> **Created**: 2026-06-21 01:05 +08
> **Slug**: get-security-profile-tool-scaffold
> **Spec**: `docs/spec.md`
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Task Contract**:
> `tasks/contracts/get-security-profile-tool-scaffold.contract.md`
> **Implementation Notes**:
> `tasks/notes/get-security-profile-tool-scaffold.notes.md`

## Agentic Routing

- Selected route: no-live `get_security_profile` tool scaffold for Sprint 1.2.
- Routing reason: `resolve_security` can now produce stable synthetic
  `instrument_id` values, but Sprint 1.2 still needs the profile tool that
  exposes status, currency, and coverage metadata.
- Due diligence:
  - P1 map: `@aiphabee/security-tools`, `@aiphabee/tool-registry`, Worker
    `/tools/get-security-profile`, and security tool contract checker.
  - P2 trace: `instrument_id` -> synthetic profile fixture -> standard
    response envelope -> not-found/invalid error handling.
  - P3 decision rationale: use deterministic profile fixtures to prove
    listed/suspended/delisted semantics before live security master reads.

## Workflow Inventory

- Active plan: `plans/plan-get-security-profile-tool-scaffold.md`
- Task contract:
  `tasks/contracts/get-security-profile-tool-scaffold.contract.md`
- Implementation notes:
  `tasks/notes/get-security-profile-tool-scaffold.notes.md`
- Runtime evidence:
  `docs/governance/get-security-profile-tool-scaffold.md`
- Tracker rollup: `docs/AiphaBee_Sprint_Tracker_v1.0.md`

## Approach

### Strategy

- Extend `@aiphabee/security-tools` with `getSecurityProfile()`.
- Add listed, suspended, and delisted synthetic profile fixtures.
- Return company/security profile, listing status, currency, lifecycle, and
  coverage metadata.
- Add Worker `POST /tools/get-security-profile` with standard envelopes.
- Mark `get_security_profile` as scaffold-ready while live data remains
  disabled.
- Add `deploy/tools/get-security-profile.contract.json` under
  `npm run check:security-tools`.

## Task Breakdown

- [x] Add no-live `getSecurityProfile()` package and tests.
- [x] Promote `get_security_profile` registry entry from planned to scaffold.
- [x] Add Worker `POST /tools/get-security-profile` route.
- [x] Add tool contract and checker coverage.
- [x] Update tracker/governance/todos.
- [x] Verify local checks, Worker smoke, and workflow strict check.
