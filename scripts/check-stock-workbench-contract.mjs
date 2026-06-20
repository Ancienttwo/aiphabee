#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/workbench/stock-workbench.contract.json";
const requiredItems = ["STK-01", "STK-02", "STK-03", "STK-05"];
const requiredSections = [
  "security_profile",
  "quote_snapshot",
  "price_history",
  "financial_facts",
  "corporate_actions"
];
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_quote_snapshot",
  "get_price_history",
  "get_financial_facts",
  "get_corporate_actions"
];
const requiredUnsupported = ["derived_valuation_metrics", "announcements"];
const requiredOutputFields = [
  "security_profile",
  "quote_snapshot",
  "price_history",
  "financial_facts",
  "corporate_actions",
  "data_quality",
  "evidence",
  "unsupported_sections"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
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
    route: contract.route,
    sections: contract.sections.length,
    status: "ok",
    tools: contract.source_tools.length
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

  if (value.version !== "2026-06-21.phase1.stock-workbench-aggregate-scaffold.v0") {
    errors.push("version must match stock workbench scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/workbench") {
    errors.push("package must be @aiphabee/workbench");
  }

  if (value.runtime_route !== "GET /workbench/runtime") {
    errors.push("runtime_route must be GET /workbench/runtime");
  }

  if (value.route !== "POST /workbench/stock/snapshot") {
    errors.push("route must be POST /workbench/stock/snapshot");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.actual_tool_execution !== true) {
    errors.push("actual_tool_execution must be true because this aggregates local tool handlers");
  }

  for (const field of ["frontend", "live_data_access", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_1_4_items,
      requiredItems,
      "covered_sprint_1_4_items"
    )
  );
  errors.push(...validateStringArray(value.sections, requiredSections, "sections"));
  errors.push(...validateStringArray(value.source_tools, requiredTools, "source_tools"));
  errors.push(
    ...validateStringArray(
      value.unsupported_sections,
      requiredUnsupported,
      "unsupported_sections"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(...validateNoSecrets(value));

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
