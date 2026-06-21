#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/budget-stop-policy.contract.json";
const requiredBudgetDimensions = ["steps", "credits", "rows", "tokens", "wall_clock_ms"];
const requiredLimitStatusFields = ["dimension", "estimated", "limit", "status"];
const requiredDecisionFields = ["status", "reasons", "stop_before_step"];
const requiredGracefulStopFields = [
  "completed_step_ids",
  "unfinished_step_ids",
  "existing_evidence_record_ids",
  "partial_response_ready",
  "next_step"
];
const requiredUsageFields = ["steps", "credits", "rows", "tokens", "tool_calls", "wall_clock_ms"];
const requiredStopConditions = [
  "max_steps",
  "budget_exhausted",
  "two_consecutive_same_error",
  "tool_scope_denied",
  "all_planned_tools_completed"
];
const requiredSameErrorClasses = [
  "DATA_NOT_LICENSED",
  "DATA_QUALITY_HOLD",
  "OUT_OF_RANGE",
  "SCOPE_DENIED",
  "TOO_MANY_ROWS",
  "TOOL_TIMEOUT"
];
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
    budget_dimensions: contract.budget_dimensions,
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

  if (value.route !== "POST /agent/runs/plan") {
    errors.push("route must be POST /agent/runs/plan");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  for (const field of ["actual_tool_execution", "frontend", "model_calls"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.default_status !== "planned_no_model") {
    errors.push("default_status must be planned_no_model");
  }

  if (value.budget_exhausted_status !== "stopped_budget") {
    errors.push("budget_exhausted_status must be stopped_budget");
  }

  errors.push(
    ...validateStringArray(value.budget_dimensions, requiredBudgetDimensions, "budget_dimensions")
  );
  errors.push(
    ...validateStringArray(
      value.required_limit_status_fields,
      requiredLimitStatusFields,
      "required_limit_status_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.required_decision_fields, requiredDecisionFields, "required_decision_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_graceful_stop_fields,
      requiredGracefulStopFields,
      "required_graceful_stop_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.required_usage_fields, requiredUsageFields, "required_usage_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_stop_conditions,
      requiredStopConditions,
      "required_stop_conditions"
    )
  );

  if (!isRecord(value.retry_policy)) {
    errors.push("retry_policy must be an object");
  } else {
    if (value.retry_policy.max_attempts_per_tool !== 2) {
      errors.push("retry_policy.max_attempts_per_tool must be 2");
    }

    if (value.retry_policy.consecutive_same_error_limit !== 2) {
      errors.push("retry_policy.consecutive_same_error_limit must be 2");
    }

    if (value.retry_policy.retry_billable !== false) {
      errors.push("retry_policy.retry_billable must be false");
    }

    if (value.retry_policy.stops_automatic_retry !== true) {
      errors.push("retry_policy.stops_automatic_retry must be true");
    }

    errors.push(
      ...validateStringArray(
        value.retry_policy.same_error_classes,
        requiredSameErrorClasses,
        "retry_policy.same_error_classes"
      )
    );
  }

  if (!isRecord(value.graceful_stop)) {
    errors.push("graceful_stop must be an object");
  } else {
    for (const field of [
      "does_not_throw_for_valid_budget_exhaustion",
      "returns_continue_cost",
      "returns_partial_result"
    ]) {
      if (value.graceful_stop[field] !== true) {
        errors.push(`graceful_stop.${field} must be true`);
      }
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
