#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/account/authorized-session-memory.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredActions = ["view", "upsert", "delete"];
const requiredControls = ["view", "edit", "delete"];
const requiredMemoryKeys = [
  "authorized_tool_scopes",
  "data_retention_acknowledgement",
  "default_currency",
  "default_workspace_id",
  "mcp_scope_consent",
  "preferred_locale",
  "response_depth",
  "watchlist_briefing_consent"
];
const requiredAllowedPayloadClasses = [
  "account_id",
  "workspace_id",
  "memory_key",
  "authorized_scope",
  "consent_state",
  "retention_state"
];
const forbiddenPayloads = [
  "raw_prompt",
  "generated_answer",
  "financial_fact_value",
  "price_value",
  "valuation_value",
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret"
];
const requiredOutputFields = [
  "account",
  "workspace",
  "action",
  "memory",
  "policy",
  "audit",
  "validation"
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
    actions: contract.supported_actions,
    route: contract.route,
    status: "ok",
    table: contract.table
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

  if (value.version !== "2026-06-21.phase3.authorized-session-memory-scaffold.v0") {
    errors.push("version must match the authorized session memory scaffold version");
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

  if (value.route !== "POST /account/authorized-memory/plan") {
    errors.push("route must be POST /account/authorized-memory/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["actual_memory_reads", "frontend", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_1_items,
      ["AGT-10", "authorized_session_memory"],
      "covered_sprint_3_1_items"
    )
  );
  errors.push(...validateStringArray(value.supported_actions, requiredActions, "supported_actions"));
  errors.push(
    ...validateStringArray(value.user_visible_controls, requiredControls, "user_visible_controls")
  );
  errors.push(
    ...validateStringArray(value.allowed_memory_keys, requiredMemoryKeys, "allowed_memory_keys")
  );
  errors.push(
    ...validateStringArray(
      value.allowed_payload_classes,
      requiredAllowedPayloadClasses,
      "allowed_payload_classes"
    )
  );
  errors.push(
    ...validateStringArray(value.forbidden_payloads, forbiddenPayloads, "forbidden_payloads")
  );
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(...validatePrivacyContract(value.privacy_contract));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validatePrivacyContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["privacy_contract must be an object"];
  }

  for (const field of [
    "authorized_information_only",
    "unsupported_keys_block_before_write"
  ]) {
    if (value[field] !== true) {
      errors.push(`privacy_contract.${field} must be true`);
    }
  }

  for (const field of [
    "credential_material_stored",
    "financial_values_stored",
    "generated_answers_stored",
    "raw_prompt_stored"
  ]) {
    if (value[field] !== false) {
      errors.push(`privacy_contract.${field} must be false`);
    }
  }

  return errors;
}

function validateDatabaseTables(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  for (const table of [
    "core.authorized_session_memory",
    "governance.authorized_session_memory_contract"
  ]) {
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
