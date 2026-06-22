#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const manifestPath = "deploy/governance/sprint1-live-data-evidence-manifest.contract.json";
const packagePath = "package.json";
const allowedStatuses = new Set(["missing", "accepted", "rejected", "needs_redaction"]);
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
const sha256Pattern = /^sha256:[a-f0-9]{64}$/u;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;
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

export { deriveEvidencePacketStatus, validateSprint1LiveDataEvidencePackets };

function validateSprint1LiveDataEvidencePackets({
  manifest,
  packageJson,
  packetDirectoryExists = true,
  packetFiles = []
}) {
  const errors = validatePacketSurface({
    manifest,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });
  const packets = packetFiles.map((file) => file.packet);
  const packetStatuses = packets.map((packet) => (isRecord(packet) ? packet.status : undefined));
  const allRequiredAccepted =
    errors.length === 0 &&
    requiredGateIds.every((id) =>
      packets.some((packet) => isRecord(packet) && packet.gate_id === id && packet.status === "accepted")
    ) &&
    packets.length === requiredGateIds.length;

  return {
    all_required_accepted: allRequiredAccepted,
    errors,
    packet_files: packetFiles.length,
    packet_statuses: Object.fromEntries(
      packets
        .filter((packet) => isRecord(packet) && typeof packet.gate_id === "string")
        .map((packet) => [packet.gate_id, packet.status])
    ),
    status:
      errors.length > 0
        ? "invalid_evidence_packets"
        : deriveEvidencePacketStatus(packetFiles.length, packetStatuses, allRequiredAccepted)
  };
}

function validatePacketSurface({ manifest, packageJson, packetDirectoryExists, packetFiles }) {
  const errors = [];

  if (!isRecord(manifest)) {
    return ["evidence manifest must be an object"];
  }

  if (manifest.packet_checker !== "scripts/check-sprint1-live-data-evidence-packets.mjs") {
    errors.push("manifest.packet_checker must be scripts/check-sprint1-live-data-evidence-packets.mjs");
  }

  if (
    manifest.packet_fixture_checker !==
    "scripts/check-sprint1-live-data-evidence-packet-fixtures.mjs"
  ) {
    errors.push(
      "manifest.packet_fixture_checker must be scripts/check-sprint1-live-data-evidence-packet-fixtures.mjs"
    );
  }

  if (manifest.handoff_checker !== "scripts/check-sprint1-live-data-evidence-handoff.mjs") {
    errors.push("manifest.handoff_checker must be scripts/check-sprint1-live-data-evidence-handoff.mjs");
  }

  if (manifest.packet_directory !== "deploy/governance/sprint1-live-data-evidence-packets") {
    errors.push("manifest.packet_directory must be deploy/governance/sprint1-live-data-evidence-packets");
  }

  if (manifest.packet_file_pattern !== "<gate_id>.evidence.json") {
    errors.push("manifest.packet_file_pattern must be <gate_id>.evidence.json");
  }

  if (!manifest.evidence_policy?.packet_checker_allows_empty_directory_until_external_evidence_arrives) {
    errors.push("evidence policy must allow an empty packet directory until external evidence arrives");
  }

  const scripts = packageJson?.scripts ?? {};
  if (
    scripts["check:sprint1-live-data-evidence-packets"] !==
    "node scripts/check-sprint1-live-data-evidence-packets.mjs"
  ) {
    errors.push("package.json check:sprint1-live-data-evidence-packets script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:sprint1-live-data-evidence-packets")) {
    errors.push("root check must include check:sprint1-live-data-evidence-packets");
  }

  if (!packetDirectoryExists) {
    errors.push(`packet directory missing ${manifest.packet_directory}`);
    return errors;
  }

  const requiredGates = new Map((manifest.required_gates ?? []).map((gate) => [gate.id, gate]));
  const seen = new Set();

  for (const id of requiredGateIds) {
    if (!requiredGates.has(id)) {
      errors.push(`manifest missing required gate ${id}`);
    }
  }

  for (const file of packetFiles) {
    const packet = file.packet;
    errors.push(
      ...validatePacket({
        file,
        forbiddenFields: manifest.forbidden_fields,
        manifest,
        packet,
        requiredGates
      })
    );

    if (isRecord(packet) && typeof packet.gate_id === "string") {
      if (seen.has(packet.gate_id)) {
        errors.push(`duplicate evidence packet ${packet.gate_id}`);
      }
      seen.add(packet.gate_id);
    }
  }

  return errors;
}

function validatePacket({ file, forbiddenFields, manifest, packet, requiredGates }) {
  if (!isRecord(packet)) {
    return [`${file.relative}: packet must be an object`];
  }

  const errors = [];
  const expectedFields = Object.keys(manifest.evidence_packet_schema ?? {}).sort();
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

  if (!requiredGateIds.includes(packet.gate_id)) {
    errors.push(`${file.relative}: gate_id is unexpected`);
    return errors;
  }

  const expectedFileName = `${packet.gate_id}.evidence.json`;
  if (basename(file.path) !== expectedFileName) {
    errors.push(`${file.relative}: filename must be ${expectedFileName}`);
  }

  const gate = requiredGates.get(packet.gate_id);
  if (gate) {
    expectArray(errors, packet.blocks, gate.blocks, `${file.relative}: blocks`);
    expectArray(
      errors,
      packet.required_evidence,
      gate.required_evidence,
      `${file.relative}: required_evidence`
    );
  }

  if (!allowedStatuses.has(packet.status)) {
    errors.push(`${file.relative}: status must be missing, accepted, rejected, or needs_redaction`);
  }

  if (!isIsoInstant(packet.observed_at)) {
    errors.push(`${file.relative}: observed_at must be an ISO-8601 timestamp`);
  }

  if (typeof packet.source_locator !== "string" || packet.source_locator.trim().length === 0) {
    errors.push(`${file.relative}: source_locator must be a non-empty redacted locator`);
  }

  if (!Array.isArray(packet.evidence_refs) || packet.evidence_refs.some((ref) => typeof ref !== "string")) {
    errors.push(`${file.relative}: evidence_refs must be a string array`);
  } else {
    if (packet.status === "accepted" && packet.evidence_refs.length === 0) {
      errors.push(`${file.relative}: accepted packet must include hash-only evidence_refs`);
    }

    if (packet.status === "missing" && packet.evidence_refs.length !== 0) {
      errors.push(`${file.relative}: missing packet must keep evidence_refs empty`);
    }

    for (const ref of packet.evidence_refs) {
      if (!sha256Pattern.test(ref)) {
        errors.push(`${file.relative}: evidence_refs must be sha256-only`);
      }
    }
  }

  if (packet.status === "accepted" && !sha256Pattern.test(String(packet.evidence_sha256))) {
    errors.push(`${file.relative}: accepted packet must include sha256 evidence_sha256`);
  }

  if (packet.status === "missing" && packet.evidence_sha256 !== null) {
    errors.push(`${file.relative}: missing packet evidence_sha256 must be null`);
  }

  if (
    packet.evidence_sha256 !== null &&
    packet.evidence_sha256 !== undefined &&
    !sha256Pattern.test(String(packet.evidence_sha256))
  ) {
    errors.push(`${file.relative}: evidence_sha256 must be null or sha256:<64 lowercase hex chars>`);
  }

  if (packet.status === "accepted" && !isoDatePattern.test(String(packet.signed_at ?? ""))) {
    errors.push(`${file.relative}: accepted packet signed_at must be YYYY-MM-DD`);
  }

  if (packet.status === "missing" && packet.signed_at !== null) {
    errors.push(`${file.relative}: missing packet signed_at must be null`);
  }

  if (packet.signed_at !== null && packet.signed_at !== undefined && !isoDatePattern.test(String(packet.signed_at))) {
    errors.push(`${file.relative}: signed_at must be null or YYYY-MM-DD`);
  }

  if (gate && packet.status === "accepted" && !gate.required_approver_roles.includes(packet.approver_role)) {
    errors.push(`${file.relative}: approver_role must be one of required_approver_roles`);
  }

  if (packet.status === "missing" && packet.approver_role !== null) {
    errors.push(`${file.relative}: missing packet approver_role must be null`);
  }

  if (packet.status === "accepted" && packet.redaction_status !== "redacted_no_secrets") {
    errors.push(`${file.relative}: accepted packet redaction_status must be redacted_no_secrets`);
  }

  if (packet.status === "missing" && packet.redaction_status !== "missing") {
    errors.push(`${file.relative}: missing packet redaction_status must be missing`);
  }

  if (!["missing", "redacted_no_secrets"].includes(packet.redaction_status)) {
    errors.push(`${file.relative}: redaction_status must be missing or redacted_no_secrets`);
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
    .filter((entry) => entry.isFile() && entry.name.endsWith(".evidence.json"))
    .map((entry) => ({
      path: join(absoluteDirectory, entry.name),
      relative: join(directory, entry.name)
    }))
    .sort((a, b) => a.relative.localeCompare(b.relative));
}

function runCli() {
  const manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);
  const packetDirectory = resolve(process.cwd(), manifest.packet_directory ?? "");
  const packetDirectoryExists = existsSync(packetDirectory);
  const packetFiles = packetDirectoryExists
    ? listPacketFiles(manifest.packet_directory).map((file) => ({
        ...file,
        packet: readJson(file.path)
      }))
    : [];
  const result = validateSprint1LiveDataEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });

  if (result.errors.length > 0) {
    emit(
      {
        errors: result.errors,
        path: manifest.packet_directory,
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

function deriveEvidencePacketStatus(packetFileCount, packetStatuses, allRequiredAccepted) {
  if (packetFileCount === 0) {
    return "awaiting_external_evidence_packets";
  }

  if (allRequiredAccepted) {
    return "ready_for_manifest_update";
  }

  if (packetStatuses.some((status) => status === "rejected" || status === "needs_redaction")) {
    return "evidence_packets_include_blockers";
  }

  if (packetStatuses.some((status) => status === "missing")) {
    return "evidence_packets_missing";
  }

  return "partial_evidence_packets";
}

function isIsoInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/u.test(value)) {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function expectArray(errors, actual, requiredValues, label) {
  if (!Array.isArray(actual) || actual.some((value) => typeof value !== "string")) {
    errors.push(`${label} must be a string array`);
    return;
  }

  for (const requiredValue of requiredValues) {
    if (!actual.includes(requiredValue)) {
      errors.push(`${label} must include ${requiredValue}`);
    }
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
