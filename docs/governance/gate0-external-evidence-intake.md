# Gate 0 External Evidence Intake

Status: intake ready, external approvals pending.

This file defines the evidence shape required before Sprint 0.1 can move from
local default-deny governance to external Gate 0 approval. It is not legal
advice and does not approve launch. The machine-readable contract is
`deploy/governance/gate0-external-evidence-intake.contract.json`; the checker is
`npm run check:gate0-external-evidence-intake`.

## Evidence Packets

| Packet | Owner | Current State | Acceptance Boundary |
|---|---|---|---|
| Field rights matrix | Business / Partnerships + Data Owner | Pending external evidence | Covers every P0 dataset field group and all 11 PRD 14.1 dimensions |
| HKEX / vendor licensing memo | Business / Partnerships + Compliance | Pending external evidence | Confirms partner vendor status, AiphaBee role, redistribution, non-display use, subscriber reporting, fees, and termination |
| Type 4 / product-boundary opinion | Compliance / Counsel | Pending external evidence | Reviews actual UX, prompts, marketing copy, pricing, MCP/API behavior, and fallback route |
| PCPD / PDPO privacy path | Privacy Owner | Pending external evidence | Covers data inventory, purpose limitation, retention, vendor/model risk, access/export/delete, PII minimization, and incident response |
| Commercial settlement schedule | Business / Partnerships + Finance | Pending external evidence | Covers dataset, channel, client type, geography, usage metric, delay, derived data, reporting, overage, and termination economics |
| Gate 0 signature register | CEO + Business + Data + Compliance + Privacy + Engineering | Pending external evidence | Final go/no-go, MCP fallback, decision date, and all required signatures |

## Default-Deny Rule

Until a signed packet explicitly allows a field, channel, user type, geography,
export, cache, or derived-data use, runtime policy remains `DEFAULT_DENY` and
the product must return `DATA_NOT_LICENSED` or equivalent blocked-state
metadata. Web display permission never implies MCP/API redistribution
permission.

## Intake Checks

Run:

```bash
npm run check:gate0-external-evidence-intake
```

The check proves that the repo has a complete intake contract and that all
external approvals remain marked pending. It intentionally fails future edits
that mark external approvals complete without replacing the pending contract
state with signed evidence references and an updated release decision.

## Sprint Impact

This closes no Sprint 0.1 checkbox by itself. It reduces the remaining work to
external evidence collection and later validation against the contract.
