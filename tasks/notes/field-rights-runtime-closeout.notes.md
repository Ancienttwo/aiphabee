# Field Rights Runtime Closeout Notes

## What Changed

- Added a field-rights runtime closeout contract.
- Added `check:field-rights-runtime` and wired it into root `npm run check`.
- Updated A2 to mark the local runtime field-cropping requirement complete.
- Kept DAT-05 traceability incomplete because live rights source remains absent.

## Verification

- `npm run check:field-rights-runtime`
- `npm run check:data-gateway`
- `npm run check:field-authorization-config`
- `npm run check:p0-rights-matrix-coverage`
- `npm run test -- packages/data-access-gateway`
- `npm run check:task-sync`
- `npm run check`

## Remaining Gaps

Partner-signed rights matrix, live DB entitlement reads, live Serving reads/SQL,
persistent usage writes, and frontend rights operations UI remain out of scope.
