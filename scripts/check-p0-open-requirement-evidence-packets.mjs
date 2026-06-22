#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const contractPath = "deploy/governance/p0-open-requirement-evidence-handoff.contract.json";
const openRequirementAuditPath = "deploy/governance/p0-open-requirement-audit.contract.json";
const packagePath = "package.json";
const sha256Pattern = /^sha256:[a-f0-9]{64}$/u;
const labelPattern = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,191}$/u;
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
  deriveP0OpenRequirementEvidencePacketStatus,
  validateP0OpenRequirementEvidencePackets
};

function runCli() {
  const contract = readJson(contractPath);
  const packageJson = readJson(packagePath);
  const openRequirementAudit = readJson(openRequirementAuditPath);
  const packetDirectory = contract.packet_directory;
  const packetDirectoryExists =
    typeof packetDirectory === "string" && existsSync(resolve(process.cwd(), packetDirectory));
  const packetFiles = packetDirectoryExists ? listPacketFiles(packetDirectory) : [];
  const result = validateP0OpenRequirementEvidencePackets({
    contract,
    openRequirementAudit,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });

  emit(result, result.errors.length > 0 ? 1 : 0);
}

function validateP0OpenRequirementEvidencePackets({
  contract,
  openRequirementAudit,
  packageJson,
  packetDirectoryExists = true,
  packetFiles = []
}) {
  const errors = validatePacketSurface({
    contract,
    openRequirementAudit,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });
  const packets = packetFiles.map((file) => file.packet);
  const allRequiredAccepted =
    errors.length === 0 &&
    contract.required_requirement_codes.every((code) =>
      packets.some(
        (packet) =>
          isRecord(packet) &&
          packet.requirement_code === code &&
          packet.status === "accepted"
      )
    ) &&
    packets.length === contract.required_requirement_codes.length;

  return {
    all_required_accepted: allRequiredAccepted,
    errors,
    packet_files: packetFiles.length,
    packet_statuses: Object.fromEntries(
      packets
        .filter((packet) => isRecord(packet) && typeof packet.requirement_code === "string")
        .map((packet) => [packet.requirement_code, packet.status])
    ),
    status:
      errors.length > 0
        ? "invalid_p0_open_requirement_evidence_packets"
        : deriveP0OpenRequirementEvidencePacketStatus({
            allRequiredAccepted,
            packetCount: packetFiles.length,
            statuses: packets.map((packet) => (isRecord(packet) ? packet.status : undefined))
          })
  };
}

function validatePacketSurface({
  contract,
  openRequirementAudit,
  packageJson,
  packetDirectoryExists,
  packetFiles
}) {
  const errors = [];

  if (!isRecord(contract)) {
    return ["P0 open requirement evidence handoff contract must be an object"];
  }

  expectEqual(errors, contract.packet_checker, "scripts/check-p0-open-requirement-evidence-packets.mjs", "packet_checker");
  expectEqual(errors, contract.packet_directory, "deploy/governance/p0-open-requirement-evidence-packets", "packet_directory");
  expectEqual(errors, contract.packet_file_pattern, "<requirement_code>.evidence.json", "packet_file_pattern");
  expectArray(errors, contract.required_requirement_codes, ["AGT-01", "AGT-07", "MCP-09"], "required_requirement_codes");
  expectEqual(errors, contract.all_required_packets_accepted, false, "all_required_packets_accepted");
  expectEqual(errors, contract.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, contract.hash_only_evidence, true, "hash_only_evidence");
  expectEqual(errors, contract.min_artifact_hashes_per_accepted_packet, 3, "min_artifact_hashes_per_accepted_packet");

  const scripts = packageJson?.scripts ?? {};
  if (
    scripts["check:p0-open-requirement-evidence-packets"] !==
    "node scripts/check-p0-open-requirement-evidence-packets.mjs"
  ) {
    errors.push("package.json check:p0-open-requirement-evidence-packets script is missing");
  }
  if (
    typeof scripts.check !== "string" ||
    !scripts.check.includes("npm run check:p0-open-requirement-evidence-packets")
  ) {
    errors.push("root check must include check:p0-open-requirement-evidence-packets");
  }

  const auditCodes = (openRequirementAudit?.guarded_open_requirements ?? []).map((item) => item.code);
  expectArray(errors, auditCodes, contract.required_requirement_codes, "openRequirementAudit.guarded_open_requirements.code");

  if (!packetDirectoryExists) {
    errors.push(`packet directory missing ${contract.packet_directory}`);
    return errors;
  }

  const requirements = new Map(
    (contract.required_requirements ?? []).map((requirement) => [
      requirement.requirement_code,
      requirement
    ])
  );
  const seen = new Set();

  for (const file of packetFiles) {
    const packet = file.packet;
    errors.push(
      ...validatePacket({
        contract,
        file,
        packet,
        requirement: isRecord(packet) ? requirements.get(packet.requirement_code) : undefined
      })
    );

    if (isRecord(packet) && typeof packet.requirement_code === "string") {
      if (seen.has(packet.requirement_code)) {
        errors.push(`duplicate requirement evidence packet ${packet.requirement_code}`);
      }
      seen.add(packet.requirement_code);
    }
  }

  return errors;
}

function validatePacket({ contract, file, packet, requirement }) {
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

  for (const field of contract.forbidden_fields ?? []) {
    if (actualFields.includes(field)) {
      errors.push(`${file.relative}: forbidden field ${field}`);
    }
  }

  const expectedBasename =
    typeof packet.requirement_code === "string"
      ? `${packet.requirement_code}.evidence.json`
      : null;
  if (expectedBasename !== null && basename(file.relative) !== expectedBasename) {
    errors.push(`${file.relative}: filename must be ${expectedBasename}`);
  }

  if (!contract.required_requirement_codes.includes(packet.requirement_code)) {
    errors.push(`${file.relative}: requirement_code must be one of ${contract.required_requirement_codes.join(", ")}`);
  }
  if (!requirement) {
    errors.push(`${file.relative}: requirement_code not listed in required_requirements`);
  }
  if (!contract.allowed_statuses.includes(packet.status)) {
    errors.push(`${file.relative}: invalid status ${JSON.stringify(packet.status)}`);
  }
  if (!contract.allowed_redaction_statuses.includes(packet.redaction_status)) {
    errors.push(`${file.relative}: invalid redaction_status ${JSON.stringify(packet.redaction_status)}`);
  }

  if (!isIsoString(packet.observed_at)) {
    errors.push(`${file.relative}: observed_at must be ISO-8601`);
  }
  if (!isLabel(packet.operator)) {
    errors.push(`${file.relative}: operator must be a redacted label`);
  }
  if (!isLabel(packet.source_locator)) {
    errors.push(`${file.relative}: source_locator must be a redacted locator label`);
  }

  if (!Array.isArray(packet.artifact_hashes)) {
    errors.push(`${file.relative}: artifact_hashes must be an array`);
  } else {
    for (const [index, hash] of packet.artifact_hashes.entries()) {
      if (!isSha256(hash)) {
        errors.push(`${file.relative}: artifact_hashes[${index}] must be a sha256 hash`);
      }
    }
  }

  if (!Array.isArray(packet.missing_evidence)) {
    errors.push(`${file.relative}: missing_evidence must be an array`);
  } else {
    const allowedMissing = new Set(requirement?.required_evidence ?? []);
    for (const item of packet.missing_evidence) {
      if (!allowedMissing.has(item)) {
        errors.push(`${file.relative}: unexpected missing_evidence ${JSON.stringify(item)}`);
      }
    }
  }

  for (const field of contract.required_hash_fields ?? []) {
    const value = packet[field];
    if (value !== null && !isSha256(value)) {
      errors.push(`${file.relative}: ${field} must be null or sha256 hash`);
    }
  }

  if (packet.status === "accepted") {
    if (packet.redaction_status !== "redacted_no_secrets") {
      errors.push(`${file.relative}: accepted packet must have redaction_status redacted_no_secrets`);
    }
    if (packet.artifact_hashes.length < contract.min_artifact_hashes_per_accepted_packet) {
      errors.push(`${file.relative}: accepted packet must include at least ${contract.min_artifact_hashes_per_accepted_packet} artifact hashes`);
    }
    if (packet.missing_evidence.length !== 0) {
      errors.push(`${file.relative}: accepted packet must have no missing_evidence`);
    }
    for (const field of contract.required_hash_fields ?? []) {
      if (!isSha256(packet[field])) {
        errors.push(`${file.relative}: accepted packet requires ${field}`);
      }
    }
  }

  if (packet.status === "missing_external_evidence") {
    if (packet.redaction_status !== "missing") {
      errors.push(`${file.relative}: missing packet must have redaction_status missing`);
    }
    if (packet.artifact_hashes.length !== 0) {
      errors.push(`${file.relative}: missing packet must not include artifact hashes`);
    }
    if (packet.missing_evidence.length === 0) {
      errors.push(`${file.relative}: missing packet must list missing_evidence`);
    }
    for (const field of contract.required_hash_fields ?? []) {
      if (packet[field] !== null) {
        errors.push(`${file.relative}: missing packet ${field} must be null`);
      }
    }
  }

  errors.push(...validateNoForbiddenText(file.relative, packet, contract.forbidden_fields ?? []));

  return errors;
}

function deriveP0OpenRequirementEvidencePacketStatus({ allRequiredAccepted, packetCount, statuses }) {
  if (allRequiredAccepted) {
    return "all_required_p0_requirement_evidence_accepted";
  }
  if (packetCount === 0) {
    return "awaiting_p0_requirement_evidence_packets";
  }
  if (statuses.includes("needs_redaction")) {
    return "p0_requirement_evidence_needs_redaction";
  }
  if (statuses.includes("rejected")) {
    return "p0_requirement_evidence_rejected";
  }
  return "p0_requirement_evidence_incomplete";
}

function listPacketFiles(directory) {
  return readdirSync(resolve(process.cwd(), directory))
    .filter((file) => file.endsWith(".evidence.json"))
    .sort()
    .map((file) => {
      const relative = join(directory, file);

      return {
        packet: readJson(relative),
        relative
      };
    });
}

function validateNoForbiddenText(relative, value, forbiddenFields, path = "$") {
  const errors = [];

  if (typeof value === "string") {
    for (const pattern of forbiddenTextPatterns) {
      if (pattern.test(value)) {
        errors.push(`${relative}: ${path} contains a forbidden secret-like value`);
      }
    }
    return errors;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      errors.push(...validateNoForbiddenText(relative, item, forbiddenFields, `${path}[${index}]`));
    });
    return errors;
  }

  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenFields.includes(key)) {
        errors.push(`${relative}: ${path}.${key} is a forbidden field`);
      }
      errors.push(...validateNoForbiddenText(relative, child, forbiddenFields, `${path}.${key}`));
    }
  }

  return errors;
}

function isSha256(value) {
  return typeof value === "string" && sha256Pattern.test(value);
}

function isIsoString(value) {
  if (typeof value !== "string") {
    return false;
  }
  const time = Date.parse(value);

  return Number.isFinite(time) && value.includes("T") && value.endsWith("Z");
}

function isLabel(value) {
  return typeof value === "string" && labelPattern.test(value);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (actual.length !== expected.length) {
    errors.push(`${path} expected ${expected.length} items but received ${actual.length}`);
    return;
  }

  expected.forEach((value, index) => {
    if (actual[index] !== value) {
      errors.push(`${path}[${index}] expected ${JSON.stringify(value)} but received ${JSON.stringify(actual[index])}`);
    }
  });
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

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
