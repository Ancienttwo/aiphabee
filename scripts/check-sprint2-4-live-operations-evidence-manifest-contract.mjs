#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = "deploy/governance/sprint2-4-live-operations-evidence-manifest.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.phase2.sprint2-4-live-operations-evidence-manifest.v0";
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
const requiredFalseFlags = [
  "frontend",
  "live_billing_provider",
  "live_billing_writes",
  "live_flag_source",
  "live_mcp_auth_store",
  "live_notification_fanout",
  "live_workflow_execution"
];
const requiredTruePolicies = [
  "all_gates_required_for_transition",
  "accepted_evidence_packet_alone_never_completes_sprint2_4",
  "hash_only_evidence_refs_required",
  "redacted_no_secrets_required",
  "packet_checker_allows_empty_directory_until_external_evidence_arrives",
  "packet_fixture_checker_reuses_packet_validator",
  "operator_handoff_templates_validate_as_missing_packets",
  "operator_handoff_readme_lists_gate_order",
  "raw_billing_payloads_forbidden_in_repo",
  "raw_workflow_payloads_forbidden_in_repo",
  "raw_notification_payloads_forbidden_in_repo",
  "raw_credential_material_forbidden_in_repo",
  "frontend_evidence_may_be_claude_owned",
  "transition_review_cross_checks_manifest_flags"
];
const requiredNotClaimed = [
  "paid_billing_live",
  "subscription_audit_invoice_ledger_live_writes",
  "workflow_execution_live",
  "watchlist_or_correction_fanout_live",
  "mcp_live_auth_store",
  "kill_switch_live_flag_source",
  "frontend_billing_workflow_notification_ui",
  "sprint2_4_exit_gate_complete",
  "all_sprints_complete"
];
const requiredPacketSchemaFields = [
  "approver_role",
  "blocks",
  "evidence_refs",
  "evidence_sha256",
  "gate_id",
  "observed_at",
  "redaction_status",
  "required_evidence",
  "signed_at",
  "source_locator",
  "status"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const manifest = readJson(manifestPath);
const packageJson = readJson(packagePath);
const tracker = readText(trackerPath);
const todos = readText(todosPath);
const errors = validateSprint24LiveOperationsEvidenceManifest({
  manifest,
  packageJson,
  todos,
  tracker
});

if (errors.length > 0) {
  emit({ errors, path: manifestPath, status: "invalid_contract" }, 1);
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

function validateSprint24LiveOperationsEvidenceManifest({ manifest: value, packageJson, todos, tracker }) {
  const errors = [];

  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }

  expectEqual(errors, value.version, expectedVersion, "version");
  expectEqual(errors, value.status, "pending_external_evidence", "status");
  expectEqual(errors, value.checker, "scripts/check-sprint2-4-live-operations-evidence-manifest-contract.mjs", "checker");
  expectEqual(errors, value.packet_checker, "scripts/check-sprint2-4-live-operations-evidence-packets.mjs", "packet_checker");
  expectEqual(errors, value.packet_fixture_checker, "scripts/check-sprint2-4-live-operations-evidence-packet-fixtures.mjs", "packet_fixture_checker");
  expectEqual(errors, value.handoff_checker, "scripts/check-sprint2-4-live-operations-evidence-handoff.mjs", "handoff_checker");
  expectEqual(errors, value.transition_review_contract, "deploy/governance/sprint2-4-live-operations-transition-review.contract.json", "transition_review_contract");
  expectEqual(errors, value.transition_review_checker, "scripts/check-sprint2-4-live-operations-transition-review-contract.mjs", "transition_review_checker");
  expectEqual(errors, value.transition_review_fixture_checker, "scripts/check-sprint2-4-live-operations-transition-review-fixtures.mjs", "transition_review_fixture_checker");
  expectEqual(errors, value.packet_directory, "deploy/governance/sprint2-4-live-operations-evidence-packets", "packet_directory");
  expectEqual(errors, value.packet_file_pattern, "<gate_id>.evidence.json", "packet_file_pattern");
  expectEqual(errors, value.template_directory, "deploy/governance/sprint2-4-live-operations-evidence-templates", "template_directory");
  expectEqual(errors, value.template_file_pattern, "<gate_id>.evidence.json", "template_file_pattern");
  expectEqual(errors, value.tracker, trackerPath, "tracker");
  expectEqual(errors, value.todos, todosPath, "todos");
  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, value.all_live_operations_gates_accepted, false, "all_live_operations_gates_accepted");
  expectArray(errors, value.required_gate_ids, requiredGateIds, "required_gate_ids");
  expectArray(errors, value.not_claimed, requiredNotClaimed, "not_claimed");

  for (const flag of requiredFalseFlags) {
    expectEqual(errors, value[flag], false, flag);
  }
  for (const policy of requiredTruePolicies) {
    expectEqual(errors, value.evidence_policy?.[policy], true, `evidence_policy.${policy}`);
  }
  for (const field of requiredPacketSchemaFields) {
    if (!Object.prototype.hasOwnProperty.call(value.evidence_packet_schema ?? {}, field)) {
      errors.push(`evidence_packet_schema missing ${field}`);
    }
  }

  errors.push(...validateRequiredGates(value.required_gates));
  errors.push(...validateLinkedFiles(value));
  errors.push(...validatePackage(packageJson));
  errors.push(...validateDocs(value, tracker, todos));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateRequiredGates(value) {
  const errors = [];

  if (!Array.isArray(value) || value.length !== requiredGateIds.length) {
    return [`required_gates must contain ${requiredGateIds.length} gates`];
  }

  const seen = new Set();
  for (const gateId of requiredGateIds) {
    const gate = value.find((item) => item.id === gateId);
    if (!gate) {
      errors.push(`required_gates missing ${gateId}`);
      continue;
    }
    if (seen.has(gateId)) {
      errors.push(`duplicate gate ${gateId}`);
    }
    seen.add(gateId);
    expectEqual(errors, gate.status, "missing", `${gateId}.status`);
    expectEqual(errors, gate.evidence_sha256, null, `${gateId}.evidence_sha256`);
    expectEqual(errors, gate.signed_at, null, `${gateId}.signed_at`);
    expectEqual(errors, gate.approver_role, null, `${gateId}.approver_role`);
    expectEqual(errors, gate.redaction_status, "missing", `${gateId}.redaction_status`);
    if (!Array.isArray(gate.blocks) || gate.blocks.length === 0) {
      errors.push(`${gateId}.blocks must not be empty`);
    }
    if (!Array.isArray(gate.required_evidence) || gate.required_evidence.length < 3) {
      errors.push(`${gateId}.required_evidence must list at least 3 evidence names`);
    }
    if (!Array.isArray(gate.required_approver_roles) || gate.required_approver_roles.length === 0) {
      errors.push(`${gateId}.required_approver_roles must not be empty`);
    }
    if (!Array.isArray(gate.evidence_refs) || gate.evidence_refs.length !== 0) {
      errors.push(`${gateId}.evidence_refs must be empty while missing`);
    }
  }

  return errors;
}

function validateLinkedFiles(value) {
  const paths = [
    value.checker,
    value.packet_checker,
    value.packet_fixture_checker,
    value.handoff_checker,
    value.transition_review_contract,
    value.transition_review_checker,
    value.transition_review_fixture_checker,
    value.packet_directory,
    value.template_directory,
    value.tracker,
    value.todos
  ];

  return paths
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked path missing: ${path}`);
}

function validatePackage(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const expected = {
    "check:sprint2-4-live-operations-evidence-handoff": "node scripts/check-sprint2-4-live-operations-evidence-handoff.mjs",
    "check:sprint2-4-live-operations-evidence-manifest": "node scripts/check-sprint2-4-live-operations-evidence-manifest-contract.mjs",
    "check:sprint2-4-live-operations-evidence-packet-fixtures": "node scripts/check-sprint2-4-live-operations-evidence-packet-fixtures.mjs",
    "check:sprint2-4-live-operations-evidence-packets": "node scripts/check-sprint2-4-live-operations-evidence-packets.mjs",
    "check:sprint2-4-live-operations-transition-review": "node scripts/check-sprint2-4-live-operations-transition-review-contract.mjs",
    "check:sprint2-4-live-operations-transition-review-fixtures": "node scripts/check-sprint2-4-live-operations-transition-review-fixtures.mjs"
  };

  for (const [name, command] of Object.entries(expected)) {
    if (scripts[name] !== command) {
      errors.push(`package.json ${name} script is missing`);
    }
    if (!String(scripts.check ?? "").includes(`npm run ${name}`)) {
      errors.push(`root check must include ${name}`);
    }
  }

  return errors;
}

function validateDocs(value, tracker, todos) {
  const errors = [];

  for (const fragment of value.required_tracker_fragments ?? []) {
    if (!tracker.includes(fragment)) {
      errors.push(`tracker missing required fragment: ${fragment}`);
    }
  }
  for (const fragment of value.required_todos_fragments ?? []) {
    if (!todos.includes(fragment)) {
      errors.push(`tasks/todos.md missing required fragment: ${fragment}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `manifest contains forbidden secret-like pattern ${pattern.source}`);
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    emit({ error: error instanceof Error ? error.message : String(error), path, status: "invalid_json" }, 1);
  }
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit({ error: error instanceof Error ? error.message : String(error), path, status: "missing_text" }, 1);
  }
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
