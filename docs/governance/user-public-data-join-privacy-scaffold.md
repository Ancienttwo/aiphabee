# User File And Public Data Join Privacy Scaffold

## Scope

This scaffold closes the Phase 4 DOC-05 / STK-08 planning item for user uploaded files joined with authorized public market data. It adds a no-write planner at `POST /documents/user-public-data-join/plan` and exposes readiness through `GET /documents/runtime`.

## Boundary

- User uploaded files remain workspace-private, untrusted data.
- The planner accepts file id and hash metadata only; it does not persist raw file bodies.
- Public data access is represented through Data Access Gateway routes and field authorization policy ids.
- Join keys are explicit allowlist values only: `instrument_id`, `document_id`, `period`, and `source_record_id`.
- Custom layouts are saved as private layout metadata plans only; no frontend layout editor is enabled.

## Disabled Surfaces

- Live upload storage
- Live public data provider reads
- Join execution
- SQL execution
- Persistent writes
- R2 artifact writes
- Model calls or model training on user files
- Frontend rendering

## Verification

- `npm run check:user-public-data-join-privacy`
- `npm run check:database`
- `npx vitest run packages/document-tools/src/index.test.ts apps/worker/src/index.test.ts`
