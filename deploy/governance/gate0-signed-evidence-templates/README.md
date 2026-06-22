# Gate 0 Signed Evidence Templates

Copy the matching template into the signed evidence review flow only after the
external artifact exists and has been redacted. These templates intentionally
validate as `missing` packets; they do not approve Gate 0 and do not unlock any
Sprint 0.1 checkbox.

Run the handoff and manifest gates before editing Sprint status:

```bash
npm run check:gate0-signed-evidence-packets
npm run check:gate0-signed-evidence-packet-fixtures
npm run check:gate0-signed-evidence-handoff
npm run check:gate0-signed-evidence-manifest
npm run check:gate0-signed-evidence-manifest-fixtures
npm run check:gate0-signed-evidence-transition-review
npm run check:gate0-signed-evidence-transition-review-fixtures
```

Accepted packets should be copied into
`deploy/governance/gate0-signed-evidence-packets/` as
`<packet_id>.evidence.json`; the packet checker intentionally allows that
directory to stay empty until external evidence arrives.

Accepted evidence refs must use redacted source locators, hex `sha256` hashes,
`YYYY-MM-DD` signed dates, an approver role/name, `approval_status=accepted`,
and `redaction_status=redacted_no_secrets`.

Until all packets are accepted, runtime stays `DEFAULT_DENY` and unconfirmed
fields/channels stay blocked with `DATA_NOT_LICENSED`.

## Packet Order

1. `field_rights_matrix`
   - `covers_all_p0_dataset_groups`
   - `covers_all_prd_14_1_dimensions`
   - `mcp_api_rights_explicit`
   - `export_cache_derived_rights_explicit`
   - `default_deny_for_unconfirmed_fields`
2. `hkex_vendor_licensing_memo`
   - `partner_vendor_status_explicit`
   - `aiphabee_role_explicit`
   - `mcp_api_non_display_fee_class_explicit`
   - `subscriber_reporting_explicit`
   - `termination_obligations_explicit`
3. `type4_product_boundary_opinion`
   - `actual_ux_reviewed`
   - `prompts_and_marketing_reviewed`
   - `pricing_and_mcp_behavior_reviewed`
   - `allowed_disallowed_feature_list_present`
   - `fallback_or_licensed_route_explicit`
4. `pcpd_privacy_path_assessment`
   - `data_inventory_present`
   - `retention_schedule_present`
   - `vendor_model_risk_review_present`
   - `user_access_export_delete_path_present`
   - `incident_response_present`
5. `commercial_settlement_schedule`
   - `dataset_channel_client_type_geography_present`
   - `usage_metric_present`
   - `delay_and_derived_data_treatment_present`
   - `reporting_cadence_present`
   - `overage_and_termination_economics_present`
6. `gate0_signature_register`
   - `all_required_roles_signed`
   - `decision_date_present`
   - `mcp_fallback_explicit`
   - `go_no_go_explicit`
