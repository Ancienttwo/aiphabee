# Gate 0 Signed Evidence Manifest

Status: pending external evidence.

This manifest is the transition surface between Gate 0 evidence intake and
Sprint 0.1 completion. It does not store raw legal memos, contracts, secrets, or
credentials. It stores only redacted source locators, SHA-256 hashes, approver
metadata, signed dates, and acceptance status.

Machine-readable contract:

```bash
npm run check:gate0-signed-evidence-manifest
```

## Current State

All required packets are still `missing`:

- Field rights matrix
- HKEX / vendor licensing memo
- Type 4 / product-boundary opinion
- PCPD / PDPO privacy path assessment
- Commercial settlement schedule
- Gate 0 signature register

Because these packets are missing, `external_approvals_complete=false` and
`release_transition_allowed=false`. Runtime stays `DEFAULT_DENY` for all
unconfirmed fields and channels.

## Accepted Evidence Rule

A packet can become `accepted` only when every evidence reference has:

- a redacted source locator or external record id;
- a canonical SHA-256 hash;
- `signed_at` in `YYYY-MM-DD` format;
- an approver role or approver name;
- `approval_status=accepted`;
- `redaction_status=redacted_no_secrets`.

Sprint 0.1 can be checked only when all required packets are accepted and the
manifest checker passes.

## Runtime Transition Rule

Accepted evidence may create exceptions to `DEFAULT_DENY` only through a signed
rights matrix. Web display rights never imply MCP/API redistribution rights.
Unconfirmed fields remain blocked with `DATA_NOT_LICENSED`.
