#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/usage/quota-display.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredChannels = ["web_agent", "mcp"];
const requiredPlanCodes = ["free", "plus", "pro", "developer", "team", "enterprise"];
const requiredDisplayFields = [
  "request_id",
  "plan_code",
  "channel",
  "period_start",
  "period_end",
  "credit_limit",
  "credits_used",
  "credits_pending",
  "credits_remaining",
  "freshness_target_minutes"
];
const requiredRequestFields = ["workspace_id", "channel", "plan_code"];
const requiredTables = [
  "platform.workspace_subscription",
  "aiphabee_core.usage_event",
  "aiphabee_core.usage_ledger_entry",
  "aiphabee_core.usage_reconciliation_batch"
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
    channels: contract.channels.length,
    display_fields: contract.display_fields.length,
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

function validateContract(value, databaseValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase1.usage-quota-display-scaffold.v0") {
    errors.push("version must match the usage quota display scaffold version");
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

  if (value.route !== "POST /usage/quota/plan") {
    errors.push("route must be POST /usage/quota/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "billing_provider_reconciliation",
    "frontend",
    "live_ledger_reads",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.freshness_target_minutes !== 5) {
    errors.push("freshness_target_minutes must be 5");
  }

  if (value.request_id_visible !== true) {
    errors.push("request_id_visible must be true");
  }

  errors.push(...validateStringArray(value.channels, requiredChannels, "channels"));
  errors.push(...validateStringArray(value.plan_codes, requiredPlanCodes, "plan_codes"));
  errors.push(
    ...validateStringArray(value.display_fields, requiredDisplayFields, "display_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_request_fields,
      requiredRequestFields,
      "required_request_fields"
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
