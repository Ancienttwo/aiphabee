# Public Status And Docs Scaffold

> **Status**: Verified backend scaffold
> **Last Updated**: 2026-06-21 19:53 +08
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md`
> **PRD Source**: `docs/researches/AiphaBee_PRD_v1.0.md` 18.4, 19.5
> **Task Contract**:
> `tasks/contracts/public-status-docs-scaffold.contract.md`

This slice completes the backend-only Sprint 3.2 scaffold for public status,
API/MCP documentation, privacy policy, and terms publication surfaces. It does
not enable a frontend docs site, live incident feed, live deployment proof, or
final legal approval.

## P1 Architecture Map

| Surface | State | Boundary |
|---|---|---|
| Package | `@aiphabee/public-ops` | Owns public operations capability, status component manifest, and docs publication manifest |
| Runtime route | `GET /public/runtime` | Reports public status/docs readiness and no-live boundaries |
| Status route | `GET /public/status` | Lists public status components with evidence routes and visible `request_id` |
| Docs route | `GET /public/docs` | Lists API/MCP/privacy/terms local publication drafts |
| Static docs | `docs/public/*.md` | Holds local API, MCP, privacy, and terms draft content |
| Contract | `deploy/public-ops/public-status-docs.contract.json` | Guards routes, document coverage, required sections, no frontend, no live feed, no writes, and no SQL |
| Schema scaffold | `aiphabee_core.public_status_component`, `aiphabee_core.public_document_publication`, `aiphabee_governance.public_operations_contract` | Empty future persistence surfaces |
| Frontend | Out of scope | User delegated frontend work to Claude |

## P2 Concrete Trace

1. Caller requests `GET /public/status` or `GET /public/docs`.
2. Worker calls `getPublicStatusPage()` or `getPublicDocsManifest()` from
   `@aiphabee/public-ops`.
3. Status output lists Worker API, Remote MCP, Data Gateway, usage/billing, and
   public documentation components with evidence routes.
4. Docs output lists API reference, MCP reference, privacy policy, and terms of
   service drafts with required section metadata.
5. Worker wraps the result in the shared standard success envelope with zero
   credits, visible `request_id`, and no-store caching.

## P3 Design Decision

Selected a dedicated `public-ops` package instead of placing public status/docs
inside MCP, account, or web code.

Reason:

- PRD 18.4 and 19.5 define public operations as a GA release boundary, not as a
  single product runtime.
- The status page must summarize several subsystems without changing their
  execution behavior.
- Frontend work remains delegated, so this slice needs a stable backend/content
  contract first.

Tradeoff:

- Public status/docs/legal surfaces are now discoverable and testable.
- Live publication, final legal review, help center workflows, and frontend
  rendering remain separate slices.

## Verification

Passed:

- `npm run typecheck --workspace @aiphabee/public-ops`
- `npm run typecheck --workspace @aiphabee/worker`
- `npm run check:public-ops`
- `npm run check:database`
- `npx vitest run packages/public-ops/src/index.test.ts apps/worker/src/index.test.ts`
- `npm run build --workspace @aiphabee/public-ops`
- `npm run build --workspace @aiphabee/worker`

Observed runtime fields:

```json
{
  "public_ops": {
    "route": "GET /public/runtime",
    "status_route": "GET /public/status",
    "docs_route": "GET /public/docs",
    "live_incident_feed": false,
    "live_publication_verified": false
  },
  "documents": [
    "api_reference",
    "mcp_reference",
    "privacy_policy",
    "terms_of_service"
  ]
}
```

## Residual Gaps

- No frontend status/docs site.
- No live uptime probe or incident feed.
- Privacy and terms drafts still require legal review.
- Help center and support request investigation workflow remains the next
  Sprint 3.2 item.
