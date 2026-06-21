#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/event-study.contract.json";
const requiredItems = [
  "ANA-06",
  "run_event_study",
  "event_date",
  "event_window",
  "benchmark",
  "abnormal_return",
  "missing_samples_not_silent"
];
const requiredSourceTools = ["resolve_security", "get_price_history"];
const requiredOutputFields = [
  "event",
  "event_window",
  "benchmark",
  "methodology",
  "observations",
  "missing_observations",
  "summary",
  "source_record_ids"
];
const requiredObservationFields = [
  "date",
  "relative_day",
  "security_return",
  "benchmark_return",
  "abnormal_return",
  "status",
  "source_record_ids"
];
const requiredSummaryFields = [
  "computed_observation_count",
  "missing_observation_count",
  "requested_observation_count",
  "cumulative_security_return",
  "cumulative_benchmark_return",
  "cumulative_abnormal_return"
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
    status: "ok",
    tool_name: contract.tool_name
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

  if (value.version !== "2026-06-21.phase3.event-study-scaffold.v0") {
    errors.push("version must match event study scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/analytics-tools") {
    errors.push("package must be @aiphabee/analytics-tools");
  }

  if (value.runtime_route !== "GET /analytics/runtime") {
    errors.push("runtime_route must be GET /analytics/runtime");
  }

  if (value.route !== "POST /analytics/event-study") {
    errors.push("route must be POST /analytics/event-study");
  }

  if (value.tool_name !== "run_event_study") {
    errors.push("tool_name must be run_event_study");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["frontend", "live_data_access", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_1_items,
      requiredItems,
      "covered_sprint_3_1_items"
    )
  );
  errors.push(...validateStringArray(value.source_tools, requiredSourceTools, "source_tools"));
  errors.push(...validateHighCostContract(value.high_cost_contract));
  errors.push(...validateEventStudyContract(value.event_study_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateHighCostContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["high_cost_contract must be an object"];
  }

  if (value.queue_route !== "POST /analytics/high-cost/plan") {
    errors.push("high_cost_contract.queue_route must be POST /analytics/high-cost/plan");
  }

  if (value.prd_credit_weight_min !== 20) {
    errors.push("high_cost_contract.prd_credit_weight_min must be 20");
  }

  if (value.prd_credit_weight_max !== 50) {
    errors.push("high_cost_contract.prd_credit_weight_max must be 50");
  }

  for (const field of ["requires_confirmation_before_enqueue", "independent_pool_required"]) {
    if (value[field] !== true) {
      errors.push(`high_cost_contract.${field} must be true`);
    }
  }

  return errors;
}

function validateEventStudyContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["event_study_contract must be an object"];
  }

  if (value.formula_version !== "event-study-v0") {
    errors.push("event_study_contract.formula_version must be event-study-v0");
  }

  if (value.abnormal_return_method !== "security_return_minus_benchmark_return") {
    errors.push(
      "event_study_contract.abnormal_return_method must be security_return_minus_benchmark_return"
    );
  }

  if (value.point_in_time !== true) {
    errors.push("event_study_contract.point_in_time must be true");
  }

  if (value.price_history_field !== "return") {
    errors.push("event_study_contract.price_history_field must be return");
  }

  if (value.sample_missing_policy !== "surface_missing_dates_do_not_drop") {
    errors.push(
      "event_study_contract.sample_missing_policy must surface missing dates"
    );
  }

  if (value.default_event_date !== "2026-01-06") {
    errors.push("event_study_contract.default_event_date must be 2026-01-06");
  }

  if (value.default_event_id !== "synthetic_00700_results_event") {
    errors.push("event_study_contract.default_event_id is invalid");
  }

  if (!isRecord(value.default_window)) {
    errors.push("event_study_contract.default_window must be an object");
  } else {
    if (value.default_window.pre_days !== 1) {
      errors.push("event_study_contract.default_window.pre_days must be 1");
    }

    if (value.default_window.post_days !== 1) {
      errors.push("event_study_contract.default_window.post_days must be 1");
    }
  }

  if (!isRecord(value.supported_window)) {
    errors.push("event_study_contract.supported_window must be an object");
  } else {
    if (value.supported_window.max_pre_days !== 2) {
      errors.push("event_study_contract.supported_window.max_pre_days must be 2");
    }

    if (value.supported_window.max_post_days !== 1) {
      errors.push("event_study_contract.supported_window.max_post_days must be 1");
    }
  }

  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "event_study_contract.required_output_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_observation_fields,
      requiredObservationFields,
      "event_study_contract.required_observation_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_summary_fields,
      requiredSummaryFields,
      "event_study_contract.required_summary_fields"
    )
  );

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
