#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/usage/billing-rules-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationFile =
  "deploy/database/migrations/20260622002000_billing_rules_release_gate_scaffold.sql";
const requiredChecks = [
  "package_credit_overage_rules_documented",
  "weighted_credit_model_referenced",
  "refund_and_proration_rules_blocked_without_provider_preview",
  "invoice_credits_match_usage_ledger_credits",
  "request_id_trace_links_invoice_ledger_usage_event",
  "high_cost_pre_debit_and_failure_refund_planned"
];
const requiredOutputFields = [
  "package_rules",
  "subscription_rules",
  "quota_gate",
  "billing_reconciliation_gate",
  "high_cost_gate",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredTables = [
  "aiphabee_core.billing_rules_release_gate",
  "aiphabee_audit.billing_rules_drill_event",
  "aiphabee_governance.billing_rules_release_gate_contract"
];
const requiredLinkedContracts = [
  "deploy/account/package-pricing.contract.json",
  "deploy/account/subscription-lifecycle.contract.json",
  "deploy/usage/quota-display.contract.json",
  "deploy/usage/billing-reconciliation.contract.json",
  "deploy/usage/high-cost-reservation.contract.json",
  "deploy/database/migrations.contract.json"
];
const requiredBlockers = [
  "final_commercial_quote_missing",
  "live_billing_provider_missing",
  "live_usage_ledger_reads_missing",
  "live_invoice_write_missing",
  "frontend_billing_ui_missing"
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

  if (value.version !== "2026-06-22.phase3.billing-rules-release-gate-scaffold.v0") {
    errors.push("version must match billing rules release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/usage-ledger") {
    errors.push("package must be @aiphabee/usage-ledger");
  }

  if (value.runtime_route !== "GET /usage/runtime") {
    errors.push("runtime_route must be GET /usage/runtime");
  }

  if (value.route !== "POST /usage/release-gates/billing-rules/plan") {
    errors.push("route must be POST /usage/release-gates/billing-rules/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const [field, expected] of Object.entries({
    account_package_route: "GET /account/package-pricing",
    billing_reconciliation_route: "POST /usage/billing/reconciliation/plan",
    high_cost_reservation_route: "POST /usage/high-cost/reservation/plan",
    quota_route: "POST /usage/quota/plan",
    subscription_route: "POST /account/subscription/lifecycle/plan"
  })) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  for (const field of [
    "frontend",
    "live_billing_provider",
    "live_ledger_reads",
    "live_ledger_writes",
    "invoice_writes",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validatePackageRules(value.package_rules));
  errors.push(...validateSubscriptionRules(value.subscription_rules));
  errors.push(...validateUsageLedgerRules(value.usage_ledger_rules));
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

function validatePackageRules(value) {
  if (!isRecord(value)) {
    return ["package_rules must be an object"];
  }

  const errors = [];

  if (value.currency !== "HKD") {
    errors.push("package_rules.currency must be HKD");
  }

  if (value.pro_credit_limit !== 5000) {
    errors.push("package_rules.pro_credit_limit must be 5000");
  }

  if (value.developer_credit_limit !== 10000) {
    errors.push("package_rules.developer_credit_limit must be 10000");
  }

  if (value.developer_overage_enabled !== true) {
    errors.push("package_rules.developer_overage_enabled must be true");
  }

  if (value.final_commercial_quote_present !== false) {
    errors.push("package_rules.final_commercial_quote_present must be false");
  }

  if (value.pricing_source !== "docs/researches/AiphaBee_PRD_v1.0.md#15.2") {
    errors.push("package_rules.pricing_source must point to PRD 15.2");
  }

  if (value.weighted_credit_model_source !== "docs/researches/AiphaBee_PRD_v1.0.md#15.3") {
    errors.push("package_rules.weighted_credit_model_source must point to PRD 15.3");
  }

  return errors;
}

function validateSubscriptionRules(value) {
  if (!isRecord(value)) {
    return ["subscription_rules must be an object"];
  }

  const errors = [];

  for (const field of ["billing_provider_calls", "refund_preview_live", "proration_preview_live"]) {
    if (value[field] !== false) {
      errors.push(`subscription_rules.${field} must be false`);
    }
  }

  if (value.lifecycle_audit_required !== true) {
    errors.push("subscription_rules.lifecycle_audit_required must be true");
  }

  return errors;
}

function validateUsageLedgerRules(value) {
  if (!isRecord(value)) {
    return ["usage_ledger_rules must be an object"];
  }

  const errors = [];

  for (const field of [
    "invoice_credits_must_match_ledger_credits",
    "request_id_trace_required",
    "pre_debit_required_for_high_cost",
    "failure_refund_required_for_high_cost"
  ]) {
    if (value[field] !== true) {
      errors.push(`usage_ledger_rules.${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.required_trace_fields,
      ["request_id", "usage_event_id", "ledger_entry_id", "invoice_line_id"],
      "usage_ledger_rules.required_trace_fields"
    )
  );

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_billing_rules_validation") {
    errors.push("release_gate.gate_status must be blocked_live_billing_rules_validation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["billing", "finance", "data-rights", "support", "ops"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validatePackageScript(packageValue) {
  if (!isRecord(packageValue) || !isRecord(packageValue.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (
    packageValue.scripts["check:billing-rules-release-gate"] !==
    "node scripts/check-billing-rules-release-gate-contract.mjs"
  ) {
    errors.push("package.json must define check:billing-rules-release-gate");
  }

  if (
    typeof packageValue.scripts.check !== "string" ||
    !packageValue.scripts.check.includes("npm run check:billing-rules-release-gate")
  ) {
    errors.push("package.json check script must include check:billing-rules-release-gate");
  }

  return errors;
}

function validateDatabaseTables(databaseValue) {
  if (!isRecord(databaseValue) || !Array.isArray(databaseValue.migrations)) {
    return ["database migrations contract must include migrations"];
  }

  const migration = databaseValue.migrations.find(
    (entry) => isRecord(entry) && entry.file === migrationFile
  );
  if (!isRecord(migration)) {
    return [`database migrations contract must include ${migrationFile}`];
  }

  const errors = [];

  errors.push(
    ...validateStringArray(migration.schemas, ["aiphabee_audit", "aiphabee_core", "aiphabee_governance"], "migration.schemas")
  );
  errors.push(...validateStringArray(migration.tables, requiredTables, "migration.tables"));

  if (migration.market_data !== false) {
    errors.push("migration.market_data must be false");
  }

  if (migration.default_rights_status !== "default_deny") {
    errors.push("migration.default_rights_status must be default_deny");
  }

  if (!existsSync(resolve(process.cwd(), migrationFile))) {
    errors.push(`${migrationFile} must exist`);
  }

  return errors;
}

function validateLinkedContractFiles(paths) {
  if (!Array.isArray(paths)) {
    return ["linked_contracts must be an array"];
  }

  return paths
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked contract missing: ${String(path)}`);
}

function validateStringArray(value, expected, path) {
  if (!Array.isArray(value)) {
    return [`${path} must be an array`];
  }

  const actual = value.filter((item) => typeof item === "string");
  const errors = [];

  for (const item of expected) {
    if (!actual.includes(item)) {
      errors.push(`${path} must include ${item}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract must not contain secret-like value matching ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(code);
}
