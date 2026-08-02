# Implementation Notes: Business Output Evidence Composition

> **Status**: Completed and independently reviewed
> **Plan**: `plans/plan-20260713-0602-business-output-evidence-composition.md`
> **Contract**: `tasks/contracts/20260713-0602-business-output-evidence-composition.contract.md`
> **Review**: `tasks/reviews/20260713-0602-business-output-evidence-composition.review.md`
> **Last Updated**: 2026-07-13
> **Lifecycle**: notes

## Design Decisions

- Added a reconciliation-only ledger; no runtime DTO, storage model or channel semantic owner.
- Proved three representative families with nine non-authoritative fixtures.
- Preserved immutable envelope, evidence, claim, calculation and existing rights-reference identities.
- Missing/malformed evidence uses frozen Row 1 `DATA_QUALITY_HOLD`; existing unlicensed/scope denial remains denied; unknown defects use generic `INTERNAL_ERROR`.
- Prohibited evidence payload duplication, confidence percentages, local reconstruction and rights inference.

## Deviations From Plan Or Spec

- None.

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| New business output DTO | Rejected | Would become a second runtime authority |
| Twelve card schemas | Rejected | Duplicates evidence and drifts at scale |
| Composition ledger | Selected | Verifies semantics while existing owners remain authoritative |

## Verification Evidence

- New checker: `status=ok`, 3 families, 9 owner-shaped fixtures, mutation self-tests covering authority boundary, dangling refs, envelope/claim/calculation/rights identity, provenance identity, denial, confidence alias, duplicated payload, ledger selector emptying, invalid strength and Row 1 channel-mapping unknown policy.
- Owner selectors are bound to `AgentAnswerDraftClaimInput`/`AgentAnswerEvidenceCardInput`/`AgentAnswerCalculationRefInput`, Evidence Lineage plan interfaces, response envelope types, and the pinned answer-evidence JSON version through the TypeScript compiler API.
- Adversarial re-probes (dangling claim evidence, provenance mutation, invalid strength, empty ledger selectors, Agent interface drift, JSON version skew, JSON selector drift) all fail closed.
- Existing Row 1, Evidence Service, Evidence Lineage, answer contract and two Agent evidence smoke checks passed.
- Targeted Vitest: 21 files / 230 tests passed.
- Data Contracts, Evidence Lineage, Agent Runtime and Worker typechecks passed.

## Rollback

Remove the Row 2 ledger, fixtures, checker, tests and package wiring atomically. No DB, external service, live state or evidence record changes exist.

## Open Questions

- None for Row 2. Row 3 remains unstarted.
