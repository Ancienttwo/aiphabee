#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/account/subscription-lifecycle.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredActions = [
  "upgrade",
  "downgrade",
  "renew",
  "cancel",
  "enter_grace_period",
  "exit_grace_period"
];
const requiredPlanCodes = ["free", "plus", "pro", "developer", "team", "enterprise"];
const requiredBillingStates = ["trialing", "active", "grace_period", "paused", "canceled"];
const requiredTables = [
  "core.account",
  "core.workspace",
  "core.subscription_plan",
  "core.workspace_subscription",
  "audit.subscription_lifecycle_event"
];
const requiredRequestFields = [
  "account_id",
  "workspace_id",
  "subscription_id",
  "action",
  "current_plan_code",
  "target_plan_code",
  "effective_at"
];
const requiredOutputs = [
  "account",
  "workspace",
  "subscription",
  "audit",
  "billing_provider",
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
    audit_event: contract.audit_event,
    route: contract.route,
    status: "ok",
    supported_actions: contract.supported_actions.length
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

  if (value.version !== "2026-06-21.phase2.subscription-lifecycle-audit.v0") {
    errors.push("version must match the subscription lifecycle scaffold version");
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

  if (value.route !== "POST /account/subscription/lifecycle/plan") {
    errors.push("route must be POST /account/subscription/lifecycle/plan");
  }

  for (const field of [
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

  if (value.audit_event !== "account.subscription.lifecycle.plan") {
    errors.push("audit_event must be account.subscription.lifecycle.plan");
  }

  if (value.grace_period_auditable !== true) {
    errors.push("grace_period_auditable must be true");
  }

  errors.push(...validateStringArray(value.supported_actions, requiredActions, "supported_actions"));
  errors.push(...validateStringArray(value.plan_codes, requiredPlanCodes, "plan_codes"));
  errors.push(...validateStringArray(value.billing_states, requiredBillingStates, "billing_states"));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(
      value.required_request_fields,
      requiredRequestFields,
      "required_request_fields"
    )
  );
  errors.push(...validateStringArray(value.planned_outputs, requiredOutputs, "planned_outputs"));
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
