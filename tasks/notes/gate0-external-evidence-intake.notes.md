# Gate 0 External Evidence Intake Notes

Date: 2026-06-22

## Completed

- Added `deploy/governance/gate0-external-evidence-intake.contract.json`.
- Added `scripts/check-gate0-external-evidence-intake-contract.mjs`.
- Added `docs/governance/gate0-external-evidence-intake.md`.
- Added `npm run check:gate0-external-evidence-intake` and included it in full `npm run check`.

## Contract Coverage

- All 11 PRD 14.1 rights dimensions.
- Field rights matrix evidence.
- HKEX/vendor licensing memo evidence.
- Type 4/product-boundary written opinion evidence.
- PCPD/PDPO privacy path evidence.
- Commercial settlement schedule evidence.
- Gate 0 signature register evidence.

## Preserved Boundary

- No external approval is marked complete.
- `DEFAULT_DENY` remains the runtime default for unconfirmed rights.
- `DATA_NOT_LICENSED` remains the runtime error for unlicensed data exposure.
- Web display rights do not imply MCP/API redistribution rights.
- The checker intentionally rejects approval-complete flags until signed evidence references replace the pending state.
