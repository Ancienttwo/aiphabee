# Implementation Notes: Signed/Live Field-Channel Rights

> **Status**: Completed and independently reviewed
> **Plan**: `plans/plan-20260713-1147-signed-live-field-channel-rights.md`
> **Contract**: `tasks/contracts/20260713-1147-signed-live-field-channel-rights.contract.md`
> **Review**: `tasks/reviews/20260713-1147-signed-live-field-channel-rights.review.md`
> **Last Updated**: 2026-07-13
> **Lifecycle**: notes

## Design Decisions

- Reconciled the 23/24/25 tool-ID drift by exact IDs, not counts: 23 = canonical partner-licensed P0 rights set (`p0-tool-catalog`), 24 = registry-required floor, 25 = full RegisteredToolName surface.
- Classified both drift tools as named, authority-grounded non-P0-rights-scoped exclusions:
  - `analyze_public_technical_signal` — ephemeral public OHLCV, Research-only, no market storage / shared cache / redistribution (docs/spec.md); registry-required scaffold only.
  - `parse_chart_image` — tenant-owned chart image upload, not partner-licensed; registered but not registry-required.
- Rewrote `check-p0-field-distribution-status` to prove `catalog(23) ⊆ registry(24) ⊆ RegisteredToolName(25)`, every extra is a named exclusion, no phantom exclusion, and `required_p0_tool_count` stays 23. Applied exact-ID symmetry to `p0-rights-matrix-coverage`.
- Removed a dead self-referential length comparison in `validateToolRegistry`.
- Kept the Data Access Gateway runtime (25-layer default-deny surface) and all Gate 0 contracts untouched.

## Local Readiness vs External Acceptance

- Local readiness: exact-ID reconciliation passes; default deny holds on every unresolved dimension; `rights_policy_version` participates in cache identity; field-rights runtime + live-policy smokes intact; the negative fixtures prove the checker fails closed. **Terminal: local_readiness_complete.**
- External acceptance: Gate 0 `accepted_packets = 0/6`, packet dir empty, `release_transition_allowed = false`. No packets were created, self-signed, or inferred. **Terminal: local_readiness_complete + blocked_external_activation, default deny preserved.**

## Verification Evidence

- `check:p0-field-distribution-status` → ok (was FAIL): 23 rights / 24 registry / 25 registered reconciled.
- `check:p0-field-distribution-status-fixtures` → ok, 8 cases (baseline + 7 fail-closed mutations).
- `check:p0-rights-matrix-coverage` → ok, 23 with exact IDs.
- `check:tool-registry`, `check:field-rights-runtime`, `check:field-rights-live-policy-source` → ok.
- Gate 0 intake/manifest/packets/transition-review → ok, accepted 0/6, blocked.
- `check:traceability-matrix` → ok.
- Targeted Vitest (tool-registry, data-access-gateway, evidence-lineage): 3 files / 37 tests passed.
- Data Access Gateway and Tool Registry typechecks passed. Task sync and strict workflow OK; `git diff --check` clean.

## Rollback

Revert both contracts, both checkers, the fixture and package wiring atomically; rerun the p0-field-distribution / p0-rights-matrix / field-rights / gate0 checks to prove default deny restored. Activation rollback (disable live reads, restore prior rights_policy_version, invalidate versioned caches, return to default deny) is reserved for a separately approved activation only. No DB, external service or live state changed.

## Open Questions

- None. External activation is frozen as a governance/external-approver-owned blocker until authentic signed packets and operator cutover exist.
