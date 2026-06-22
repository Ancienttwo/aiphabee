#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/usage/partner-sla-reconciliation-readiness.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const requiredCadences = ["daily", "weekly"];
const requiredSlaFields = [
  "data_delay_minutes",
  "missing_rows",
  "error_count",
  "backfill_count"
];
const requiredChecks = [
  "daily_report_generated",
  "weekly_report_generated",
  "sla_counters_cover_delay_missing_error_backfill",
  "request_usage_trace_complete",
  "partner_support_release_gate_passed",
  "live_surfaces_blocked",
  "sensitive_payloads_excluded"
];
const requiredOutputFields = [
  "daily_report",
  "weekly_report",
  "sla_summary",
  "support_release_gate",
  "readiness",
  "release_checks",
  "release_gate",
  "usage_fixture_rows"
];
const requiredTables = [
  "core.usage_event",
  "core.usage_ledger_entry",
  "core.partner_reconciliation_report",
  "core.partner_reconciliation_report_line",
  "audit.partner_reconciliation_event",
  "governance.partner_reconciliation_contract",
  "core.partner_support_release_gate",
  "audit.partner_support_drill_event",
  "governance.partner_support_release_gate_contract"
];
const requiredBlockers = [
  "live_usage_ledger_reads_missing",
  "live_partner_report_artifact_store_missing",
  "partner_portal_delivery_missing",
  "final_partner_settlement_approval_missing"
];
const requiredLinkedContracts = [
  "deploy/usage/partner-reconciliation-report.contract.json",
  "deploy/usage/partner-support-release-gate.contract.json",
  "deploy/support/request-id-investigation.contract.json",
  "deploy/database/migrations.contract.json"
];
const requiredForbiddenPayloads = [
  "raw_prompt",
  "generated_answer",
  "raw_email",
  "raw_personal_contact",
  "credential_material",
  "payment_identifier",
  "document_body"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson(packageJsonPath);
const errors = validateContract(contract, databaseContract, packageJson);

if (errors.length > 0) {
  emit({ errors, path: contractPath, status: "invalid_contract" }, 1);
}

emit(
  {
    checks: contract.required_checks.length,
    route: contract.route,
    status: "ok"
  },
  0
);

function validateContract(value, databaseValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase3.partner-sla-reconciliation-readiness.v0") {
    errors.push("version must match partner SLA reconciliation readiness version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/usage-ledger") {
    errors.push("package must be @aiphabee/usage-ledger");
  }

  for (const [field, expected] of Object.entries({
    covered_requirement: "DAT-10",
    partner_reconciliation_route: "POST /usage/partner-reconciliation/plan",
    partner_support_release_gate_route: "POST /usage/release-gates/partner-support/plan",
    route: "GET /usage/partner-sla/reconciliation-readiness",
    runtime_route: "GET /usage/runtime"
  })) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "billing_provider_calls",
    "live_ledger_reads",
    "live_support_log_reads",
    "live_partner_report_artifact_store",
    "partner_portal_delivery",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validateStringArray(value.supported_cadences, requiredCadences, "supported_cadences"));
  errors.push(...validateStringArray(value.required_sla_fields, requiredSlaFields, "required_sla_fields"));
  errors.push(...validateStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(value.linked_contracts, requiredLinkedContracts, "linked_contracts")
  );
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validatePrivacy(value.privacy));
  errors.push(...validateLinkedContractFiles(value.linked_contracts));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_partner_sla_reconciliation") {
    errors.push("release_gate.gate_status must be blocked_live_partner_sla_reconciliation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["data-partner", "support", "billing", "ops", "compliance"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validatePrivacy(value) {
  if (!isRecord(value)) {
    return ["privacy must be an object"];
  }

  const errors = [];

  if (value.sensitive_payloads_excluded !== true) {
    errors.push("privacy.sensitive_payloads_excluded must be true");
  }

  errors.push(
    ...validateStringArray(
      value.forbidden_payloads,
      requiredForbiddenPayloads,
      "privacy.forbidden_payloads"
    )
  );

  return errors;
}

function validateLinkedContractFiles(values) {
  if (!Array.isArray(values)) {
    return ["linked_contracts must be an array"];
  }

  return values
    .filter((path) => typeof path === "string" && !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked contract does not exist: ${path}`);
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must exist"];
  }

  const expected = "node scripts/check-partner-sla-reconciliation-readiness-contract.mjs";
  const errors = [];

  if (value.scripts["check:partner-sla-reconciliation-readiness"] !== expected) {
    errors.push("package.json must expose check:partner-sla-reconciliation-readiness");
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:partner-sla-reconciliation-readiness")
  ) {
    errors.push("root check must include check:partner-sla-reconciliation-readiness");
  }

  return errors;
}

function validateDatabaseTables(value) {
  if (!isRecord(value)) {
    return ["database contract must be an object"];
  }

  const serialized = JSON.stringify(value);
  return requiredTables
    .filter((table) => !serialized.includes(table))
    .map((table) => `database contract must include ${table}`);
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern}`);
}

function validateStringArray(value, expected, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const missing = expected.filter((item) => !value.includes(item));
  const extra = value.filter((item) => typeof item !== "string" || !expected.includes(item));
  const errors = [];

  if (missing.length > 0) {
    errors.push(`${label} missing ${missing.join(", ")}`);
  }

  if (extra.length > 0) {
    errors.push(`${label} has unexpected values ${extra.join(", ")}`);
  }

  return errors;
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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
