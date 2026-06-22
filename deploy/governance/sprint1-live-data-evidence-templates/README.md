# Sprint 1.1 Live Data Evidence Handoff Templates

These templates are for the operator or data owner who has external Sprint 1.1
activation evidence. They validate as `missing` packets before execution and
must be copied into `deploy/governance/sprint1-live-data-evidence-packets` only
after replacing the template metadata with redacted, hash-only evidence from the
real source.

Operator order:

1. Run `npm run check:sprint1-live-data-evidence-handoff`.
2. Gather evidence for each gate in this order:
   - `signed_partner_data_contract`
   - `partner_serving_rows_loaded`
   - `field_rights_policy_source_live`
   - `hyperdrive_select_1_passed`
   - `serving_sql_execution_enabled`
   - `quality_owner_cutover_approved`
   - `usage_event_live_write_passed`
   - `usage_ledger_entry_live_write_passed`
   - `billing_reconciliation_live_read_passed`
3. Copy each matching template to
   `deploy/governance/sprint1-live-data-evidence-packets` as
   `<gate_id>.evidence.json`.
4. Replace `observed_at`, `status`, `evidence_refs`, `evidence_sha256`,
   `signed_at`, `approver_role`, `redaction_status`, and `source_locator` with
   redacted metadata from the external evidence. Use `sha256:` refs only.
5. Run `npm run check:sprint1-live-data-evidence-packets`.
6. Only after all packets validate as accepted, update
   `deploy/governance/sprint1-live-data-evidence-manifest.contract.json` and run
   `npm run check:sprint1-live-data-evidence-manifest`.

Required evidence names by gate:

- `signed_partner_data_contract`: `signed_dataset_scope`, `field_rights_matrix`, `usage_metering_terms`
- `partner_serving_rows_loaded`: `serving_dataset_rows`, `serving_snapshot_rows`, `serving_record_rows`
- `field_rights_policy_source_live`: `live_entitlement_policy_rows`, `policy_version`, `workspace_plan_channel_matrix`
- `hyperdrive_select_1_passed`: `hyperdrive_config`, `read_only_select_1`, `connection_redaction_proof`
- `serving_sql_execution_enabled`: `row_limit_enforced`, `field_projection_enforced`, `cache_key_material_verified`
- `quality_owner_cutover_approved`: `PASS_WARN_release_policy`, `HOLD_REJECT_RAW_isolation`, `quality_owner_signoff`
- `usage_event_live_write_passed`: `core.usage_event_insert`, `request_id_idempotency`, `no_double_charge_probe`
- `usage_ledger_entry_live_write_passed`: `core.usage_ledger_entry_insert`, `weighted_credits`, `workspace_subscription_context`
- `billing_reconciliation_live_read_passed`: `invoice_line_trace`, `usage_to_invoice_consistency`, `freshness_under_5_minutes`

Do not paste raw partner rows, raw DB values, SQL connection strings, database
URLs, account IDs, workspace IDs, invoice IDs, customer IDs, billing payloads,
tokens, or secrets into these packets.
