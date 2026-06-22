#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const manifestPath = "deploy/governance/gate0-signed-evidence-manifest.contract.json";
const intakePath = "deploy/governance/gate0-external-evidence-intake.contract.json";
const packageJsonPath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredVersion = "2026-06-22.gate0-signed-evidence-manifest.v0";
const handoffCheckerPath = "scripts/check-gate0-signed-evidence-handoff.mjs";
const packetCheckerPath = "scripts/check-gate0-signed-evidence-packets.mjs";
const packetFixtureCheckerPath = "scripts/check-gate0-signed-evidence-packet-fixtures.mjs";
const packetDirectoryPath = "deploy/governance/gate0-signed-evidence-packets";
const packetFilePattern = "<packet_id>.evidence.json";
const templateDirectoryPath = "deploy/governance/gate0-signed-evidence-templates";
const requiredPacketIds = [
  "field_rights_matrix",
  "hkex_vendor_licensing_memo",
  "type4_product_boundary_opinion",
  "pcpd_privacy_path_assessment",
  "commercial_settlement_schedule",
  "gate0_signature_register"
];
const requiredForbiddenClaims = [
  "external_approval_complete_without_all_packets_accepted",
  "evidence_ref_without_sha256",
  "raw_legal_memo_or_contract_contents",
  "secret_or_credential_material",
  "web_rights_imply_mcp_rights",
  "unconfirmed_field_allowed"
];
const allowedPacketStatuses = ["missing", "submitted", "accepted", "rejected", "superseded"];
const hexSha256Pattern = /^[a-f0-9]{64}$/u;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

if (isMainModule()) {
  runCli();
}

export { validateManifest };

function runCli() {
  const manifest = readJson(manifestPath);
  const intake = readJson(intakePath);
  const packageJson = readJson(packageJsonPath);
  const tracker = readText(trackerPath);
  const errors = validateManifest({ intake, manifest, packageJson, tracker });

  if (errors.length > 0) {
    emit(
      {
        errors,
        path: manifestPath,
        status: "invalid_contract"
      },
      1
    );
  }

  emit(
    {
      accepted_packets: manifest.required_packets.filter((packet) => packet.status === "accepted").length,
      required_packets: manifest.required_packets.length,
      release_transition_allowed: manifest.release_transition_allowed,
      status: "ok"
    },
    0
  );
}

function validateManifest({ intake, manifest: value, packageJson, tracker }) {
  const errors = [];

  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }

  if (value.version !== requiredVersion) {
    errors.push(`version must be ${requiredVersion}`);
  }

  if (value.intake_contract !== intakePath) {
    errors.push(`intake_contract must be ${intakePath}`);
  }

  if (value.decision_pack !== "docs/governance/gate0-rights-regulatory-decision-pack.md") {
    errors.push("decision_pack must be docs/governance/gate0-rights-regulatory-decision-pack.md");
  }

  if (value.manifest_doc !== "docs/governance/gate0-signed-evidence-manifest.md") {
    errors.push("manifest_doc must be docs/governance/gate0-signed-evidence-manifest.md");
  }

  if (value.handoff_checker !== handoffCheckerPath) {
    errors.push(`handoff_checker must be ${handoffCheckerPath}`);
  }

  if (value.packet_checker !== packetCheckerPath) {
    errors.push(`packet_checker must be ${packetCheckerPath}`);
  }

  if (value.packet_fixture_checker !== packetFixtureCheckerPath) {
    errors.push(`packet_fixture_checker must be ${packetFixtureCheckerPath}`);
  }

  if (value.packet_directory !== packetDirectoryPath) {
    errors.push(`packet_directory must be ${packetDirectoryPath}`);
  }

  if (value.packet_file_pattern !== packetFilePattern) {
    errors.push(`packet_file_pattern must be ${packetFilePattern}`);
  }

  if (value.template_directory !== templateDirectoryPath) {
    errors.push(`template_directory must be ${templateDirectoryPath}`);
  }

  if (value.template_file_pattern !== packetFilePattern) {
    errors.push(`template_file_pattern must be ${packetFilePattern}`);
  }

  if (value.runtime_default !== "DEFAULT_DENY") {
    errors.push("runtime_default must be DEFAULT_DENY");
  }

  if (value.unconfirmed_runtime_error !== "DATA_NOT_LICENSED") {
    errors.push("unconfirmed_runtime_error must be DATA_NOT_LICENSED");
  }

  errors.push(...validateIntakeAlignment(intake, value));
  errors.push(...validateEvidenceRefSchema(value.evidence_ref_schema));
  errors.push(...validatePackets(value.required_packets));
  errors.push(...validateCompletionPolicy(value.completion_policy));
  errors.push(...validateForbiddenClaims(value.forbidden_claims));
  errors.push(...validateTransitionState(value));
  errors.push(
    ...validateLinkedFiles([
      value.intake_contract,
      value.decision_pack,
      value.manifest_doc,
      value.handoff_checker,
      value.packet_checker,
      value.packet_fixture_checker,
      value.packet_directory,
      value.template_directory
    ])
  );
  errors.push(...validatePackageScript(packageJson));
  errors.push(...validateTracker(tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateIntakeAlignment(intake, manifest) {
  const errors = [];
  const intakePacketIds = new Set((intake.required_evidence_packets ?? []).map((packet) => packet.id));
  const manifestPacketIds = new Set((manifest.required_packets ?? []).map((packet) => packet.id));

  for (const packetId of requiredPacketIds) {
    if (!intakePacketIds.has(packetId)) {
      errors.push(`intake contract missing packet ${packetId}`);
    }

    if (!manifestPacketIds.has(packetId)) {
      errors.push(`manifest missing packet ${packetId}`);
    }
  }

  if (intake.external_approvals_complete !== false) {
    errors.push("intake external_approvals_complete must remain false for pending manifest");
  }

  return errors;
}

function validateEvidenceRefSchema(value) {
  if (!isRecord(value)) {
    return ["evidence_ref_schema must be an object"];
  }

  const required = {
    approval_status: "accepted|rejected|superseded",
    redaction_status: "redacted_no_secrets",
    sha256: "hex_sha256_of_redacted_or_canonical_artifact",
    signed_at: "YYYY-MM-DD",
    source_locator: "redacted_file_or_external_record_id"
  };
  const errors = [];

  for (const [key, expected] of Object.entries(required)) {
    if (value[key] !== expected) {
      errors.push(`evidence_ref_schema.${key} must be ${expected}`);
    }
  }

  if (typeof value.approver !== "string" || value.approver.length === 0) {
    errors.push("evidence_ref_schema.approver must be present");
  }

  return errors;
}

function validatePackets(value) {
  if (!Array.isArray(value)) {
    return ["required_packets must be an array"];
  }

  const errors = [];
  const seen = new Set();

  if (value.length !== requiredPacketIds.length) {
    errors.push(`required_packets must contain ${requiredPacketIds.length} packets`);
  }

  for (const packet of value) {
    if (!isRecord(packet)) {
      errors.push("required_packets entries must be objects");
      continue;
    }

    if (!requiredPacketIds.includes(packet.id)) {
      errors.push(`unexpected packet id ${packet.id}`);
    }

    if (seen.has(packet.id)) {
      errors.push(`duplicate packet id ${packet.id}`);
    }
    seen.add(packet.id);

    if (!allowedPacketStatuses.includes(packet.status)) {
      errors.push(`${packet.id}.status must be one of ${allowedPacketStatuses.join(", ")}`);
    }

    if (!Array.isArray(packet.evidence_refs)) {
      errors.push(`${packet.id}.evidence_refs must be an array`);
    } else {
      errors.push(...validateEvidenceRefs(packet));
    }

    if (!Array.isArray(packet.required_approver_roles) || packet.required_approver_roles.length === 0) {
      errors.push(`${packet.id}.required_approver_roles must be a non-empty array`);
    }

    if (!Array.isArray(packet.acceptance_checks) || packet.acceptance_checks.length === 0) {
      errors.push(`${packet.id}.acceptance_checks must be a non-empty array`);
    }

    if (packet.blocks_sprint0_1_checkbox !== true) {
      errors.push(`${packet.id}.blocks_sprint0_1_checkbox must be true`);
    }

    if (packet.status === "accepted" && packet.evidence_refs.length === 0) {
      errors.push(`${packet.id} cannot be accepted without evidence_refs`);
    }

    if (["missing", "superseded"].includes(packet.status) && packet.evidence_refs.length !== 0) {
      errors.push(`${packet.id}.${packet.status} packet must not retain active evidence_refs`);
    }
  }

  for (const packetId of requiredPacketIds) {
    if (!seen.has(packetId)) {
      errors.push(`required_packets missing ${packetId}`);
    }
  }

  return errors;
}

function validateEvidenceRefs(packet) {
  const errors = [];

  for (const [index, ref] of packet.evidence_refs.entries()) {
    if (!isRecord(ref)) {
      errors.push(`${packet.id}.evidence_refs[${index}] must be an object`);
      continue;
    }

    for (const field of ["source_locator", "approver", "approval_status", "redaction_status"]) {
      if (typeof ref[field] !== "string" || ref[field].trim().length === 0) {
        errors.push(`${packet.id}.evidence_refs[${index}].${field} must be a non-empty string`);
      }
    }

    if (!hexSha256Pattern.test(String(ref.sha256 ?? ""))) {
      errors.push(`${packet.id}.evidence_refs[${index}].sha256 must be a hex sha256`);
    }

    if (!isoDatePattern.test(String(ref.signed_at ?? ""))) {
      errors.push(`${packet.id}.evidence_refs[${index}].signed_at must be YYYY-MM-DD`);
    }

    if (ref.approval_status !== packet.status && packet.status !== "submitted") {
      errors.push(`${packet.id}.evidence_refs[${index}].approval_status must match packet status`);
    }

    if (ref.redaction_status !== "redacted_no_secrets") {
      errors.push(`${packet.id}.evidence_refs[${index}].redaction_status must be redacted_no_secrets`);
    }
  }

  return errors;
}

function validateCompletionPolicy(value) {
  if (!isRecord(value)) {
    return ["completion_policy must be an object"];
  }

  const required = {
    all_packets_have_evidence_refs: true,
    all_packets_status: "accepted",
    all_refs_have_sha256: true,
    accepted_packets_must_be_promoted_to_manifest_before_sprint_checkbox: true,
    no_ref_contains_secret_material: true,
    operator_handoff_readme_lists_packet_order: true,
    operator_handoff_templates_validate_as_missing_packets: true,
    packet_checker_allows_empty_directory_until_external_evidence_arrives: true,
    packet_fixture_checker_reuses_packet_validator: true,
    release_transition_sets_default_deny_exceptions_only_from_accepted_matrix: true,
    sprint0_1_checkbox_may_be_checked_only_when_external_approvals_complete: true,
    submitted_packets_do_not_unlock_gate0: true
  };
  const errors = [];

  for (const [key, expected] of Object.entries(required)) {
    if (value[key] !== expected) {
      errors.push(`completion_policy.${key} must be ${expected}`);
    }
  }

  return errors;
}

function validateForbiddenClaims(value) {
  if (!Array.isArray(value)) {
    return ["forbidden_claims must be an array"];
  }

  return requiredForbiddenClaims
    .filter((claim) => !value.includes(claim))
    .map((claim) => `forbidden_claims missing ${claim}`);
}

function validateTransitionState(value) {
  const errors = [];
  const acceptedPackets = value.required_packets.filter((packet) => packet.status === "accepted");
  const allAccepted = acceptedPackets.length === requiredPacketIds.length;

  if (value.external_approvals_complete !== allAccepted) {
    errors.push("external_approvals_complete must equal all packets accepted");
  }

  if (value.release_transition_allowed !== allAccepted) {
    errors.push("release_transition_allowed must equal all packets accepted");
  }

  if (allAccepted && value.status !== "ready_for_gate0_decision") {
    errors.push("status must be ready_for_gate0_decision when all packets are accepted");
  }

  if (!allAccepted && value.status !== "pending_external_evidence") {
    errors.push("status must be pending_external_evidence until all packets are accepted");
  }

  return errors;
}

function validatePackageScript(packageJson) {
  const script = packageJson?.scripts?.["check:gate0-signed-evidence-manifest"];

  if (script !== "node scripts/check-gate0-signed-evidence-manifest-contract.mjs") {
    return ["package.json must expose check:gate0-signed-evidence-manifest"];
  }

  const fixturesScript = packageJson?.scripts?.["check:gate0-signed-evidence-manifest-fixtures"];

  if (fixturesScript !== "node scripts/check-gate0-signed-evidence-manifest-fixtures.mjs") {
    return ["package.json must expose check:gate0-signed-evidence-manifest-fixtures"];
  }

  const handoffScript = packageJson?.scripts?.["check:gate0-signed-evidence-handoff"];

  if (handoffScript !== `node ${handoffCheckerPath}`) {
    return ["package.json must expose check:gate0-signed-evidence-handoff"];
  }

  const packetScript = packageJson?.scripts?.["check:gate0-signed-evidence-packets"];

  if (packetScript !== `node ${packetCheckerPath}`) {
    return ["package.json must expose check:gate0-signed-evidence-packets"];
  }

  const packetFixturesScript = packageJson?.scripts?.["check:gate0-signed-evidence-packet-fixtures"];

  if (packetFixturesScript !== `node ${packetFixtureCheckerPath}`) {
    return ["package.json must expose check:gate0-signed-evidence-packet-fixtures"];
  }

  const checkScript = String(packageJson?.scripts?.check ?? "");

  for (const requiredScript of [
    "npm run check:gate0-signed-evidence-manifest",
    "npm run check:gate0-signed-evidence-manifest-fixtures",
    "npm run check:gate0-signed-evidence-handoff",
    "npm run check:gate0-signed-evidence-packets",
    "npm run check:gate0-signed-evidence-packet-fixtures"
  ]) {
    if (!checkScript.includes(requiredScript)) {
      return [`package.json check script must include ${requiredScript}`];
    }
  }

  return [];
}

function validateTracker(tracker) {
  const required = [
    "Sprint 0.1",
    "Gate 0",
    "字段级权利矩阵",
    "签字",
    "外部审批",
    "Gate 0 signed evidence packet verifier"
  ];

  return required.filter((item) => !tracker.includes(item)).map((item) => `tracker missing ${item}`);
}

function validateLinkedFiles(paths) {
  return paths
    .filter((path) => typeof path !== "string" || path.trim().length === 0 || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${path}`);
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `manifest contains forbidden secret-like pattern ${pattern}`);
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

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_file"
      },
      1
    );
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMainModule() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
