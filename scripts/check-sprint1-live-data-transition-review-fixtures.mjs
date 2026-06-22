#!/usr/bin/env node
import { deriveSprint1LiveDataTransitionReview } from "./check-sprint1-live-data-transition-review-contract.mjs";

const requiredGateIds = [
  "signed_partner_data_contract",
  "partner_serving_rows_loaded",
  "field_rights_policy_source_live",
  "hyperdrive_select_1_passed",
  "serving_sql_execution_enabled",
  "quality_owner_cutover_approved",
  "usage_event_live_write_passed",
  "usage_ledger_entry_live_write_passed",
  "billing_reconciliation_live_read_passed"
];

const gateBlocks = {
  billing_reconciliation_live_read_passed: ["billing_reconciliation_posting"],
  field_rights_policy_source_live: ["live_serving_reads", "live_usage_writes"],
  hyperdrive_select_1_passed: ["live_serving_sql_execution"],
  partner_serving_rows_loaded: ["live_serving_reads"],
  quality_owner_cutover_approved: ["live_serving_reads"],
  serving_sql_execution_enabled: ["live_serving_reads"],
  signed_partner_data_contract: ["live_serving_reads", "live_usage_writes"],
  usage_event_live_write_passed: ["live_usage_writes"],
  usage_ledger_entry_live_write_passed: ["live_usage_writes"]
};

const scenarios = [
  {
    expected_allowed: 0,
    name: "no packets and missing activation gates",
    packet_statuses: {},
    ready_gates: []
  },
  {
    expected_allowed: 0,
    name: "accepted evidence packets alone do not unlock review",
    packet_statuses: Object.fromEntries(requiredGateIds.map((id) => [id, "accepted"])),
    ready_gates: []
  },
  {
    expected_allowed: 1,
    name: "single accepted packet with manifest and activation allows only its own review",
    packet_statuses: Object.fromEntries(requiredGateIds.map((id) => [id, "accepted"])),
    ready_gates: ["partner_serving_rows_loaded"]
  },
  {
    expected_allowed: requiredGateIds.length,
    name: "all packets manifest gates and activation gates accepted",
    packet_statuses: Object.fromEntries(requiredGateIds.map((id) => [id, "accepted"])),
    ready_gates: requiredGateIds
  }
];
const errors = [];

for (const scenario of scenarios) {
  const readyGateSet = new Set(scenario.ready_gates);
  const transitionReview = deriveSprint1LiveDataTransitionReview({
    activation: makeActivation(readyGateSet),
    manifest: makeManifest(readyGateSet),
    packetResult: {
      packet_statuses: scenario.packet_statuses
    }
  });

  if (transitionReview.completion_allowed_count !== scenario.expected_allowed) {
    errors.push(`${scenario.name}: expected ${scenario.expected_allowed} allowed reviews`);
  }

  const expectedReleaseAllowed = scenario.expected_allowed === requiredGateIds.length;
  if (transitionReview.release_transition_allowed !== expectedReleaseAllowed) {
    errors.push(`${scenario.name}: release_transition_allowed mismatch`);
  }

  if (
    scenario.name.includes("packets alone") &&
    transitionReview.live_data_transition_reviews.some((review) => review.completion_allowed)
  ) {
    errors.push(`${scenario.name}: packet-only state unlocked at least one review`);
  }
}

if (errors.length > 0) {
  console.error(
    JSON.stringify(
      {
        errors,
        status: "invalid_fixtures"
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      allowed_scenarios: 1,
      blocked_scenarios: 2,
      partial_scenarios: 1,
      scenarios: scenarios.length,
      status: "ok"
    },
    null,
    2
  )
);

function makeManifest(readyGateSet) {
  return {
    required_gates: requiredGateIds.map((id) => ({
      id,
      status: readyGateSet.has(id) ? "accepted" : "missing"
    }))
  };
}

function makeActivation(readyGateSet) {
  const allReady = readyGateSet.size === requiredGateIds.length;

  return {
    billing_reconciliation_posting: allReady,
    live_serving_reads: allReady,
    live_serving_sql_execution: allReady,
    live_usage_writes: allReady,
    activation_gates: requiredGateIds.map((id) => ({
      blocks: gateBlocks[id],
      id,
      status: readyGateSet.has(id) ? "accepted" : "missing"
    }))
  };
}
