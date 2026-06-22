#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const contractPath = "deploy/governance/live-smoke-capture-artifacts.contract.json";
const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const packagePath = "package.json";
const allowedStatuses = new Set(["passed", "missing_env", "permission_denied", "failed"]);
const requiredCaptureIds = [
  "cloudflare_resource_inventory",
  "cloudflare_bindings_functional",
  "ai_gateway_model_execution",
  "ai_gateway_observability",
  "observability_otlp_eval_store",
  "provider_secret_store_rotation"
];
const sha256Pattern = /^sha256:[a-f0-9]{64}$/u;
const runnerPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/u;
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const ledger = readJson(ledgerPath);
const packageJson = readJson(packagePath);
const errors = validatePacketSurface({ contract, ledger, packageJson });

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contract.artifact_directory,
      status: "invalid_capture_packets"
    },
    1
  );
}

const packetFiles = listPacketFiles(contract.artifact_directory);
const packets = packetFiles.map((file) => readJson(file.path));
const packetStatuses = packets.map((packet) => packet.status);
const allRequiredPassed =
  requiredCaptureIds.every((id) => packets.some((packet) => packet.capture_id === id && packet.status === "passed")) &&
  packets.length === requiredCaptureIds.length;

emit(
  {
    all_required_passed: allRequiredPassed,
    packet_files: packetFiles.length,
    packet_statuses: Object.fromEntries(packets.map((packet) => [packet.capture_id, packet.status])),
    status: deriveStatus(packetFiles.length, packetStatuses, allRequiredPassed)
  },
  0
);

function validatePacketSurface({ contract, ledger, packageJson }) {
  const errors = [];

  if (!isRecord(contract)) {
    return ["capture artifact contract must be an object"];
  }

  if (contract.packet_checker !== "scripts/check-live-smoke-capture-packets.mjs") {
    errors.push("contract.packet_checker must be scripts/check-live-smoke-capture-packets.mjs");
  }

  if (contract.artifact_directory !== "deploy/governance/live-smoke-capture-packets") {
    errors.push("contract.artifact_directory must be deploy/governance/live-smoke-capture-packets");
  }

  if (contract.packet_file_pattern !== "<capture_id>.capture.json") {
    errors.push("contract.packet_file_pattern must be <capture_id>.capture.json");
  }

  if (!contract.artifact_policy?.packet_checker_allows_empty_directory_until_external_env_arrives) {
    errors.push("artifact policy must allow an empty packet directory until external env arrives");
  }

  const scripts = packageJson?.scripts ?? {};
  if (scripts["check:live-smoke-capture-packets"] !== "node scripts/check-live-smoke-capture-packets.mjs") {
    errors.push("package.json check:live-smoke-capture-packets script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-capture-packets")) {
    errors.push("root check must include check:live-smoke-capture-packets");
  }

  const artifactDirectory = resolve(process.cwd(), contract.artifact_directory ?? "");
  if (!existsSync(artifactDirectory)) {
    errors.push(`artifact directory missing ${contract.artifact_directory}`);
    return errors;
  }

  const packetFiles = listPacketFiles(contract.artifact_directory);
  const ledgerCommands = new Map((ledger.live_smoke_commands ?? []).map((entry) => [entry.id, entry]));
  const requiredCaptures = new Map((contract.required_captures ?? []).map((entry) => [entry.id, entry]));
  const seen = new Set();

  for (const id of requiredCaptureIds) {
    if (!ledgerCommands.has(id)) {
      errors.push(`ledger missing live smoke command ${id}`);
    }
    if (!requiredCaptures.has(id)) {
      errors.push(`contract missing required capture ${id}`);
    }
  }

  for (const file of packetFiles) {
    const packet = readJson(file.path);
    errors.push(...validatePacket({ file, forbiddenFields: contract.forbidden_fields, ledgerCommands, packet, requiredCaptures }));

    if (isRecord(packet) && typeof packet.capture_id === "string") {
      if (seen.has(packet.capture_id)) {
        errors.push(`duplicate capture packet ${packet.capture_id}`);
      }
      seen.add(packet.capture_id);
    }
  }

  return errors;
}

function validatePacket({ file, forbiddenFields, ledgerCommands, packet, requiredCaptures }) {
  if (!isRecord(packet)) {
    return [`${file.relative}: packet must be an object`];
  }

  const errors = [];
  const expectedFields = Object.keys(contract.capture_packet_schema ?? {}).sort();
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

  if (!requiredCaptureIds.includes(packet.capture_id)) {
    errors.push(`${file.relative}: capture_id is unexpected`);
    return errors;
  }

  const expectedFileName = `${packet.capture_id}.capture.json`;
  if (basename(file.path) !== expectedFileName) {
    errors.push(`${file.relative}: filename must be ${expectedFileName}`);
  }

  const ledgerCommand = ledgerCommands.get(packet.capture_id);
  const requiredCapture = requiredCaptures.get(packet.capture_id);

  if (ledgerCommand && packet.command !== ledgerCommand.command) {
    errors.push(`${file.relative}: command must match ledger`);
  }

  if (ledgerCommand && packet.script !== ledgerCommand.script) {
    errors.push(`${file.relative}: script must match ledger`);
  }

  if (requiredCapture && packet.command !== requiredCapture.command) {
    errors.push(`${file.relative}: command must match capture contract`);
  }

  if (requiredCapture && packet.script !== requiredCapture.script) {
    errors.push(`${file.relative}: script must match capture contract`);
  }

  if (!isIsoInstant(packet.observed_at)) {
    errors.push(`${file.relative}: observed_at must be an ISO-8601 timestamp`);
  }

  if (typeof packet.runner !== "string" || !runnerPattern.test(packet.runner)) {
    errors.push(`${file.relative}: runner must be a redacted label`);
  }

  if (!Number.isInteger(packet.exit_code)) {
    errors.push(`${file.relative}: exit_code must be an integer`);
  }

  if (!allowedStatuses.has(packet.status)) {
    errors.push(`${file.relative}: status must be passed, missing_env, permission_denied, or failed`);
  }

  if (packet.status === "passed" && packet.exit_code !== 0) {
    errors.push(`${file.relative}: passed capture must have exit_code 0`);
  }

  if (packet.status === "passed" && !sha256Pattern.test(String(packet.output_sha256))) {
    errors.push(`${file.relative}: passed capture must include sha256 output hash`);
  }

  if (packet.status === "missing_env" && packet.output_sha256 !== null) {
    errors.push(`${file.relative}: missing_env capture must keep output_sha256 null`);
  }

  if (packet.output_sha256 !== null && packet.output_sha256 !== undefined && !sha256Pattern.test(String(packet.output_sha256))) {
    errors.push(`${file.relative}: output_sha256 must be null or sha256:<64 lowercase hex chars>`);
  }

  if (packet.redaction_status !== "redacted_no_secrets") {
    errors.push(`${file.relative}: redaction_status must be redacted_no_secrets`);
  }

  if (typeof packet.source_locator !== "string" || packet.source_locator.trim().length === 0) {
    errors.push(`${file.relative}: source_locator must be a non-empty redacted locator`);
  }

  if (!Array.isArray(packet.evidence_refs) || packet.evidence_refs.some((ref) => typeof ref !== "string")) {
    errors.push(`${file.relative}: evidence_refs must be a string array`);
  } else {
    if (packet.status === "passed" && packet.evidence_refs.length === 0) {
      errors.push(`${file.relative}: passed capture must include hash-only evidence_refs`);
    }

    for (const ref of packet.evidence_refs) {
      if (!sha256Pattern.test(ref)) {
        errors.push(`${file.relative}: evidence_refs must be sha256-only`);
      }
    }
  }

  if (typeof packet.cleanup_verified !== "boolean") {
    errors.push(`${file.relative}: cleanup_verified must be boolean`);
  }

  if (packet.capture_id === "provider_secret_store_rotation" && packet.status === "passed" && packet.cleanup_verified !== true) {
    errors.push(`${file.relative}: provider secret store rotation passed capture requires cleanup_verified=true`);
  }

  if (packet.capture_id !== "provider_secret_store_rotation" && packet.cleanup_verified !== false) {
    errors.push(`${file.relative}: non-destructive capture must keep cleanup_verified=false`);
  }

  errors.push(...validateForbiddenKeys(packet, new Set(forbiddenFields ?? []), file.relative));
  errors.push(...validateNoSecrets(packet, file.relative));

  return errors;
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
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => ({
      path: join(absoluteDirectory, entry.name),
      relative: join(directory, entry.name)
    }))
    .sort((a, b) => a.relative.localeCompare(b.relative));
}

function deriveStatus(packetFileCount, packetStatuses, allRequiredPassed) {
  if (packetFileCount === 0) {
    return "awaiting_external_env_capture";
  }

  if (allRequiredPassed) {
    return "ready_for_ledger_update";
  }

  if (packetStatuses.some((status) => status === "failed" || status === "permission_denied")) {
    return "capture_packets_include_blockers";
  }

  if (packetStatuses.some((status) => status === "missing_env")) {
    return "capture_packets_missing_env";
  }

  return "partial_capture_packets";
}

function isIsoInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/u.test(value)) {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
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

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
