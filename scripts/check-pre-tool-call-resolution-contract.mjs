#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/pre-tool-call-resolution.contract.json";
const requiredDimensions = ["security", "time", "currency", "methodology"];
const requiredStatuses = ["ready", "ready_with_assumptions", "needs_clarification"];
const requiredSecurityBehaviors = [
  "explicit_symbol_resolution",
  "prompt_symbol_inference",
  "ambiguous_candidate_clarification",
  "no_silent_security_selection"
];
const requiredTimeBehaviors = ["as_of_resolution", "latest_available_assumption"];
const supportedCurrencies = ["HKD", "USD", "CNY"];
const requiredMethodologyBehaviors = [
  "explicit_methodology_resolution",
  "split_adjusted_default_assumption",
  "latest_reported_financial_facts_assumption"
];
const requiredClarificationFields = ["field", "question", "reason", "blocking"];
const requiredAssumptionFields = ["field", "value", "reason", "source"];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
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
    dimensions: contract.required_dimensions,
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

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  if (value.route !== "POST /agent/runs/preflight") {
    errors.push("route must be POST /agent/runs/preflight");
  }

  if (value.planner_route !== "POST /agent/runs/plan") {
    errors.push("planner_route must be POST /agent/runs/plan");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  for (const field of ["actual_tool_execution", "frontend", "model_calls"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.clarification_supported !== true) {
    errors.push("clarification_supported must be true");
  }

  errors.push(
    ...validateStringArray(value.required_dimensions, requiredDimensions, "required_dimensions")
  );
  errors.push(...validateStringArray(value.required_statuses, requiredStatuses, "required_statuses"));
  errors.push(
    ...validateStringArray(
      value.required_security_behaviors,
      requiredSecurityBehaviors,
      "required_security_behaviors"
    )
  );
  errors.push(
    ...validateStringArray(value.required_time_behaviors, requiredTimeBehaviors, "required_time_behaviors")
  );
  errors.push(
    ...validateStringArray(value.supported_currencies, supportedCurrencies, "supported_currencies")
  );
  errors.push(
    ...validateStringArray(
      value.required_methodology_behaviors,
      requiredMethodologyBehaviors,
      "required_methodology_behaviors"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_clarification_fields,
      requiredClarificationFields,
      "required_clarification_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_assumption_fields,
      requiredAssumptionFields,
      "required_assumption_fields"
    )
  );

  if (!isRecord(value.tool_readiness)) {
    errors.push("tool_readiness must be an object");
  } else {
    if (value.tool_readiness.blocks_on_clarification !== true) {
      errors.push("tool_readiness.blocks_on_clarification must be true");
    }

    if (value.tool_readiness.lists_blocked_tools !== true) {
      errors.push("tool_readiness.lists_blocked_tools must be true");
    }
  }

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
