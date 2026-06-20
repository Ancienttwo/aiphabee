#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/evidence-lineage.contract.json";
const requiredTools = ["get_data_lineage", "get_entitlements"];
const requiredRoutes = [
  "POST /tools/get-data-lineage",
  "POST /tools/get-entitlements"
];
const requiredInputsByTool = {
  get_data_lineage: ["evidence_id", "record_id", "as_of", "include_upstream"],
  get_entitlements: [
    "workspace_id",
    "channel",
    "tool_name",
    "dataset",
    "fields",
    "as_of",
    "time_range",
    "requested_rows",
    "export_requested"
  ]
};
const requiredStatusesByTool = {
  get_data_lineage: ["found", "not_found", "data_quality_hold"],
  get_entitlements: [
    "found",
    "scope_denied",
    "data_not_licensed",
    "out_of_range",
    "too_many_rows"
  ]
};
const requiredErrorsByTool = {
  get_data_lineage: ["DATA_QUALITY_HOLD", "NOT_FOUND", "SCOPE_DENIED"],
  get_entitlements: ["DATA_NOT_LICENSED", "OUT_OF_RANGE", "SCOPE_DENIED", "TOO_MANY_ROWS"]
};
const requiredLineageFields = [
  "evidenceId",
  "recordId",
  "dataset",
  "source",
  "sourceBatchId",
  "sourceRecordId",
  "sourceRowHash",
  "dataVersion",
  "methodologyVersion",
  "qualityState",
  "version",
  "upstream"
];
const requiredScopeFields = [
  "workspaceId",
  "plan",
  "channel",
  "datasets",
  "tools",
  "allowedFields",
  "deniedFields",
  "exportAllowed",
  "delaySeconds",
  "historyDays",
  "maxRows",
  "maxWindowDays",
  "limitationCodes"
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
    routes: contract.tools.map((tool) => tool.route),
    status: "ok",
    tools: contract.tools.map((tool) => tool.tool_name)
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
    errors.push("status must be local_contract until live evidence service exists");
  }

  if (value.package !== "@aiphabee/evidence-lineage") {
    errors.push("package must be @aiphabee/evidence-lineage");
  }

  for (const booleanField of [
    "live_data_access",
    "allow_arbitrary_sql",
    "allow_arbitrary_url"
  ]) {
    if (value[booleanField] !== false) {
      errors.push(`${booleanField} must be false`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.gateway_policy_compiler !== true) {
    errors.push("gateway_policy_compiler must be true");
  }

  if (!Array.isArray(value.tools)) {
    errors.push("tools must be an array");
    return errors;
  }

  const toolsByName = new Map(value.tools.map((tool) => [tool.tool_name, tool]));

  for (const toolName of requiredTools) {
    const tool = toolsByName.get(toolName);

    if (!isRecord(tool)) {
      errors.push(`tools must include ${toolName}`);
      continue;
    }

    if (!requiredRoutes.includes(tool.route)) {
      errors.push(`${toolName} route is invalid`);
    }

    if (tool.handler_ready !== true) {
      errors.push(`${toolName} handler_ready must be true`);
    }

    errors.push(
      ...validateStringArray(
        tool.supported_inputs,
        requiredInputsByTool[toolName],
        `${toolName}.supported_inputs`
      )
    );
    errors.push(
      ...validateStringArray(
        tool.required_statuses,
        requiredStatusesByTool[toolName],
        `${toolName}.required_statuses`
      )
    );
    errors.push(
      ...validateStringArray(
        tool.required_error_codes,
        requiredErrorsByTool[toolName],
        `${toolName}.required_error_codes`
      )
    );

    if (toolName === "get_data_lineage") {
      errors.push(
        ...validateStringArray(
          tool.required_lineage_fields,
          requiredLineageFields,
          `${toolName}.required_lineage_fields`
        )
      );
    }

    if (toolName === "get_entitlements") {
      errors.push(
        ...validateStringArray(
          tool.required_scope_fields,
          requiredScopeFields,
          `${toolName}.required_scope_fields`
        )
      );
    }

    if (!Array.isArray(tool.fixture_cases) || tool.fixture_cases.length < 4) {
      errors.push(`${toolName}.fixture_cases must include fixture coverage`);
    }
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
