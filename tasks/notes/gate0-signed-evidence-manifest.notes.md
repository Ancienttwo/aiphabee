# Gate 0 Signed Evidence Manifest Notes

Date: 2026-06-22

## Completed

- Added `deploy/governance/gate0-signed-evidence-manifest.contract.json`.
- Added `scripts/check-gate0-signed-evidence-manifest-contract.mjs`.
- Added `docs/governance/gate0-signed-evidence-manifest.md`.
- Added `npm run check:gate0-signed-evidence-manifest`.
- Updated Sprint tracker, deferred goal ledger, and Gate 0 governance docs.

## Current Manifest State

All six required evidence packets remain `missing`:

- `field_rights_matrix`
- `hkex_vendor_licensing_memo`
- `type4_product_boundary_opinion`
- `pcpd_privacy_path_assessment`
- `commercial_settlement_schedule`
- `gate0_signature_register`

The manifest therefore keeps:

- `external_approvals_complete=false`
- `release_transition_allowed=false`
- `runtime_default=DEFAULT_DENY`
- `unconfirmed_runtime_error=DATA_NOT_LICENSED`

## Transition Rule

A packet cannot be marked `accepted` unless it includes redacted evidence refs
with SHA-256 hash, signed date, approver metadata, `approval_status=accepted`,
and `redaction_status=redacted_no_secrets`.
