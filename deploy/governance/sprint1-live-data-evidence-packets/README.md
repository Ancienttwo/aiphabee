# Sprint 1 Live Data Evidence Packets

This directory is intentionally empty until external Sprint 1 live-data
activation evidence is collected.

## Sprint 1 live data evidence intake readiness

Copy a template from `deploy/governance/sprint1-live-data-evidence-templates/`
into this directory only after the gate has redacted hash-only evidence. The
packet filename must match `<gate_id>.evidence.json`.

| Gate ID | Packet file | Blocks | Approver roles | Required proof |
|---|---|---|---|---|
| `signed_partner_data_contract` | `signed_partner_data_contract.evidence.json` | `live_serving_reads`, `live_usage_writes` | `data_partner_signatory`, `commercial_owner` | `signed_dataset_scope`, `field_rights_matrix`, `usage_metering_terms` |
| `partner_serving_rows_loaded` | `partner_serving_rows_loaded.evidence.json` | `live_serving_reads` | `data_platform_owner` | `serving_dataset_rows`, `serving_snapshot_rows`, `serving_record_rows` |
| `field_rights_policy_source_live` | `field_rights_policy_source_live.evidence.json` | `live_serving_reads`, `live_usage_writes` | `data_governance_owner` | `live_entitlement_policy_rows`, `policy_version`, `workspace_plan_channel_matrix` |
| `hyperdrive_select_1_passed` | `hyperdrive_select_1_passed.evidence.json` | `live_serving_sql_execution` | `platform_owner`, `sre_owner` | `hyperdrive_config`, `read_only_select_1`, `connection_redaction_proof` |
| `serving_sql_execution_enabled` | `serving_sql_execution_enabled.evidence.json` | `live_serving_reads` | `data_gateway_owner` | `row_limit_enforced`, `field_projection_enforced`, `cache_key_material_verified` |
| `quality_owner_cutover_approved` | `quality_owner_cutover_approved.evidence.json` | `live_serving_reads` | `data_quality_owner` | `PASS_WARN_release_policy`, `HOLD_REJECT_RAW_isolation`, `quality_owner_signoff` |
| `usage_event_live_write_passed` | `usage_event_live_write_passed.evidence.json` | `live_usage_writes` | `usage_owner` | `core.usage_event_insert`, `request_id_idempotency`, `no_double_charge_probe` |
| `usage_ledger_entry_live_write_passed` | `usage_ledger_entry_live_write_passed.evidence.json` | `live_usage_writes` | `usage_owner`, `billing_owner` | `core.usage_ledger_entry_insert`, `weighted_credits`, `workspace_subscription_context` |
| `billing_reconciliation_live_read_passed` | `billing_reconciliation_live_read_passed.evidence.json` | `billing_reconciliation_posting` | `billing_owner`, `finance_owner` | `invoice_line_trace`, `usage_to_invoice_consistency`, `freshness_under_5_minutes` |

Accepted packets must satisfy all of these conditions:

- `status=accepted`
- `redaction_status=redacted_no_secrets`
- `evidence_refs` is non-empty and contains only `sha256:` refs
- `evidence_sha256` is a `sha256:` ref for the redacted packet or evidence bundle
- `signed_at` is `YYYY-MM-DD`
- `approver_role` is one of the gate's allowed roles
- `blocks` and `required_evidence` match the manifest exactly

An accepted evidence packet alone cannot complete Sprint 1 live data. The
matching manifest gate and activation gate must also be accepted before any
Sprint 1.1, Sprint 1.2, Sprint 1.4, Sprint 3.1, Sprint 3.3, or Phase exit
state can change.

Forbidden field names and payload classes:

- `raw_partner_rows`
- `raw_database_values`
- `raw_billing_payloads`
- `raw_rows`
- `raw_row`
- `raw_record`
- `raw_response`
- `raw_output`
- `database_url`
- `connection_string`
- `authorization`
- `api_key`
- `token`
- `secret`
- `password`
- `account_id`
- `workspace_id`
- `invoice_id`
- `customer_id`
- `env_value`

Do not commit raw partner rows, raw database values, billing payloads, database
URLs, connection strings, account IDs, workspace IDs, invoice IDs, customer IDs,
tokens, secrets, or environment values.

Run:

```bash
npm run check:sprint1-live-data-evidence-packets
npm run check:sprint1-live-data-evidence-packet-fixtures
npm run check:sprint1-live-data-evidence-handoff
npm run check:sprint1-live-data-activation
npm run check:sprint1-live-data-evidence-manifest
npm run check:sprint1-live-data-evidence-manifest-fixtures
npm run check:sprint1-live-data-transition-review
npm run check:sprint1-live-data-transition-review-fixtures
npm run check:sprint-completion-audit
npm run check:sprint-exit-gate-transition-review
```
