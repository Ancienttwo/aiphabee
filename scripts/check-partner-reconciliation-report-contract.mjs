#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/usage/partner-reconciliation-report.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredGroupBy = ["dataset", "channel", "package_code", "user_id"];
const requiredTraceFields = [
  "request_id",
  "usage_event_id",
  "dataset",
  "channel",
  "package_code",
  "user_id"
];
const requiredSlaFields = [
  "data_delay_minutes",
  "missing_rows",
  "error_count",
  "backfill_count"
];
const requiredRequestFields = [
  "partner_id",
  "workspace_id",
  "period_start",
  "period_end",
  "usage_rows"
];
const requiredOutputs = [
  "report",
  "rows",
  "summary",
  "sla",
  "traceability",
  "export",
  "privacy",
  "audit"
];
const requiredForbiddenPayloads = [
  "raw_email",
  "raw_personal_contact",
  "payment_identifier",
  "credential_material",
  "raw_prompt",
  "generated_answer"
];
const requiredTables = [
  "core.workspace",
  "core.usage_event",
  "core.usage_ledger_entry",
  "core.partner_reconciliation_report",
  "core.partner_reconciliation_report_line",
  "audit.partner_reconciliation_event",
  "governance.partner_reconciliation_contract"
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
    group_by: contract.group_by.length,
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

  if (value.version !== "2026-06-21.phase3.partner-reconciliation-report-scaffold.v0") {
    errors.push("version must match the partner reconciliation report scaffold version");
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

  if (value.route !== "POST /usage/partner-reconciliation/plan") {
    errors.push("route must be POST /usage/partner-reconciliation/plan");
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

  if (value.request_id_visible !== true) {
    errors.push("request_id_visible must be true");
  }

  if (value.partner_sla_report !== true) {
    errors.push("partner_sla_report must be true");
  }

  errors.push(...validateStringArray(value.export_formats, ["csv", "json"], "export_formats"));
  errors.push(
    ...validateStringArray(value.supported_cadences, ["daily", "weekly"], "supported_cadences")
  );
  errors.push(...validateStringArray(value.group_by, requiredGroupBy, "group_by"));
  errors.push(
    ...validateStringArray(value.required_trace_fields, requiredTraceFields, "required_trace_fields")
  );
  errors.push(
    ...validateStringArray(value.required_sla_fields, requiredSlaFields, "required_sla_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_request_fields,
      requiredRequestFields,
      "required_request_fields"
    )
  );
  errors.push(...validateStringArray(value.planned_outputs, requiredOutputs, "planned_outputs"));
  errors.push(
    ...validateStringArray(
      value.forbidden_payloads,
      requiredForbiddenPayloads,
      "forbidden_payloads"
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
