#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/usage/billing-reconciliation.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredTraceFields = [
  "request_id",
  "usage_event_id",
  "ledger_entry_id",
  "invoice_line_id"
];
const requiredRequestFields = [
  "workspace_id",
  "subscription_id",
  "invoice_id",
  "billing_period_start",
  "billing_period_end",
  "ledger_entries"
];
const requiredOutputs = [
  "invoice",
  "invoice_lines",
  "consistency",
  "traceability",
  "billing_provider"
];
const requiredTables = [
  "core.workspace_subscription",
  "core.usage_event",
  "core.usage_ledger_entry",
  "core.usage_reconciliation_batch",
  "core.subscription_invoice",
  "core.subscription_invoice_line"
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
    route: contract.route,
    status: "ok",
    trace_fields: contract.required_trace_fields.length
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

  if (value.version !== "2026-06-21.phase2.usage-billing-reconciliation-scaffold.v0") {
    errors.push("version must match the usage billing reconciliation scaffold version");
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

  if (value.route !== "POST /usage/billing/reconciliation/plan") {
    errors.push("route must be POST /usage/billing/reconciliation/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "billing_provider_calls",
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

  if (value.support_investigation_by_request_id !== true) {
    errors.push("support_investigation_by_request_id must be true");
  }

  errors.push(
    ...validateStringArray(value.required_trace_fields, requiredTraceFields, "required_trace_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_request_fields,
      requiredRequestFields,
      "required_request_fields"
    )
  );
  errors.push(...validateStringArray(value.planned_outputs, requiredOutputs, "planned_outputs"));
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
