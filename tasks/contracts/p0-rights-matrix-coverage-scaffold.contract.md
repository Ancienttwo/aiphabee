# P0 Rights Matrix Coverage Scaffold Contract

## Scope

Complete the Sprint 3.3 §19.1 backend scaffold for P0 field/tool rights matrix
coverage across Web, MCP, export, and enterprise authorization surfaces.

## Required Surfaces

- `@aiphabee/data-access-gateway` exposes P0 rights matrix coverage
  capabilities.
- `GET /gateway/runtime` includes nested `p0_rights_matrix_coverage` readiness.
- `GET /gateway/rights-matrix/p0/coverage` returns coverage for all 16 P0
  tools and core P0 dataset/field groups.
- Local contract checker: `npm run check:p0-rights-matrix-coverage`.
- Empty schema scaffold:
  - `aiphabee_core.p0_rights_matrix_entry`
  - `aiphabee_governance.p0_rights_matrix_contract`

## Behavioral Contract

- Required surfaces are `web`, `mcp`, `export`, and `enterprise`.
- Default rights status remains `default_deny`.
- Tool coverage count must match the 16 registered P0 tools.
- Partner-signed matrix loading must remain false in this scaffold.
- Release gate must remain blocked on partner, commercial, and legal signoffs.
- No live DB reads, writes, SQL, or frontend UI.

## Non-Goals

- No signed partner rights matrix ingestion.
- No live entitlement row activation.
- No external legal/commercial signoff.
- No frontend operations UI.
