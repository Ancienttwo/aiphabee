# Numeric Lineage DAT-09 Closeout

This note closes the local P0 tool portion of DAT-09: every registered P0 tool
golden response that can expose numbers now carries a reproducible lineage
triple:

- `source_record_id`
- `data_version`
- `methodology_version`

The closeout is intentionally local and no-live. It does not claim partner
source rows, production route replay, or post-generation model output parsing.

## Verified Surface

- Shared `ProvenanceRef` requires `methodology_version`.
- `deploy/tools/tool-schemas.contract.json` requires the lineage triple in every
  registered P0 tool output provenance item.
- `tests/golden/tools/manifest.json` and all 16 tool golden fixtures carry the
  same lineage triple.
- `npm run test:golden` now validates the lineage triple instead of only
  checking `source_record_id`.
- `npm run check:numeric-lineage` validates the tool schema, golden fixtures,
  answer evidence contract, numeric source guard, and evidence lineage service
  together.

## Limits

- Live partner source rows are still not loaded.
- Live route replay is still not enabled.
- Post-generation model output parsing/evidence binding remains a later live
  Agent slice.
