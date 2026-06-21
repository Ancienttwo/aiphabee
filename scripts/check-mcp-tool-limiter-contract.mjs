#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/tool-limiter.contract.json";
const requiredSprintItems = [
  "MCP-11",
  "rate_limit_plan",
  "concurrency_limit_plan",
  "budget_limit_plan",
  "ordinary_pool_protection"
];
const requiredRuntimeCapabilityFields = [
  "mcp_tool_limiter_ready",
  "mcp_tool_limiter_version",
  "rate_limit_plan_ready",
  "concurrency_limit_plan_ready",
  "budget_limit_plan_ready",
  "mcp_limiter_live",
  "ordinary_pool_protection",
  "mcp_limiter_error_codes",
  "mcp_tool_limiter_pools"
];
const requiredToolLimitFields = [
  "limiter_version",
  "tool_name",
  "ordinary_pool_protection",
  "weight",
  "rate_limit",
  "concurrency",
  "budget",
  "durable_queue"
];
const requiredRateLimitFields = [
  "per_minute_limit",
  "burst_limit",
  "live_window_reads",
  "rate_limited",
  "rate_limited_error_code",
  "retry_after_seconds",
  "status"
];
const requiredConcurrencyFields = [
  "pool",
  "max_parallel",
  "high_cost_pool_isolated",
  "live_inflight_reads"
];
const requiredBudgetFields = [
  "estimated_credits",
  "remaining_credits_after_estimate",
  "allowed_after_estimate",
  "budget_exceeded",
  "budget_exceeded_error_code",
  "pre_debit_required",
  "failure_refund_required",
  "live_debit"
];
const requiredValidatedTools = ["get_price_history", "get_market_calendar"];
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
    high_cost_threshold: contract.high_cost_threshold,
    route: contract.route,
    status: "ok",
    validated_tools: contract.validated_tools.length,
    version: contract.version
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

  if (value.version !== "2026-06-21.phase2.mcp-tool-limiter-scaffold.v0") {
    errors.push("version must match MCP tool limiter scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.runtime_route !== "GET /mcp/runtime") {
    errors.push("runtime_route must be GET /mcp/runtime");
  }

  if (value.route !== "POST /mcp") {
    errors.push("route must be POST /mcp");
  }

  for (const field of [
    "frontend",
    "live_tool_execution",
    "live_rate_limiter",
    "live_concurrency_limiter",
    "live_budget_debit",
    "durable_queue_writes"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.ordinary_pool_protection !== true) {
    errors.push("ordinary_pool_protection must be true");
  }

  if (value.high_cost_threshold !== 8) {
    errors.push("high_cost_threshold must be 8");
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
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "required_runtime_capability_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_limit_fields,
      requiredToolLimitFields,
      "required_tool_limit_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_rate_limit_fields,
      requiredRateLimitFields,
      "required_rate_limit_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_concurrency_fields,
      requiredConcurrencyFields,
      "required_concurrency_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_budget_fields,
      requiredBudgetFields,
      "required_budget_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.validated_tools,
      requiredValidatedTools,
      "validated_tools"
    )
  );
  errors.push(...validateRateLimit(value.rate_limit));
  errors.push(...validateBudget(value.budget));
  errors.push(...validatePools(value.concurrency_pools));
  errors.push(...validateDurableQueue(value.durable_queue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateRateLimit(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["rate_limit must be an object"];
  }

  if (value.per_minute_limit !== 60) {
    errors.push("rate_limit.per_minute_limit must be 60");
  }

  if (value.burst_limit !== 10) {
    errors.push("rate_limit.burst_limit must be 10");
  }

  if (value.live_window_reads !== false) {
    errors.push("rate_limit.live_window_reads must be false");
  }

  if (value.rate_limited_error_code !== "RATE_LIMITED") {
    errors.push("rate_limit.rate_limited_error_code must be RATE_LIMITED");
  }

  return errors;
}

function validateBudget(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["budget must be an object"];
  }

  if (value.budget_exceeded_error_code !== "BUDGET_EXCEEDED") {
    errors.push("budget.budget_exceeded_error_code must be BUDGET_EXCEEDED");
  }

  if (value.failure_refund_required !== true) {
    errors.push("budget.failure_refund_required must be true");
  }

  if (value.live_debit !== false) {
    errors.push("budget.live_debit must be false");
  }

  if (value.pre_debit_required !== true) {
    errors.push("budget.pre_debit_required must be true");
  }

  return errors;
}

function validatePools(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["concurrency_pools must be an array"];
  }

  const standardPool = value.find((pool) => isRecord(pool) && pool.name === "mcp_standard");
  const highCostPool = value.find((pool) => isRecord(pool) && pool.name === "mcp_high_cost");

  if (!isRecord(standardPool)) {
    errors.push("concurrency_pools must include mcp_standard");
  } else {
    if (standardPool.high_cost !== false) {
      errors.push("mcp_standard.high_cost must be false");
    }
    if (standardPool.max_parallel !== 8) {
      errors.push("mcp_standard.max_parallel must be 8");
    }
    if (standardPool.ordinary_pool_protection !== true) {
      errors.push("mcp_standard.ordinary_pool_protection must be true");
    }
  }

  if (!isRecord(highCostPool)) {
    errors.push("concurrency_pools must include mcp_high_cost");
  } else {
    if (highCostPool.high_cost !== true) {
      errors.push("mcp_high_cost.high_cost must be true");
    }
    if (highCostPool.max_parallel !== 2) {
      errors.push("mcp_high_cost.max_parallel must be 2");
    }
    if (highCostPool.ordinary_pool_protection !== true) {
      errors.push("mcp_high_cost.ordinary_pool_protection must be true");
    }
    if (highCostPool.queue_name !== "mcp-high-cost") {
      errors.push("mcp_high_cost.queue_name must be mcp-high-cost");
    }
  }

  return errors;
}

function validateDurableQueue(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["durable_queue must be an object"];
  }

  if (value.high_cost_queue_name !== "mcp-high-cost") {
    errors.push("durable_queue.high_cost_queue_name must be mcp-high-cost");
  }

  if (value.enqueue_status !== "planned_no_live") {
    errors.push("durable_queue.enqueue_status must be planned_no_live");
  }

  if (value.live_queue_writes !== false) {
    errors.push("durable_queue.live_queue_writes must be false");
  }

  return errors;
}

function validateStringArray(value, required, label) {
  const errors = [];

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return [`${label} must be a string array`];
  }

  for (const item of required) {
    if (!value.includes(item)) {
      errors.push(`${label} must include ${item}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract must not contain secret-like value matching ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
