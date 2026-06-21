#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/account/session.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredLoginMethods = ["email_passwordless", "social_google", "social_github"];
const requiredSessionActions = [
  "login",
  "logout",
  "refresh",
  "revoke_device",
  "revoke_session"
];
const requiredPlanCodes = ["free", "plus", "pro", "developer", "team", "enterprise"];
const requiredTables = [
  "core.account",
  "core.workspace",
  "core.workspace_membership",
  "core.subscription_plan",
  "core.workspace_subscription"
];
const requiredRequestFields = ["account_id", "workspace_id", "email_hash"];
const requiredOutputs = ["account", "workspace", "session", "device", "manual_plan", "validation"];
const forbiddenPayloads = [
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret"
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
    login_methods: contract.supported_login_methods.length,
    route: contract.route,
    runtime_route: contract.runtime_route,
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

function validateContract(value, databaseValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase1.internal-account-session-manual-plan.v0") {
    errors.push("version must match the account runtime scaffold version");
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

  if (value.route !== "POST /account/session/plan") {
    errors.push("route must be POST /account/session/plan");
  }

  for (const field of [
    "auth_provider_calls",
    "billing_provider_calls",
    "frontend",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  errors.push(
    ...validateStringArray(
      value.supported_login_methods,
      requiredLoginMethods,
      "supported_login_methods"
    )
  );
  errors.push(
    ...validateStringArray(
      value.supported_session_actions,
      requiredSessionActions,
      "supported_session_actions"
    )
  );
  errors.push(...validateStringArray(value.manual_plan_codes, requiredPlanCodes, "manual_plan_codes"));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(
      value.required_request_fields,
      requiredRequestFields,
      "required_request_fields"
    )
  );
  errors.push(...validateStringArray(value.planned_outputs, requiredOutputs, "planned_outputs"));
  errors.push(
    ...validateStringArray(value.forbidden_payloads, forbiddenPayloads, "forbidden_payloads")
  );
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
