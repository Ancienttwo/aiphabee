#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const manifestPath = "deploy/governance/phase3-security-load-dr-release-evidence-manifest.contract.json";
const packagePath = "package.json";
const allowedStatuses = new Set(["missing", "accepted", "rejected", "needs_redaction"]);
const requiredGateIds = [
  "compliance_legal_security_signoff",
  "live_kill_switch_incident_audit_evidence",
  "live_performance_availability_slo_evidence",
  "live_load_test_artifact",
  "live_dr_restore_failover_rollback_evidence",
  "live_incident_status_comms_drill_evidence",
  "ops_sre_product_release_signoff"
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
  derivePhase3SecurityLoadDrReleaseEvidencePacketStatus,
  validatePhase3SecurityLoadDrReleaseEvidencePackets
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
  const result = validatePhase3SecurityLoadDrReleaseEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });

  if (result.errors.length > 0) {
    emit({ errors: result.errors, status: result.status }, 1);
  }

  emit(result, 0);
}

function validatePhase3SecurityLoadDrReleaseEvidencePackets({
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
        : derivePhase3SecurityLoadDrReleaseEvidencePacketStatus(
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
    "scripts/check-phase3-security-load-dr-release-evidence-packets.mjs"
  ) {
    errors.push("manifest.packet_checker must be scripts/check-phase3-security-load-dr-release-evidence-packets.mjs");
  }
  if (manifest.packet_directory !== "deploy/governance/phase3-security-load-dr-release-evidence-packets") {
    errors.push("manifest.packet_directory must be deploy/governance/phase3-security-load-dr-release-evidence-packets");
  }
  if (manifest.packet_file_pattern !== "<gate_id>.evidence.json") {
    errors.push("manifest.packet_file_pattern must be <gate_id>.evidence.json");
  }
  if (!manifest.evidence_policy?.packet_checker_allows_empty_directory_until_external_evidence_arrives) {
    errors.push("evidence policy must allow an empty packet directory until external evidence arrives");
  }

  const scripts = packageJson?.scripts ?? {};
  if (
    scripts["check:phase3-security-load-dr-release-evidence-packets"] !==
    "node scripts/check-phase3-security-load-dr-release-evidence-packets.mjs"
  ) {
    errors.push("package.json check:phase3-security-load-dr-release-evidence-packets script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:phase3-security-load-dr-release-evidence-packets")) {
    errors.push("root check must include check:phase3-security-load-dr-release-evidence-packets");
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

  validateHashOnlyRefs(errors, file.relative, packet);
  validatePacketDecisionFields(errors, file.relative, packet);

  for (const field of forbiddenFields ?? []) {
    if (Object.prototype.hasOwnProperty.call(packet, field)) {
      errors.push(`${file.relative}: forbidden raw field ${field}`);
    }
  }

  const serialized = JSON.stringify(packet);
  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`${file.relative}: contains forbidden secret-like pattern ${pattern.source}`);
    }
  }

  return errors;
}

function validateHashOnlyRefs(errors, relative, packet) {
  if (!Array.isArray(packet.evidence_refs) || packet.evidence_refs.some((ref) => typeof ref !== "string")) {
    errors.push(`${relative}: evidence_refs must be a string array`);
    return;
  }
  if (packet.status === "accepted" && packet.evidence_refs.length === 0) {
    errors.push(`${relative}: accepted packet must include hash-only evidence_refs`);
  }
  if (packet.status === "missing" && packet.evidence_refs.length !== 0) {
    errors.push(`${relative}: missing packet must keep evidence_refs empty`);
  }
  for (const ref of packet.evidence_refs) {
    if (!sha256Pattern.test(ref)) {
      errors.push(`${relative}: evidence_refs must be sha256-only`);
    }
  }
}

function validatePacketDecisionFields(errors, relative, packet) {
  if (packet.status === "accepted" && !sha256Pattern.test(String(packet.evidence_sha256))) {
    errors.push(`${relative}: accepted packet must include sha256 evidence_sha256`);
  }
  if (packet.status === "missing" && packet.evidence_sha256 !== null) {
    errors.push(`${relative}: missing packet must keep evidence_sha256 null`);
  }
  if (packet.status === "accepted" && !isoDatePattern.test(String(packet.signed_at))) {
    errors.push(`${relative}: accepted packet must include signed_at YYYY-MM-DD`);
  }
  if (packet.status === "missing" && packet.signed_at !== null) {
    errors.push(`${relative}: missing packet must keep signed_at null`);
  }
  if (packet.status === "accepted" && typeof packet.approver_role !== "string") {
    errors.push(`${relative}: accepted packet must include approver_role`);
  }
  if (packet.status === "missing" && packet.approver_role !== null) {
    errors.push(`${relative}: missing packet must keep approver_role null`);
  }
  if (packet.status === "accepted" && packet.redaction_status !== "redacted_no_secrets") {
    errors.push(`${relative}: accepted packet must be redacted_no_secrets`);
  }
}

function derivePhase3SecurityLoadDrReleaseEvidencePacketStatus(packetCount, statuses, allRequiredAccepted) {
  if (allRequiredAccepted) {
    return "all_required_phase3_security_load_dr_release_evidence_accepted";
  }
  if (packetCount === 0) {
    return "awaiting_external_evidence_packets";
  }
  if (statuses.includes("needs_redaction")) {
    return "evidence_packets_need_redaction";
  }
  return "phase3_security_load_dr_release_evidence_incomplete";
}

function listPacketFiles(directory) {
  return readdirSync(resolve(process.cwd(), directory))
    .filter((name) => name.endsWith(".evidence.json"))
    .sort()
    .map((name) => ({
      path: resolve(process.cwd(), directory, name),
      relative: join(directory, name)
    }));
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function isIsoInstant(value) {
  if (typeof value !== "string") {
    return false;
  }
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) && value.includes("T");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMainModule() {
  return fileURLToPath(import.meta.url) === process.argv[1];
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
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_text"
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
