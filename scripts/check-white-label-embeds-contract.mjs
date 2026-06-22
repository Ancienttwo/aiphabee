#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/partner/white-label-embeds.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const migrationPath = "supabase/migrations/20260622008000_partner_white_label_embed_scaffold.sql";
const packageJsonPath = "package.json";
const partnerSourcePath = "packages/partner-runtime/src/index.ts";
const partnerTestPath = "packages/partner-runtime/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredPhase4Items = [
  "B2B2C/白标",
  "embedded_research_tools",
  "MCP/API",
  "partner_settlement"
];
const requiredPartnerTypes = ["brokerage", "media", "wealth_platform", "data_company"];
const requiredSurfaces = ["research_widget", "report_viewer", "watchlist_widget", "mcp_api", "data_api"];
const requiredCommercialModels = [
  "fixed_annual_license",
  "minimum_guarantee_overage",
  "subscription_revenue_share",
  "mcp_api_revenue_share",
  "premium_data_package",
  "sla_quality_credit"
];
const requiredBrandModes = ["co_branded", "white_label"];
const requiredDataScopes = [
  "research_outputs",
  "market_data",
  "announcement_summaries",
  "analytics_results"
];
const requiredTables = [
  "core.partner_program",
  "core.partner_embed_surface",
  "audit.partner_distribution_event",
  "governance.partner_white_label_contract"
];
const requiredOutputFields = [
  "partner",
  "brand_policy",
  "embed",
  "mcp_api",
  "data_governance",
  "commercial_model",
  "security",
  "validation"
];
const requiredBlockedStatuses = [
  "blocked_invalid_origin",
  "blocked_missing_context",
  "blocked_unsupported_commercial_model",
  "blocked_unsupported_partner_type",
  "blocked_unsupported_surface"
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
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  migration: readText(migrationPath),
  partner: readText(partnerSourcePath),
  partnerTest: readText(partnerTestPath),
  tracker: readText(trackerPath),
  worker: readText(workerSourcePath),
  workerTest: readText(workerTestPath)
};
const errors = validateContract(contract, databaseContract, packageJson, sourceFiles);

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
    surfaces: contract.distribution_surfaces
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

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_file"
      },
      1
    );
  }
}

function validateContract(value, databaseValue, packageValue, sourceFilesValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase4.partner-white-label-embed-scaffold.v0") {
    errors.push("version must match partner white-label embed scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/partner-runtime") {
    errors.push("package must be @aiphabee/partner-runtime");
  }

  if (value.runtime_route !== "GET /partner/runtime") {
    errors.push("runtime_route must be GET /partner/runtime");
  }

  if (value.route !== "POST /partner/white-label-embeds/plan") {
    errors.push("route must be POST /partner/white-label-embeds/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_embed_rendering",
    "live_api_execution",
    "persistent_writes",
    "sql_emitted",
    "embed_script_generated",
    "public_indexing"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_phase4_items, requiredPhase4Items, "covered_phase4_items")
  );
  errors.push(...validateStringArray(value.partner_types, requiredPartnerTypes, "partner_types"));
  errors.push(
    ...validateStringArray(value.distribution_surfaces, requiredSurfaces, "distribution_surfaces")
  );
  errors.push(
    ...validateStringArray(value.commercial_models, requiredCommercialModels, "commercial_models")
  );
  errors.push(...validateStringArray(value.brand_modes, requiredBrandModes, "brand_modes"));
  errors.push(...validateStringArray(value.data_scopes, requiredDataScopes, "data_scopes"));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(...validateStringArray(value.blocked_statuses, requiredBlockedStatuses, "blocked_statuses"));
  errors.push(...validateSecurityContract(value.security_contract));
  errors.push(...validateEmbedContract(value.embed_contract));
  errors.push(...validateIntegrationRoutes(value.integration_routes));
  errors.push(...validateDatabaseMigration(databaseValue));
  errors.push(...validateMigrationText(sourceFilesValue.migration));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSensitiveLiterals(value));

  return errors;
}

function validateSecurityContract(value) {
  if (!isRecord(value)) {
    return ["security_contract must be an object"];
  }

  const errors = [];

  for (const field of [
    "signed_contract_required",
    "tenant_isolation_required",
    "field_authorization_required",
    "partner_rights_matrix_required",
    "default_deny_until_signed"
  ]) {
    if (value[field] !== true) {
      errors.push(`security_contract.${field} must be true`);
    }
  }

  for (const field of [
    "credential_material_stored",
    "raw_personal_contact_included",
    "raw_prompt_included",
    "external_redistribution_allowed"
  ]) {
    if (value[field] !== false) {
      errors.push(`security_contract.${field} must be false`);
    }
  }

  return errors;
}

function validateEmbedContract(value) {
  if (!isRecord(value)) {
    return ["embed_contract must be an object"];
  }

  const errors = [];

  for (const field of ["https_origin_allowlist_required", "csp_required"]) {
    if (value[field] !== true) {
      errors.push(`embed_contract.${field} must be true`);
    }
  }

  for (const field of ["script_bundle_generated", "public_indexing", "live_rendering"]) {
    if (value[field] !== false) {
      errors.push(`embed_contract.${field} must be false`);
    }
  }

  return errors;
}

function validateIntegrationRoutes(value) {
  if (!isRecord(value)) {
    return ["integration_routes must be an object"];
  }

  const expected = {
    data_gateway: "POST /gateway/exports/plan",
    mcp: "POST /mcp",
    mcp_key_create: "POST /mcp/api-keys/create/plan",
    mcp_oauth_authorize: "POST /mcp/oauth/authorize/plan",
    runtime: "GET /partner/runtime",
    settlement: "POST /usage/partner-reconciliation/plan"
  };
  const errors = [];

  for (const [field, route] of Object.entries(expected)) {
    if (value[field] !== route) {
      errors.push(`integration_routes.${field} must be ${route}`);
    }
  }

  return errors;
}

function validateDatabaseMigration(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.migrations)) {
    return ["database migrations contract must include migrations"];
  }

  const migration = value.migrations.find(
    (item) =>
      isRecord(item) &&
      item.file === "supabase/migrations/20260622008000_partner_white_label_embed_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database migrations contract must include partner white-label embed scaffold migration"];
  }

  errors.push(...validateStringArray(migration.tables, requiredTables, "migration.tables"));

  if (migration.default_rights_status !== "default_deny") {
    errors.push("partner white-label embed migration must preserve default_deny");
  }

  if (migration.market_data !== false) {
    errors.push("partner white-label embed migration market_data must be false");
  }

  return errors;
}

function validateMigrationText(value) {
  const errors = [];

  for (const token of [
    "create table if not exists core.partner_program",
    "create table if not exists core.partner_embed_surface",
    "create table if not exists audit.partner_distribution_event",
    "create table if not exists governance.partner_white_label_contract",
    "default 'default_deny'",
    "external_redistribution_allowed boolean not null default false",
    "script_bundle_generated boolean not null default false",
    "embed_rendering_enabled boolean not null default false",
    "live_api_execution_enabled boolean not null default false",
    "credential_material_stored boolean not null default false"
  ]) {
    if (!value.includes(token)) {
      errors.push(`migration must include ${token}`);
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:white-label-embeds"];
  const check = value.scripts.check;

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-white-label-embeds-contract.mjs")
  ) {
    errors.push("check:white-label-embeds must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:white-label-embeds")) {
    errors.push("root check script must include check:white-label-embeds");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    partner: [
      "PARTNER_RUNTIME_VERSION",
      "createWhiteLabelEmbedPlan",
      "getPartnerRuntimeCapabilities",
      "getWhiteLabelEmbedCapabilities",
      "blocked_invalid_origin",
      "external_redistribution_allowed"
    ],
    partnerTest: [
      "reports partner runtime capabilities without live embed or API execution",
      "plans white-label embeds and MCP API without generating frontend assets",
      "blocks embed surfaces without an HTTPS origin allowlist"
    ],
    worker: [
      'app.get("/partner/runtime"',
      'app.post("/partner/white-label-embeds/plan"',
      "createWhiteLabelEmbedPlan",
      "getPartnerRuntimeCapabilities",
      "normalizeOptionalInteger"
    ],
    workerTest: [
      "serves partner runtime capabilities without live embed or API execution",
      "plans white-label embeds and MCP API without generating frontend assets",
      "blocks white-label embeds without an HTTPS origin allowlist"
    ]
  };

  for (const [fileKey, tokens] of Object.entries(requiredByFile)) {
    const text = value[fileKey];

    if (typeof text !== "string") {
      errors.push(`${fileKey} source missing`);
      continue;
    }

    for (const token of tokens) {
      if (!text.includes(token)) {
        errors.push(`${fileKey} must include ${token}`);
      }
    }
  }

  return errors;
}

function validateTrackerSync(tracker) {
  const errors = [];

  if (!tracker.includes("- [x] B2B 白标与嵌入式组件")) {
    errors.push("tracker must mark B2B white-label embeds phase4 item complete");
  }

  if (!tracker.includes("npm run check:white-label-embeds")) {
    errors.push("tracker B2B row must reference check:white-label-embeds");
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

function validateNoSensitiveLiterals(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract contains forbidden sensitive-like pattern ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
