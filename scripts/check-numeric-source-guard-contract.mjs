#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/numeric-source-guard.contract.json";
const allowedSources = ["tool_result", "deterministic_calculation"];
const blockedSources = ["model_memory", "training_data", "unverified_prompt", "unstated_source"];
const requiredValidationRules = [
  "extract_numeric_claims",
  "require_tool_result_or_calculation_ref",
  "block_model_memory_numbers",
  "label_missing_numbers_unknown"
];
const requiredToolResultSourceFields = [
  "tool_name",
  "version",
  "output_schema_id",
  "data_classes",
  "source_record_required"
];
const requiredDeterministicCalculationFields = [
  "calculation_id",
  "input_source",
  "methodology_version",
  "required_source_tools"
];
const requiredPlannedToolSources = [
  "get_quote_snapshot",
  "get_price_history",
  "get_financial_facts"
];
const requiredCalculationIds = [
  "deterministic_return_risk_v0",
  "deterministic_financial_growth_v0"
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
    allowed_sources: contract.allowed_sources,
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

  if (value.guard_status !== "guarded_no_actual_results") {
    errors.push("guard_status must be guarded_no_actual_results");
  }

  if (value.concrete_claims_allowed_now !== false) {
    errors.push("concrete_claims_allowed_now must be false");
  }

  if (value.post_generation_validation !== "planned") {
    errors.push("post_generation_validation must be planned");
  }

  errors.push(...validateStringArray(value.allowed_sources, allowedSources, "allowed_sources"));
  errors.push(...validateStringArray(value.blocked_sources, blockedSources, "blocked_sources"));
  errors.push(
    ...validateStringArray(
      value.required_validation_rules,
      requiredValidationRules,
      "required_validation_rules"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_result_source_fields,
      requiredToolResultSourceFields,
      "required_tool_result_source_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_deterministic_calculation_fields,
      requiredDeterministicCalculationFields,
      "required_deterministic_calculation_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_planned_tool_sources,
      requiredPlannedToolSources,
      "required_planned_tool_sources"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_calculation_ids,
      requiredCalculationIds,
      "required_calculation_ids"
    )
  );

  if (!isRecord(value.answer_contract)) {
    errors.push("answer_contract must be an object");
  } else {
    if (value.answer_contract.concrete_financial_numbers_allowed !== false) {
      errors.push("answer_contract.concrete_financial_numbers_allowed must be false");
    }

    if (value.answer_contract.failure_code !== "UNSOURCED_NUMERIC_CLAIM") {
      errors.push("answer_contract.failure_code must be UNSOURCED_NUMERIC_CLAIM");
    }

    if (value.answer_contract.memory_generated_numbers_allowed !== false) {
      errors.push("answer_contract.memory_generated_numbers_allowed must be false");
    }

    for (const field of ["requires_calculation_ref", "requires_source_record_ref"]) {
      if (value.answer_contract[field] !== true) {
        errors.push(`answer_contract.${field} must be true`);
      }
    }

    if (value.answer_contract.unsupported_numeric_claim_behavior !== "block_answer_claim") {
      errors.push("answer_contract.unsupported_numeric_claim_behavior must be block_answer_claim");
    }

    if (value.answer_contract.unknown_value_label !== "unknown") {
      errors.push("answer_contract.unknown_value_label must be unknown");
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
