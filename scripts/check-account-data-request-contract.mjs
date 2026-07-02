#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/account/data-request.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredActions = ["download", "delete"];
const requiredScopes = [
  "account_profile",
  "workspace_membership",
  "subscription_billing",
  "mcp_credentials_metadata",
  "authorized_memory",
  "saved_research",
  "usage_ledger",
  "audit_log"
];
const requiredControls = ["download", "delete_request", "status"];
const requiredRetentionHoldScopes = ["subscription_billing", "usage_ledger", "audit_log"];
const requiredDeleteAllowedScopes = [
  "account_profile",
  "workspace_membership",
  "mcp_credentials_metadata",
  "authorized_memory",
  "saved_research"
];
const requiredTables = [
  "aiphabee_core.account_data_request",
  "aiphabee_core.account_data_request_item",
  "aiphabee_audit.account_data_request_event",
  "aiphabee_governance.account_data_request_contract"
];
const requiredOutputFields = [
  "account",
  "workspace",
  "request",
  "delivery",
  "retention_policy",
  "execution_plan",
  "audit",
  "privacy",
  "validation"
];
const forbiddenPayloads = [
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret",
  "raw_prompt",
  "generated_answer",
  "payment_identifier"
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
const errors = validateContract(contract, databaseContract);

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
    actions: contract.request_actions,
    retention_hold_scopes: contract.retention_policy.retention_hold_scopes.length,
    route: contract.route,
    status: "ok",
    tables: contract.tables.length
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

function validateContract(value, databaseValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase3.account-data-request-scaffold.v0") {
    errors.push("version must match the account data request scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/account-runtime") {
    errors.push("package must be @aiphabee/account-runtime");
  }

  if (value.runtime_route !== "GET /account/runtime") {
    errors.push("runtime_route must be GET /account/runtime");
  }

  if (value.route !== "POST /account/data-requests/plan") {
    errors.push("route must be POST /account/data-requests/plan");
  }

  for (const field of ["frontend", "live_data_export", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  errors.push(...validateStringArray(value.request_actions, requiredActions, "request_actions"));
  errors.push(...validateStringArray(value.request_scopes, requiredScopes, "request_scopes"));
  errors.push(
    ...validateStringArray(value.user_visible_controls, requiredControls, "user_visible_controls")
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(...validateStringArray(value.forbidden_payloads, forbiddenPayloads, "forbidden_payloads"));
  errors.push(...validateRetentionPolicy(value.retention_policy));
  errors.push(...validateAudit(value.audit));
  errors.push(...validateDelivery(value.delivery));
  errors.push(...validatePrivacyContract(value.privacy_contract));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateRetentionPolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["retention_policy must be an object"];
  }

  if (value.source !== "docs/researches/AiphaBee_PRD_v1.0.md#ACC-05") {
    errors.push("retention_policy.source must point to ACC-05");
  }

  if (value.policy_version_required !== true) {
    errors.push("retention_policy.policy_version_required must be true");
  }

  if (value.erasure_policy !== "delete_or_anonymize_when_not_retained") {
    errors.push("retention_policy.erasure_policy must preserve retention-aware erasure");
  }

  errors.push(
    ...validateStringArray(
      value.delete_allowed_scopes,
      requiredDeleteAllowedScopes,
      "retention_policy.delete_allowed_scopes"
    )
  );
  errors.push(
    ...validateStringArray(
      value.export_allowed_scopes,
      requiredScopes,
      "retention_policy.export_allowed_scopes"
    )
  );
  errors.push(
    ...validateStringArray(
      value.retention_hold_scopes,
      requiredRetentionHoldScopes,
      "retention_policy.retention_hold_scopes"
    )
  );

  return errors;
}

function validateAudit(value) {
  if (!isRecord(value)) {
    return ["audit must be an object"];
  }

  const errors = [];

  if (value.required !== true) {
    errors.push("audit.required must be true");
  }

  if (value.audit_event !== "account.data_request.plan") {
    errors.push("audit.audit_event must be account.data_request.plan");
  }

  if (value.event_table !== "aiphabee_audit.account_data_request_event") {
    errors.push("audit.event_table must be aiphabee_audit.account_data_request_event");
  }

  if (value.identity_verification_required !== true) {
    errors.push("audit.identity_verification_required must be true");
  }

  if (value.policy_version_required !== true) {
    errors.push("audit.policy_version_required must be true");
  }

  return errors;
}

function validateDelivery(value) {
  if (!isRecord(value)) {
    return ["delivery must be an object"];
  }

  const errors = [];

  if (value.secure_delivery_required !== true) {
    errors.push("delivery.secure_delivery_required must be true");
  }

  errors.push(...validateStringArray(value.download_formats, ["json", "csv"], "delivery.download_formats"));

  if (value.expires_after_delivery !== true) {
    errors.push("delivery.expires_after_delivery must be true");
  }

  return errors;
}

function validatePrivacyContract(value) {
  if (!isRecord(value)) {
    return ["privacy_contract must be an object"];
  }

  const errors = [];

  for (const field of [
    "raw_email_included",
    "credential_material_included",
    "raw_prompt_included"
  ]) {
    if (value[field] !== false) {
      errors.push(`privacy_contract.${field} must be false`);
    }
  }

  for (const field of [
    "delete_request_does_not_remove_retained_audit_logs",
    "unsupported_scopes_block_before_write"
  ]) {
    if (value[field] !== true) {
      errors.push(`privacy_contract.${field} must be true`);
    }
  }

  return errors;
}

function validateDatabaseTables(databaseValue) {
  const migrations = isRecord(databaseValue) && Array.isArray(databaseValue.migrations)
    ? databaseValue.migrations
    : [];
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file === "deploy/database/migrations/20260621128000_account_data_request_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database contract must include account data request migration"];
  }

  return validateStringArray(migration.tables, requiredTables, "database migration tables");
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern}`);
    }
  }

  return errors;
}

function validateStringArray(value, requiredValues, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const errors = [];

  for (const required of requiredValues) {
    if (!value.includes(required)) {
      errors.push(`${label} must include ${required}`);
    }
  }

  return errors;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
