#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/security-history.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredHistoryTypes = [
  "historical_names",
  "historical_industries",
  "historical_constituents"
];
const requiredStatuses = ["found", "not_found"];
const requiredErrorCodes = [
  "NOT_FOUND",
  "POINT_IN_TIME_UNAVAILABLE",
  "SCOPE_DENIED"
];
const requiredHistoryFields = [
  "activeName",
  "activeIndustry",
  "activeConstituentMemberships",
  "pointInTimePolicy",
  "coverage"
];
const requiredDatabaseTables = [
  "core.security_name_history",
  "core.security_industry_history",
  "core.index_constituent_history",
  "governance.security_history_contract"
];
const requiredFixtureCases = [
  "historical_name",
  "historical_industry",
  "historical_constituent",
  "current_constituent",
  "missing_as_of",
  "not_found"
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
    history_types: requiredHistoryTypes,
    route: contract.route,
    status: "ok",
    tables: requiredDatabaseTables
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase3.security-history-scaffold.v0") {
    errors.push("version must match the security history scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until live history data exists");
  }

  if (value.capability_name !== "security_history") {
    errors.push("capability_name must be security_history");
  }

  if (value.route !== "POST /tools/get-security-history") {
    errors.push("route must be POST /tools/get-security-history");
  }

  for (const [field, expected] of [
    ["handler_ready", true],
    ["live_data_access", false],
    ["allow_arbitrary_sql", false],
    ["allow_arbitrary_url", false],
    ["standard_response_envelope", true],
    ["as_of_required", true],
    ["frontend", false],
    ["mcp_registration", false],
    ["persistent_writes", false]
  ]) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${String(expected)}`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_1_items,
      ["SEC-05"],
      "covered_sprint_3_1_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.supported_history_types,
      requiredHistoryTypes,
      "supported_history_types"
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
      value.required_history_fields,
      requiredHistoryFields,
      "required_history_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_database_tables,
      requiredDatabaseTables,
      "required_database_tables"
    )
  );
  errors.push(
    ...validateStringArray(value.fixture_cases, requiredFixtureCases, "fixture_cases")
  );

  if (!isRecord(value.point_in_time_policy)) {
    errors.push("point_in_time_policy must be an object");
  } else {
    for (const field of [
      "uses_latest_name",
      "uses_latest_classification",
      "uses_latest_constituents"
    ]) {
      if (value.point_in_time_policy[field] !== false) {
        errors.push(`point_in_time_policy.${field} must be false`);
      }
    }
  }

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
