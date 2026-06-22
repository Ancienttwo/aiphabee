#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateMcpTargetClientLiveE2ePackets } from "./check-mcp-target-client-live-e2e-packets.mjs";

const contractPath = "deploy/mcp/target-client-live-e2e-handoff.contract.json";
const targetGateContractPath = "deploy/mcp/target-clients-console-release-gate.contract.json";
const packagePath = "package.json";
const contract = readJson(contractPath);
const targetGateContract = readJson(targetGateContractPath);
const packageJson = readJson(packagePath);
const clientNames = contract.required_target_clients.map((client) => client.client_name);
const completeAcceptedPacketFiles = clientNames.map((clientName, index) =>
  makePacketFile(makeAcceptedPacket(clientName, index))
);
const scenarios = [
  {
    expectValid: true,
    expectedStatus: "awaiting_external_target_client_e2e_packets",
    name: "empty_directory_awaits_external_e2e",
    packetFiles: []
  },
  {
    expectValid: true,
    expectedAllRequiredAccepted: true,
    expectedStatus: "ready_for_target_clients_console_gate_review",
    name: "complete_accepted_packet_set",
    packetFiles: completeAcceptedPacketFiles
  },
  {
    expectValid: true,
    expectedStatus: "target_client_e2e_packets_missing_external_e2e",
    name: "missing_external_template_does_not_unlock",
    packetFiles: [makePacketFile(makeMissingPacket("mcp_inspector"))]
  },
  {
    expectedError:
      "deploy/mcp/target-client-live-e2e-packets/mcp_inspector.e2e.json: accepted packet initialize_result_hash must be sha256:<64 lowercase hex chars>",
    expectValid: false,
    name: "accepted_packet_missing_initialize_hash",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("mcp_inspector", 0), (packet) => {
          packet.initialize_result_hash = null;
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/mcp/target-client-live-e2e-packets/typescript_sdk_client.e2e.json: artifact_hashes must be sha256-only",
    expectValid: false,
    name: "non_hash_artifact_ref",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("typescript_sdk_client", 1), (packet) => {
          packet.artifact_hashes = ["redacted-artifact"];
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/mcp/target-client-live-e2e-packets/claude_desktop.e2e.json: forbidden field key raw_prompt",
    expectValid: false,
    name: "raw_prompt_field_rejected",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("claude_desktop", 2), (packet) => {
          packet.raw_prompt = "redacted but forbidden raw prompt payload";
        })
      )
    ]
  },
  {
    expectedError: "duplicate target-client E2E packet cursor",
    expectValid: false,
    name: "duplicate_client_name",
    packetFiles: [
      makePacketFile(makeAcceptedPacket("cursor", 3)),
      makePacketFile(makeAcceptedPacket("cursor", 4))
    ]
  },
  {
    expectedError:
      "deploy/mcp/target-client-live-e2e-packets/unknown_client.e2e.json: client_name is unexpected",
    expectValid: false,
    name: "unexpected_client_name",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("chatgpt_connector", 4), (packet) => {
          packet.client_name = "unknown_client";
        }),
        "unknown_client.e2e.json"
      )
    ]
  },
  {
    expectedError:
      "deploy/mcp/target-client-live-e2e-packets/chatgpt_connector.e2e.json: packet contains forbidden secret-like pattern Bearer\\s+[A-Za-z0-9._-]{20,}",
    expectValid: false,
    name: "secret_like_locator_rejected",
    packetFiles: [
      makePacketFile(
        mutate(makeAcceptedPacket("chatgpt_connector", 4), (packet) => {
          packet.source_locator = "Bearer abcdefghijklmnopqrstuvwxyz";
        })
      )
    ]
  },
  {
    expectValid: true,
    expectedStatus: "target_client_e2e_packets_include_blockers",
    name: "needs_redaction_packet_is_blocker",
    packetFiles: [makePacketFile(makeNeedsRedactionPacket("mcp_inspector"))]
  },
  {
    expectedError: "packet directory missing deploy/mcp/target-client-live-e2e-packets",
    expectValid: false,
    name: "packet_directory_missing",
    packetDirectoryExists: false,
    packetFiles: []
  }
];
const failures = [];

for (const scenario of scenarios) {
  const result = validateMcpTargetClientLiveE2ePackets({
    contract,
    packageJson,
    packetDirectoryExists: scenario.packetDirectoryExists ?? true,
    packetFiles: scenario.packetFiles,
    targetGateContract
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

function makeAcceptedPacket(clientName, index) {
  return {
    artifact_hashes: [makeSha256(index + 20), makeSha256(index + 21), makeSha256(index + 22)],
    client_name: clientName,
    client_version: `fixture-${clientName}-v1`,
    connection_guide_version: contract.connection_guide_version,
    console_log_row_hash: makeSha256(index + 10),
    credential_panel_hash: makeSha256(index + 13),
    error_panel_hash: makeSha256(index + 14),
    initialize_result_hash: makeSha256(index + 6),
    observed_at: "2026-06-23T00:00:00.000Z",
    operator: "fixture-operator",
    protocol_version: contract.target_protocol_version,
    redaction_status: "redacted_no_secrets",
    request_id: `fixture-${clientName}-request`,
    scope_panel_hash: makeSha256(index + 12),
    source_locator: `fixture:${clientName}:redacted`,
    status: "accepted",
    tool_call_result_hash: makeSha256(index + 8),
    tools_list_result_hash: makeSha256(index + 7),
    transport: contract.allowed_transports[0],
    usage_panel_hash: makeSha256(index + 11)
  };
}

function makeMissingPacket(clientName) {
  return {
    artifact_hashes: [],
    client_name: clientName,
    client_version: null,
    connection_guide_version: contract.connection_guide_version,
    console_log_row_hash: null,
    credential_panel_hash: null,
    error_panel_hash: null,
    initialize_result_hash: null,
    observed_at: "2026-06-23T00:00:00.000Z",
    operator: "fixture",
    protocol_version: contract.target_protocol_version,
    redaction_status: "missing",
    request_id: null,
    scope_panel_hash: null,
    source_locator: `fixture:${clientName}:missing`,
    status: "missing_external_e2e",
    tool_call_result_hash: null,
    tools_list_result_hash: null,
    transport: contract.allowed_transports[0],
    usage_panel_hash: null
  };
}

function makeNeedsRedactionPacket(clientName) {
  return {
    ...makeMissingPacket(clientName),
    redaction_status: "needs_redaction",
    status: "needs_redaction"
  };
}

function makePacketFile(packet, fileName = `${packet.client_name}.e2e.json`) {
  return {
    packet,
    path: `/fixture/${fileName}`,
    relative: `deploy/mcp/target-client-live-e2e-packets/${fileName}`
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
