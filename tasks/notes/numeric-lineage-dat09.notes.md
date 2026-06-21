# Numeric Lineage DAT-09 Notes

## What Changed

- Required `methodology_version` in `ProvenanceRef`.
- Added methodology versions to all P0 tool golden fixture provenance records,
  envelope metadata, and fixture data metadata.
- Added `required_provenance_fields` and strict provenance item schemas to
  `deploy/tools/tool-schemas.contract.json`.
- Extended `npm run test:golden` so tool fixtures must keep
  `source_record_id`, `data_version`, and `methodology_version` aligned with the
  manifest.
- Added `npm run check:numeric-lineage`.

## Verification

- `npm run test:golden`
- `npm run check:numeric-lineage`
- `npm run check:tool-schemas`
- `npm run check:p0-tool-catalog`
- `npm run check:always-on-controls`
- `npm run typecheck`

## Limits

This is still a local/no-live contract closeout. Partner source rows, live route
replay, and post-generation model evidence binding are explicitly out of scope.
