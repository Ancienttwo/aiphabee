#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/gateway/restricted-exports.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredFormats = ["csv", "image", "pdf"];
const requiredWatermarkFields = [
  "request_id",
  "workspace_id",
  "dataset",
  "rights_policy_version",
  "as_of"
];
const requiredStatuses = [
  "planned_no_write",
  "blocked_missing_scope",
  "blocked_gateway_denied",
  "blocked_unsupported_format"
];
const requiredErrorCodes = [
  "SCOPE_DENIED",
  "DATA_NOT_LICENSED",
  "TOO_MANY_ROWS",
  "OUT_OF_RANGE",
  "DATA_QUALITY_HOLD"
];
const requiredDatabaseTables = [
  "core.restricted_export_request",
  "audit.restricted_export_event",
  "governance.restricted_export_contract"
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
    formats: contract.supported_formats,
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

  if (value.version !== "2026-06-21.phase3.restricted-export-scaffold.v0") {
    errors.push("version must match restricted export scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until live exports exist");
  }

  if (value.capability_name !== "restricted_exports") {
    errors.push("capability_name must be restricted_exports");
  }

  if (value.route !== "POST /gateway/exports/plan") {
    errors.push("route must be POST /gateway/exports/plan");
  }

  if (value.runtime_route !== "GET /gateway/runtime") {
    errors.push("runtime_route must be GET /gateway/runtime");
  }

  for (const [field, expected] of [
    ["scope_required", true],
    ["high_risk_scope", true],
    ["uses_data_access_gateway", true],
    ["export_requested", true],
    ["field_authorization_required", true],
    ["row_limit_required", true],
    ["watermark_required", true],
    ["live_data_access", false],
    ["artifact_writes", false],
    ["persistent_writes", false],
    ["frontend", false]
  ]) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${String(expected)}`);
    }
  }

  if (value.required_scope !== "exports.read") {
    errors.push("required_scope must be exports.read");
  }

  if (value.export_channel !== "export") {
    errors.push("export_channel must be export");
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_1_items,
      ["ANA-08"],
      "covered_sprint_3_1_items"
    )
  );
  errors.push(
    ...validateStringArray(value.supported_formats, requiredFormats, "supported_formats")
  );
  errors.push(
    ...validateStringArray(
      value.required_watermark_fields,
      requiredWatermarkFields,
      "required_watermark_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.required_statuses, requiredStatuses, "required_statuses")
  );
  errors.push(
    ...validateStringArray(
      value.required_error_codes,
      requiredErrorCodes,
      "required_error_codes"
    )
  );
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

function emit(payload, code) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(code);
}
