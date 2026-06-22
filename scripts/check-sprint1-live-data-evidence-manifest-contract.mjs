#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const manifestPath = "deploy/governance/sprint1-live-data-evidence-manifest.contract.json";
const activationPath = "deploy/governance/sprint1-live-data-activation.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const docsPath = "docs/governance/sprint1-live-data-evidence-manifest.md";
const activationDocsPath = "docs/governance/sprint1-live-data-activation.md";
const expectedVersion = "2026-06-22.phase1.sprint1-live-data-evidence-manifest.v0";
const packetCheckerPath = "scripts/check-sprint1-live-data-evidence-packets.mjs";
const packetFixtureCheckerPath = "scripts/check-sprint1-live-data-evidence-packet-fixtures.mjs";
const handoffCheckerPath = "scripts/check-sprint1-live-data-evidence-handoff.mjs";
const packetDirectoryPath = "deploy/governance/sprint1-live-data-evidence-packets";
const templateDirectoryPath = "deploy/governance/sprint1-live-data-evidence-templates";
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
const requiredNotClaimed = [
  "partner_rows_loaded",
  "live_serving_reads_complete",
  "live_serving_sql_execution_complete",
  "live_usage_writes_complete",
  "billing_reconciliation_posted",
  "sprint1_1_live_data_complete"
];
const requiredPacketSchema = {
  approver_role: "required_gates.required_approver_roles member or null when missing",
  blocks: "required_gates.blocks",
  evidence_refs: "hash_only_refs_for_accepted_packets",
  evidence_sha256: "sha256:hex_sha256_of_redacted_packet_or_null",
  gate_id: "required_gates.id",
  observed_at: "ISO-8601",
  redaction_status: "missing|redacted_no_secrets",
  required_evidence: "required_gates.required_evidence",
  signed_at: "YYYY-MM-DD or null",
  source_locator: "redacted_file_or_external_record_id",
  status: "missing|accepted|rejected|needs_redaction"
};
const requiredForbiddenFields = [
  "authorization",
  "api_key",
  "token",
  "secret",
  "password",
  "raw_rows",
  "raw_row",
  "raw_record",
  "raw_response",
  "raw_output",
  "database_url",
  "connection_string",
  "account_id",
  "workspace_id",
  "invoice_id",
  "customer_id",
  "env_value"
];
const allowedStatuses = ["missing", "accepted", "rejected"];
const sha256RefPattern = /^sha256:[a-f0-9]{64}$/u;
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

export { validateSprint1LiveDataEvidenceManifest };

function runCli() {
  const manifest = readJson(manifestPath);
  const activation = readJson(activationPath);
  const packageJson = readJson(packagePath);
  const docs = readText(docsPath);
  const activationDocs = readText(activationDocsPath);
  const tracker = readText(trackerPath);
  const todos = readText(todosPath);
  const errors = validateSprint1LiveDataEvidenceManifest({
    activation,
    activationDocs,
    docs,
    manifest,
    packageJson,
    todos,
    tracker
  });

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
      accepted_gates: manifest.required_gates.filter((gate) => gate.status === "accepted").length,
      release_transition_allowed: manifest.release_transition_allowed,
      required_gates: manifest.required_gates.length,
      status: "ok"
    },
    0
  );
}

function validateSprint1LiveDataEvidenceManifest({
  activation,
  activationDocs,
  docs,
  manifest: value,
  packageJson,
  todos,
  tracker
}) {
  const errors = [];

  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }

  expectEqual(errors, value.version, expectedVersion, "version");
  expectEqual(errors, value.status, deriveStatus(value), "status");
  expectEqual(errors, value.checker, "scripts/check-sprint1-live-data-evidence-manifest-contract.mjs", "checker");
  expectEqual(errors, value.fixture_checker, "scripts/check-sprint1-live-data-evidence-manifest-fixtures.mjs", "fixture_checker");
  expectEqual(errors, value.packet_checker, packetCheckerPath, "packet_checker");
  expectEqual(errors, value.packet_fixture_checker, packetFixtureCheckerPath, "packet_fixture_checker");
  expectEqual(errors, value.handoff_checker, handoffCheckerPath, "handoff_checker");
  expectEqual(errors, value.activation_contract, activationPath, "activation_contract");
  expectEqual(errors, value.activation_doc, activationDocsPath, "activation_doc");
  expectEqual(errors, value.manifest_doc, docsPath, "manifest_doc");
  expectEqual(errors, value.packet_directory, packetDirectoryPath, "packet_directory");
  expectEqual(errors, value.packet_file_pattern, "<gate_id>.evidence.json", "packet_file_pattern");
  expectEqual(errors, value.template_directory, templateDirectoryPath, "template_directory");
  expectEqual(errors, value.template_file_pattern, "<gate_id>.evidence.json", "template_file_pattern");

  for (const field of [
    "billing_reconciliation_posting",
    "frontend",
    "live_serving_reads",
    "live_serving_sql_execution",
    "live_usage_writes"
  ]) {
    expectEqual(errors, value[field], false, field);
  }

  expectArray(errors, value.not_claimed, requiredNotClaimed, "not_claimed");
  errors.push(...validateEvidencePolicy(value.evidence_policy));
  errors.push(...validatePacketSchema(value.evidence_packet_schema));
  errors.push(...validateForbiddenFields(value.forbidden_fields));
  errors.push(...validateActivationAlignment(activation, value));
  errors.push(...validateRequiredGates(value.required_gates, activation));
  errors.push(...validateTransitionState(value));
  errors.push(
    ...validateLinkedFiles([
      value.activation_contract,
      value.activation_doc,
      value.manifest_doc,
      value.packet_checker,
      value.packet_fixture_checker,
      value.handoff_checker,
      value.packet_directory,
      value.template_directory
    ])
  );
  errors.push(...validatePackage(packageJson));
  errors.push(...validateDocs({ activationDocs, docs, todos, tracker }));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateEvidencePolicy(value) {
  if (!isRecord(value)) {
    return ["evidence_policy must be an object"];
  }

  const errors = [];
  const requiredTrue = [
    "activation_contract_remains_source_of_truth",
    "all_gates_required_for_transition",
    "hash_only_evidence_refs_required",
    "packet_checker_allows_empty_directory_until_external_evidence_arrives",
    "packet_fixture_checker_reuses_packet_validator",
    "redacted_no_secrets_required",
    "operator_handoff_templates_validate_as_missing_packets",
    "operator_handoff_readme_lists_gate_order",
    "raw_partner_rows_forbidden_in_repo",
    "raw_database_values_forbidden_in_repo",
    "raw_billing_payloads_forbidden_in_repo",
    "manifest_transition_still_owned_by_evidence_manifest"
  ];

  for (const key of requiredTrue) {
    if (value[key] !== true) {
      errors.push(`evidence_policy.${key} must be true`);
    }
  }

  return errors;
}

function validatePacketSchema(value) {
  if (!isRecord(value)) {
    return ["evidence_packet_schema must be an object"];
  }

  const errors = [];

  for (const [key, expected] of Object.entries(requiredPacketSchema)) {
    if (value[key] !== expected) {
      errors.push(`evidence_packet_schema.${key} must be ${expected}`);
    }
  }

  return errors;
}

function validateForbiddenFields(value) {
  if (!Array.isArray(value) || value.some((field) => typeof field !== "string")) {
    return ["forbidden_fields must be a string array"];
  }

  const errors = [];

  for (const field of requiredForbiddenFields) {
    if (!value.includes(field)) {
      errors.push(`forbidden_fields must include ${field}`);
    }
  }

  return errors;
}

function validateActivationAlignment(activation, manifest) {
  const errors = [];

  if (!isRecord(activation)) {
    return ["activation contract must be an object"];
  }

  expectEqual(errors, activation.evidence_manifest, manifestPath, "activation.evidence_manifest");
  expectEqual(
    errors,
    activation.evidence_manifest_checker,
    "scripts/check-sprint1-live-data-evidence-manifest-contract.mjs",
    "activation.evidence_manifest_checker"
  );
  expectEqual(
    errors,
    activation.evidence_manifest_fixture_checker,
    "scripts/check-sprint1-live-data-evidence-manifest-fixtures.mjs",
    "activation.evidence_manifest_fixture_checker"
  );
  expectEqual(errors, activation.evidence_manifest_doc, docsPath, "activation.evidence_manifest_doc");

  const activationIds = new Set((activation.activation_gates ?? []).map((gate) => gate.id));
  const manifestIds = new Set((manifest.required_gates ?? []).map((gate) => gate.id));

  for (const id of requiredGateIds) {
    if (!activationIds.has(id)) {
      errors.push(`activation contract missing gate ${id}`);
    }
    if (!manifestIds.has(id)) {
      errors.push(`manifest missing gate ${id}`);
    }
  }

  return errors;
}

function validateRequiredGates(value, activation) {
  if (!Array.isArray(value)) {
    return ["required_gates must be an array"];
  }

  const errors = [];
  const seen = new Set();
  const activationGates = new Map((activation.activation_gates ?? []).map((gate) => [gate.id, gate]));

  if (value.length !== requiredGateIds.length) {
    errors.push(`required_gates must contain ${requiredGateIds.length} gates`);
  }

  for (const [index, gate] of value.entries()) {
    if (!isRecord(gate)) {
      errors.push(`required_gates[${index}] must be an object`);
      continue;
    }

    if (!requiredGateIds.includes(gate.id)) {
      errors.push(`unexpected gate id ${gate.id}`);
    }

    if (seen.has(gate.id)) {
      errors.push(`duplicate gate id ${gate.id}`);
    }
    seen.add(gate.id);

    if (!allowedStatuses.includes(gate.status)) {
      errors.push(`${gate.id}.status must be one of ${allowedStatuses.join(", ")}`);
    }

    const activationGate = activationGates.get(gate.id);
    if (activationGate) {
      expectArray(errors, gate.blocks, activationGate.blocks, `${gate.id}.blocks`);
      expectArray(errors, gate.required_evidence, activationGate.required_evidence, `${gate.id}.required_evidence`);
    }

    if (!Array.isArray(gate.required_approver_roles) || gate.required_approver_roles.length === 0) {
      errors.push(`${gate.id}.required_approver_roles must be a non-empty array`);
    }

    if (!Array.isArray(gate.evidence_refs)) {
      errors.push(`${gate.id}.evidence_refs must be an array`);
      continue;
    }

    errors.push(...validateGateEvidence(gate));
  }

  for (const id of requiredGateIds) {
    if (!seen.has(id)) {
      errors.push(`required_gates missing ${id}`);
    }
  }

  return errors;
}

function validateGateEvidence(gate) {
  const errors = [];

  if (gate.status === "missing") {
    if (gate.evidence_refs.length !== 0) {
      errors.push(`${gate.id}.missing gate must not retain evidence_refs`);
    }
    if (gate.evidence_sha256 !== null) {
      errors.push(`${gate.id}.missing gate evidence_sha256 must be null`);
    }
    if (gate.signed_at !== null) {
      errors.push(`${gate.id}.missing gate signed_at must be null`);
    }
    if (gate.approver_role !== null) {
      errors.push(`${gate.id}.missing gate approver_role must be null`);
    }
    if (gate.redaction_status !== "missing") {
      errors.push(`${gate.id}.missing gate redaction_status must be missing`);
    }
    return errors;
  }

  if (gate.evidence_refs.length === 0) {
    errors.push(`${gate.id} cannot be ${gate.status} without evidence_refs`);
  }

  for (const [index, ref] of gate.evidence_refs.entries()) {
    if (typeof ref !== "string" || !sha256RefPattern.test(ref)) {
      errors.push(`${gate.id}.evidence_refs[${index}] must be a sha256 ref`);
    }
  }

  if (typeof gate.evidence_sha256 !== "string" || !sha256RefPattern.test(gate.evidence_sha256)) {
    errors.push(`${gate.id}.evidence_sha256 must be a sha256 ref`);
  }

  if (typeof gate.signed_at !== "string" || !isoDatePattern.test(gate.signed_at)) {
    errors.push(`${gate.id}.signed_at must be YYYY-MM-DD`);
  }

  if (!gate.required_approver_roles.includes(gate.approver_role)) {
    errors.push(`${gate.id}.approver_role must be one of required_approver_roles`);
  }

  if (gate.redaction_status !== "redacted_no_secrets") {
    errors.push(`${gate.id}.redaction_status must be redacted_no_secrets`);
  }

  return errors;
}

function validateTransitionState(value) {
  const errors = [];
  const gates = Array.isArray(value.required_gates) ? value.required_gates : [];
  const allAccepted = gates.length === requiredGateIds.length && gates.every((gate) => isRecord(gate) && gate.status === "accepted");

  if (value.all_activation_gates_accepted !== allAccepted) {
    errors.push("all_activation_gates_accepted must equal whether all gates are accepted");
  }

  if (value.release_transition_allowed !== allAccepted) {
    errors.push("release_transition_allowed must equal whether all gates are accepted");
  }

  if (allAccepted && value.status !== "ready_for_sprint1_1_live_data_decision") {
    errors.push("status must be ready_for_sprint1_1_live_data_decision when all gates are accepted");
  }

  if (!allAccepted && value.status !== "pending_external_evidence") {
    errors.push("status must remain pending_external_evidence until all gates are accepted");
  }

  return errors;
}

function validatePackage(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const requiredScripts = {
    "check:sprint1-live-data-evidence-manifest": "node scripts/check-sprint1-live-data-evidence-manifest-contract.mjs",
    "check:sprint1-live-data-evidence-manifest-fixtures": "node scripts/check-sprint1-live-data-evidence-manifest-fixtures.mjs",
    "check:sprint1-live-data-evidence-packets": "node scripts/check-sprint1-live-data-evidence-packets.mjs",
    "check:sprint1-live-data-evidence-packet-fixtures": "node scripts/check-sprint1-live-data-evidence-packet-fixtures.mjs",
    "check:sprint1-live-data-evidence-handoff": "node scripts/check-sprint1-live-data-evidence-handoff.mjs"
  };

  for (const [script, command] of Object.entries(requiredScripts)) {
    if (scripts[script] !== command) {
      errors.push(`package.json ${script} must be ${command}`);
    }
  }

  for (const script of Object.keys(requiredScripts)) {
    if (!String(scripts.check ?? "").includes(`npm run ${script}`)) {
      errors.push(`root check must include ${script}`);
    }
  }

  return errors;
}

function validateDocs({ activationDocs, docs, todos, tracker }) {
  const errors = [];
  const combined = `${activationDocs}\n${docs}\n${todos}\n${tracker}`;

  for (const text of [
    "sprint1-live-data-evidence-manifest",
    "npm run check:sprint1-live-data-evidence-manifest",
    "npm run check:sprint1-live-data-evidence-manifest-fixtures",
    "npm run check:sprint1-live-data-evidence-packets",
    "npm run check:sprint1-live-data-evidence-packet-fixtures",
    "npm run check:sprint1-live-data-evidence-handoff",
    "deploy/governance/sprint1-live-data-evidence-packets",
    "operator handoff templates",
    "hash-only evidence",
    "partner_serving_rows_loaded",
    "hyperdrive_select_1_passed",
    "usage_event_live_write_passed",
    "billing_reconciliation_live_read_passed"
  ]) {
    if (!combined.includes(text)) {
      errors.push(`docs/tracker/todos must mention ${text}`);
    }
  }

  if (!tracker.includes("- [ ] **Data Access Gateway live Serving**")) {
    errors.push("tracker must keep Data Access Gateway live Serving unchecked");
  }
  if (!tracker.includes("- [ ] **Usage ledger live writes + billing reconciliation**")) {
    errors.push("tracker must keep Usage ledger live writes unchecked");
  }

  return errors;
}

function validateLinkedFiles(paths) {
  return paths
    .filter((path) => typeof path !== "string" || path.trim().length === 0 || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${path}`);
}

function deriveStatus(value) {
  const gates = Array.isArray(value.required_gates) ? value.required_gates : [];
  const allAccepted = gates.length === requiredGateIds.length && gates.every((gate) => isRecord(gate) && gate.status === "accepted");

  return allAccepted ? "ready_for_sprint1_1_live_data_decision" : "pending_external_evidence";
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

function expectEqual(errors, actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} must be ${JSON.stringify(expected)}`);
  }
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `manifest contains forbidden secret-like pattern ${pattern.source}`);
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

function isMainModule() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
