#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/high-cost-analytics-queue.contract.json";
const requiredItems = ["ANA-01", "ANA-03", "MCP-11", "US-W10"];
const requiredOutputFields = [
  "cost_estimate",
  "scheduling_decision",
  "concurrency_pool",
  "independent_pool_required",
  "queue_required",
  "enqueue_plan",
  "usage_policy",
  "pre_debit_required",
  "failure_refund_required"
];
const requiredTools = ["screen_securities", "compare_securities"];
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

  if (value.version !== "2026-06-21.phase2.high-cost-analytics-queue-scaffold.v0") {
    errors.push("version must match high-cost analytics queue scaffold version");
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

  if (value.route !== "POST /analytics/high-cost/plan") {
    errors.push("route must be POST /analytics/high-cost/plan");
  }

  if (value.tool_name !== "plan_high_cost_analytics") {
    errors.push("tool_name must be plan_high_cost_analytics");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["frontend", "live_data_access", "sql_emitted", "durable_queue_writes"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_1_items,
      requiredItems,
      "covered_sprint_2_1_items"
    )
  );
  errors.push(...validateHighCostPolicy(value.high_cost_policy));
  errors.push(...validateToolWeights(value.tool_weights));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateHighCostPolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["high_cost_policy must be an object"];
  }

  for (const field of [
    "independent_concurrency_pool",
    "ordinary_pool_protected",
    "queue_required_for_high_cost_tools",
    "pre_debit_required",
    "failure_refund_required",
    "requires_confirmation_before_enqueue",
    "usage_ledger_link_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`high_cost_policy.${field} must be true`);
    }
  }

  if (value.queue_name !== "analytics-high-cost") {
    errors.push("high_cost_policy.queue_name must be analytics-high-cost");
  }

  if (value.high_cost_threshold !== 8) {
    errors.push("high_cost_policy.high_cost_threshold must be 8");
  }

  if (value.max_parallel_high_cost !== 2) {
    errors.push("high_cost_policy.max_parallel_high_cost must be 2");
  }

  if (value.max_parallel_standard !== 8) {
    errors.push("high_cost_policy.max_parallel_standard must be 8");
  }

  if (value.durable_workflow !== "planned") {
    errors.push("high_cost_policy.durable_workflow must be planned");
  }

  return errors;
}

function validateToolWeights(value) {
  const errors = [];

  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    return ["tool_weights must be an object array"];
  }

  for (const toolName of requiredTools) {
    const tool = value.find((item) => item.tool_name === toolName);

    if (!isRecord(tool)) {
      errors.push(`tool_weights must include ${toolName}`);
      continue;
    }

    if (tool.prd_credit_weight_min !== (toolName === "screen_securities" ? 8 : 5)) {
      errors.push(`${toolName} prd_credit_weight_min is invalid`);
    }

    if (tool.prd_credit_weight_max !== (toolName === "screen_securities" ? 20 : 15)) {
      errors.push(`${toolName} prd_credit_weight_max is invalid`);
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
