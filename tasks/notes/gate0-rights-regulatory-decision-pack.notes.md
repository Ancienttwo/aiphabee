# Notes: gate0-rights-regulatory-decision-pack

> **Last Updated**: 2026-06-20 13:18 +08
> **Plan**: `plans/plan-gate0-rights-regulatory-decision-pack.md`
> **Packet**: `docs/governance/gate0-rights-regulatory-decision-pack.md`

## Decisions

- Used `DEFAULT_DENY` for every unconfirmed market-data right and channel.
- Kept Sprint 0.1 external approval checkboxes unchecked because no signed data
  partner, HKEX/vendor, counsel, or privacy evidence exists in repo.
- Treated MCP/API separately from Web display; Web permission is not reusable
  for machine-readable redistribution.
- Limited work to docs/plan/contract state; no product code or live data access.

## Evidence Reviewed

- `docs/researches/AiphaBee_PRD_v1.0.md` §14.1, §14.2, §18.1.
- `docs/AiphaBee_Sprint_Tracker_v1.0.md` Sprint 0.1 and §F.
- HKEX Market Data FAQ and Market Data Vendors fee page.
- SFC licensing guidance for Type 4 and analytical-tool risk.
- PCPD AI Model Personal Data Protection Framework.

## Verification

- Passed: `scripts/check-task-workflow.sh --strict`

## Residual Blockers

- Signed field-level rights matrix is still missing.
- HKEX/vendor role and fee treatment are still missing.
- Type 4/research-tool written opinion is still missing.
- PCPD/PDPO privacy assessment is still missing.
- Commercial settlement schedule and signature register are still missing.
