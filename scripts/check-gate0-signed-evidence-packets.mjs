#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const manifestPath = "deploy/governance/gate0-signed-evidence-manifest.contract.json";
const packagePath = "package.json";
const allowedStatuses = new Set(["missing", "submitted", "accepted", "rejected", "superseded"]);
const allowedApprovalStatuses = new Set(["accepted", "rejected", "superseded"]);
const requiredPacketIds = [
  "field_rights_matrix",
  "hkex_vendor_licensing_memo",
  "type4_product_boundary_opinion",
  "pcpd_privacy_path_assessment",
  "commercial_settlement_schedule",
  "gate0_signature_register"
];
const expectedPacketFields = [
  "acceptance_checks",
  "blocks_sprint0_1_checkbox",
  "evidence_refs",
  "id",
  "required_approver_roles",
  "status"
];
const evidenceRefFields = [
  "approval_status",
  "approver",
  "redaction_status",
  "sha256",
  "signed_at",
  "source_locator"
];
const hexSha256Pattern = /^[a-f0-9]{64}$/u;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;
const forbiddenFieldKeys = new Set([
  "authorization",
  "api_key",
  "token",
  "secret",
  "password",
  "raw_legal_memo",
  "raw_contract",
  "raw_document",
  "raw_payload",
  "raw_response",
  "raw_output",
  "raw_text",
  "database_url",
  "connection_string",
  "account_id",
  "workspace_id",
  "env_value"
]);
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u,
  /raw[_\s-]?(legal|contract|document|memo|payload|text|content)/iu,
  /unredacted/iu
];

if (isMainModule()) {
  runCli();
}

export { deriveGate0SignedEvidencePacketStatus, validateGate0SignedEvidencePackets };

function validateGate0SignedEvidencePackets({
  manifest,
  packageJson,
  packetDirectoryExists = true,
  packetFiles = []
}) {
  const errors = validatePacketSurface({ manifest, packageJson, packetDirectoryExists, packetFiles });
  const packets = packetFiles.map((file) => file.packet);
  const packetStatuses = packets.map((packet) => (isRecord(packet) ? packet.status : undefined));
  const allRequiredAccepted =
    errors.length === 0 &&
    requiredPacketIds.every((id) =>
      packets.some((packet) => isRecord(packet) && packet.id === id && packet.status === "accepted")
    ) &&
    packets.length === requiredPacketIds.length;

  return {
    all_required_accepted: allRequiredAccepted,
    errors,
    packet_files: packetFiles.length,
    packet_statuses: Object.fromEntries(
      packets
        .filter((packet) => isRecord(packet) && typeof packet.id === "string")
        .map((packet) => [packet.id, packet.status])
    ),
    status:
      errors.length > 0
        ? "invalid_signed_evidence_packets"
        : deriveGate0SignedEvidencePacketStatus(packetFiles.length, packetStatuses, allRequiredAccepted)
  };
}

function validatePacketSurface({ manifest, packageJson, packetDirectoryExists, packetFiles }) {
  const errors = [];

  if (!isRecord(manifest)) {
    return ["signed evidence manifest must be an object"];
  }

  if (manifest.packet_checker !== "scripts/check-gate0-signed-evidence-packets.mjs") {
    errors.push("manifest.packet_checker must be scripts/check-gate0-signed-evidence-packets.mjs");
  }

  if (
    manifest.packet_fixture_checker !==
    "scripts/check-gate0-signed-evidence-packet-fixtures.mjs"
  ) {
    errors.push(
      "manifest.packet_fixture_checker must be scripts/check-gate0-signed-evidence-packet-fixtures.mjs"
    );
  }

  if (manifest.handoff_checker !== "scripts/check-gate0-signed-evidence-handoff.mjs") {
    errors.push("manifest.handoff_checker must be scripts/check-gate0-signed-evidence-handoff.mjs");
  }

  if (manifest.packet_directory !== "deploy/governance/gate0-signed-evidence-packets") {
    errors.push("manifest.packet_directory must be deploy/governance/gate0-signed-evidence-packets");
  }

  if (manifest.packet_file_pattern !== "<packet_id>.evidence.json") {
    errors.push("manifest.packet_file_pattern must be <packet_id>.evidence.json");
  }

  if (
    !manifest.completion_policy?.packet_checker_allows_empty_directory_until_external_evidence_arrives
  ) {
    errors.push("completion_policy must allow an empty packet directory until external evidence arrives");
  }

  if (!manifest.completion_policy?.packet_fixture_checker_reuses_packet_validator) {
    errors.push("completion_policy must require packet fixtures to reuse the packet validator");
  }

  const scripts = packageJson?.scripts ?? {};
  if (
    scripts["check:gate0-signed-evidence-packets"] !==
    "node scripts/check-gate0-signed-evidence-packets.mjs"
  ) {
    errors.push("package.json check:gate0-signed-evidence-packets script is missing");
  }
  if (
    scripts["check:gate0-signed-evidence-packet-fixtures"] !==
    "node scripts/check-gate0-signed-evidence-packet-fixtures.mjs"
  ) {
    errors.push("package.json check:gate0-signed-evidence-packet-fixtures script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:gate0-signed-evidence-packets")) {
    errors.push("root check must include check:gate0-signed-evidence-packets");
  }
  if (!String(scripts.check ?? "").includes("npm run check:gate0-signed-evidence-packet-fixtures")) {
    errors.push("root check must include check:gate0-signed-evidence-packet-fixtures");
  }

  if (!packetDirectoryExists) {
    errors.push(`packet directory missing ${manifest.packet_directory}`);
    return errors;
  }

  const requiredPackets = new Map((manifest.required_packets ?? []).map((packet) => [packet.id, packet]));
  const seen = new Set();

  for (const id of requiredPacketIds) {
    if (!requiredPackets.has(id)) {
      errors.push(`manifest missing required packet ${id}`);
    }
  }

  for (const file of packetFiles) {
    const packet = file.packet;
    errors.push(...validatePacket({ file, packet, requiredPackets }));

    if (isRecord(packet) && typeof packet.id === "string") {
      if (seen.has(packet.id)) {
        errors.push(`duplicate signed evidence packet ${packet.id}`);
      }
      seen.add(packet.id);
    }
  }

  return errors;
}

function validatePacket({ file, packet, requiredPackets }) {
  if (!isRecord(packet)) {
    return [`${file.relative}: packet must be an object`];
  }

  const errors = [];
  const actualFields = Object.keys(packet).sort();

  for (const field of expectedPacketFields) {
    if (!actualFields.includes(field)) {
      errors.push(`${file.relative}: missing field ${field}`);
    }
  }

  for (const field of actualFields) {
    if (!expectedPacketFields.includes(field)) {
      errors.push(`${file.relative}: unexpected field ${field}`);
    }
  }

  if (!requiredPacketIds.includes(packet.id)) {
    errors.push(`${file.relative}: id is unexpected`);
    return [...errors, ...validateForbiddenKeys(packet, file.relative), ...validateNoSecrets(packet, file.relative)];
  }

  const expectedFileName = `${packet.id}.evidence.json`;
  if (basename(file.path) !== expectedFileName) {
    errors.push(`${file.relative}: filename must be ${expectedFileName}`);
  }

  const manifestPacket = requiredPackets.get(packet.id);
  if (manifestPacket) {
    expectArrayEqual(
      errors,
      packet.required_approver_roles,
      manifestPacket.required_approver_roles,
      `${file.relative}: required_approver_roles`
    );
    expectArrayEqual(
      errors,
      packet.acceptance_checks,
      manifestPacket.acceptance_checks,
      `${file.relative}: acceptance_checks`
    );
  }

  if (!allowedStatuses.has(packet.status)) {
    errors.push(`${file.relative}: status must be missing, submitted, accepted, rejected, or superseded`);
  }

  if (packet.blocks_sprint0_1_checkbox !== true) {
    errors.push(`${file.relative}: blocks_sprint0_1_checkbox must be true`);
  }

  if (!Array.isArray(packet.evidence_refs)) {
    errors.push(`${file.relative}: evidence_refs must be an array`);
  } else {
    if (packet.status === "accepted" && packet.evidence_refs.length === 0) {
      errors.push(`${file.relative}: accepted packet must include evidence_refs`);
    }

    if (["missing", "superseded"].includes(packet.status) && packet.evidence_refs.length !== 0) {
      errors.push(`${file.relative}: ${packet.status} packet must not retain active evidence_refs`);
    }

    for (const [index, ref] of packet.evidence_refs.entries()) {
      errors.push(...validateEvidenceRef(ref, packet, index, file.relative));
    }
  }

  errors.push(...validateForbiddenKeys(packet, file.relative));
  errors.push(...validateNoSecrets(packet, file.relative));

  return errors;
}

function validateEvidenceRef(ref, packet, index, label) {
  if (!isRecord(ref)) {
    return [`${label}: evidence_refs[${index}] must be an object`];
  }

  const errors = [];
  const actualFields = Object.keys(ref).sort();

  for (const field of evidenceRefFields) {
    if (!actualFields.includes(field)) {
      errors.push(`${label}: evidence_refs[${index}] missing field ${field}`);
    }
  }

  for (const field of actualFields) {
    if (!evidenceRefFields.includes(field)) {
      errors.push(`${label}: evidence_refs[${index}] unexpected field ${field}`);
    }
  }

  for (const field of ["source_locator", "approver", "approval_status", "redaction_status"]) {
    if (typeof ref[field] !== "string" || ref[field].trim().length === 0) {
      errors.push(`${label}: evidence_refs[${index}].${field} must be a non-empty string`);
    }
  }

  if (!hexSha256Pattern.test(String(ref.sha256 ?? ""))) {
    errors.push(`${label}: evidence_refs[${index}].sha256 must be a hex sha256`);
  }

  if (!isoDatePattern.test(String(ref.signed_at ?? ""))) {
    errors.push(`${label}: evidence_refs[${index}].signed_at must be YYYY-MM-DD`);
  }

  if (!allowedApprovalStatuses.has(ref.approval_status)) {
    errors.push(`${label}: evidence_refs[${index}].approval_status must be accepted, rejected, or superseded`);
  }

  if (ref.approval_status !== packet.status && packet.status !== "submitted") {
    errors.push(`${label}: evidence_refs[${index}].approval_status must match packet status`);
  }

  if (ref.redaction_status !== "redacted_no_secrets") {
    errors.push(`${label}: evidence_refs[${index}].redaction_status must be redacted_no_secrets`);
  }

  return errors;
}

function validateForbiddenKeys(value, label, path = []) {
  const errors = [];

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      errors.push(...validateForbiddenKeys(item, label, [...path, String(index)]));
    }
    return errors;
  }

  if (!isRecord(value)) {
    return errors;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenFieldKeys.has(key.toLowerCase())) {
      errors.push(`${label}: forbidden field key ${[...path, key].join(".")}`);
    }
    errors.push(...validateForbiddenKeys(nested, label, [...path, key]));
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
  const result = validateGate0SignedEvidencePackets({
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

function deriveGate0SignedEvidencePacketStatus(packetFileCount, packetStatuses, allRequiredAccepted) {
  if (packetFileCount === 0) {
    return "awaiting_external_signed_evidence_packets";
  }

  if (allRequiredAccepted) {
    return "ready_for_manifest_update";
  }

  if (packetStatuses.some((status) => status === "rejected" || status === "superseded")) {
    return "signed_evidence_packets_include_blockers";
  }

  if (packetStatuses.some((status) => status === "missing")) {
    return "signed_evidence_packets_missing";
  }

  return "partial_signed_evidence_packets";
}

function expectArrayEqual(errors, actual, expected, label) {
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    errors.push(`${label} must be an array`);
    return;
  }

  if (actual.length !== expected.length) {
    errors.push(`${label} expected ${expected.length} entries but received ${actual.length}`);
  }

  for (const [index, expectedValue] of expected.entries()) {
    if (actual[index] !== expectedValue) {
      errors.push(`${label}[${index}] mismatch`);
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
