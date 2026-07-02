#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/usage/partner-support-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationFile =
  "deploy/database/migrations/20260622003000_partner_support_release_gate_scaffold.sql";
const requiredChecks = [
  "partner_report_generated",
  "partner_report_trace_links_request_id_and_usage_event",
  "partner_report_sla_counters_present",
  "support_request_id_investigation_metadata_only",
  "sensitive_payloads_excluded",
  "live_artifact_and_log_reads_blocked"
];
const requiredOutputFields = [
  "partner_reconciliation_gate",
  "support_investigation_gate",
  "ops_drill",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredTables = [
  "aiphabee_core.partner_support_release_gate",
  "aiphabee_audit.partner_support_drill_event",
  "aiphabee_governance.partner_support_release_gate_contract"
];
const requiredLinkedContracts = [
  "deploy/usage/partner-reconciliation-report.contract.json",
  "deploy/support/request-id-investigation.contract.json",
  "deploy/database/migrations.contract.json"
];
const requiredBlockers = [
  "live_usage_ledger_reads_missing",
  "live_partner_report_artifact_store_missing",
  "partner_portal_delivery_missing",
  "live_support_log_reads_missing",
  "frontend_ops_ui_missing",
  "final_partner_settlement_approval_missing"
];
const requiredForbiddenFields = [
  "raw_prompt",
  "generated_answer",
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret",
  "api_key_material",
  "payment_method",
  "portfolio_holdings",
  "document_body",
  "personal_contact_detail"
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

function validateContract(value, databaseValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase3.partner-support-release-gate-scaffold.v0") {
    errors.push("version must match partner support release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/usage-ledger") {
    errors.push("package must be @aiphabee/usage-ledger");
  }

  for (const [field, expected] of Object.entries({
    partner_reconciliation_route: "POST /usage/partner-reconciliation/plan",
    route: "POST /usage/release-gates/partner-support/plan",
    runtime_route: "GET /usage/runtime",
    support_help_center_route: "GET /support/help-center",
    support_investigation_route: "POST /support/request-id-investigation/plan",
    support_runtime_route: "GET /support/runtime"
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

  errors.push(...validatePartnerReportRules(value.partner_report_rules));
  errors.push(...validateSupportRules(value.support_rules));
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
  errors.push(...validateLinkedContractFiles(value.linked_contracts));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validatePartnerReportRules(value) {
  if (!isRecord(value)) {
    return ["partner_report_rules must be an object"];
  }

  const errors = [];

  errors.push(
    ...validateStringArray(
      value.group_by,
      ["dataset", "channel", "package_code", "user_id"],
      "partner_report_rules.group_by"
    )
  );
  errors.push(
    ...validateStringArray(
      value.sla_fields_required,
      ["data_delay_minutes", "missing_rows", "error_count", "backfill_count"],
      "partner_report_rules.sla_fields_required"
    )
  );
  errors.push(
    ...validateStringArray(
      value.supported_formats,
      ["csv", "json"],
      "partner_report_rules.supported_formats"
    )
  );

  for (const field of ["request_id_trace_required", "usage_event_trace_required"]) {
    if (value[field] !== true) {
      errors.push(`partner_report_rules.${field} must be true`);
    }
  }

  if (value.live_artifact_writes !== false) {
    errors.push("partner_report_rules.live_artifact_writes must be false");
  }

  return errors;
}

function validateSupportRules(value) {
  if (!isRecord(value)) {
    return ["support_rules must be an object"];
  }

  const errors = [];

  for (const field of ["request_id_required", "support_agent_required", "metadata_only"]) {
    if (value[field] !== true) {
      errors.push(`support_rules.${field} must be true`);
    }
  }

  for (const field of ["live_log_reads", "live_billing_provider_reads"]) {
    if (value[field] !== false) {
      errors.push(`support_rules.${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.planned_sources,
      [
        "standard_response_envelope",
        "mcp_error_detail",
        "usage_ledger_event",
        "usage_billing_reconciliation",
        "public_status_component"
      ],
      "support_rules.planned_sources"
    )
  );
  errors.push(
    ...validateStringArray(
      value.forbidden_fields,
      requiredForbiddenFields,
      "support_rules.forbidden_fields"
    )
  );

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_partner_support_validation") {
    errors.push("release_gate.gate_status must be blocked_live_partner_support_validation");
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

  const expected = "node scripts/check-partner-support-release-gate-contract.mjs";
  const errors = [];

  if (value.scripts["check:partner-support-release-gate"] !== expected) {
    errors.push("package.json must expose check:partner-support-release-gate");
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:partner-support-release-gate")
  ) {
    errors.push("root check must include check:partner-support-release-gate");
  }

  return errors;
}

function validateDatabaseTables(value) {
  if (!isRecord(value) || !Array.isArray(value.migrations)) {
    return ["database migrations contract must expose migrations array"];
  }

  const migration = value.migrations.find(
    (item) => isRecord(item) && item.file === migrationFile
  );

  if (!isRecord(migration)) {
    return [`database migrations contract must include ${migrationFile}`];
  }

  const errors = validateStringArray(migration.tables, requiredTables, "database migration tables");

  if (migration.market_data !== false) {
    errors.push("database migration market_data must be false");
  }

  if (migration.default_rights_status !== "default_deny") {
    errors.push("database migration default_rights_status must be default_deny");
  }

  if (!existsSync(resolve(process.cwd(), migrationFile))) {
    errors.push(`migration file is missing: ${migrationFile}`);
  }

  return errors;
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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
