#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/documents/user-public-data-join-privacy.contract.json";
const migrationPath =
  "deploy/database/migrations/20260622012000_user_public_data_join_privacy_scaffold.sql";
const requiredItems = ["DOC-05", "STK-08"];
const requiredTools = [
  "search_documents",
  "document_sanitizer",
  "data_access_gateway",
  "restricted_exports",
  "field_authorization_config"
];
const requiredLinkedContracts = [
  "deploy/documents/search-documents.contract.json",
  "deploy/documents/document-sanitizer.contract.json",
  "deploy/gateway/access.contract.json",
  "deploy/gateway/restricted-exports.contract.json",
  "deploy/gateway/field-authorization-config.contract.json"
];
const requiredInputs = [
  "workspace_id",
  "user_file_id",
  "user_file_sha256",
  "user_consent_id",
  "public_data_scope",
  "field_authorization_policy_id",
  "join_keys",
  "requested_fields",
  "privacy_policy_id",
  "retention_policy_id"
];
const requiredStatuses = [
  "planned_no_write",
  "blocked_missing_workspace",
  "blocked_missing_user_file",
  "blocked_missing_consent",
  "blocked_missing_public_data_scope",
  "blocked_missing_field_authorization",
  "blocked_missing_join_keys",
  "blocked_missing_privacy_policy",
  "blocked_missing_retention_policy"
];
const requiredJoinKeys = ["instrument_id", "document_id", "period", "source_record_id"];
const forbiddenOperations = [
  "raw_file_body_storage",
  "public_data_live_provider_read",
  "join_result_persistent_write",
  "cross_workspace_join",
  "public_output_private_user_data",
  "layout_frontend_rendering",
  "sql_execution",
  "model_training_on_user_file"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const errors = validateContract(contract);

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
    route: contract.route,
    status: "ok",
    tool_name: contract.tool_name
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

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase4.user-public-data-join-privacy-scaffold.v0") {
    errors.push("version must match user/public data join privacy scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/document-tools") {
    errors.push("package must be @aiphabee/document-tools");
  }

  if (value.runtime_route !== "GET /documents/runtime") {
    errors.push("runtime_route must be GET /documents/runtime");
  }

  if (value.route !== "POST /documents/user-public-data-join/plan") {
    errors.push("route must be POST /documents/user-public-data-join/plan");
  }

  if (value.tool_name !== "user_public_data_join_privacy_plan") {
    errors.push("tool_name must be user_public_data_join_privacy_plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_upload_storage",
    "public_data_live_read",
    "join_execution_live",
    "sql_emitted",
    "persistent_writes",
    "model_calls",
    "r2_writes",
    "raw_file_body_persisted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(...validateStringArray(value.covered_phase_4_items, requiredItems, "covered_phase_4_items"));
  errors.push(...validateStringArray(value.source_tools, requiredTools, "source_tools"));
  errors.push(...validateLinkedContracts(value.linked_contracts));
  errors.push(...validatePrivacyContract(value.privacy_contract));
  errors.push(...validateJoinContract(value.join_contract));
  errors.push(...validateCustomLayoutContract(value.custom_layout_contract));
  errors.push(...validateStringArray(value.required_inputs, requiredInputs, "required_inputs"));
  errors.push(...validateStringArray(value.expected_statuses, requiredStatuses, "expected_statuses"));
  errors.push(...validateStringArray(value.forbidden_operations, forbiddenOperations, "forbidden_operations"));
  errors.push(...validateStringArray(value.migrations, [migrationPath], "migrations"));
  errors.push(...validateMigration());
  errors.push(...validatePackageScript());
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateLinkedContracts(value) {
  const errors = validateStringArray(value, requiredLinkedContracts, "linked_contracts");

  if (Array.isArray(value)) {
    for (const path of value) {
      if (typeof path === "string" && !existsSync(resolve(process.cwd(), path))) {
        errors.push(`${path} must exist`);
      }
    }
  }

  return errors;
}

function validatePrivacyContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["privacy_contract must be an object"];
  }

  for (const field of [
    "workspace_scoped_user_file",
    "user_consent_required",
    "privacy_policy_required",
    "retention_policy_required",
    "deletion_policy_required",
    "document_sanitizer_required",
    "field_authorization_required",
    "audit_event_metadata_only",
    "file_hash_or_id_only",
    "prompt_injection_isolated"
  ]) {
    if (value[field] !== true) {
      errors.push(`privacy_contract.${field} must be true`);
    }
  }

  for (const field of [
    "raw_file_body_persisted",
    "user_file_reused_for_model_training",
    "cross_workspace_join",
    "public_output_contains_user_private_data",
    "public_data_rights_expansion"
  ]) {
    if (value[field] !== false) {
      errors.push(`privacy_contract.${field} must be false`);
    }
  }

  return errors;
}

function validateJoinContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["join_contract must be an object"];
  }

  if (value.source !== "synthetic_user_file_public_data_join_plan") {
    errors.push("join_contract.source must be synthetic_user_file_public_data_join_plan");
  }

  if (value.join_key_policy !== "explicit_allowlist") {
    errors.push("join_contract.join_key_policy must be explicit_allowlist");
  }

  errors.push(...validateStringArray(value.supported_join_keys, requiredJoinKeys, "join_contract.supported_join_keys"));

  for (const field of [
    "requested_fields_minimized",
    "row_level_workspace_filter",
    "synthetic_join_plan_only"
  ]) {
    if (value[field] !== true) {
      errors.push(`join_contract.${field} must be true`);
    }
  }

  if (value.join_execution_live !== false) {
    errors.push("join_contract.join_execution_live must be false");
  }

  if (value.gateway_access_route !== "POST /gateway/access-check") {
    errors.push("join_contract.gateway_access_route must be POST /gateway/access-check");
  }

  if (value.gateway_export_route !== "POST /gateway/exports/plan") {
    errors.push("join_contract.gateway_export_route must be POST /gateway/exports/plan");
  }

  return errors;
}

function validateCustomLayoutContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["custom_layout_contract must be an object"];
  }

  if (value.layout_scope !== "workspace_private") {
    errors.push("custom_layout_contract.layout_scope must be workspace_private");
  }

  for (const field of [
    "layout_metadata_only",
    "save_plan_no_write",
    "references_user_file_by_id_only",
    "references_public_data_scope_by_id_only"
  ]) {
    if (value[field] !== true) {
      errors.push(`custom_layout_contract.${field} must be true`);
    }
  }

  if (value.frontend_layout_editor !== false) {
    errors.push("custom_layout_contract.frontend_layout_editor must be false");
  }

  return errors;
}

function validateMigration() {
  const errors = [];
  const fullPath = resolve(process.cwd(), migrationPath);

  if (!existsSync(fullPath)) {
    return [`${migrationPath} must exist`];
  }

  const sql = readText(migrationPath);

  for (const needle of [
    "aiphabee_core.user_public_data_join_plan",
    "aiphabee_audit.user_public_data_join_event",
    "aiphabee_governance.user_public_data_join_privacy_contract",
    "raw_file_body_persisted boolean not null default false check",
    "public_data_live_read boolean not null default false check",
    "cross_workspace_join boolean not null default false check",
    "custom_layout_metadata_only boolean not null default true check",
    "persistent_write_enabled boolean not null default false check",
    "sql_emitted boolean not null default false check"
  ]) {
    if (!sql.includes(needle)) {
      errors.push(`${migrationPath} must include ${needle}`);
    }
  }

  return errors;
}

function validatePackageScript() {
  const packageJson = readJson("package.json");

  if (!isRecord(packageJson) || !isRecord(packageJson.scripts)) {
    return ["package.json scripts must be an object"];
  }

  const script = packageJson.scripts["check:user-public-data-join-privacy"];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-user-public-data-join-privacy-contract.mjs")
  ) {
    return ["check:user-public-data-join-privacy script must run its contract checker"];
  }

  if (
    typeof packageJson.scripts.check !== "string" ||
    !packageJson.scripts.check.includes("check:user-public-data-join-privacy")
  ) {
    return ["root check script must include check:user-public-data-join-privacy"];
  }

  return [];
}

function validateStringArray(value, required, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const missing = required.filter((item) => !value.includes(item));

  return missing.map((item) => `${label} must include ${item}`);
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract must not contain secret-like value matching ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
