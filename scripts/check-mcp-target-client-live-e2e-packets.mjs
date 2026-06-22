#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const contractPath = "deploy/mcp/target-client-live-e2e-handoff.contract.json";
const targetGateContractPath = "deploy/mcp/target-clients-console-release-gate.contract.json";
const packagePath = "package.json";
const allowedStatuses = new Set([
  "accepted",
  "missing_external_e2e",
  "needs_redaction",
  "rejected"
]);
const requiredClientNames = [
  "mcp_inspector",
  "typescript_sdk_client",
  "claude_desktop",
  "cursor",
  "chatgpt_connector"
];
const sha256Pattern = /^sha256:[a-f0-9]{64}$/u;
const labelPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

if (isMainModule()) {
  runCli();
}

export {
  deriveMcpTargetClientLiveE2ePacketStatus,
  validateMcpTargetClientLiveE2ePackets
};

function validateMcpTargetClientLiveE2ePackets({
  contract,
  packageJson,
  packetDirectoryExists = true,
  packetFiles = [],
  targetGateContract
}) {
  const errors = validatePacketSurface({
    contract,
    packageJson,
    packetDirectoryExists,
    packetFiles,
    targetGateContract
  });
  const packets = packetFiles.map((file) => file.packet);
  const packetStatuses = packets.map((packet) => (isRecord(packet) ? packet.status : undefined));
  const allRequiredAccepted =
    errors.length === 0 &&
    requiredClientNames.every((clientName) =>
      packets.some(
        (packet) =>
          isRecord(packet) &&
          packet.client_name === clientName &&
          packet.status === "accepted"
      )
    ) &&
    packets.length === requiredClientNames.length;

  return {
    all_required_accepted: allRequiredAccepted,
    errors,
    packet_files: packetFiles.length,
    packet_statuses: Object.fromEntries(
      packets
        .filter((packet) => isRecord(packet) && typeof packet.client_name === "string")
        .map((packet) => [packet.client_name, packet.status])
    ),
    status:
      errors.length > 0
        ? "invalid_target_client_e2e_packets"
        : deriveMcpTargetClientLiveE2ePacketStatus(
            packetFiles.length,
            packetStatuses,
            allRequiredAccepted
          )
  };
}

function validatePacketSurface({
  contract,
  packageJson,
  packetDirectoryExists,
  packetFiles,
  targetGateContract
}) {
  const errors = [];

  if (!isRecord(contract)) {
    return ["target-client live E2E handoff contract must be an object"];
  }

  if (contract.packet_checker !== "scripts/check-mcp-target-client-live-e2e-packets.mjs") {
    errors.push("contract.packet_checker must be scripts/check-mcp-target-client-live-e2e-packets.mjs");
  }
  if (
    contract.packet_fixture_checker !==
    "scripts/check-mcp-target-client-live-e2e-packet-fixtures.mjs"
  ) {
    errors.push(
      "contract.packet_fixture_checker must be scripts/check-mcp-target-client-live-e2e-packet-fixtures.mjs"
    );
  }
  if (contract.checker !== "scripts/check-mcp-target-client-live-e2e-handoff.mjs") {
    errors.push("contract.checker must be scripts/check-mcp-target-client-live-e2e-handoff.mjs");
  }
  if (contract.packet_directory !== "deploy/mcp/target-client-live-e2e-packets") {
    errors.push("contract.packet_directory must be deploy/mcp/target-client-live-e2e-packets");
  }
  if (contract.packet_file_pattern !== "<client_name>.e2e.json") {
    errors.push("contract.packet_file_pattern must be <client_name>.e2e.json");
  }
  if (!contract.evidence_policy?.packet_checker_allows_empty_directory_until_external_e2e_arrives) {
    errors.push("evidence policy must allow an empty packet directory until external E2E arrives");
  }

  expectArray(
    errors,
    contract.required_target_clients?.map((client) => client.client_name),
    requiredClientNames,
    "contract.required_target_clients.client_name"
  );

  if (targetGateContract !== undefined) {
    expectArray(
      errors,
      targetGateContract.target_client_policy?.target_clients,
      requiredClientNames,
      "target_clients_console_gate.target_client_policy.target_clients"
    );
    expectEqual(
      errors,
      targetGateContract.target_client_policy?.live_e2e_passed,
      false,
      "target_clients_console_gate.target_client_policy.live_e2e_passed"
    );
  }

  const scripts = packageJson?.scripts ?? {};
  if (
    scripts["check:mcp-target-client-live-e2e-packets"] !==
    "node scripts/check-mcp-target-client-live-e2e-packets.mjs"
  ) {
    errors.push("package.json check:mcp-target-client-live-e2e-packets script is missing");
  }
  if (
    typeof scripts.check !== "string" ||
    !scripts.check.includes("npm run check:mcp-target-client-live-e2e-packets")
  ) {
    errors.push("root check must include check:mcp-target-client-live-e2e-packets");
  }

  if (!packetDirectoryExists) {
    errors.push(`packet directory missing ${contract.packet_directory}`);
    return errors;
  }

  const requiredClients = new Map(
    (contract.required_target_clients ?? []).map((client) => [client.client_name, client])
  );
  const seen = new Set();

  for (const clientName of requiredClientNames) {
    if (!requiredClients.has(clientName)) {
      errors.push(`contract missing required target client ${clientName}`);
    }
  }

  for (const file of packetFiles) {
    const packet = file.packet;
    errors.push(
      ...validatePacket({
        contract,
        file,
        forbiddenFields: contract.forbidden_fields,
        packet,
        requiredClients
      })
    );

    if (isRecord(packet) && typeof packet.client_name === "string") {
      if (seen.has(packet.client_name)) {
        errors.push(`duplicate target-client E2E packet ${packet.client_name}`);
      }
      seen.add(packet.client_name);
    }
  }

  return errors;
}

function validatePacket({ contract, file, forbiddenFields, packet, requiredClients }) {
  if (!isRecord(packet)) {
    return [`${file.relative}: packet must be an object`];
  }

  const errors = [];
  const expectedFields = Object.keys(contract.evidence_packet_schema ?? {}).sort();
  const actualFields = Object.keys(packet).sort();

  for (const field of expectedFields) {
    if (!actualFields.includes(field)) {
      errors.push(`${file.relative}: missing field ${field}`);
    }
  }

  for (const field of actualFields) {
    if (!expectedFields.includes(field)) {
      errors.push(`${file.relative}: unexpected field ${field}`);
    }
  }

  if (!requiredClientNames.includes(packet.client_name)) {
    errors.push(`${file.relative}: client_name is unexpected`);
    return errors;
  }

  const expectedFileName = `${packet.client_name}.e2e.json`;
  if (basename(file.path) !== expectedFileName) {
    errors.push(`${file.relative}: filename must be ${expectedFileName}`);
  }

  const requiredClient = requiredClients.get(packet.client_name);
  if (requiredClient === undefined) {
    errors.push(`${file.relative}: required client contract missing ${packet.client_name}`);
  }

  if (!allowedStatuses.has(packet.status)) {
    errors.push(
      `${file.relative}: status must be accepted, missing_external_e2e, needs_redaction, or rejected`
    );
  }

  expectEqual(
    errors,
    packet.protocol_version,
    contract.target_protocol_version,
    `${file.relative}: protocol_version`
  );
  expectEqual(
    errors,
    packet.connection_guide_version,
    contract.connection_guide_version,
    `${file.relative}: connection_guide_version`
  );

  if (!contract.allowed_transports?.includes(packet.transport)) {
    errors.push(`${file.relative}: transport must be a contract allowed_transports member`);
  }

  if (!isIsoInstant(packet.observed_at)) {
    errors.push(`${file.relative}: observed_at must be an ISO-8601 timestamp`);
  }

  if (typeof packet.operator !== "string" || !labelPattern.test(packet.operator)) {
    errors.push(`${file.relative}: operator must be a redacted label`);
  }

  if (typeof packet.source_locator !== "string" || packet.source_locator.trim().length === 0) {
    errors.push(`${file.relative}: source_locator must be a non-empty redacted locator`);
  }

  validateStatusSpecificFields(errors, contract, file.relative, packet);
  validateHashFields(errors, contract.hash_fields ?? [], file.relative, packet);
  validateArtifactHashes(errors, contract, file.relative, packet);
  errors.push(...validateForbiddenKeys(packet, new Set(forbiddenFields ?? []), file.relative));
  errors.push(...validateNoSecrets(packet, file.relative));

  return errors;
}

function validateStatusSpecificFields(errors, contract, label, packet) {
  if (packet.status === "accepted") {
    if (typeof packet.client_version !== "string" || packet.client_version.trim().length === 0) {
      errors.push(`${label}: accepted packet client_version must be non-empty`);
    }
    if (typeof packet.request_id !== "string" || packet.request_id.trim().length === 0) {
      errors.push(`${label}: accepted packet request_id must be non-empty`);
    }
    if (packet.redaction_status !== "redacted_no_secrets") {
      errors.push(`${label}: accepted packet redaction_status must be redacted_no_secrets`);
    }
    return;
  }

  if (packet.status === "missing_external_e2e") {
    if (packet.client_version !== null) {
      errors.push(`${label}: missing_external_e2e packet client_version must be null`);
    }
    if (packet.request_id !== null) {
      errors.push(`${label}: missing_external_e2e packet request_id must be null`);
    }
    if (packet.redaction_status !== "missing") {
      errors.push(`${label}: missing_external_e2e packet redaction_status must be missing`);
    }
    for (const field of contract.hash_fields ?? []) {
      if (packet[field] !== null) {
        errors.push(`${label}: missing_external_e2e packet ${field} must be null`);
      }
    }
    if (!Array.isArray(packet.artifact_hashes) || packet.artifact_hashes.length !== 0) {
      errors.push(`${label}: missing_external_e2e packet artifact_hashes must be empty`);
    }
    return;
  }

  if (packet.status === "needs_redaction" && packet.redaction_status !== "needs_redaction") {
    errors.push(`${label}: needs_redaction packet redaction_status must be needs_redaction`);
  }

  if (packet.status === "rejected" && !["missing", "redacted_no_secrets"].includes(packet.redaction_status)) {
    errors.push(`${label}: rejected packet redaction_status must be missing or redacted_no_secrets`);
  }
}

function validateHashFields(errors, hashFields, label, packet) {
  for (const field of hashFields) {
    const value = packet[field];

    if (packet.status === "accepted" && !sha256Pattern.test(String(value))) {
      errors.push(`${label}: accepted packet ${field} must be sha256:<64 lowercase hex chars>`);
      continue;
    }

    if (value !== null && value !== undefined && !sha256Pattern.test(String(value))) {
      errors.push(`${label}: ${field} must be null or sha256:<64 lowercase hex chars>`);
    }
  }
}

function validateArtifactHashes(errors, contract, label, packet) {
  if (
    !Array.isArray(packet.artifact_hashes) ||
    packet.artifact_hashes.some((hash) => typeof hash !== "string")
  ) {
    errors.push(`${label}: artifact_hashes must be a string array`);
    return;
  }

  if (
    packet.status === "accepted" &&
    packet.artifact_hashes.length < (contract.min_artifact_hashes_per_accepted_packet ?? 1)
  ) {
    errors.push(`${label}: accepted packet artifact_hashes must include at least 3 hashes`);
  }

  for (const hash of packet.artifact_hashes) {
    if (!sha256Pattern.test(hash)) {
      errors.push(`${label}: artifact_hashes must be sha256-only`);
    }
  }
}

function validateForbiddenKeys(value, forbiddenFields, label, path = []) {
  const errors = [];

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      errors.push(...validateForbiddenKeys(item, forbiddenFields, label, [...path, String(index)]));
    }
    return errors;
  }

  if (!isRecord(value)) {
    return errors;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenFields.has(key.toLowerCase())) {
      errors.push(`${label}: forbidden field key ${[...path, key].join(".")}`);
    }
    errors.push(...validateForbiddenKeys(nested, forbiddenFields, label, [...path, key]));
  }

  return errors;
}

function validateNoSecrets(value, label) {
  const serialized = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `${label}: packet contains forbidden secret-like pattern ${pattern.source}`);
}

function listPacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".e2e.json"))
    .map((entry) => ({
      path: join(absoluteDirectory, entry.name),
      relative: join(directory, entry.name)
    }))
    .sort((a, b) => a.relative.localeCompare(b.relative));
}

function runCli() {
  const contract = readJson(contractPath);
  const targetGateContract = readJson(targetGateContractPath);
  const packageJson = readJson(packagePath);
  const packetDirectory = resolve(process.cwd(), contract.packet_directory ?? "");
  const packetDirectoryExists = existsSync(packetDirectory);
  const packetFiles = packetDirectoryExists
    ? listPacketFiles(contract.packet_directory).map((file) => ({
        ...file,
        packet: readJson(file.path)
      }))
    : [];
  const result = validateMcpTargetClientLiveE2ePackets({
    contract,
    packageJson,
    packetDirectoryExists,
    packetFiles,
    targetGateContract
  });

  if (result.errors.length > 0) {
    emit(
      {
        errors: result.errors,
        path: contract.packet_directory,
        status: result.status
      },
      1
    );
  }

  emit(
    {
      all_required_accepted: result.all_required_accepted,
      packet_files: result.packet_files,
      packet_statuses: result.packet_statuses,
      status: result.status
    },
    0
  );
}

function deriveMcpTargetClientLiveE2ePacketStatus(
  packetFileCount,
  packetStatuses,
  allRequiredAccepted
) {
  if (packetFileCount === 0) {
    return "awaiting_external_target_client_e2e_packets";
  }

  if (allRequiredAccepted) {
    return "ready_for_target_clients_console_gate_review";
  }

  if (packetStatuses.some((status) => status === "rejected" || status === "needs_redaction")) {
    return "target_client_e2e_packets_include_blockers";
  }

  if (packetStatuses.some((status) => status === "missing_external_e2e")) {
    return "target_client_e2e_packets_missing_external_e2e";
  }

  return "partial_target_client_e2e_packets";
}

function isIsoInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/u.test(value)) {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual)) {
    errors.push(`${path} expected array`);
    return;
  }

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} mismatch: expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "invalid_json"
      },
      1
    );
  }
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMainModule() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
