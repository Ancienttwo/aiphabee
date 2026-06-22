#!/usr/bin/env node
import { derivePhase3SecurityLoadDrReleaseTransitionReview } from "./check-phase3-security-load-dr-release-transition-review-contract.mjs";

const gateIds = [
  "compliance_legal_security_signoff",
  "live_kill_switch_incident_audit_evidence",
  "live_performance_availability_slo_evidence",
  "live_load_test_artifact",
  "live_dr_restore_failover_rollback_evidence",
  "live_incident_status_comms_drill_evidence",
  "ops_sre_product_release_signoff"
];
const gateBlocks = {
  compliance_legal_security_signoff: ["external_compliance_legal_signoff"],
  live_dr_restore_failover_rollback_evidence: ["live_dr_restore_failover"],
  live_incident_status_comms_drill_evidence: ["live_incident_status_comms"],
  live_kill_switch_incident_audit_evidence: ["live_kill_switch_incident_audit"],
  live_load_test_artifact: ["live_load_test", "live_performance_availability_slo"],
  live_performance_availability_slo_evidence: ["live_performance_availability_slo"],
  ops_sre_product_release_signoff: ["ops_sre_product_signoff"]
};

const scenarios = [
  {
    expected_allowed: false,
    expected_condition: "accepted_evidence_packet_missing",
    manifest: manifest({ acceptedGates: false, clearFlags: false }),
    name: "missing packet and manifest gate blocks transition",
    packetResult: packetResult(false)
  },
  {
    expected_allowed: false,
    expected_condition: "manifest_gate_missing",
    manifest: manifest({ acceptedGates: false, clearFlags: true }),
    name: "accepted packet alone cannot complete phase 3 release evidence",
    packetResult: packetResult(true)
  },
  {
    expected_allowed: false,
    expected_condition: "live_load_test_missing",
    manifest: manifest({ acceptedGates: true, clearFlags: false }),
    name: "accepted packet and manifest still need live flags",
    packetResult: packetResult(true)
  },
  {
    expected_allowed: true,
    manifest: manifest({ acceptedGates: true, clearFlags: true }),
    name: "all packets, manifest gates, and live flags allow transition",
    packetResult: packetResult(true)
  }
];

const errors = [];

for (const scenario of scenarios) {
  const review = derivePhase3SecurityLoadDrReleaseTransitionReview({
    manifest: scenario.manifest,
    packetResult: scenario.packetResult
  });

  if (review.release_transition_allowed !== scenario.expected_allowed) {
    errors.push(`${scenario.name}: release_transition_allowed mismatch`);
  }
  if (scenario.expected_condition) {
    const conditions = review.security_load_dr_transition_reviews.flatMap((item) => item.blocking_conditions);
    if (!conditions.includes(scenario.expected_condition)) {
      errors.push(`${scenario.name}: expected condition ${scenario.expected_condition}`);
    }
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_fixtures" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      allowed_scenarios: 1,
      blocked_scenarios: 3,
      scenarios: scenarios.length,
      status: "ok"
    },
    null,
    2
  )
);

function manifest({ acceptedGates, clearFlags }) {
  return {
    external_compliance_legal_signoff: clearFlags,
    live_dr_restore_failover: clearFlags,
    live_incident_status_comms: clearFlags,
    live_kill_switch_incident_audit: clearFlags,
    live_load_test: clearFlags,
    live_performance_availability_slo: clearFlags,
    ops_sre_product_signoff: clearFlags,
    required_gates: gateIds.map((id) => ({
      blocks: gateBlocks[id],
      id,
      status: acceptedGates ? "accepted" : "missing"
    }))
  };
}

function packetResult(allAccepted) {
  return {
    all_required_accepted: allAccepted,
    packet_statuses: Object.fromEntries(gateIds.map((id) => [id, allAccepted ? "accepted" : "missing"]))
  };
}
