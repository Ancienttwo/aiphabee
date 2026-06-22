#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const manifestPath = "deploy/governance/sprint2-4-live-operations-evidence-manifest.contract.json";
const packagePath = "package.json";
const allowedStatuses = new Set(["missing", "accepted", "rejected", "needs_redaction"]);
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

export {
  deriveSprint24LiveOperationsEvidencePacketStatus,
  validateSprint24LiveOperationsEvidencePackets
};

function runCli() {
  const manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);
  const packetDirectoryExists = existsSync(resolve(process.cwd(), manifest.packet_directory ?? ""));
  const packetFiles = packetDirectoryExists
    ? listPacketFiles(manifest.packet_directory).map((file) => ({
        ...file,
        packet: readJson(file.path)
      }))
    : [];
  const result = validateSprint24LiveOperationsEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });

  if (result.errors.length > 0) {
    emit(
      {
        errors: result.errors,
        status: result.status
      },
      1
    );
  }

  emit(result, 0);
}

function validateSprint24LiveOperationsEvidencePackets({
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
        : deriveSprint24LiveOperationsEvidencePacketStatus(
            packetFiles.length,
            packetStatuses,
            allRequiredAccepted
          )
  };
}

function validatePacketSurface({ manifest, packageJson, packetDirectoryExists, packetFiles }) {
  const errors = [];

  if (!isRecord(manifest)) {
    return ["evidence manifest must be an object"];
  }

  if (
    manifest.packet_checker !==
    "scripts/check-sprint2-4-live-operations-evidence-packets.mjs"
  ) {
    errors.push("manifest.packet_checker must be scripts/check-sprint2-4-live-operations-evidence-packets.mjs");
  }
  if (
    manifest.packet_fixture_checker !==
    "scripts/check-sprint2-4-live-operations-evidence-packet-fixtures.mjs"
  ) {
    errors.push("manifest.packet_fixture_checker must be scripts/check-sprint2-4-live-operations-evidence-packet-fixtures.mjs");
  }
  if (
    manifest.handoff_checker !==
    "scripts/check-sprint2-4-live-operations-evidence-handoff.mjs"
  ) {
    errors.push("manifest.handoff_checker must be scripts/check-sprint2-4-live-operations-evidence-handoff.mjs");
  }
  if (manifest.packet_directory !== "deploy/governance/sprint2-4-live-operations-evidence-packets") {
    errors.push("manifest.packet_directory must be deploy/governance/sprint2-4-live-operations-evidence-packets");
  }
  if (manifest.packet_file_pattern !== "<gate_id>.evidence.json") {
    errors.push("manifest.packet_file_pattern must be <gate_id>.evidence.json");
  }
  if (!manifest.evidence_policy?.packet_checker_allows_empty_directory_until_external_evidence_arrives) {
    errors.push("evidence policy must allow an empty packet directory until external evidence arrives");
  }

  const scripts = packageJson?.scripts ?? {};
  if (
    scripts["check:sprint2-4-live-operations-evidence-packets"] !==
    "node scripts/check-sprint2-4-live-operations-evidence-packets.mjs"
  ) {
    errors.push("package.json check:sprint2-4-live-operations-evidence-packets script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:sprint2-4-live-operations-evidence-packets")) {
    errors.push("root check must include check:sprint2-4-live-operations-evidence-packets");
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
    expectArray(errors, packet.required_evidence, gate.required_evidence, `${file.relative}: required_evidence`);
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

function deriveSprint24LiveOperationsEvidencePacketStatus(packetCount, packetStatuses, allRequiredAccepted) {
  if (allRequiredAccepted) {
    return "all_required_evidence_accepted";
  }
  if (packetCount === 0) {
    return "awaiting_external_evidence_packets";
  }
  if (packetStatuses.includes("needs_redaction") || packetStatuses.includes("rejected")) {
    return "evidence_packets_need_attention";
  }
  return "evidence_packets_incomplete";
}

function listPacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".evidence.json"))
    .map((entry) => ({
      path: join(directory, entry.name),
      relative: join(directory, entry.name)
    }));
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

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual)) {
    errors.push(`${path} must be an array`);
    return;
  }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function isIsoInstant(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMainModule() {
  return fileURLToPath(import.meta.url) === process.argv[1];
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
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

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;

  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
