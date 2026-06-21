# Task Contract: Numeric Lineage DAT-09

## Goal

Close the local DAT-09 requirement that every current outward numeric tool
sample maps to `source_record_id`, `data_version`, and `methodology_version`.

## Acceptance

- `ProvenanceRef.methodology_version` is required in the shared data contract.
- All 16 P0 tool output schemas require the lineage triple in `provenance[]`.
- All 16 tool golden manifest source records and fixtures include matching
  lineage triples.
- `npm run test:golden` fails if any tool fixture loses the lineage triple.
- `npm run check:numeric-lineage` passes and is included in root `npm run check`.
- `docs/AiphaBee_Sprint_Tracker_v1.0.md` marks A1 DAT-09 and the DAT-09
  traceability matrix row complete with explicit local/no-live limits.

## Non-Goals

- Live partner source rows.
- Production route replay.
- Frontend evidence cards.
- Post-generation model output parsing.
