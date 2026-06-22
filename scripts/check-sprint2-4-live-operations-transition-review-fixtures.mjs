#!/usr/bin/env node
import { deriveSprint24LiveOperationsTransitionReview } from "./check-sprint2-4-live-operations-transition-review-contract.mjs";

const gateId = "live_billing_provider_contract";
const requiredGateIds = [
  "live_billing_provider_contract",
  "subscription_lifecycle_live_writes",
  "invoice_proration_refund_preview_live",
  "usage_billing_reconciliation_live",
  "high_cost_reservation_predebit_refund_live",
  "workflow_task_live_execution_checkpoint",
  "deep_report_workflow_live_execution",
  "watchlist_alerts_live_fanout",
  "saved_screening_live_execution",
  "data_correction_live_fanout",
  "mcp_live_auth_credential_store",
  "kill_switch_live_flag_source",
  "frontend_billing_workflow_notification_ui"
];
const gateBlocks = {
  deep_report_workflow_live_execution: ["live_workflow_execution"],
  data_correction_live_fanout: ["live_notification_fanout"],
  frontend_billing_workflow_notification_ui: ["frontend"],
  high_cost_reservation_predebit_refund_live: ["live_billing_writes"],
  invoice_proration_refund_preview_live: ["live_billing_provider", "live_billing_writes"],
  kill_switch_live_flag_source: ["live_flag_source"],
  live_billing_provider_contract: ["live_billing_provider"],
  mcp_live_auth_credential_store: ["live_mcp_auth_store"],
  saved_screening_live_execution: ["live_workflow_execution", "live_notification_fanout"],
  subscription_lifecycle_live_writes: ["live_billing_writes"],
  usage_billing_reconciliation_live: ["live_billing_writes"],
  watchlist_alerts_live_fanout: ["live_notification_fanout"],
  workflow_task_live_execution_checkpoint: ["live_workflow_execution"]
};
const scenarios = [
  {
    expected_allowed: 0,
    manifest: manifest({ gate_status: "missing", live_billing_provider: false }),
    name: "no packet and missing manifest gate blocks transition",
    packet_statuses: {}
  },
  {
    expected_allowed: 0,
    expected_condition: "manifest_gate_missing",
    manifest: manifest({ gate_status: "missing", live_billing_provider: false }),
    name: "accepted packet alone does not complete Sprint 2.4 live operations",
    packet_statuses: { [gateId]: "accepted" }
  },
  {
    expected_allowed: 0,
    expected_condition: "live_billing_provider_missing",
    manifest: manifest({ gate_status: "accepted", live_billing_provider: false }),
    name: "accepted packet and manifest gate still require linked live flags",
    packet_statuses: { [gateId]: "accepted" }
  },
  {
    expected_allowed: requiredGateIds.length,
    manifest: manifest({ all_flags: true, gate_status: "accepted" }),
    name: "all accepted packets plus manifest gates plus live flags allow transition",
    packet_statuses: Object.fromEntries(requiredGateIds.map((id) => [id, "accepted"]))
  }
];
const errors = [];

for (const scenario of scenarios) {
  const review = deriveSprint24LiveOperationsTransitionReview({
    manifest: scenario.manifest,
    packetResult: {
      packet_statuses: scenario.packet_statuses
    }
  });

  if (review.completion_allowed_count !== scenario.expected_allowed) {
    errors.push(`${scenario.name}: expected ${scenario.expected_allowed} allowed decisions`);
  }

  const decision = review.live_operations_transition_reviews[0];
  if (
    scenario.expected_condition &&
    !decision.blocking_conditions.includes(scenario.expected_condition)
  ) {
    errors.push(`${scenario.name}: expected condition ${scenario.expected_condition}`);
  }

  if (review.release_transition_allowed !== (scenario.expected_allowed === requiredGateIds.length)) {
    errors.push(`${scenario.name}: release_transition_allowed mismatch`);
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_fixtures" }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ allowed_scenarios: 1, blocked_scenarios: 3, scenarios: scenarios.length, status: "ok" }, null, 2));

function manifest({ all_flags = false, gate_status, live_billing_provider = false }) {
  return {
    frontend: all_flags,
    live_billing_provider: all_flags || live_billing_provider,
    live_billing_writes: all_flags,
    live_flag_source: all_flags,
    live_mcp_auth_store: all_flags,
    live_notification_fanout: all_flags,
    live_workflow_execution: all_flags,
    required_gates: requiredGateIds.map((id) => ({
      blocks: gateBlocks[id],
      id,
      status: gate_status
    }))
  };
}
