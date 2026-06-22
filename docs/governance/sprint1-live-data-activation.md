# Sprint 1.1 Live Data Activation

Status: blocked external activation.

This ledger covers the two Sprint 1.1 items that are still live-data blocked:
Data Access Gateway live Serving and Usage ledger live writes + billing
reconciliation. It does not enable partner rows, Hyperdrive reads, SQL
execution, persistent usage writes, billing provider posting, or frontend
behavior.

Machine-readable check:

```bash
npm run check:sprint1-live-data-activation
```

The checker requires the existing no-live gates to remain true:

- `npm run check:data-gateway`
- `npm run check:database`
- `npm run check:field-rights-live-policy-source`
- `npm run check:serving-quality-live-readiness`
- `npm run check:usage-quota-display`
- `npm run check:usage-billing-reconciliation`

## Activation Gates

| Gate | Current State | Blocks |
|---|---|---|
| `signed_partner_data_contract` | missing | live Serving reads and usage writes |
| `partner_serving_rows_loaded` | missing | live Serving reads |
| `field_rights_policy_source_live` | missing | live Serving reads and usage writes |
| `hyperdrive_select_1_passed` | missing | live SQL execution |
| `serving_sql_execution_enabled` | missing | live Serving reads |
| `quality_owner_cutover_approved` | missing | live Serving reads |
| `usage_event_live_write_passed` | missing | live usage writes |
| `usage_ledger_entry_live_write_passed` | missing | live usage writes |
| `billing_reconciliation_live_read_passed` | missing | billing reconciliation posting |

## Runtime Boundary

The current runtime can plan field projection, row limits, time windows, cache
key material, quality isolation, Serving SQL descriptors/text, deferred
execution envelopes, usage events, quota display, and billing traceability. It
cannot claim real licensed rows, live SQL execution, persistent usage writes, or
posted reconciliation until every activation gate above has accepted evidence.

## Sprint Impact

This closes no Sprint 1.1 live checkbox by itself. It makes the activation
criteria explicit and machine-checkable so future live evidence cannot bypass
the no-live contracts.
