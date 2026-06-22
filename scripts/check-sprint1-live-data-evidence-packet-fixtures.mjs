#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateSprint1LiveDataEvidencePackets } from "./check-sprint1-live-data-evidence-packets.mjs";

const manifestPath = "deploy/governance/sprint1-live-data-evidence-manifest.contract.json";
const packagePath = "package.json";
const manifest = readJson(manifestPath);
const packageJson = readJson(packagePath);
const gateIds = manifest.required_gates.map((gate) => gate.id);
const completeAcceptedPacketFiles = gateIds.map((id, index) =>
  makePacketFile(makeAcceptedPacket(id, index))
);
const scenarios = [
  {
    expectValid: true,
    expectedStatus: "awaiting_external_evidence_packets",
    name: "empty_directory_awaits_external_evidence",
    packetFiles: []
  },
  {
    expectValid: true,
    expectedAllRequiredAccepted: true,
    expectedStatus: "ready_for_manifest_update",
    name: "complete_accepted_packet_set",
    packetFiles: completeAcceptedPacketFiles
  },
  {
    expectValid: true,
    expectedStatus: "evidence_packets_missing",
    name: "missing_packet_does_not_unlock",
    packetFiles: [makePacketFile(makeMissingPacket("partner_serving_rows_loaded"))]
  },
  {
    expectedError:
      "deploy/governance/sprint1-live-data-evidence-packets/signed_partner_data_contract.evidence.json: accepted packet must include hash-only evidence_refs",
    expectValid: false,
    name: "accepted_packet_missing_evidence_refs",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("signed_partner_data_contract", 0), (packet) => {
          packet.evidence_refs = [];
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/sprint1-live-data-evidence-packets/hyperdrive_select_1_passed.evidence.json: evidence_refs must be sha256-only",
    expectValid: false,
    name: "non_hash_evidence_ref",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("hyperdrive_select_1_passed", 3), (packet) => {
          packet.evidence_refs = ["redacted-hyperdrive-ref"];
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/sprint1-live-data-evidence-packets/usage_event_live_write_passed.evidence.json: forbidden field key raw_rows",
    expectValid: false,
    name: "raw_rows_field_rejected",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("usage_event_live_write_passed", 6), (packet) => {
          packet.raw_rows = "redacted but forbidden raw row payload";
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/sprint1-live-data-evidence-packets/field_rights_policy_source_live.evidence.json: required_evidence must include live_entitlement_policy_rows",
    expectValid: false,
    name: "required_evidence_mismatch",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("field_rights_policy_source_live", 2), (packet) => {
          packet.required_evidence = ["policy_version"];
        })
      )
    ]
  },
  {
    expectedError: "duplicate evidence packet partner_serving_rows_loaded",
    expectValid: false,
    name: "duplicate_gate_id",
    packetFiles: [
      makePacketFile(makeAcceptedPacket("partner_serving_rows_loaded", 1)),
      makePacketFile(makeAcceptedPacket("partner_serving_rows_loaded", 2))
    ]
  },
  {
    expectedError:
      "deploy/governance/sprint1-live-data-evidence-packets/unknown_gate.evidence.json: gate_id is unexpected",
    expectValid: false,
    name: "unexpected_gate_id",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("partner_serving_rows_loaded", 1), (packet) => {
          packet.gate_id = "unknown_gate";
        }),
        "unknown_gate.evidence.json"
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/sprint1-live-data-evidence-packets/billing_reconciliation_live_read_passed.evidence.json: packet contains forbidden secret-like pattern Bearer\\s+[A-Za-z0-9._-]{20,}",
    expectValid: false,
    name: "secret_like_locator_rejected",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("billing_reconciliation_live_read_passed", 8), (packet) => {
          packet.source_locator = "Bearer abcdefghijklmnopqrstuvwxyz";
        })
      )
    ]
  },
  {
    expectedError: "packet directory missing deploy/governance/sprint1-live-data-evidence-packets",
    expectValid: false,
    name: "packet_directory_missing",
    packetDirectoryExists: false,
    packetFiles: []
  }
];
const failures = [];

for (const scenario of scenarios) {
  const result = validateSprint1LiveDataEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists: scenario.packetDirectoryExists ?? true,
    packetFiles: scenario.packetFiles
  });

  if (scenario.expectValid && result.errors.length > 0) {
    failures.push({
      errors: result.errors,
      name: scenario.name,
      status: "expected_valid"
    });
    continue;
  }

  if (scenario.expectValid && scenario.expectedStatus !== result.status) {
    failures.push({
      actual_status: result.status,
      expected_status: scenario.expectedStatus,
      name: scenario.name,
      status: "status_mismatch"
    });
    continue;
  }

  if (
    scenario.expectValid &&
    typeof scenario.expectedAllRequiredAccepted === "boolean" &&
    scenario.expectedAllRequiredAccepted !== result.all_required_accepted
  ) {
    failures.push({
      actual_all_required_accepted: result.all_required_accepted,
      expected_all_required_accepted: scenario.expectedAllRequiredAccepted,
      name: scenario.name,
      status: "all_required_accepted_mismatch"
    });
    continue;
  }

  if (!scenario.expectValid) {
    if (result.errors.length === 0) {
      failures.push({
        name: scenario.name,
        status: "expected_invalid"
      });
      continue;
    }

    if (!result.errors.includes(scenario.expectedError)) {
      failures.push({
        errors: result.errors,
        expected_error: scenario.expectedError,
        name: scenario.name,
        status: "missing_expected_error"
      });
    }
  }
}

if (failures.length > 0) {
  emit(
    {
      failures,
      scenarios: scenarios.length,
      status: "invalid_fixtures"
    },
    1
  );
}

emit(
  {
    invalid_scenarios: scenarios.filter((scenario) => !scenario.expectValid).length,
    scenarios: scenarios.length,
    status: "ok",
    valid_scenarios: scenarios.filter((scenario) => scenario.expectValid).length
  },
  0
);

function makeAcceptedPacket(gateId, index) {
  const gate = manifest.required_gates.find((entry) => entry.id === gateId);

  return {
    gate_id: gateId,
    status: "accepted",
    blocks: gate.blocks,
    required_evidence: gate.required_evidence,
    observed_at: "2026-06-22T00:00:00.000Z",
    source_locator: `fixture:${gateId}:redacted`,
    evidence_refs: [makeSha256(index + 1)],
    evidence_sha256: makeSha256(index + 10),
    signed_at: "2026-06-22",
    approver_role: gate.required_approver_roles[0],
    redaction_status: "redacted_no_secrets"
  };
}

function makeMissingPacket(gateId) {
  const gate = manifest.required_gates.find((entry) => entry.id === gateId);

  return {
    gate_id: gateId,
    status: "missing",
    blocks: gate.blocks,
    required_evidence: gate.required_evidence,
    observed_at: "2026-06-22T00:00:00.000Z",
    source_locator: `fixture:${gateId}:missing`,
    evidence_refs: [],
    evidence_sha256: null,
    signed_at: null,
    approver_role: null,
    redaction_status: "missing"
  };
}

function makePacketFile(packet, fileName = `${packet.gate_id}.evidence.json`) {
  return {
    packet,
    path: `/fixture/${fileName}`,
    relative: `deploy/governance/sprint1-live-data-evidence-packets/${fileName}`
  };
}

function makeSha256(index) {
  const digit = ((index % 15) + 1).toString(16);
  return `sha256:${digit.repeat(64)}`;
}

function mutate(value, mutator) {
  const packet = clone(value);
  mutator(packet);
  return packet;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
