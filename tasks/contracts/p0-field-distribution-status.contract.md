# Task Contract: P0 Field Distribution Status

## Objective

Close the Sprint 0.1 repo-verifiable requirement to annotate P0 field
distribution status for Web display, MCP/API redistribution, export, and
derived use, with unconfirmed fields default-denied.

## Acceptance

- Add `deploy/governance/p0-field-distribution-status.contract.json`.
- Add `npm run check:p0-field-distribution-status`.
- Validate all nine P0 dataset groups are represented.
- Validate each represented dataset group has non-empty field patterns.
- Validate Web/MCP/export/derived statuses are all
  `default_deny_pending_partner_matrix`.
- Cross-check the source P0 rights matrix coverage contract, Tool Registry, and
  Data Access Gateway source.
- Update only the Sprint 0.1 field-status checkbox.

## Out Of Scope

- Data partner signature.
- HKEX/vendor license conclusion.
- Live rights DB reads.
- Commercial settlement terms.
- Gate 0 decision signature.
