#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/registry.contract.json";
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_market_calendar",
  "get_quote_snapshot",
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_financial_ratios",
  "search_announcements",
  "get_announcement",
  "screen_securities",
  "compare_securities",
  "calculate_returns_risk",
  "get_event_timeline",
  "get_data_lineage",
  "get_entitlements"
];
const requiredRoutes = ["GET /tools/runtime", "GET /agent/runtime"];
const requiredChannels = ["web", "mcp", "api"];
const scaffoldTools = [
  "resolve_security",
  "get_security_profile",
  "get_market_calendar",
  "get_quote_snapshot",
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_financial_ratios",
  "search_announcements",
  "get_announcement",
  "screen_securities",
  "compare_securities",
  "calculate_returns_risk",
  "get_event_timeline",
  "get_data_lineage",
  "get_entitlements"
];

let contract;

try {
  contract = JSON.parse(readFileSync(resolve(process.cwd(), contractPath), "utf8"));
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      path: contractPath,
      status: "invalid_json"
    },
    1
  );
}

const errors = validateContract(contract);

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
    routes: contract.runtime_routes.length,
    status: "ok",
    tools: contract.required_tools.length
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until tool execution exists");
  }

  if (value.registry_status !== "registry_scaffold") {
    errors.push("registry_status must be registry_scaffold");
  }

  if (value.execution_ready !== false) {
    errors.push("execution_ready must be false in this scaffold");
  }

  if (value.live_data_access !== false) {
    errors.push("live_data_access must be false in this scaffold");
  }

  if (value.allow_arbitrary_sql !== false) {
    errors.push("allow_arbitrary_sql must be false");
  }

  if (value.allow_arbitrary_url !== false) {
    errors.push("allow_arbitrary_url must be false");
  }

  if (value.versioning_ready !== true) {
    errors.push("versioning_ready must be true");
  }

  if (value.deprecation_policy_ready !== true) {
    errors.push("deprecation_policy_ready must be true");
  }

  if (value.breaking_changes_require_new_major !== true) {
    errors.push("breaking_changes_require_new_major must be true");
  }

  if (value.pagination_limits_ready !== true) {
    errors.push("pagination_limits_ready must be true");
  }

  if (value.pagination_or_rights_bypass_blocked !== true) {
    errors.push("pagination_or_rights_bypass_blocked must be true");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.rights_aware !== true) {
    errors.push("rights_aware must be true");
  }

  errors.push(...validateStringArray(value.channels, requiredChannels, "channels"));
  errors.push(...validateStringArray(value.runtime_routes, requiredRoutes, "runtime_routes"));
  errors.push(...validateStringArray(value.required_tools, requiredTools, "required_tools"));
  errors.push(...validateStringArray(value.scaffold_tools, scaffoldTools, "scaffold_tools"));
  errors.push(...validateStringArray(value.required_tool_fields, [
    "name",
    "version",
    "description",
    "channels",
    "lifecycle",
    "permissions",
    "retrieval",
    "schema",
    "execution",
    "testing",
    "status"
  ], "required_tool_fields"));
  errors.push(...validateStringArray(value.required_schema_fields, [
    "inputSchemaId",
    "outputSchemaId",
    "standardErrorCodes",
    "standardResponseEnvelope"
  ], "required_schema_fields"));
  errors.push(...validateStringArray(value.required_permission_fields, [
    "requiredScope",
    "dataClasses",
    "rightsAware"
  ], "required_permission_fields"));
  errors.push(...validateStringArray(value.required_execution_fields, [
    "mode",
    "handlerReady",
    "liveDataAccess",
    "allowArbitrarySql",
    "allowArbitraryUrl"
  ], "required_execution_fields"));
  errors.push(...validateStringArray(value.required_testing_fields, [
    "goldenFixtureReady",
    "requiredGoldenFixture"
  ], "required_testing_fields"));
  errors.push(...validateStringArray(value.required_lifecycle_fields, [
    "publicVersion",
    "majorVersion",
    "breakingChangesRequireNewMajor",
    "deprecation",
    "compatibility"
  ], "required_lifecycle_fields"));
  errors.push(...validateStringArray(value.required_deprecation_fields, [
    "status",
    "minimumNoticeDays",
    "announcedAt",
    "sunsetAt",
    "migrationGuide"
  ], "required_deprecation_fields"));
  errors.push(...validateStringArray(value.required_retrieval_fields, [
    "cursorPagination",
    "rowLimit",
    "timeRangeLimit",
    "enforcedBeforeExecution",
    "planOrRightsBypassBlocked"
  ], "required_retrieval_fields"));
  errors.push(...validateStringArray(value.required_row_limit_fields, [
    "defaultLimit",
    "maxLimit",
    "parameter"
  ], "required_row_limit_fields"));
  errors.push(...validateStringArray(value.required_cursor_pagination_fields, [
    "enabled",
    "parameter",
    "cursorOpaque",
    "cursorBoundToRequest"
  ], "required_cursor_pagination_fields"));
  errors.push(...validateStringArray(value.required_time_range_limit_fields, [
    "required",
    "fromParameters",
    "toParameters",
    "maxWindowDays"
  ], "required_time_range_limit_fields"));

  if (value.minimum_deprecation_notice_days < 90) {
    errors.push("minimum_deprecation_notice_days must be at least 90");
  }

  if (value.previous_major_support_window_days < 180) {
    errors.push("previous_major_support_window_days must be at least 180");
  }

  errors.push(...validateNoSecretLikeValues(value));

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
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
