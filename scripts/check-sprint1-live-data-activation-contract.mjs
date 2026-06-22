#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/sprint1-live-data-activation.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const docsPath = "docs/governance/sprint1-live-data-activation.md";
const evidenceManifestPath = "deploy/governance/sprint1-live-data-evidence-manifest.contract.json";
const evidenceManifestCheckerPath = "scripts/check-sprint1-live-data-evidence-manifest-contract.mjs";
const evidenceManifestFixtureCheckerPath = "scripts/check-sprint1-live-data-evidence-manifest-fixtures.mjs";
const evidenceManifestDocPath = "docs/governance/sprint1-live-data-evidence-manifest.md";
const gatewayContractPath = "deploy/gateway/access.contract.json";
const servingReadinessPath = "deploy/governance/serving-quality-live-readiness.contract.json";
const quotaContractPath = "deploy/usage/quota-display.contract.json";
const billingContractPath = "deploy/usage/billing-reconciliation.contract.json";

const requiredTrackerItems = [
  "Sprint 1.1: Data Access Gateway live Serving",
  "Sprint 1.1: Usage ledger live writes + billing reconciliation"
];
const requiredLinkedContracts = [
  "deploy/gateway/access.contract.json",
  "deploy/database/migrations.contract.json",
  "deploy/governance/serving-quality-live-readiness.contract.json",
  "deploy/governance/field-rights-live-policy-source.contract.json",
  "deploy/usage/quota-display.contract.json",
  "deploy/usage/billing-reconciliation.contract.json"
];
const requiredChecks = [
  "npm run check:data-gateway",
  "npm run check:database",
  "npm run check:field-rights-live-policy-source",
  "npm run check:serving-quality-live-readiness",
  "npm run check:usage-quota-display",
  "npm run check:usage-billing-reconciliation"
];
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
  "live_usage_writes_complete",
  "billing_reconciliation_posted",
  "sprint1_1_live_data_complete"
];
const requiredGatewayGuards = [
  "field_entitlement_policy_source_scaffold",
  "row_limit",
  "time_range_limit",
  "quality_hold",
  "serving_execution_adapter_scaffold",
  "serving_quality_release_isolation",
  "serving_query_planner_scaffold",
  "serving_sql_text_compiler_scaffold",
  "cache_key_versioning",
  "usage_event_writer_scaffold",
  "usage_preview"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const gatewayContract = readJson(gatewayContractPath);
const servingReadiness = readJson(servingReadinessPath);
const quotaContract = readJson(quotaContractPath);
const billingContract = readJson(billingContractPath);
const tracker = readText(trackerPath);
const todos = readText(todosPath);
const docs = readText(docsPath);
const errors = validateContract({
  billingContract,
  contract,
  docs,
  gatewayContract,
  packageJson,
  quotaContract,
  servingReadiness,
  todos,
  tracker
});

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_contract"
    },
    1
  );
}

emit(
  {
    activation_gates: contract.activation_gates.length,
    release_transition_allowed: contract.release_transition_allowed,
    status: "ok"
  },
  0
);

function validateContract({
  billingContract,
  contract: value,
  docs,
  gatewayContract,
  packageJson,
  quotaContract,
  servingReadiness,
  todos,
  tracker
}) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  expectEqual(errors, value.version, "2026-06-22.phase1.sprint1-live-data-activation.v0", "version");
  expectEqual(errors, value.status, "blocked_external_activation", "status");
  expectEqual(errors, value.checker, "scripts/check-sprint1-live-data-activation-contract.mjs", "checker");
  expectEqual(errors, value.evidence_manifest, evidenceManifestPath, "evidence_manifest");
  expectEqual(errors, value.evidence_manifest_checker, evidenceManifestCheckerPath, "evidence_manifest_checker");
  expectEqual(
    errors,
    value.evidence_manifest_fixture_checker,
    evidenceManifestFixtureCheckerPath,
    "evidence_manifest_fixture_checker"
  );
  expectEqual(errors, value.evidence_manifest_doc, evidenceManifestDocPath, "evidence_manifest_doc");
  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");

  for (const field of [
    "billing_reconciliation_posting",
    "frontend",
    "live_serving_reads",
    "live_serving_sql_execution",
    "live_usage_writes"
  ]) {
    expectEqual(errors, value[field], false, field);
  }

  expectArray(errors, value.tracker_items, requiredTrackerItems, "tracker_items");
  expectArray(errors, value.linked_contracts, requiredLinkedContracts, "linked_contracts");
  expectArray(errors, value.required_checks, requiredChecks, "required_checks");
  expectArray(errors, value.not_claimed, requiredNotClaimed, "not_claimed");
  errors.push(...validateLinkedContracts(value.linked_contracts));
  errors.push(
    ...validateLinkedContracts([
      value.evidence_manifest,
      value.evidence_manifest_checker,
      value.evidence_manifest_fixture_checker,
      value.evidence_manifest_doc
    ])
  );
  errors.push(...validateActivationGates(value.activation_gates));
  errors.push(...validateExistingNoLiveContracts({ billingContract, gatewayContract, quotaContract, servingReadiness }));
  errors.push(...validatePackage(packageJson));
  errors.push(...validateDocs({ docs, todos, tracker }));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateLinkedContracts(value) {
  const errors = [];

  for (const path of value ?? []) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing ${path}`);
    }
  }

  return errors;
}

function validateActivationGates(value) {
  if (!Array.isArray(value)) {
    return ["activation_gates must be an array"];
  }

  const errors = [];
  const gates = new Map();

  for (const [index, gate] of value.entries()) {
    if (!isRecord(gate)) {
      errors.push(`activation_gates[${index}] must be an object`);
      continue;
    }

    if (typeof gate.id !== "string") {
      errors.push(`activation_gates[${index}].id must be a string`);
      continue;
    }

    if (gates.has(gate.id)) {
      errors.push(`duplicate activation gate ${gate.id}`);
    }
    gates.set(gate.id, gate);

    if (gate.status !== "missing") {
      errors.push(`${gate.id}.status must be missing until external evidence is accepted`);
    }

    if (!Array.isArray(gate.blocks) || gate.blocks.length === 0) {
      errors.push(`${gate.id}.blocks must be a non-empty array`);
    }

    if (!Array.isArray(gate.required_evidence) || gate.required_evidence.length === 0) {
      errors.push(`${gate.id}.required_evidence must be a non-empty array`);
    }
  }

  for (const id of requiredGateIds) {
    if (!gates.has(id)) {
      errors.push(`activation_gates missing ${id}`);
    }
  }

  return errors;
}

function validateExistingNoLiveContracts({ billingContract, gatewayContract, quotaContract, servingReadiness }) {
  const errors = [];

  expectEqual(errors, gatewayContract.live_data_access, false, "gateway.live_data_access");
  expectArray(errors, gatewayContract.required_guards, requiredGatewayGuards, "gateway.required_guards");

  for (const field of [
    "frontend",
    "live_partner_rows_loaded",
    "live_serving_reads",
    "live_serving_sql_execution",
    "persistent_writes",
    "sql_executed"
  ]) {
    expectEqual(errors, servingReadiness[field], false, `serving_readiness.${field}`);
  }
  expectEqual(
    errors,
    servingReadiness.activation?.status,
    "blocked_live_serving_activation",
    "serving_readiness.activation.status"
  );

  for (const field of ["frontend", "live_ledger_reads", "persistent_writes", "sql_emitted"]) {
    expectEqual(errors, quotaContract[field], false, `quota.${field}`);
  }
  expectEqual(errors, quotaContract.freshness_target_minutes, 5, "quota.freshness_target_minutes");

  for (const field of [
    "billing_provider_calls",
    "frontend",
    "live_ledger_reads",
    "persistent_writes",
    "sql_emitted"
  ]) {
    expectEqual(errors, billingContract[field], false, `billing.${field}`);
  }
  expectEqual(errors, billingContract.freshness_target_minutes, 5, "billing.freshness_target_minutes");

  return errors;
}

function validatePackage(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const command = "node scripts/check-sprint1-live-data-activation-contract.mjs";

  if (scripts["check:sprint1-live-data-activation"] !== command) {
    errors.push("package.json check:sprint1-live-data-activation script is missing");
  }

  if (!String(scripts.check ?? "").includes("npm run check:sprint1-live-data-activation")) {
    errors.push("root check must include check:sprint1-live-data-activation");
  }

  if (
    scripts["check:sprint1-live-data-evidence-manifest"] !==
    "node scripts/check-sprint1-live-data-evidence-manifest-contract.mjs"
  ) {
    errors.push("package.json check:sprint1-live-data-evidence-manifest script is missing");
  }

  if (
    scripts["check:sprint1-live-data-evidence-manifest-fixtures"] !==
    "node scripts/check-sprint1-live-data-evidence-manifest-fixtures.mjs"
  ) {
    errors.push("package.json check:sprint1-live-data-evidence-manifest-fixtures script is missing");
  }

  if (!String(scripts.check ?? "").includes("npm run check:sprint1-live-data-evidence-manifest")) {
    errors.push("root check must include check:sprint1-live-data-evidence-manifest");
  }

  if (!String(scripts.check ?? "").includes("npm run check:sprint1-live-data-evidence-manifest-fixtures")) {
    errors.push("root check must include check:sprint1-live-data-evidence-manifest-fixtures");
  }

  return errors;
}

function validateDocs({ docs, todos, tracker }) {
  const errors = [];
  const combined = `${docs}\n${todos}\n${tracker}`;

  for (const text of [
    "sprint1-live-data-activation",
    "sprint1-live-data-evidence-manifest",
    "npm run check:sprint1-live-data-activation",
    "npm run check:sprint1-live-data-evidence-manifest",
    "npm run check:sprint1-live-data-evidence-manifest-fixtures",
    "Data Access Gateway live Serving",
    "Usage ledger live writes",
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
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
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
