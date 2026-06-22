# Sprint 1.1 Live Data Evidence Manifest

Status: pending external evidence.

This manifest records the signed, redacted, hash-only evidence required before
Sprint 1.1 live data activation can move from blocked planning to an activation
decision. It is paired with `deploy/governance/sprint1-live-data-activation.contract.json`
and does not enable live Serving reads, Hyperdrive SQL execution, usage ledger
writes, billing reconciliation posting, or frontend behavior.

Machine-readable checks:

```bash
npm run check:sprint1-live-data-evidence-manifest
npm run check:sprint1-live-data-evidence-manifest-fixtures
npm run check:sprint1-live-data-evidence-packets
npm run check:sprint1-live-data-evidence-packet-fixtures
npm run check:sprint1-live-data-evidence-handoff
```

## Evidence Policy

- Evidence refs are hash-only evidence strings in `sha256:<hex>` format.
- Raw partner rows, raw database values, billing payloads, database URLs,
  account identifiers, tokens, and provider secrets are forbidden in repo.
- Every activation gate must be accepted before `release_transition_allowed`
  can become true.
- The activation contract remains the source of truth for the gate ids, blocked
  runtime surfaces, and required evidence names.

## Current Gate State

| Gate | Current State | Required Evidence |
|---|---|---|
| `signed_partner_data_contract` | missing | signed dataset scope, field rights matrix, usage metering terms |
| `partner_serving_rows_loaded` | missing | serving dataset rows, serving snapshot rows, serving record rows |
| `field_rights_policy_source_live` | missing | live entitlement policy rows, policy version, workspace/plan/channel matrix |
| `hyperdrive_select_1_passed` | missing | Hyperdrive config, read-only `SELECT 1`, connection redaction proof |
| `serving_sql_execution_enabled` | missing | row limit, field projection, cache key material |
| `quality_owner_cutover_approved` | missing | PASS/WARN release policy, HOLD/REJECT_RAW isolation, quality-owner signoff |
| `usage_event_live_write_passed` | missing | `core.usage_event` insert, request id idempotency, no-double-charge probe |
| `usage_ledger_entry_live_write_passed` | missing | `core.usage_ledger_entry` insert, weighted credits, workspace subscription context |
| `billing_reconciliation_live_read_passed` | missing | invoice line trace, usage-to-invoice consistency, freshness under 5 minutes |

## Evidence Packets

External evidence should be captured as redacted packet metadata under
`deploy/governance/sprint1-live-data-evidence-packets/`. The packet checker
allows an empty directory while evidence is unavailable, then validates every
`<gate_id>.evidence.json` file against the manifest gate ids, blocked surfaces,
required evidence names, required approver roles, hash-only evidence refs, and
forbidden raw fields.

The operator handoff templates live under
`deploy/governance/sprint1-live-data-evidence-templates/`. They validate as
`missing` packets and must be copied into the packet directory only after the
operator replaces the template fields with redacted evidence metadata.

## Transition Boundary

The current production manifest has all nine gates `missing` and keeps
`release_transition_allowed=false`. Fixture scenarios prove the opposite state
is only valid when all gates are `accepted`, redacted, signed, and backed by
hash-only evidence.
