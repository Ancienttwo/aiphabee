#!/usr/bin/env node
import { validateSprint24LiveOperationsEvidencePackets } from "./check-sprint2-4-live-operations-evidence-packets.mjs";

const gate = {
  blocks: ["live_billing_provider"],
  id: "live_billing_provider_contract",
  required_approver_roles: ["billing_owner", "finance_owner"],
  required_evidence: ["billing_provider_account", "plan_catalog_mapping", "provider_webhook_verification"],
  status: "missing"
};
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
const manifest = {
  evidence_packet_schema: {
    approver_role: "required_gates.required_approver_roles member or null when missing",
    blocks: "required_gates.blocks",
    evidence_refs: "hash_only_refs_for_accepted_packets",
    evidence_sha256: "sha256:hex_sha256_of_redacted_packet_or_null",
    gate_id: "required_gates.id",
    observed_at: "ISO-8601",
    redaction_status: "missing|redacted_no_secrets",
    required_evidence: "required_gates.required_evidence",
    signed_at: "YYYY-MM-DD or null",
    source_locator: "redacted_file_or_external_record_id",
    status: "missing|accepted|rejected|needs_redaction"
  },
  evidence_policy: {
    packet_checker_allows_empty_directory_until_external_evidence_arrives: true
  },
  forbidden_fields: ["raw_billing_payload", "token", "secret"],
  handoff_checker: "scripts/check-sprint2-4-live-operations-evidence-handoff.mjs",
  packet_checker: "scripts/check-sprint2-4-live-operations-evidence-packets.mjs",
  packet_directory: "deploy/governance/sprint2-4-live-operations-evidence-packets",
  packet_file_pattern: "<gate_id>.evidence.json",
  packet_fixture_checker: "scripts/check-sprint2-4-live-operations-evidence-packet-fixtures.mjs",
  required_gates: requiredGateIds.map((id) =>
    id === gate.id
      ? gate
      : {
          blocks: ["live_billing_writes"],
          id,
          required_approver_roles: ["billing_owner"],
          required_evidence: ["evidence_one", "evidence_two", "evidence_three"],
          status: "missing"
        }
  )
};
const packageJson = {
  scripts: {
    check: "npm run check:sprint2-4-live-operations-evidence-packets",
    "check:sprint2-4-live-operations-evidence-packets": "node scripts/check-sprint2-4-live-operations-evidence-packets.mjs"
  }
};
const validHash = `sha256:${"a".repeat(64)}`;
const basePacket = {
  approver_role: null,
  blocks: gate.blocks,
  evidence_refs: [],
  evidence_sha256: null,
  gate_id: gate.id,
  observed_at: "2026-06-23T00:00:00.000Z",
  redaction_status: "missing",
  required_evidence: gate.required_evidence,
  signed_at: null,
  source_locator: "template:live_billing_provider_contract:replace-after-evidence",
  status: "missing"
};

const scenarios = [
  {
    expected_status: "awaiting_external_evidence_packets",
    name: "empty packet directory is allowed while external evidence is missing",
    packetFiles: []
  },
  {
    expected_status: "evidence_packets_incomplete",
    name: "missing template packet validates as incomplete",
    packetFiles: [packetFile(basePacket)]
  },
  {
    expected_status: "evidence_packets_incomplete",
    name: "accepted single packet validates but does not imply all gates accepted",
    packetFiles: [
      packetFile({
        ...basePacket,
        approver_role: "billing_owner",
        evidence_refs: [validHash],
        evidence_sha256: validHash,
        redaction_status: "redacted_no_secrets",
        signed_at: "2026-06-23",
        status: "accepted"
      })
    ]
  },
  {
    expected_error: "forbidden field key raw_billing_payload",
    name: "raw billing payload field is rejected",
    packetFiles: [
      packetFile({
        ...basePacket,
        raw_billing_payload: "do-not-store"
      })
    ]
  },
  {
    expected_error: "Bearer",
    name: "secret-like token text is rejected",
    packetFiles: [
      packetFile({
        ...basePacket,
        source_locator: "Bearer abcdefghijklmnopqrstuvwxyz1234567890"
      })
    ]
  },
  {
    expected_error: "sha256-only",
    name: "non sha evidence ref is rejected",
    packetFiles: [
      packetFile({
        ...basePacket,
        approver_role: "billing_owner",
        evidence_refs: ["raw-file"],
        evidence_sha256: validHash,
        redaction_status: "redacted_no_secrets",
        signed_at: "2026-06-23",
        status: "accepted"
      })
    ]
  }
];
const errors = [];

for (const scenario of scenarios) {
  const result = validateSprint24LiveOperationsEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: scenario.packetFiles
  });

  if (scenario.expected_status && result.status !== scenario.expected_status) {
    errors.push(`${scenario.name}: expected status ${scenario.expected_status} but received ${result.status}`);
  }
  if (scenario.expected_error && !result.errors.some((error) => error.includes(scenario.expected_error))) {
    errors.push(`${scenario.name}: expected error containing ${scenario.expected_error}`);
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_fixtures" }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ invalid_scenarios: 3, scenarios: scenarios.length, status: "ok", valid_scenarios: 3 }, null, 2));

function packetFile(packet) {
  return {
    packet,
    path: `deploy/governance/sprint2-4-live-operations-evidence-packets/${packet.gate_id}.evidence.json`,
    relative: `deploy/governance/sprint2-4-live-operations-evidence-packets/${packet.gate_id}.evidence.json`
  };
}
