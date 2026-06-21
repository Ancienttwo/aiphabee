#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/tool-schema-validation.contract.json";
const toolSchemasPath = "deploy/tools/tool-schemas.contract.json";
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_market_calendar",
  "get_quote_snapshot",
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_event_timeline",
  "get_data_lineage",
  "get_entitlements"
];
const requiredSprintItems = [
  "MCP-04",
  "strict_input_validation",
  "additional_properties_false",
  "structuredContent",
  "outputSchema"
];
const requiredToolCallFields = [
  "input_schema_id",
  "output_schema_id",
  "input_validation",
  "output_validation",
  "schema_validation",
  "structured_content_validation"
];
const requiredInputValidationFields = [
  "additional_properties_allowed",
  "arguments_valid",
  "input_schema_id",
  "missing_required_arguments",
  "required_fields_present",
  "schema_validation_status",
  "unsupported_arguments"
];
const requiredOutputValidationFields = [
  "output_schema_id",
  "raw_text_only_response_allowed",
  "structured_content_matches_output_schema",
  "structured_content_required"
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
const errors = [
  ...validateContract(contract),
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
    route: contract.route,
    schema_source_contract: contract.schema_source_contract,
    status: "ok",
    tools: requiredTools.length
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

  if (value.version !== "2026-06-21.phase2.mcp-tool-schema-validation-scaffold.v0") {
    errors.push("version must match MCP tool schema validation scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.route !== "POST /mcp") {
    errors.push("route must be POST /mcp");
  }

  if (value.schema_source_contract !== toolSchemasPath) {
    errors.push(`schema_source_contract must be ${toolSchemasPath}`);
  }

  if (value.tool_registry_package !== "@aiphabee/tool-registry") {
    errors.push("tool_registry_package must be @aiphabee/tool-registry");
  }

  for (const field of ["frontend", "live_tool_execution", "raw_text_only_response_allowed"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "standard_response_envelope",
    "strict_input_validation",
    "missing_required_arguments_rejected",
    "unsupported_arguments_rejected",
    "structured_content_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  if (value.additional_properties_allowed !== false) {
    errors.push("additional_properties_allowed must be false");
  }

  if (value.structured_content_matches_output_schema !== "planned_no_live") {
    errors.push("structured_content_matches_output_schema must be planned_no_live");
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
      value.required_input_validation_fields,
      requiredInputValidationFields,
      "required_input_validation_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_validation_fields,
      requiredOutputValidationFields,
      "required_output_validation_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.validated_tools, requiredTools, "validated_tools")
  );
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

  for (const toolName of requiredTools) {
    const schemaPair = value.schemas[toolName];
    if (!isRecord(schemaPair)) {
      errors.push(`tool schema contract must include ${toolName}`);
      continue;
    }

    if (schemaPair.input?.additionalProperties !== false) {
      errors.push(`${toolName}.input.additionalProperties must be false`);
    }

    if (schemaPair.input?.$id !== `tool.${toolName}.input.v0`) {
      errors.push(`${toolName}.input.$id must match registry id`);
    }

    if (schemaPair.output?.$id !== `tool.${toolName}.output.v0`) {
      errors.push(`${toolName}.output.$id must match registry id`);
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
