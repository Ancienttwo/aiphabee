#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/pagination-limits.contract.json";
const registryContractPath = "deploy/tools/registry.contract.json";
const toolSchemasPath = "deploy/tools/tool-schemas.contract.json";
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
const paginatedTools = [
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_event_timeline"
];
const timeRangeTools = [
  "get_market_calendar",
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_financial_ratios",
  "search_announcements",
  "screen_securities",
  "compare_securities",
  "calculate_returns_risk",
  "get_event_timeline",
  "get_entitlements"
];
const requiredSprintItems = [
  "MCP-06",
  "cursor_pagination",
  "max_rows",
  "time_range_limits",
  "pagination_cannot_bypass_rights"
];
const requiredToolCallFields = [
  "bounded_retrieval",
  "input_validation",
  "output_validation",
  "schema_validation"
];
const requiredBoundedRetrievalFields = [
  "cursor_pagination",
  "row_limit",
  "time_range_limit",
  "max_rows_enforced",
  "plan_or_rights_bypass_blocked",
  "pagination_limits_version"
];
const requiredRuntimeCapabilityFields = [
  "cursor_pagination_ready",
  "max_row_limit_enforced",
  "time_range_limits_ready",
  "pagination_limits_ready",
  "pagination_limits_version",
  "pagination_or_rights_bypass_blocked"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const registryContract = readJson(registryContractPath);
const toolSchemas = readJson(toolSchemasPath);
const errors = [
  ...validateContract(contract),
  ...validateRegistryContract(registryContract),
  ...validateToolSchemas(toolSchemas)
];

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
    paginated_tools: contract.paginated_tools.length,
    route: contract.route,
    status: "ok",
    time_range_tools: contract.time_range_tools.length
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

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase2.mcp-pagination-limits-scaffold.v0") {
    errors.push("version must match MCP pagination limits scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.tool_registry_package !== "@aiphabee/tool-registry") {
    errors.push("tool_registry_package must be @aiphabee/tool-registry");
  }

  if (value.route !== "POST /mcp") {
    errors.push("route must be POST /mcp");
  }

  if (value.runtime_route !== "GET /mcp/runtime") {
    errors.push("runtime_route must be GET /mcp/runtime");
  }

  if (value.schema_source_contract !== toolSchemasPath) {
    errors.push(`schema_source_contract must be ${toolSchemasPath}`);
  }

  if (value.registry_contract !== registryContractPath) {
    errors.push(`registry_contract must be ${registryContractPath}`);
  }

  for (const field of ["frontend", "live_tool_execution"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "cursor_pagination_ready",
    "max_row_limit_enforced",
    "time_range_limits_ready",
    "pagination_limits_ready",
    "pagination_or_rights_bypass_blocked"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_3_items,
      requiredSprintItems,
      "covered_sprint_2_3_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_call_fields,
      requiredToolCallFields,
      "required_tool_call_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_bounded_retrieval_fields,
      requiredBoundedRetrievalFields,
      "required_bounded_retrieval_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "required_runtime_capability_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.standard_limit_error_codes,
      ["OUT_OF_RANGE", "TOO_MANY_ROWS"],
      "standard_limit_error_codes"
    )
  );
  errors.push(...validateStringArray(value.validated_tools, requiredTools, "validated_tools"));
  errors.push(...validateStringArray(value.row_limited_tools, requiredTools, "row_limited_tools"));
  errors.push(...validateStringArray(value.paginated_tools, paginatedTools, "paginated_tools"));
  errors.push(...validateStringArray(value.time_range_tools, timeRangeTools, "time_range_tools"));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateRegistryContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["registry contract must be an object"];
  }

  if (value.pagination_limits_ready !== true) {
    errors.push("registry contract pagination_limits_ready must be true");
  }

  if (value.pagination_or_rights_bypass_blocked !== true) {
    errors.push("registry contract pagination_or_rights_bypass_blocked must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_retrieval_fields,
      [
        "cursorPagination",
        "rowLimit",
        "timeRangeLimit",
        "enforcedBeforeExecution",
        "planOrRightsBypassBlocked"
      ],
      "registry.required_retrieval_fields"
    )
  );

  return errors;
}

function validateToolSchemas(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.schemas)) {
    return ["tool schema contract must expose schemas"];
  }

  for (const toolName of paginatedTools) {
    const properties = getInputProperties(value, toolName, errors);
    if (properties === undefined) {
      continue;
    }

    for (const field of ["limit", "cursor", "from", "to"]) {
      if (!isRecord(properties[field])) {
        errors.push(`${toolName}.input.properties must include ${field}`);
      }
    }
  }

  for (const toolName of timeRangeTools) {
    const properties = getInputProperties(value, toolName, errors);
    if (properties === undefined) {
      continue;
    }

    if (
      !isRecord(properties.from) &&
      !isRecord(properties.financial_from) &&
      !isRecord(properties.financialFrom) &&
      !isRecord(properties.published_from) &&
      !isRecord(properties.publishedFrom) &&
      !isRecord(properties.time_range) &&
      !isRecord(properties.timeRange)
    ) {
      errors.push(`${toolName}.input.properties must include from/to or time_range`);
    }
  }

  const entitlementsProperties = getInputProperties(value, "get_entitlements", errors);
  if (
    entitlementsProperties !== undefined &&
    !isRecord(entitlementsProperties.requested_rows) &&
    !isRecord(entitlementsProperties.requestedRows)
  ) {
    errors.push("get_entitlements.input.properties must include requested_rows/requestedRows");
  }

  return errors;
}

function getInputProperties(value, toolName, errors) {
  const schemaPair = value.schemas[toolName];
  if (!isRecord(schemaPair) || !isRecord(schemaPair.input)) {
    errors.push(`tool schema contract must include ${toolName}.input`);
    return undefined;
  }

  if (!isRecord(schemaPair.input.properties)) {
    errors.push(`${toolName}.input.properties must be an object`);
    return undefined;
  }

  return schemaPair.input.properties;
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
