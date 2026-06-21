#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/sharing/privacy-share-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationFile =
  "supabase/migrations/20260622000000_privacy_share_release_gate_scaffold.sql";
const requiredChecks = [
  "personal_data_download_delivery_is_scoped_and_no_write",
  "personal_data_delete_respects_retention_holds",
  "share_link_rechecks_recipient_entitlement",
  "share_link_effective_fields_are_intersection",
  "share_link_does_not_expand_rights",
  "private_link_has_expiry_watermark_and_no_public_index"
];
const requiredOutputFields = [
  "account_data_request_gate",
  "private_share_gate",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredTables = [
  "core.privacy_share_release_gate",
  "governance.privacy_share_release_gate_contract"
];
const requiredCoveredItems = [
  "personal_data_delivery_retention_compliance",
  "private_share_link_no_rights_expansion"
];
const requiredLinkedContracts = [
  "deploy/account/data-request.contract.json",
  "deploy/sharing/private-share-link.contract.json",
  "deploy/database/migrations.contract.json"
];
const requiredBlockers = [
  "live_privacy_delivery_job_missing",
  "live_retention_policy_source_missing",
  "live_share_handle_generation_missing",
  "external_privacy_legal_signoff_missing",
  "frontend_privacy_share_release_ui_missing"
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

  if (value.version !== "2026-06-22.phase3.privacy-share-release-gate-scaffold.v0") {
    errors.push("version must match privacy share release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/sharing-runtime") {
    errors.push("package must be @aiphabee/sharing-runtime");
  }

  if (value.runtime_route !== "GET /sharing/runtime") {
    errors.push("runtime_route must be GET /sharing/runtime");
  }

  if (value.route !== "POST /sharing/release-gates/privacy-share/plan") {
    errors.push("route must be POST /sharing/release-gates/privacy-share/plan");
  }

  if (value.account_data_runtime_route !== "GET /account/runtime") {
    errors.push("account_data_runtime_route must be GET /account/runtime");
  }

  if (value.account_data_request_route !== "POST /account/data-requests/plan") {
    errors.push("account_data_request_route must be POST /account/data-requests/plan");
  }

  if (value.private_share_route !== "POST /sharing/private-links/plan") {
    errors.push("private_share_route must be POST /sharing/private-links/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_data_access",
    "live_data_export",
    "live_db_writes",
    "live_share_handle_generation",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validatePersonalDataDownload(value.personal_data_download));
  errors.push(...validatePersonalDataErasure(value.personal_data_erasure));
  errors.push(...validatePrivateShare(value.private_share));
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
    ...validateStringArray(
      value.covered_sprint_3_3_items,
      requiredCoveredItems,
      "covered_sprint_3_3_items"
    )
  );
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

function validatePersonalDataDownload(value) {
  if (!isRecord(value)) {
    return ["personal_data_download must be an object"];
  }

  const errors = [];

  for (const field of [
    "secure_delivery_required",
    "scoped_request_items_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`personal_data_download.${field} must be true`);
    }
  }

  for (const field of ["raw_email_included", "credential_material_included", "raw_prompt_included"]) {
    if (value[field] !== false) {
      errors.push(`personal_data_download.${field} must be false`);
    }
  }

  if (value.delivery_status !== "planned_no_write") {
    errors.push("personal_data_download.delivery_status must be planned_no_write");
  }

  return errors;
}

function validatePersonalDataErasure(value) {
  if (!isRecord(value)) {
    return ["personal_data_erasure must be an object"];
  }

  const errors = [];

  if (value.retention_policy_required !== true) {
    errors.push("personal_data_erasure.retention_policy_required must be true");
  }

  if (value.erasure_policy !== "delete_or_anonymize_when_not_retained") {
    errors.push("personal_data_erasure.erasure_policy must match account data request contract");
  }

  if (value.unsupported_scopes_block_before_write !== true) {
    errors.push("personal_data_erasure.unsupported_scopes_block_before_write must be true");
  }

  errors.push(
    ...validateStringArray(
      value.retention_hold_scopes,
      ["subscription_billing", "usage_ledger", "audit_log"],
      "personal_data_erasure.retention_hold_scopes"
    )
  );

  return errors;
}

function validatePrivateShare(value) {
  if (!isRecord(value)) {
    return ["private_share must be an object"];
  }

  const errors = [];

  for (const field of [
    "recipient_entitlement_recheck",
    "effective_fields_must_equal_intersection",
    "redaction_required_when_recipient_lacks_field",
    "watermark_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`private_share.${field} must be true`);
    }
  }

  for (const field of [
    "recipient_data_rights_expansion",
    "share_expands_recipient_rights",
    "public_indexing",
    "link_handle_materialized"
  ]) {
    if (value[field] !== false) {
      errors.push(`private_share.${field} must be false`);
    }
  }

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_privacy_share_validation") {
    errors.push("release_gate.gate_status must be blocked_live_privacy_share_validation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["security", "privacy", "data_governance", "legal"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validateLinkedContractFiles(value) {
  if (!Array.isArray(value)) {
    return ["linked_contracts must be an array"];
  }

  return value
    .filter((path) => typeof path === "string" && !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked contract file missing: ${path}`);
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:privacy-share-release-gate"];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-privacy-share-release-gate-contract.mjs")
  ) {
    return ["check:privacy-share-release-gate script must run its contract checker"];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("check:privacy-share-release-gate")
  ) {
    return ["root check script must include check:privacy-share-release-gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const migrations = isRecord(value) && Array.isArray(value.migrations) ? value.migrations : [];
  const migration = migrations.find((entry) => isRecord(entry) && entry.file === migrationFile);

  if (!isRecord(migration)) {
    return ["database contract must include privacy share release gate migration"];
  }

  return validateStringArray(migration.tables, requiredTables, "database migration tables");
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`secret-like pattern detected: ${pattern}`);
    }
  }

  return errors;
}

function validateStringArray(value, expected, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const actual = value.filter((item) => typeof item === "string");

  if (actual.length !== value.length) {
    return [`${label} must contain only strings`];
  }

  if (actual.length !== expected.length) {
    return [`${label} length must be ${expected.length}`];
  }

  return expected
    .filter((item, index) => actual[index] !== item)
    .map((item, index) => `${label}[${index}] must be ${item}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
