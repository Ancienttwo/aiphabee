# Market Statistics Scaffold Contract

## Objective

Complete the Phase 4 backend-only scaffold for `get_market_breadth`,
`get_ownership_and_short_selling`, and `get_buybacks_and_placements` when the
market-statistics data scope is authorized.

## Required Surfaces

- Package: `@aiphabee/analytics-tools`
- Runtime route: `GET /analytics/runtime`
- Market breadth route: `POST /analytics/market-breadth`
- Ownership/short-selling route: `POST /analytics/ownership-short-selling`
- Buybacks/placements route: `POST /analytics/buybacks-placements`
- Contract: `deploy/analytics/market-statistics.contract.json`
- Checker: `npm run check:market-statistics`

## Required Guarantees

- Use standard response envelopes.
- Require authorized market-statistics access.
- Return `blocked_authorization` without authorization.
- Return `blocked_resolution` for unresolved security-specific requests.
- Include source record identifiers in successful outputs.
- Do not read live market-statistics providers.
- Do not write DB rows.
- Do not emit SQL.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Package and Worker targeted tests pass.
- Analytics Tools and Worker typecheck pass.
- Sprint tracker row is checked.
