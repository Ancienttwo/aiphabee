#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = "deploy/governance/phase3-security-load-dr-release-evidence-manifest.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.phase3.security-load-dr-release-evidence-manifest.v0";
const requiredGateIds = [
  "compliance_legal_security_signoff",
  "live_kill_switch_incident_audit_evidence",
  "live_performance_availability_slo_evidence",
  "live_load_test_artifact",
  "live_dr_restore_failover_rollback_evidence",
  "live_incident_status_comms_drill_evidence",
  "ops_sre_product_release_signoff"
];
const requiredFalseFlags = [
  "external_compliance_legal_signoff",
  "live_dr_restore_failover",
  "live_incident_status_comms",
  "live_kill_switch_incident_audit",
  "live_load_test",
  "live_performance_availability_slo",
  "ops_sre_product_signoff"
];
const requiredTruePolicies = [
  "accepted_evidence_packet_alone_never_completes_sprint3_3",
  "all_gates_required_for_transition",
  "hash_only_evidence_refs_required",
  "operator_handoff_readme_lists_gate_order",
  "operator_handoff_templates_validate_as_missing_packets",
  "packet_checker_allows_empty_directory_until_external_evidence_arrives",
  "packet_fixture_checker_reuses_packet_validator",
  "raw_apm_logs_forbidden_in_repo",
  "raw_audit_export_forbidden_in_repo",
  "raw_incident_transcript_forbidden_in_repo",
  "raw_secret_or_credential_material_forbidden_in_repo",
  "raw_security_report_forbidden_in_repo",
  "redacted_no_secrets_required",
  "transition_review_cross_checks_release_gate_contracts"
];
const requiredNotClaimed = [
  "external_compliance_legal_signoff",
  "live_kill_switch_incident_audit",
  "live_performance_availability_slo",
  "live_load_test",
  "live_dr_restore_failover",
  "live_incident_status_comms",
  "ops_sre_product_signoff",
  "sprint3_3_exit_gate_complete",
  "phase3_ga_complete",
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
const expectedScripts = {
  "check:phase3-security-load-dr-release-evidence-handoff": "node scripts/check-phase3-security-load-dr-release-evidence-handoff.mjs",
  "check:phase3-security-load-dr-release-evidence-manifest": "node scripts/check-phase3-security-load-dr-release-evidence-manifest-contract.mjs",
  "check:phase3-security-load-dr-release-evidence-packet-fixtures": "node scripts/check-phase3-security-load-dr-release-evidence-packet-fixtures.mjs",
  "check:phase3-security-load-dr-release-evidence-packets": "node scripts/check-phase3-security-load-dr-release-evidence-packets.mjs",
  "check:phase3-security-load-dr-release-transition-review": "node scripts/check-phase3-security-load-dr-release-transition-review-contract.mjs",
  "check:phase3-security-load-dr-release-transition-review-fixtures": "node scripts/check-phase3-security-load-dr-release-transition-review-fixtures.mjs"
};
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
const errors = validatePhase3SecurityLoadDrReleaseEvidenceManifest({
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

function validatePhase3SecurityLoadDrReleaseEvidenceManifest({ manifest: value, packageJson, todos, tracker }) {
  const errors = [];

  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }

  expectEqual(errors, value.version, expectedVersion, "version");
  expectEqual(errors, value.status, "pending_external_evidence", "status");
  expectEqual(errors, value.checker, "scripts/check-phase3-security-load-dr-release-evidence-manifest-contract.mjs", "checker");
  expectEqual(errors, value.packet_checker, "scripts/check-phase3-security-load-dr-release-evidence-packets.mjs", "packet_checker");
  expectEqual(errors, value.packet_fixture_checker, "scripts/check-phase3-security-load-dr-release-evidence-packet-fixtures.mjs", "packet_fixture_checker");
  expectEqual(errors, value.handoff_checker, "scripts/check-phase3-security-load-dr-release-evidence-handoff.mjs", "handoff_checker");
  expectEqual(errors, value.transition_review_contract, "deploy/governance/phase3-security-load-dr-release-transition-review.contract.json", "transition_review_contract");
  expectEqual(errors, value.transition_review_checker, "scripts/check-phase3-security-load-dr-release-transition-review-contract.mjs", "transition_review_checker");
  expectEqual(errors, value.transition_review_fixture_checker, "scripts/check-phase3-security-load-dr-release-transition-review-fixtures.mjs", "transition_review_fixture_checker");
  expectEqual(errors, value.packet_directory, "deploy/governance/phase3-security-load-dr-release-evidence-packets", "packet_directory");
  expectEqual(errors, value.packet_file_pattern, "<gate_id>.evidence.json", "packet_file_pattern");
  expectEqual(errors, value.template_directory, "deploy/governance/phase3-security-load-dr-release-evidence-templates", "template_directory");
  expectEqual(errors, value.template_file_pattern, "<gate_id>.evidence.json", "template_file_pattern");
  expectEqual(errors, value.tracker, trackerPath, "tracker");
  expectEqual(errors, value.todos, todosPath, "todos");
  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, value.all_security_load_dr_gates_accepted, false, "all_security_load_dr_gates_accepted");
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
  errors.push(...validateLinkedReleaseGates(value.linked_release_gate_contracts));
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

function validateLinkedReleaseGates(value) {
  const errors = [];

  if (!Array.isArray(value) || value.length !== 3) {
    return ["linked_release_gate_contracts must contain compliance, performance, and load/DR gates"];
  }

  for (const entry of value) {
    if (!existsSync(resolve(process.cwd(), entry.path ?? ""))) {
      errors.push(`linked release gate path missing: ${entry.path}`);
      continue;
    }
    const releaseGate = readJson(entry.path);
    expectEqual(errors, releaseGate.release_gate?.gate_status, entry.expected_gate_status, `${entry.id}.release_gate.gate_status`);
    expectEqual(errors, releaseGate.release_gate?.no_live_release_claim, true, `${entry.id}.release_gate.no_live_release_claim`);
    if (!existsSync(resolve(process.cwd(), entry.checker ?? ""))) {
      errors.push(`${entry.id}.checker linked path missing`);
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

  for (const [name, command] of Object.entries(expectedScripts)) {
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
