#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/gateway/field-authorization-config.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredRequestFields = [
  "operator_id",
  "dataset",
  "field_pattern",
  "channel",
  "plan",
  "target_status",
  "policy_version",
  "effective_at"
];
const requiredOutputs = ["change", "approval", "policy_effect", "validation"];
const requiredTables = [
  "aiphabee_governance.data_entitlement",
  "aiphabee_governance.workspace_entitlement",
  "aiphabee_core.field_authorization_change",
  "aiphabee_audit.field_authorization_approval",
  "aiphabee_governance.field_authorization_config_contract"
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
  emit({ errors, path: contractPath, status: "invalid_contract" }, 1);
}

emit(
  {
    approval_required: contract.approval_required,
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

  if (value.version !== "2026-06-21.phase3.field-authorization-config-scaffold.v0") {
    errors.push("version must match field authorization config scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/data-access-gateway") {
    errors.push("package must be @aiphabee/data-access-gateway");
  }

  if (value.runtime_route !== "GET /gateway/runtime") {
    errors.push("runtime_route must be GET /gateway/runtime");
  }

  if (value.route !== "POST /gateway/field-authorizations/changes/plan") {
    errors.push("route must be POST /gateway/field-authorizations/changes/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["frontend", "live_db_reads", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "approval_required",
    "default_deny_preserved",
    "effective_time_required",
    "policy_version_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(value.required_request_fields, requiredRequestFields, "required_request_fields")
  );
  errors.push(
    ...validateStringArray(
      value.supported_approval_statuses,
      ["pending", "approved", "rejected"],
      "supported_approval_statuses"
    )
  );
  errors.push(
    ...validateStringArray(
      value.supported_target_statuses,
      ["approved", "blocked", "default_deny"],
      "supported_target_statuses"
    )
  );
  errors.push(...validateStringArray(value.planned_outputs, requiredOutputs, "planned_outputs"));
  errors.push(
    ...validateStringArray(
      value.policy_effect_tables,
      ["aiphabee_governance.data_entitlement", "aiphabee_governance.workspace_entitlement"],
      "policy_effect_tables"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateDatabaseTables(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  for (const table of requiredTables) {
    if (!serialized.includes(table)) {
      errors.push(`database contract must include ${table}`);
    }
  }

  return errors;
}

function validateStringArray(value, requiredValues, name) {
  const errors = [];

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${name} must be a string array`];
  }

  for (const requiredValue of requiredValues) {
    if (!value.includes(requiredValue)) {
      errors.push(`${name} must include ${requiredValue}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
