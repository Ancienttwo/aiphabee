# Sprint 2.4 Live Operations Evidence Templates

Copy one template into
`deploy/governance/sprint2-4-live-operations-evidence-packets` after live
evidence exists. Keep status as `missing` until every required evidence name is
represented by redacted `sha256:` hashes and `redaction_status` is
`redacted_no_secrets`.

Operator order:

1. Run `npm run check:sprint2-4-live-operations-evidence-handoff`.
2. Gather redacted evidence for each gate in this order:
   - `live_billing_provider_contract`
   - `subscription_lifecycle_live_writes`
   - `invoice_proration_refund_preview_live`
   - `usage_billing_reconciliation_live`
   - `high_cost_reservation_predebit_refund_live`
   - `workflow_task_live_execution_checkpoint`
   - `deep_report_workflow_live_execution`
   - `watchlist_alerts_live_fanout`
   - `saved_screening_live_execution`
   - `data_correction_live_fanout`
   - `mcp_live_auth_credential_store`
   - `kill_switch_live_flag_source`
   - `frontend_billing_workflow_notification_ui`
3. Copy each matching template as `<gate_id>.evidence.json`.
4. Replace only metadata fields with redacted, hash-only evidence refs.
5. Run `npm run check:sprint2-4-live-operations-evidence-packets`.
6. Run `npm run check:sprint2-4-live-operations-transition-review`; accepted evidence packet alone must stay blocked until the manifest gate and linked live flags are accepted.
7. Rerun `npm run check:sprint-exit-gate-transition-review` and `npm run check:sprint-completion-audit` before changing Sprint 2.4 or Phase 2 exit gates.

Do not paste raw billing payloads, workflow payloads, notification payloads,
credential material, database URLs, account IDs, workspace IDs, invoice IDs,
customer IDs, payment identifiers, tokens, or secrets into these packets.
