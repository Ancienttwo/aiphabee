#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/sharing/private-share-link.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredCoveredItems = ["RES-03", "PRD §19.4"];
const requiredWatermarkFields = [
  "request_id",
  "share_ref",
  "creator_workspace_id",
  "recipient_workspace_id",
  "dataset",
  "rights_policy_version",
  "as_of"
];
const requiredStatuses = [
  "planned_no_write",
  "blocked_missing_context",
  "blocked_invalid_expiry",
  "blocked_creator_missing_scope",
  "blocked_recipient_missing_scope",
  "blocked_creator_gateway_denied",
  "blocked_recipient_gateway_denied"
];
const requiredDatabaseTables = [
  "core.private_share_link",
  "audit.private_share_event",
  "governance.private_sharing_contract"
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
    max_expires_in_hours: contract.max_expires_in_hours,
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

  if (value.version !== "2026-06-21.phase3.private-share-link-scaffold.v0") {
    errors.push("version must match private share link scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until live sharing exists");
  }

  if (value.capability_name !== "private_sharing_links") {
    errors.push("capability_name must be private_sharing_links");
  }

  if (value.route !== "POST /sharing/private-links/plan") {
    errors.push("route must be POST /sharing/private-links/plan");
  }

  if (value.runtime_route !== "GET /sharing/runtime") {
    errors.push("runtime_route must be GET /sharing/runtime");
  }

  if (value.required_scope !== "exports.read") {
    errors.push("required_scope must be exports.read");
  }

  if (value.gateway_channel !== "export") {
    errors.push("gateway_channel must be export");
  }

  for (const [field, expected] of [
    ["creator_scope_required", true],
    ["recipient_scope_required", true],
    ["uses_data_access_gateway", true],
    ["recipient_entitlement_recheck", true],
    ["recipient_data_rights_expansion", false],
    ["share_expands_recipient_rights", false],
    ["field_authorization_required", true],
    ["redaction_required_when_recipient_lacks_field", true],
    ["row_limit_required", true],
    ["watermark_required", true],
    ["live_data_access", false],
    ["link_handle_materialized", false],
    ["public_indexing", false],
    ["artifact_writes", false],
    ["persistent_writes", false],
    ["frontend", false]
  ]) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${String(expected)}`);
    }
  }

  if (value.max_expires_in_hours !== 168) {
    errors.push("max_expires_in_hours must be 168");
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_2_items,
      requiredCoveredItems,
      "covered_sprint_3_2_items"
    )
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
