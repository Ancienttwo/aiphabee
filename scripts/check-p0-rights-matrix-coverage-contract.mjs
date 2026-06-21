#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/gateway/p0-rights-matrix-coverage.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredSurfaces = ["web", "mcp", "export", "enterprise"];
const requiredDatasetGroups = [
  "security_master",
  "market_calendar",
  "quote_snapshot",
  "price_history",
  "corporate_actions",
  "financial_facts",
  "announcements",
  "derived_analytics",
  "evidence_lineage"
];
const requiredTables = [
  "core.p0_rights_matrix_entry",
  "governance.p0_rights_matrix_contract"
];
const requiredOutputFields = [
  "tool_coverage",
  "dataset_field_coverage",
  "surface_coverage",
  "release_gate",
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
    route: contract.route,
    status: "ok",
    surfaces: contract.required_surfaces.length,
    tools: contract.required_p0_tool_count
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

  if (value.version !== "2026-06-21.phase3.p0-rights-matrix-coverage-scaffold.v0") {
    errors.push("version must match the P0 rights matrix coverage scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/data-access-gateway") {
    errors.push("package must be @aiphabee/data-access-gateway");
  }

  if (value.runtime_route !== "GET /gateway/runtime") {
    errors.push("runtime_route must be GET /gateway/runtime");
  }

  if (value.route !== "GET /gateway/rights-matrix/p0/coverage") {
    errors.push("route must be GET /gateway/rights-matrix/p0/coverage");
  }

  for (const field of [
    "frontend",
    "live_rights_matrix_reads",
    "partner_signed_matrix_loaded",
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

  if (value.required_p0_tool_count !== 16) {
    errors.push("required_p0_tool_count must be 16");
  }

  if (value.default_rights_status !== "default_deny") {
    errors.push("default_rights_status must be default_deny");
  }

  errors.push(...validateStringArray(value.required_surfaces, requiredSurfaces, "required_surfaces"));
  errors.push(...validateStringArray(value.dataset_groups, requiredDatasetGroups, "dataset_groups"));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields"));
  errors.push(...validateSurfaceAuthorization(value.surface_authorization));
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateSurfaceAuthorization(value) {
  if (!isRecord(value)) {
    return ["surface_authorization must be an object"];
  }

  const errors = [];

  for (const surface of requiredSurfaces) {
    if (value[surface] !== "configured_default_deny") {
      errors.push(`surface_authorization.${surface} must be configured_default_deny`);
    }
  }

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_external_rights_matrix") {
    errors.push("release_gate.gate_status must be blocked_external_rights_matrix");
  }

  if (value.partner_signed_matrix_required !== true) {
    errors.push("release_gate.partner_signed_matrix_required must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["data_partner", "commercial_owner", "legal_compliance"],
      "release_gate.required_signoffs"
    )
  );

  return errors;
}

function validateDatabaseTables(databaseValue) {
  const migrations = isRecord(databaseValue) && Array.isArray(databaseValue.migrations)
    ? databaseValue.migrations
    : [];
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file === "supabase/migrations/20260621129000_p0_rights_matrix_coverage_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database contract must include P0 rights matrix coverage migration"];
  }

  return validateStringArray(migration.tables, requiredTables, "database migration tables");
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern}`);
    }
  }

  return errors;
}

function validateStringArray(value, requiredValues, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const errors = [];

  for (const required of requiredValues) {
    if (!value.includes(required)) {
      errors.push(`${label} must include ${required}`);
    }
  }

  return errors;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
