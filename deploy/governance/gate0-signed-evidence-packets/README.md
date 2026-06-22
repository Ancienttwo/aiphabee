# Gate 0 Signed Evidence Packets

This directory is the redacted intake surface for signed Gate 0 evidence.
It is intentionally empty until external signed evidence exists and has been
redacted.

## Gate 0 signed evidence packet intake readiness

Copy a template from `deploy/governance/gate0-signed-evidence-templates/` into
this directory only after the external artifact exists and the packet is
redacted. The packet filename must match `<packet_id>.evidence.json`.

| Packet ID | Packet file | Required approver roles | Acceptance checks |
|---|---|---|---|
| `field_rights_matrix` | `field_rights_matrix.evidence.json` | `Business / Partnerships`, `Data Owner` | `covers_all_p0_dataset_groups`, `covers_all_prd_14_1_dimensions`, `mcp_api_rights_explicit`, `export_cache_derived_rights_explicit`, `default_deny_for_unconfirmed_fields` |
| `hkex_vendor_licensing_memo` | `hkex_vendor_licensing_memo.evidence.json` | `Business / Partnerships`, `Compliance / Counsel` | `partner_vendor_status_explicit`, `aiphabee_role_explicit`, `mcp_api_non_display_fee_class_explicit`, `subscriber_reporting_explicit`, `termination_obligations_explicit` |
| `type4_product_boundary_opinion` | `type4_product_boundary_opinion.evidence.json` | `Compliance / Counsel` | `actual_ux_reviewed`, `prompts_and_marketing_reviewed`, `pricing_and_mcp_behavior_reviewed`, `allowed_disallowed_feature_list_present`, `fallback_or_licensed_route_explicit` |
| `pcpd_privacy_path_assessment` | `pcpd_privacy_path_assessment.evidence.json` | `Privacy Owner` | `data_inventory_present`, `retention_schedule_present`, `vendor_model_risk_review_present`, `user_access_export_delete_path_present`, `incident_response_present` |
| `commercial_settlement_schedule` | `commercial_settlement_schedule.evidence.json` | `Business / Partnerships`, `Finance` | `dataset_channel_client_type_geography_present`, `usage_metric_present`, `delay_and_derived_data_treatment_present`, `reporting_cadence_present`, `overage_and_termination_economics_present` |
| `gate0_signature_register` | `gate0_signature_register.evidence.json` | `CEO`, `Business / Partnerships`, `Data Owner`, `Compliance / Counsel`, `Privacy Owner`, `Engineering` | `all_required_roles_signed`, `decision_date_present`, `mcp_fallback_explicit`, `go_no_go_explicit` |

Accepted packets must satisfy all of these conditions:

- `status=accepted`
- `evidence_refs` is non-empty
- each evidence ref has `approval_status=accepted`
- each evidence ref has `redaction_status=redacted_no_secrets`
- each evidence ref has a hex sha256 value
- each evidence ref has `signed_at` in `YYYY-MM-DD` format
- each evidence ref has an `approver` and `source_locator`
- `required_approver_roles` and `acceptance_checks` match the manifest exactly

An accepted packet alone cannot complete Gate 0. The accepted packet must be
promoted into `deploy/governance/gate0-signed-evidence-manifest.contract.json`,
the matching external intake approval must be accepted, and transition review
must pass before any Sprint 0.1, Phase 0, or release state can change.

Until every required packet is accepted and promoted, runtime behavior remains
`DEFAULT_DENY` with `DATA_NOT_LICENSED` for unconfirmed fields and channels.

Forbidden field names and payload classes:

- `raw_legal_memo`
- `raw_contract`
- `raw_document`
- `raw_vendor_document`
- `raw_payload`
- `raw_response`
- `raw_output`
- `raw_text`
- `raw_content`
- `authorization`
- `api_key`
- `token`
- `secret`
- `password`
- `database_url`
- `connection_string`
- `account_id`
- `workspace_id`
- `env_value`
- `unredacted_source_payload`

Do not commit raw legal memos, raw contracts, raw vendor documents, credentials,
account identifiers, database URLs, bearer tokens, environment values, or
unredacted source payloads. Use redacted source locators and hex `sha256`
hashes only.

Run:

```bash
npm run check:gate0-signed-evidence-packets
npm run check:gate0-signed-evidence-packet-fixtures
npm run check:gate0-signed-evidence-handoff
npm run check:gate0-signed-evidence-manifest
npm run check:gate0-signed-evidence-manifest-fixtures
npm run check:gate0-signed-evidence-transition-review
npm run check:gate0-signed-evidence-transition-review-fixtures
npm run check:sprint-completion-audit
npm run check:sprint-exit-gate-transition-review
```
