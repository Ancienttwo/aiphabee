# Gate 0 Signed Evidence Transition Fixtures Notes

Date: 2026-06-22

## Completed

- Refactored `scripts/check-gate0-signed-evidence-manifest-contract.mjs` so its
  validation logic can be reused by fixture checks while preserving the CLI
  default behavior.
- Added `scripts/check-gate0-signed-evidence-manifest-fixtures.mjs`.
- Added `npm run check:gate0-signed-evidence-manifest-fixtures` and wired it
  into full `npm run check`.

## Fixture Coverage

Valid scenarios:

- `current_pending_manifest`
- `complete_accepted_manifest`

Invalid scenarios:

- `accepted_without_evidence_refs`
- `partial_packet_release_flags`
- `invalid_sha256_ref`
- `approval_status_mismatch`
- `unredacted_evidence_ref`
- `missing_packet_retains_evidence_ref`

## Current Production State

The production manifest remains pending:

- `accepted_packets=0`
- `required_packets=6`
- `release_transition_allowed=false`

No external approval checkbox was marked complete.
