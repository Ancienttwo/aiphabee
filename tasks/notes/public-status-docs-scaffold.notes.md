# Public Status And Docs Scaffold Notes

## Summary

Implemented the Sprint 3.2 backend scaffold for public status, API/MCP docs,
privacy policy, and terms surfaces.

## Current State

- `@aiphabee/public-ops` exposes public operations capabilities.
- `GET /public/runtime` reports status/docs readiness.
- `GET /public/status` returns five public status components with evidence
  routes and visible `request_id`.
- `GET /public/docs` returns a manifest for API reference, MCP reference,
  privacy policy, and terms of service drafts.
- `docs/public/api.md`, `docs/public/mcp.md`, `docs/public/privacy.md`, and
  `docs/public/terms.md` exist as local publication drafts.
- `core.public_status_component`, `core.public_document_publication`, and
  `governance.public_operations_contract` exist as empty schema scaffolds.
- The local contract checker verifies routes, document coverage, required
  sections, status components, no live incident feed, no live publication claim,
  no SQL, no writes, and database contract linkage.

## Non-Goals

- No frontend status page or docs site.
- No live deployment verification.
- No live incident feed or uptime probe.
- No final legal approval for privacy or terms.
- No help center/support workflow; that remains the next Sprint 3.2 item.

## Verification

Passed:

- `npm run typecheck --workspace @aiphabee/public-ops`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:public-ops`
- `npm run check:database`
- `npx vitest run packages/public-ops/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run build --workspace @aiphabee/public-ops`
- `npm run build --workspace @aiphabee/worker`
