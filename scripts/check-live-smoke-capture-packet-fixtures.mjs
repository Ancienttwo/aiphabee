#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateCapturePackets } from "./check-live-smoke-capture-packets.mjs";

const contractPath = "deploy/governance/live-smoke-capture-artifacts.contract.json";
const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const packagePath = "package.json";

const contract = readJson(contractPath);
const ledger = readJson(ledgerPath);
const packageJson = readJson(packagePath);
const ledgerCommands = new Map(ledger.live_smoke_commands.map((entry) => [entry.id, entry]));
const captureIds = contract.required_captures.map((entry) => entry.id);

const completePassedPacketFiles = captureIds.map((id, index) =>
  makePacketFile(makePassedPacket(id, index))
);

const scenarios = [
  {
    expectValid: true,
    expectedStatus: "awaiting_external_env_capture",
    name: "empty_directory_awaits_external_env",
    packetFiles: []
  },
  {
    expectValid: true,
    expectedAllRequiredPassed: true,
    expectedStatus: "ready_for_ledger_update",
    name: "complete_passed_packet_set",
    packetFiles: completePassedPacketFiles
  },
  {
    expectValid: true,
    expectedStatus: "capture_packets_missing_env",
    name: "missing_env_packet_does_not_unlock",
    packetFiles: [makePacketFile(makeMissingEnvPacket("ai_gateway_model_execution"))]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/cloudflare_resource_inventory.capture.json: passed capture must include sha256 output hash",
    expectValid: false,
    name: "passed_packet_missing_output_hash",
    packetFiles: [
      makePacketFile(
        mutate(makePassedPacket("cloudflare_resource_inventory", 0), (packet) => {
          packet.output_sha256 = null;
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/ai_gateway_model_execution.capture.json: missing_env capture must keep output_sha256 null",
    expectValid: false,
    name: "missing_env_packet_with_output_hash",
    packetFiles: [
      makePacketFile(
        mutate(makeMissingEnvPacket("ai_gateway_model_execution"), (packet) => {
          packet.output_sha256 = makeSha256(8);
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/ai_gateway_observability.capture.json: evidence_refs must be sha256-only",
    expectValid: false,
    name: "non_hash_evidence_ref",
    packetFiles: [
      makePacketFile(
        mutate(makePassedPacket("ai_gateway_observability", 3), (packet) => {
          packet.evidence_refs = ["redacted-log-ref"];
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/provider_secret_store_rotation.capture.json: provider secret store rotation passed capture requires cleanup_verified=true",
    expectValid: false,
    name: "provider_secret_cleanup_missing",
    packetFiles: [
      makePacketFile(
        mutate(makePassedPacket("provider_secret_store_rotation", 5), (packet) => {
          packet.cleanup_verified = false;
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/cloudflare_bindings_functional.capture.json: non-destructive capture must keep cleanup_verified=false",
    expectValid: false,
    name: "non_destructive_cleanup_claimed",
    packetFiles: [
      makePacketFile(
        mutate(makePassedPacket("cloudflare_bindings_functional", 1), (packet) => {
          packet.cleanup_verified = true;
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/cloudflare_resource_inventory.capture.json: unexpected field raw_output",
    expectValid: false,
    name: "raw_output_field_rejected",
    packetFiles: [
      makePacketFile(
        mutate(makePassedPacket("cloudflare_resource_inventory", 0), (packet) => {
          packet.raw_output = "redacted raw output must not be stored";
        })
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/observability_otlp_eval_store.capture.json: command must match ledger",
    expectValid: false,
    name: "command_mismatch",
    packetFiles: [
      makePacketFile(
        mutate(makePassedPacket("observability_otlp_eval_store", 4), (packet) => {
          packet.command = "npm run smoke:wrong-live-command";
        })
      )
    ]
  },
  {
    expectedError: "duplicate capture packet cloudflare_resource_inventory",
    expectValid: false,
    name: "duplicate_capture_id",
    packetFiles: [
      makePacketFile(makePassedPacket("cloudflare_resource_inventory", 0)),
      makePacketFile(makePassedPacket("cloudflare_resource_inventory", 1))
    ]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/unknown_capture.capture.json: capture_id is unexpected",
    expectValid: false,
    name: "unexpected_capture_id",
    packetFiles: [
      makePacketFile(
        mutate(makePassedPacket("cloudflare_resource_inventory", 0), (packet) => {
          packet.capture_id = "unknown_capture";
        }),
        "unknown_capture.capture.json"
      )
    ]
  },
  {
    expectedError:
      "deploy/governance/live-smoke-capture-packets/ai_gateway_model_execution.capture.json: packet contains forbidden secret-like pattern Bearer\\s+[A-Za-z0-9._-]{20,}",
    expectValid: false,
    name: "secret_like_locator_rejected",
    packetFiles: [
      makePacketFile(
        mutate(makePassedPacket("ai_gateway_model_execution", 2), (packet) => {
          packet.source_locator = "Bearer abcdefghijklmnopqrstuvwxyz";
        })
      )
    ]
  },
  {
    expectedError: "artifact directory missing deploy/governance/live-smoke-capture-packets",
    expectValid: false,
    name: "artifact_directory_missing",
    artifactDirectoryExists: false,
    packetFiles: []
  }
];

const failures = [];

for (const scenario of scenarios) {
  const result = validateCapturePackets({
    artifactDirectoryExists: scenario.artifactDirectoryExists ?? true,
    contract,
    ledger,
    packageJson,
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
    typeof scenario.expectedAllRequiredPassed === "boolean" &&
    scenario.expectedAllRequiredPassed !== result.all_required_passed
  ) {
    failures.push({
      actual_all_required_passed: result.all_required_passed,
      expected_all_required_passed: scenario.expectedAllRequiredPassed,
      name: scenario.name,
      status: "all_required_passed_mismatch"
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

function makePassedPacket(captureId, index) {
  const command = ledgerCommands.get(captureId);

  return {
    capture_id: captureId,
    cleanup_verified: captureId === "provider_secret_store_rotation",
    command: command.command,
    evidence_refs: [makeSha256(index + 1)],
    exit_code: 0,
    observed_at: "2026-06-22T00:00:00.000Z",
    output_sha256: makeSha256(index + 7),
    redaction_status: "redacted_no_secrets",
    runner: "fixture-runner",
    script: command.script,
    source_locator: `fixture:${captureId}:redacted`,
    status: "passed"
  };
}

function makeMissingEnvPacket(captureId) {
  const command = ledgerCommands.get(captureId);

  return {
    capture_id: captureId,
    cleanup_verified: false,
    command: command.command,
    evidence_refs: [],
    exit_code: 1,
    observed_at: "2026-06-22T00:00:00.000Z",
    output_sha256: null,
    redaction_status: "redacted_no_secrets",
    runner: "fixture-runner",
    script: command.script,
    source_locator: `fixture:${captureId}:missing-env`,
    status: "missing_env"
  };
}

function makePacketFile(packet, fileName = `${packet.capture_id}.capture.json`) {
  return {
    packet,
    path: `/fixture/${fileName}`,
    relative: `deploy/governance/live-smoke-capture-packets/${fileName}`
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
