# Public Status And Docs Scaffold Contract

## Objective

Complete the backend-only Sprint 3.2 scaffold for public status, API/MCP
documentation, privacy policy, and terms publication surfaces.

## Required Surfaces

- Package: `@aiphabee/public-ops`
- Runtime route: `GET /public/runtime`
- Status route: `GET /public/status`
- Docs route: `GET /public/docs`
- Contract: `deploy/public-ops/public-status-docs.contract.json`
- Checker: `npm run check:public-ops`
- Public docs:
  - `docs/public/api.md`
  - `docs/public/mcp.md`
  - `docs/public/privacy.md`
  - `docs/public/terms.md`
- Schema scaffolds:
  - `core.public_status_component`
  - `core.public_document_publication`
  - `governance.public_operations_contract`

## Required Guarantees

- Use standard response envelopes.
- Keep `request_id` visible for investigation.
- Expose status components for Worker API, Remote MCP, Data Gateway, usage and
  billing, and public documentation.
- Expose document manifest entries for API reference, MCP reference, privacy
  policy, and terms of service.
- Verify required sections exist in each local publication draft.
- Do not require account authentication for public metadata routes.
- Do not enable live incident feeds.
- Do not claim live publication deployment.
- Do not emit SQL.
- Do not write status or document publication rows.
- Keep frontend UI out of scope.

## Acceptance

- Contract checker passes.
- Database migration contract includes the public operations tables.
- Package and Worker targeted tests pass.
- Public Ops package and Worker typecheck/build pass.
- Sprint tracker row is checked and Sprint 3.2 count is updated.
