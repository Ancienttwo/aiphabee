#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/observability/eval-v1.contract.json";
const eventsContractPath = "deploy/observability/events.contract.json";
const requiredMetrics = [
  "fact_accuracy",
  "calculation_accuracy",
  "citation_accuracy",
  "correct_refusal_rate"
];
const requiredWvroCriteria = [
  "financial_tool_success",
  "openable_evidence",
  "high_intent_action",
  "no_data_error_or_severe_hallucination_or_compliance_block"
];
const requiredHighIntentActions = [
  "save_research",
  "add_to_watchlist",
  "compare",
  "allowed_export",
  "create_alert",
  "continue_follow_up",
  "mcp_follow_up"
];
const requiredForbiddenPayloads = ["prompt", "api_key", "token", "secret", "password"];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const eventsContract = readJson(eventsContractPath);
const errors = validateContract(contract, eventsContract);

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
    metrics: contract.metrics.length,
    plan_route: contract.plan_route,
    status: "ok",
    wvro_criteria: contract.wvro.required_criteria.length
  },
  0
);

function validateContract(value, eventsContract) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase1.eval-v1-wvro-scaffold.v0") {
    errors.push("version must match eval v1 scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/observability") {
    errors.push("package must be @aiphabee/observability");
  }

  if (value.runtime_route !== "GET /observability/runtime") {
    errors.push("runtime_route must be GET /observability/runtime");
  }

  if (value.plan_route !== "POST /observability/eval-v1/plan") {
    errors.push("plan_route must be POST /observability/eval-v1/plan");
  }

  if (value.event_type !== "run.eval") {
    errors.push("event_type must be run.eval");
  }

  for (const field of ["eval_store_writes_enabled", "frontend", "live_persistent_writes"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.unsourced_numeric_claim_target_rate !== 0.001) {
    errors.push("unsourced_numeric_claim_target_rate must be 0.001");
  }

  errors.push(...validateMetrics(value.metrics));
  errors.push(...validateWvro(value.wvro));
  errors.push(
    ...validateStringArray(value.forbidden_payloads, requiredForbiddenPayloads, "forbidden_payloads")
  );
  errors.push(...validateEventsContract(eventsContract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateMetrics(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["metrics must be an array"];
  }

  const metricIds = new Set();

  value.forEach((metric, index) => {
    if (!isRecord(metric)) {
      errors.push(`metrics[${index}] must be an object`);
      return;
    }

    if (typeof metric.metric_id === "string") {
      metricIds.add(metric.metric_id);
    }

    if (metric.source !== "eval_set_v1") {
      errors.push(`metrics[${index}].source must be eval_set_v1`);
    }

    if (metric.status !== "planned") {
      errors.push(`metrics[${index}].status must be planned`);
    }
  });

  for (const metricId of requiredMetrics) {
    if (!metricIds.has(metricId)) {
      errors.push(`metrics missing ${metricId}`);
    }
  }

  return errors;
}

function validateWvro(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["wvro must be an object"];
  }

  if (value.definition_source !== "prd_4_3") {
    errors.push("wvro.definition_source must be prd_4_3");
  }

  errors.push(
    ...validateStringArray(value.required_criteria, requiredWvroCriteria, "wvro.required_criteria")
  );
  errors.push(
    ...validateStringArray(
      value.high_intent_actions,
      requiredHighIntentActions,
      "wvro.high_intent_actions"
    )
  );

  return errors;
}

function validateEventsContract(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.event_types)) {
    return ["events contract must define event_types"];
  }

  const evalEvent = value.event_types.find(
    (eventType) => isRecord(eventType) && eventType.type === "run.eval"
  );

  if (!isRecord(evalEvent)) {
    return ["events contract must include run.eval"];
  }

  if (!Array.isArray(evalEvent.required_fields) || !evalEvent.required_fields.includes("eval")) {
    errors.push("events contract run.eval must require eval field");
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
      errors.push(`${name} missing ${requiredValue}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract must not contain secret-like value matching ${pattern}`);
    }
  }

  return errors;
}

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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
