#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/research/static-report.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredMetadataFields = [
  "generated_at",
  "data_delay_minutes",
  "data_version",
  "methodology_version",
  "rights_policy_version",
  "disclaimer"
];
const requiredWatermarkFields = [
  "request_id",
  "report_id",
  "generated_at",
  "data_delay_minutes",
  "data_version",
  "methodology_version",
  "rights_policy_version",
  "disclaimer"
];
const requiredStatuses = [
  "planned_no_write",
  "blocked_missing_context",
  "blocked_unlicensed_scope",
  "blocked_metadata_incomplete",
  "blocked_unsupported_format"
];
const requiredFormats = ["html", "pdf", "image"];
const requiredDatabaseTables = [
  "aiphabee_core.static_report_artifact",
  "aiphabee_audit.static_report_event",
  "aiphabee_governance.static_report_contract"
];

let contract;
let databaseContract;

try {
  contract = JSON.parse(readFileSync(resolve(process.cwd(), contractPath), "utf8"));
  databaseContract = JSON.parse(
    readFileSync(resolve(process.cwd(), databaseContractPath), "utf8")
  );
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      status: "invalid_json"
    },
    1
  );
}

const errors = [
  ...validateContract(contract),
  ...validateDatabaseContract(databaseContract, requiredDatabaseTables)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      status: "invalid_contract"
    },
    1
  );
}

emit(
  {
    metadata_fields: contract.required_metadata_fields.length,
    required_scope: contract.required_scope,
    route: contract.route,
    status: "ok"
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase3.static-report-metadata-scaffold.v0") {
    errors.push("version must match static report metadata scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until live static reports exist");
  }

  if (value.capability_name !== "static_report_artifact") {
    errors.push("capability_name must be static_report_artifact");
  }

  if (value.tool_name !== "plan_static_report_artifact") {
    errors.push("tool_name must be plan_static_report_artifact");
  }

  if (value.route !== "POST /research/reports/static/plan") {
    errors.push("route must be POST /research/reports/static/plan");
  }

  if (value.runtime_route !== "GET /research/runtime") {
    errors.push("runtime_route must be GET /research/runtime");
  }

  if (value.required_scope !== "exports.read") {
    errors.push("required_scope must be exports.read");
  }

  for (const [field, expected] of [
    ["allowed_scope_only", true],
    ["rights_policy_required", true],
    ["generated_at_required", true],
    ["data_delay_required", true],
    ["version_metadata_required", true],
    ["disclaimer_required", true],
    ["watermark_required", true],
    ["raw_partner_data_embedded", false],
    ["live_tool_execution", false],
    ["live_data_access", false],
    ["model_calls", false],
    ["artifact_writes", false],
    ["persistent_writes", false],
    ["frontend", false]
  ]) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${String(expected)}`);
    }
  }

  errors.push(...validateStringArray(value.covered_sprint_3_2_items, ["RES-04"], "covered_sprint_3_2_items"));
  errors.push(...validateStringArray(value.supported_formats, requiredFormats, "supported_formats"));
  errors.push(
    ...validateStringArray(
      value.required_metadata_fields,
      requiredMetadataFields,
      "required_metadata_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_watermark_fields,
      requiredWatermarkFields,
      "required_watermark_fields"
    )
  );
  errors.push(...validateStringArray(value.required_statuses, requiredStatuses, "required_statuses"));
  errors.push(
    ...validateStringArray(
      value.required_database_tables,
      requiredDatabaseTables,
      "required_database_tables"
    )
  );
  errors.push(...validateNoSecretLikeValues(value));

  return errors;
}

function validateDatabaseContract(value, requiredTables) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.migrations)) {
    return ["database contract migrations must be an array"];
  }

  const allTables = new Set(value.migrations.flatMap((migration) => migration.tables ?? []));

  for (const table of requiredTables) {
    if (!allTables.has(table)) {
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

function validateNoSecretLikeValues(value) {
  const serialized = JSON.stringify(value);
  const patterns = [
    /sk-[A-Za-z0-9_-]+/u,
    /postgres(?:ql)?:\/\//iu,
    /Bearer\s+[A-Za-z0-9._-]+/u,
    /gh[pousr]_[A-Za-z0-9_]+/u,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
  ];

  return patterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
