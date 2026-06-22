#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/runtime-schema-snapshot.contract.json";
const toolSchemasPath = "deploy/tools/tool-schemas.contract.json";
const toolSchemaValidationPath = "deploy/mcp/tool-schema-validation.contract.json";
const packagePath = "package.json";
const runtimeSourcePath = "packages/mcp-runtime/src/index.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const expectedVersion = "2026-06-22.phase1.mcp-runtime-schema-snapshot.v0";
const expectedRoute = "GET /mcp/runtime/tool-schemas";
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
const requiredDescriptorFields = [
  "name",
  "description",
  "input_schema_id",
  "output_schema_id",
  "required_scope",
  "version",
  "public_version",
  "major_version",
  "deprecation",
  "retrieval_limits",
  "schema_snapshot"
];
const requiredSchemaSnapshotFields = [
  "schema_snapshot_version",
  "schema_dialect",
  "schema_source_contract",
  "input_schema",
  "output_schema",
  "standard_error_codes"
];
const requiredInputSchemaFields = [
  "id",
  "required",
  "any_of",
  "allowed_properties",
  "additional_properties_allowed"
];
const requiredOutputSchemaFields = [
  "id",
  "required_envelope_fields",
  "standard_response_envelope",
  "structured_content_required",
  "raw_text_only_response_allowed"
];
const requiredOutputEnvelopeFields = [
  "ok",
  "request_id",
  "as_of",
  "market_status",
  "provenance",
  "usage",
  "data",
  "data_version",
  "methodology_version"
];
const forbiddenInputProperties = ["sql", "sql_text", "url", "endpoint"];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const toolSchemas = readJson(toolSchemasPath);
const toolSchemaValidation = readJson(toolSchemaValidationPath);
const packageJson = readJson(packagePath);
const runtimeSource = readText(runtimeSourcePath);
const workerSource = readText(workerSourcePath);

const errors = [
  ...validateContract(contract),
  ...validateToolSchemas(toolSchemas),
  ...validateToolSchemaValidation(toolSchemaValidation),
  ...validatePackageScripts(packageJson),
  ...validateSource(runtimeSource, workerSource)
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
    route: contract.route,
    schema_source_contract: contract.schema_source_contract,
    status: "ok",
    tools: contract.tool_count,
    version: contract.version
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== expectedVersion) {
    errors.push(`version must be ${expectedVersion}`);
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.route !== expectedRoute) {
    errors.push(`route must be ${expectedRoute}`);
  }

  if (value.runtime_route !== "GET /mcp/runtime") {
    errors.push("runtime_route must be GET /mcp/runtime");
  }

  if (value.protocol_route !== "POST /mcp") {
    errors.push("protocol_route must be POST /mcp");
  }

  if (value.schema_source_contract !== toolSchemasPath) {
    errors.push(`schema_source_contract must be ${toolSchemasPath}`);
  }

  if (value.tool_registry_package !== "@aiphabee/tool-registry") {
    errors.push("tool_registry_package must be @aiphabee/tool-registry");
  }

  if (value.schema_dialect !== "https://json-schema.org/draft/2020-12/schema") {
    errors.push("schema_dialect must be JSON Schema draft 2020-12");
  }

  for (const field of [
    "runtime_schema_serving",
    "tools_list_schema_snapshot",
    "tools_list_default_deny_schema_summary",
    "standard_response_envelope",
    "strict_input_validation",
    "structured_content_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "additional_properties_allowed",
    "raw_text_only_response_allowed",
    "frontend",
    "live_tool_execution"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (value.tool_count !== requiredTools.length) {
    errors.push(`tool_count must be ${requiredTools.length}`);
  }

  errors.push(
    ...validateStringArray(
      value.required_descriptor_fields,
      requiredDescriptorFields,
      "required_descriptor_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_schema_snapshot_fields,
      requiredSchemaSnapshotFields,
      "required_schema_snapshot_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_input_schema_fields,
      requiredInputSchemaFields,
      "required_input_schema_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_schema_fields,
      requiredOutputSchemaFields,
      "required_output_schema_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_envelope_fields,
      requiredOutputEnvelopeFields,
      "required_output_envelope_fields"
    )
  );
  errors.push(...validateStringArray(value.validated_tools, requiredTools, "validated_tools"));
  errors.push(
    ...validateStringArray(
      value.forbidden_input_properties,
      forbiddenInputProperties,
      "forbidden_input_properties"
    )
  );
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateToolSchemas(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.schemas)) {
    return ["tool schema contract must expose schemas"];
  }

  if (Object.keys(value.schemas).length !== requiredTools.length) {
    errors.push(`tool schema contract must contain ${requiredTools.length} tools`);
  }

  for (const toolName of requiredTools) {
    const schemaPair = value.schemas[toolName];
    if (!isRecord(schemaPair)) {
      errors.push(`tool schema contract must include ${toolName}`);
      continue;
    }

    if (schemaPair.input?.$id !== `tool.${toolName}.input.v0`) {
      errors.push(`${toolName}.input.$id must match runtime snapshot id`);
    }

    if (schemaPair.output?.$id !== `tool.${toolName}.output.v0`) {
      errors.push(`${toolName}.output.$id must match runtime snapshot id`);
    }

    if (schemaPair.input?.additionalProperties !== false) {
      errors.push(`${toolName}.input.additionalProperties must be false`);
    }

    if (!Array.isArray(schemaPair.output?.required)) {
      errors.push(`${toolName}.output.required must be an array`);
      continue;
    }

    for (const field of ["provenance", "usage", "data_version", "methodology_version"]) {
      if (!schemaPair.output.required.includes(field)) {
        errors.push(`${toolName}.output.required must include ${field}`);
      }
    }

    const inputProperties = schemaPair.input?.properties;
    if (!isRecord(inputProperties)) {
      errors.push(`${toolName}.input.properties must be present`);
      continue;
    }

    for (const property of forbiddenInputProperties) {
      if (Object.hasOwn(inputProperties, property)) {
        errors.push(`${toolName}.input must not expose ${property}`);
      }
    }
  }

  return errors;
}

function validateToolSchemaValidation(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["tool schema validation contract must be an object"];
  }

  if (value.route !== "POST /mcp") {
    errors.push("tool schema validation route must be POST /mcp");
  }

  if (value.schema_source_contract !== toolSchemasPath) {
    errors.push(`tool schema validation source must be ${toolSchemasPath}`);
  }

  if (value.live_tool_execution !== false) {
    errors.push("tool schema validation live_tool_execution must be false");
  }

  errors.push(
    ...validateStringArray(
      value.validated_tools,
      requiredTools,
      "tool_schema_validation.validated_tools"
    )
  );

  return errors;
}

function validatePackageScripts(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const errors = [];
  const scriptName = "check:mcp-runtime-schema-snapshot";
  const scriptCommand = "node scripts/check-mcp-runtime-schema-snapshot-contract.mjs";

  if (value.scripts[scriptName] !== scriptCommand) {
    errors.push(`${scriptName} must run ${scriptCommand}`);
  }

  if (typeof value.scripts.check !== "string" || !value.scripts.check.includes(`npm run ${scriptName}`)) {
    errors.push(`root check must include ${scriptName}`);
  }

  return errors;
}

function validateSource(runtimeSource, workerSource) {
  const errors = [];

  for (const token of [
    "MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION",
    "getMcpRuntimeSchemaSnapshot",
    "createToolSchemaSnapshotDescriptor",
    "schema_snapshot: createToolSchemaSnapshotDescriptor(tool)",
    "schema_snapshot: createToolsListSchemaSnapshotSummary(tools.length)",
    expectedRoute
  ]) {
    if (!runtimeSource.includes(token)) {
      errors.push(`runtime source must include ${token}`);
    }
  }

  for (const token of [
    "getMcpRuntimeSchemaSnapshot",
    'app.get("/mcp/runtime/tool-schemas"',
    "runtime-tool-schema-snapshot"
  ]) {
    if (!workerSource.includes(token)) {
      errors.push(`worker source must include ${token}`);
    }
  }

  for (const path of [contractPath, toolSchemasPath, runtimeSourcePath, workerSourcePath]) {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`${path} must exist`);
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

function readJson(path) {
  try {
    return JSON.parse(readText(path));
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
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
