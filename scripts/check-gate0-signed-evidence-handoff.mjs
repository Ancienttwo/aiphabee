#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { validateManifest } from "./check-gate0-signed-evidence-manifest-contract.mjs";

const manifestPath = "deploy/governance/gate0-signed-evidence-manifest.contract.json";
const intakePath = "deploy/governance/gate0-external-evidence-intake.contract.json";
const packageJsonPath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const readmePath = "deploy/governance/gate0-signed-evidence-templates/README.md";
const packetReadmePath = "deploy/governance/gate0-signed-evidence-packets/README.md";
const requiredAcceptanceCommands = [
  "npm run check:gate0-signed-evidence-packets",
  "npm run check:gate0-signed-evidence-packet-fixtures",
  "npm run check:gate0-signed-evidence-handoff",
  "npm run check:gate0-signed-evidence-manifest",
  "npm run check:gate0-signed-evidence-manifest-fixtures",
  "npm run check:gate0-signed-evidence-transition-review",
  "npm run check:gate0-signed-evidence-transition-review-fixtures",
  "npm run check:sprint-completion-audit",
  "npm run check:sprint-exit-gate-transition-review"
];
const requiredForbiddenPayloads = [
  "raw_legal_memo",
  "raw_contract",
  "raw_document",
  "raw_vendor_document",
  "raw_payload",
  "raw_response",
  "raw_output",
  "raw_text",
  "raw_content",
  "authorization",
  "api_key",
  "token",
  "secret",
  "password",
  "database_url",
  "connection_string",
  "account_id",
  "workspace_id",
  "env_value",
  "unredacted_source_payload"
];

const manifest = readJson(manifestPath);
const intake = readJson(intakePath);
const packageJson = readJson(packageJsonPath);
const tracker = readText(trackerPath);
const readme = readText(readmePath);
const packetReadme = readText(packetReadmePath);
const templateDirectory = manifest.template_directory;
const templateDirectoryExists =
  typeof templateDirectory === "string" && existsSync(resolve(process.cwd(), templateDirectory));
const templateFiles = templateDirectoryExists ? listTemplatePacketFiles(templateDirectory) : [];
const packetDirectory = manifest.packet_directory;
const packetDirectoryExists =
  typeof packetDirectory === "string" && existsSync(resolve(process.cwd(), packetDirectory));
const errors = validateHandoff({
  intake,
  manifest,
  packageJson,
  packetDirectoryExists,
  packetReadme,
  readme,
  templateDirectoryExists,
  templateFiles,
  tracker
});

if (errors.length > 0) {
  emit(
    {
      errors,
      path: manifest.template_directory,
      status: "invalid_gate0_signed_evidence_handoff"
    },
    1
  );
}

emit(
  {
    status: "ok",
    template_status: "gate0_signed_evidence_packets_missing",
    templates: templateFiles.length
  },
  0
);

function validateHandoff({
  intake,
  manifest: value,
  packageJson,
  packetDirectoryExists,
  packetReadme,
  readme,
  templateDirectoryExists,
  templateFiles,
  tracker
}) {
  const errors = [];

  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }

  if (value.handoff_checker !== "scripts/check-gate0-signed-evidence-handoff.mjs") {
    errors.push("manifest.handoff_checker must be scripts/check-gate0-signed-evidence-handoff.mjs");
  }
  if (value.template_directory !== "deploy/governance/gate0-signed-evidence-templates") {
    errors.push("manifest.template_directory must be deploy/governance/gate0-signed-evidence-templates");
  }
  if (value.template_file_pattern !== "<packet_id>.evidence.json") {
    errors.push("manifest.template_file_pattern must be <packet_id>.evidence.json");
  }
  if (value.packet_checker !== "scripts/check-gate0-signed-evidence-packets.mjs") {
    errors.push("manifest.packet_checker must be scripts/check-gate0-signed-evidence-packets.mjs");
  }
  if (
    value.packet_fixture_checker !==
    "scripts/check-gate0-signed-evidence-packet-fixtures.mjs"
  ) {
    errors.push(
      "manifest.packet_fixture_checker must be scripts/check-gate0-signed-evidence-packet-fixtures.mjs"
    );
  }
  if (value.packet_directory !== "deploy/governance/gate0-signed-evidence-packets") {
    errors.push("manifest.packet_directory must be deploy/governance/gate0-signed-evidence-packets");
  }
  if (value.packet_file_pattern !== "<packet_id>.evidence.json") {
    errors.push("manifest.packet_file_pattern must be <packet_id>.evidence.json");
  }
  if (!value.completion_policy?.operator_handoff_templates_validate_as_missing_packets) {
    errors.push("completion_policy must require templates to validate as missing packets");
  }
  if (!value.completion_policy?.operator_handoff_readme_lists_packet_order) {
    errors.push("completion_policy must require README packet order");
  }
  if (!value.completion_policy?.packet_checker_allows_empty_directory_until_external_evidence_arrives) {
    errors.push("completion_policy must allow packet checker empty directory until external evidence arrives");
  }
  if (!value.completion_policy?.packet_fixture_checker_reuses_packet_validator) {
    errors.push("completion_policy must require packet fixture checker to reuse packet validator");
  }

  validateIntakeReadiness(errors, value);

  const scripts = packageJson?.scripts ?? {};
  if (scripts["check:gate0-signed-evidence-handoff"] !== "node scripts/check-gate0-signed-evidence-handoff.mjs") {
    errors.push("package.json check:gate0-signed-evidence-handoff script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:gate0-signed-evidence-handoff")) {
    errors.push("root check must include check:gate0-signed-evidence-handoff");
  }
  if (scripts["check:gate0-signed-evidence-packets"] !== "node scripts/check-gate0-signed-evidence-packets.mjs") {
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
  for (const command of value.intake_readiness?.acceptance_commands ?? []) {
    const scriptName = command.replace(/^npm run /u, "");

    if (!requiredAcceptanceCommands.includes(command)) {
      errors.push(`intake readiness command is not allowed: ${command}`);
    }
    if (!scripts[scriptName]) {
      errors.push(`package.json ${scriptName} script is missing for gate0 signed evidence intake readiness`);
    }
    if (!String(scripts.check ?? "").includes(`npm run ${scriptName}`)) {
      errors.push(`root check must include ${scriptName} for gate0 signed evidence intake readiness`);
    }
  }

  if (!templateDirectoryExists) {
    errors.push(`template directory missing ${value.template_directory}`);
    return errors;
  }
  if (!packetDirectoryExists) {
    errors.push(`packet directory missing ${value.packet_directory}`);
  }

  const requiredPackets = value.required_packets ?? [];
  const requiredPacketIds = requiredPackets.map((entry) => entry.id);
  const missingTemplates = requiredPacketIds.filter(
    (id) => !templateFiles.some((file) => basename(file.path) === `${id}.evidence.json`)
  );
  const unexpectedTemplates = templateFiles.filter(
    (file) => !requiredPacketIds.includes(basename(file.path).replace(/\.evidence\.json$/u, ""))
  );

  for (const id of missingTemplates) {
    errors.push(`template missing ${id}.evidence.json`);
  }
  for (const file of unexpectedTemplates) {
    errors.push(`unexpected template ${file.relative}`);
  }

  const templateManifest = {
    ...value,
    external_approvals_complete: false,
    release_transition_allowed: false,
    required_packets: templateFiles
      .map((file) => file.packet)
      .sort((left, right) => requiredPacketIds.indexOf(left.id) - requiredPacketIds.indexOf(right.id)),
    status: "pending_external_evidence"
  };
  const validation = validateManifest({
    intake,
    manifest: templateManifest,
    packageJson,
    tracker
  });

  errors.push(...validation.map((error) => `template manifest invalid: ${error}`));

  const requiredPacketMap = new Map(requiredPackets.map((packet) => [packet.id, packet]));
  for (const file of templateFiles) {
    const packet = file.packet;

    if (!isRecord(packet)) {
      errors.push(`${file.relative}: template packet must be an object`);
      continue;
    }

    const requiredPacket = requiredPacketMap.get(packet.id);
    if (!requiredPacket) {
      continue;
    }

    if (packet.status !== "missing") {
      errors.push(`${file.relative}: template status must be missing`);
    }
    if (!Array.isArray(packet.evidence_refs) || packet.evidence_refs.length !== 0) {
      errors.push(`${file.relative}: template evidence_refs must be empty`);
    }
    if (packet.blocks_sprint0_1_checkbox !== true) {
      errors.push(`${file.relative}: template blocks_sprint0_1_checkbox must be true`);
    }
    errors.push(
      ...expectArrayEqual(
        packet.required_approver_roles,
        requiredPacket.required_approver_roles,
        `${file.relative}.required_approver_roles`
      )
    );
    errors.push(
      ...expectArrayEqual(
        packet.acceptance_checks,
        requiredPacket.acceptance_checks,
        `${file.relative}.acceptance_checks`
      )
    );
  }

  for (const packet of requiredPackets) {
    if (!readme.includes(packet.id)) {
      errors.push(`handoff README must mention ${packet.id}`);
    }
    for (const check of packet.acceptance_checks ?? []) {
      if (!readme.includes(check)) {
        errors.push(`handoff README must mention ${check}`);
      }
    }
  }

  const handoffText = `${readme}\n${packetReadme}`;
  for (const text of [
    "npm run check:gate0-signed-evidence-handoff",
    "npm run check:gate0-signed-evidence-manifest",
    "npm run check:gate0-signed-evidence-manifest-fixtures",
    "npm run check:gate0-signed-evidence-packets",
    "npm run check:gate0-signed-evidence-packet-fixtures",
    "npm run check:gate0-signed-evidence-transition-review",
    "npm run check:gate0-signed-evidence-transition-review-fixtures",
    "deploy/governance/gate0-signed-evidence-packets",
    "DEFAULT_DENY",
    "DATA_NOT_LICENSED",
    "redacted_no_secrets",
    "sha256"
  ]) {
    if (!handoffText.includes(text)) {
      errors.push(`handoff README must mention ${text}`);
    }
  }

  validatePacketReadme(errors, packetReadme, requiredPackets);

  return errors;
}

function validateIntakeReadiness(errors, value) {
  const readiness = value.intake_readiness;

  if (!isRecord(readiness)) {
    errors.push("intake_readiness must exist");
    return;
  }

  expectEqual(errors, readiness.status, "ready_for_external_packet_intake", "intake_readiness.status");
  expectEqual(errors, readiness.packet_directory_ready, true, "intake_readiness.packet_directory_ready");
  expectArray(errors, readiness.acceptance_commands, requiredAcceptanceCommands, "intake_readiness.acceptance_commands");

  if (
    typeof readiness.handoff_boundary !== "string" ||
    !readiness.handoff_boundary.includes("DEFAULT_DENY") ||
    !readiness.handoff_boundary.includes("DATA_NOT_LICENSED")
  ) {
    errors.push("intake_readiness.handoff_boundary must mention DEFAULT_DENY and DATA_NOT_LICENSED");
  }

  for (const payload of requiredForbiddenPayloads) {
    expectIncludes(errors, readiness.forbidden_payloads, payload, `intake_readiness.forbidden_payloads.${payload}`);
  }

  const requiredPackets = Array.isArray(value.required_packets) ? value.required_packets : [];
  const requiredPacketMap = new Map(requiredPackets.map((packet) => [packet.id, packet]));

  if (!Array.isArray(readiness.required_packets) || readiness.required_packets.length !== requiredPackets.length) {
    errors.push("intake_readiness.required_packets must contain one packet contract per required Gate 0 packet");
    return;
  }

  const packetMap = new Map();
  for (const packet of readiness.required_packets) {
    if (!isRecord(packet)) {
      errors.push("intake_readiness.required_packets entries must be objects");
      continue;
    }
    packetMap.set(packet.id, packet);
  }

  for (const requiredPacket of requiredPackets) {
    const packet = packetMap.get(requiredPacket.id);

    if (!packet) {
      errors.push(`intake_readiness.required_packets missing ${requiredPacket.id}`);
      continue;
    }

    expectEqual(errors, packet.owner_kind, "external_signed_evidence", `intake_readiness.${requiredPacket.id}.owner_kind`);
    expectEqual(errors, packet.packet_file, `${requiredPacket.id}.evidence.json`, `intake_readiness.${requiredPacket.id}.packet_file`);
    expectEqual(errors, packet.template_file, `${requiredPacket.id}.evidence.json`, `intake_readiness.${requiredPacket.id}.template_file`);
    expectEqual(errors, packet.expected_packet_status, "missing", `intake_readiness.${requiredPacket.id}.expected_packet_status`);
    expectEqual(errors, packet.evidence_ref_required_status, "accepted", `intake_readiness.${requiredPacket.id}.evidence_ref_required_status`);
    expectEqual(errors, packet.evidence_ref_sha256_format, "hex_sha256", `intake_readiness.${requiredPacket.id}.evidence_ref_sha256_format`);
    expectEqual(errors, packet.blocks_sprint0_1_checkbox, true, `intake_readiness.${requiredPacket.id}.blocks_sprint0_1_checkbox`);
    expectArray(
      errors,
      packet.required_approver_roles,
      requiredPacket.required_approver_roles,
      `intake_readiness.${requiredPacket.id}.required_approver_roles`
    );
    expectArray(
      errors,
      packet.acceptance_checks,
      requiredPacket.acceptance_checks,
      `intake_readiness.${requiredPacket.id}.acceptance_checks`
    );
  }

  for (const packetId of packetMap.keys()) {
    if (!requiredPacketMap.has(packetId)) {
      errors.push(`intake_readiness.required_packets has unexpected packet ${packetId}`);
    }
  }
}

function validatePacketReadme(errors, packetReadme, requiredPackets) {
  for (const packet of requiredPackets) {
    for (const fragment of [
      packet.id,
      `${packet.id}.evidence.json`,
      ...(packet.required_approver_roles ?? []),
      ...(packet.acceptance_checks ?? [])
    ]) {
      if (!packetReadme.includes(fragment)) {
        errors.push(`packet README must mention ${fragment}`);
      }
    }
  }

  for (const fragment of [
    "Gate 0 signed evidence packet intake readiness",
    "status=accepted",
    "approval_status=accepted",
    "redaction_status=redacted_no_secrets",
    "evidence_refs",
    "hex sha256",
    "signed_at",
    "approver",
    "accepted packet alone",
    "DEFAULT_DENY",
    "DATA_NOT_LICENSED",
    ...requiredAcceptanceCommands,
    ...requiredForbiddenPayloads
  ]) {
    if (!packetReadme.includes(fragment)) {
      errors.push(`packet README missing intake readiness fragment: ${fragment}`);
    }
  }
}

function listTemplatePacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".evidence.json"))
    .map((entry) => {
      const path = join(absoluteDirectory, entry.name);

      return {
        packet: readJson(path),
        path,
        relative: join(directory, entry.name)
      };
    })
    .sort((left, right) => left.relative.localeCompare(right.relative));
}

function expectArrayEqual(actual, expected, label) {
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return [`${label} must be an array`];
  }
  if (actual.length !== expected.length) {
    return [`${label} expected ${expected.length} entries but received ${actual.length}`];
  }

  return expected.flatMap((value, index) => (actual[index] === value ? [] : [`${label}[${index}] mismatch`]));
}

function expectIncludes(errors, values, expected, label) {
  if (!Array.isArray(values) || !values.includes(expected)) {
    errors.push(`${label} must include ${expected}`);
  }
}

function expectArray(errors, actual, expected, label) {
  if (!Array.isArray(actual)) {
    errors.push(`${label} must be an array`);
    return;
  }

  if (!Array.isArray(expected)) {
    errors.push(`${label} expected reference must be an array`);
    return;
  }

  if (actual.length !== expected.length) {
    errors.push(`${label} expected ${expected.length} items but received ${actual.length}`);
    return;
  }

  expected.forEach((value, index) => {
    if (actual[index] !== value) {
      errors.push(`${label}[${index}] expected ${value} but received ${actual[index]}`);
    }
  });
}

function expectEqual(errors, actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} expected ${expected} but received ${actual}`);
  }
}

function readJson(path) {
  return JSON.parse(readText(path));
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
