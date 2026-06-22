#!/usr/bin/env node
import { validatePhase3SecurityLoadDrReleaseEvidencePackets } from "./check-phase3-security-load-dr-release-evidence-packets.mjs";

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
const requiredEvidence = {
  compliance_legal_security_signoff: ["external_compliance_legal_signoff_hash", "security_review_signoff_hash", "forbidden_advice_claim_review_hash"],
  live_dr_restore_failover_rollback_evidence: ["live_dr_restore_evidence_hash", "live_failover_execution_hash", "release_rollback_execution_hash"],
  live_incident_status_comms_drill_evidence: ["live_incident_drill_hash", "status_page_communication_drill_hash", "postmortem_or_runbook_review_hash"],
  live_kill_switch_incident_audit_evidence: ["live_kill_switch_flag_source_hash", "incident_request_id_trace_hash", "audit_export_store_hash"],
  live_load_test_artifact: ["load_test_run_artifact_hash", "peak_rps_error_rate_report_hash", "frontend_first_token_measurement_hash"],
  live_performance_availability_slo_evidence: ["live_apm_provider_metric_hash", "live_probe_scheduler_hash", "slo_metric_store_hash"],
  ops_sre_product_release_signoff: ["ops_signoff_hash", "sre_signoff_hash", "product_signoff_hash"]
};

const manifest = {
  evidence_packet_schema: {
    approver_role: "role_or_named_approver",
    blocks: ["manifest_boolean_gate_name"],
    evidence_refs: ["sha256:<redacted_artifact_hash>"],
    evidence_sha256: "sha256:<canonical_packet_or_artifact_hash>",
    gate_id: "one_required_gate_id",
    observed_at: "ISO-8601 timestamp",
    redaction_status: "redacted_no_secrets",
    required_evidence: ["evidence_name"],
    signed_at: "YYYY-MM-DD",
    source_locator: "redacted_file_or_external_record_id",
    status: "accepted|missing|needs_redaction|rejected"
  },
  evidence_policy: {
    packet_checker_allows_empty_directory_until_external_evidence_arrives: true
  },
  forbidden_fields: ["raw_security_report", "raw_apm_logs", "raw_incident_transcript", "raw_audit_export", "api_token"],
  packet_checker: "scripts/check-phase3-security-load-dr-release-evidence-packets.mjs",
  packet_directory: "deploy/governance/phase3-security-load-dr-release-evidence-packets",
  packet_file_pattern: "<gate_id>.evidence.json",
  required_gates: gateIds.map((id) => ({
    blocks: gateBlocks[id],
    id,
    required_evidence: requiredEvidence[id]
  }))
};
const packageJson = {
  scripts: {
    check: "npm run check:phase3-security-load-dr-release-evidence-packets",
    "check:phase3-security-load-dr-release-evidence-packets": "node scripts/check-phase3-security-load-dr-release-evidence-packets.mjs"
  }
};
const scenarios = [
  {
    expected_status: "awaiting_external_evidence_packets",
    name: "empty packet directory is valid until evidence arrives",
    packets: []
  },
  {
    expected_status: "phase3_security_load_dr_release_evidence_incomplete",
    name: "missing templates are valid but incomplete",
    packets: gateIds.map((id) => packet(id, "missing"))
  },
  {
    expected_status: "all_required_phase3_security_load_dr_release_evidence_accepted",
    name: "all accepted packets are valid",
    packets: gateIds.map((id) => packet(id, "accepted"))
  },
  {
    expected_error: "forbidden raw field raw_security_report",
    name: "raw security report is rejected",
    packets: [{ ...packet(gateIds[0], "accepted"), raw_security_report: "raw report" }]
  },
  {
    expected_error: "accepted packet must include sha256 evidence_sha256",
    name: "accepted packet without hash is rejected",
    packets: [{ ...packet(gateIds[0], "accepted"), evidence_sha256: "not-a-hash" }]
  },
  {
    expected_error: "duplicate evidence packet",
    name: "duplicate packet ids are rejected",
    packets: [packet(gateIds[0], "missing"), packet(gateIds[0], "missing")]
  }
];

const errors = [];

for (const scenario of scenarios) {
  const result = validatePhase3SecurityLoadDrReleaseEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: scenario.packets.map((packetValue) => ({
      packet: packetValue,
      path: `/tmp/${packetValue.gate_id}.evidence.json`,
      relative: `${packetValue.gate_id}.evidence.json`
    }))
  });

  if (scenario.expected_status && result.status !== scenario.expected_status) {
    errors.push(`${scenario.name}: expected status ${scenario.expected_status} but received ${result.status}`);
  }
  if (
    scenario.expected_error &&
    !result.errors.some((error) => error.includes(scenario.expected_error))
  ) {
    errors.push(`${scenario.name}: expected error containing ${scenario.expected_error}`);
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_fixtures" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      invalid_scenarios: 3,
      scenarios: scenarios.length,
      status: "ok",
      valid_scenarios: 3
    },
    null,
    2
  )
);

function packet(gateId, status) {
  const accepted = status === "accepted";

  return {
    approver_role: accepted ? "Ops" : null,
    blocks: gateBlocks[gateId],
    evidence_refs: accepted ? [hash()] : [],
    evidence_sha256: accepted ? hash() : null,
    gate_id: gateId,
    observed_at: "2026-06-23T00:00:00.000Z",
    redaction_status: accepted ? "redacted_no_secrets" : "missing",
    required_evidence: requiredEvidence[gateId],
    signed_at: accepted ? "2026-06-23" : null,
    source_locator: "redacted_fixture_locator",
    status
  };
}

function hash() {
  return `sha256:${"a".repeat(64)}`;
}
