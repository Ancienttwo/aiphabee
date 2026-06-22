#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateGate0SignedEvidencePackets } from "./check-gate0-signed-evidence-packets.mjs";

const manifestPath = "deploy/governance/gate0-signed-evidence-manifest.contract.json";
const packagePath = "package.json";
const manifest = readJson(manifestPath);
const packageJson = readJson(packagePath);
const packetIds = manifest.required_packets.map((packet) => packet.id);
const completeAcceptedPacketFiles = packetIds.map((id, index) =>
  makePacketFile(makeAcceptedPacket(id, index))
);
const scenarios = [
  {
    expectValid: true,
    expectedStatus: "awaiting_external_signed_evidence_packets",
    name: "empty_directory_awaits_external_signed_evidence",
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
    expectedStatus: "signed_evidence_packets_missing",
    name: "missing_packet_does_not_unlock",
    packetFiles: [makePacketFile(makeMissingPacket("field_rights_matrix"))]
  },
  {
    expectedError:
      "deploy/governance/gate0-signed-evidence-packets/field_rights_matrix.evidence.json: accepted packet must include evidence_refs",
    expectValid: false,
    name: "accepted_packet_missing_evidence_refs",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("field_rights_matrix", 0), (packet) => {
          packet.evidence_refs = [];
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/gate0-signed-evidence-packets/hkex_vendor_licensing_memo.evidence.json: evidence_refs[0].sha256 must be a hex sha256",
    expectValid: false,
    name: "invalid_sha256_ref",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("hkex_vendor_licensing_memo", 1), (packet) => {
          packet.evidence_refs[0].sha256 = "sha256:not-hex";
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/gate0-signed-evidence-packets/type4_product_boundary_opinion.evidence.json: required_approver_roles[0] mismatch",
    expectValid: false,
    name: "required_approver_roles_mismatch",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("type4_product_boundary_opinion", 2), (packet) => {
          packet.required_approver_roles = ["Engineering"];
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/gate0-signed-evidence-packets/pcpd_privacy_path_assessment.evidence.json: forbidden field key raw_legal_memo",
    expectValid: false,
    name: "raw_legal_memo_field_rejected",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("pcpd_privacy_path_assessment", 3), (packet) => {
          packet.raw_legal_memo = "redacted but forbidden raw legal memo payload";
        })
      )
    ]
  },
  {
    expectedError: "duplicate signed evidence packet commercial_settlement_schedule",
    expectValid: false,
    name: "duplicate_packet_id",
    packetFiles: [
      makePacketFile(makeAcceptedPacket("commercial_settlement_schedule", 4)),
      makePacketFile(makeAcceptedPacket("commercial_settlement_schedule", 5))
    ]
  },
  {
    expectedError:
      "deploy/governance/gate0-signed-evidence-packets/unknown_packet.evidence.json: id is unexpected",
    expectValid: false,
    name: "unexpected_packet_id",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("gate0_signature_register", 5), (packet) => {
          packet.id = "unknown_packet";
        }),
        "unknown_packet.evidence.json"
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/gate0-signed-evidence-packets/wrong_name.evidence.json: filename must be gate0_signature_register.evidence.json",
    expectValid: false,
    name: "filename_mismatch",
    packetFiles: [makePacketFile(makeAcceptedPacket("gate0_signature_register", 5), "wrong_name.evidence.json")]
  },
  {
    expectedError: "packet directory missing deploy/governance/gate0-signed-evidence-packets",
    expectValid: false,
    name: "packet_directory_missing",
    packetDirectoryExists: false,
    packetFiles: []
  }
];
const failures = [];

for (const scenario of scenarios) {
  const result = validateGate0SignedEvidencePackets({
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

function makeAcceptedPacket(packetId, index) {
  const packet = manifest.required_packets.find((entry) => entry.id === packetId);

  return {
    id: packetId,
    status: "accepted",
    evidence_refs: [makeEvidenceRef(packet, index)],
    required_approver_roles: packet.required_approver_roles,
    acceptance_checks: packet.acceptance_checks,
    blocks_sprint0_1_checkbox: true
  };
}

function makeMissingPacket(packetId) {
  const packet = manifest.required_packets.find((entry) => entry.id === packetId);

  return {
    id: packetId,
    status: "missing",
    evidence_refs: [],
    required_approver_roles: packet.required_approver_roles,
    acceptance_checks: packet.acceptance_checks,
    blocks_sprint0_1_checkbox: true
  };
}

function makeEvidenceRef(packet, index) {
  return {
    approval_status: "accepted",
    approver: packet.required_approver_roles[0],
    redaction_status: "redacted_no_secrets",
    sha256: makeFixtureSha256(index),
    signed_at: "2026-06-23",
    source_locator: `redacted://gate0-packet-fixture/${packet.id}`
  };
}

function makePacketFile(packet, fileName = `${packet.id}.evidence.json`) {
  return {
    packet,
    path: `/fixture/${fileName}`,
    relative: `deploy/governance/gate0-signed-evidence-packets/${fileName}`
  };
}

function makeFixtureSha256(index) {
  const digit = ((index % 15) + 1).toString(16);
  return digit.repeat(64);
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
