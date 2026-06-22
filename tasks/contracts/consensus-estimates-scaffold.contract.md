# Consensus Estimates Scaffold Contract

## Objective

Complete the Phase 4 backend-only scaffold for `get_consensus_or_estimates`
only when explicit redistribution rights are confirmed.

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Consensus estimates route: `POST /analytics/consensus-estimates`
- Contract: `deploy/analytics/consensus-estimates.contract.json`
- Checker: `npm run check:consensus-estimates`

## Required Guarantees

- Use standard response envelopes.
- Require explicit redistribution rights.
- Return `blocked_redistribution_rights` without confirmed rights.
- Return `blocked_resolution` when the security cannot be resolved after rights
  are confirmed.
- Include source record identifiers in successful outputs.
- Do not read live provider data.
- Do not expose raw provider payloads.
- Do not write DB rows.
- Do not emit SQL.
- Do not provide investment advice.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Analytics Tools and Worker typecheck pass.
- Sprint tracker row is checked.
