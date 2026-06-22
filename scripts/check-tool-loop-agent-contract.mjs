#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/tool-loop-planner.contract.json";
const requiredStepPhases = [
  "security_resolution",
  "entitlement_gate",
  "data_fetch",
  "evidence_binding",
  "answer_contract"
];
const requiredProgressEvents = [
  "run.started",
  "tool.step.planned",
  "tool.call.started",
  "tool.call.completed",
  "tool.call.failed",
  "run.completed",
  "run.stopped"
];
const requiredStopConditions = [
  "max_steps",
  "budget_exhausted",
  "two_consecutive_same_error",
  "tool_scope_denied",
  "all_planned_tools_completed"
];
const requiredToolCallFields = [
  "name",
  "version",
  "input_schema_id",
  "output_schema_id",
  "required_scope",
  "live_data_access",
  "execution"
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
    max_parallel_tools: contract.max_parallel_tools,
    route: contract.route,
    status: "ok",
    streaming_transport: contract.streaming_transport
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

  if (value.stream_route !== "POST /agent/runs/stream") {
    errors.push("stream_route must be POST /agent/runs/stream");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  for (const field of [
    "actual_tool_execution",
    "chain_of_thought_exposed",
    "frontend",
    "model_calls"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.streaming_transport !== "server_sent_events") {
    errors.push("streaming_transport must be server_sent_events");
  }

  if (value.stream_content_type !== "text/event-stream") {
    errors.push("stream_content_type must be text/event-stream");
  }

  for (const field of ["stream_model_calls", "stream_actual_tool_execution"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  if (value.max_steps !== 6) {
    errors.push("max_steps must be 6");
  }

  if (value.supported_max_steps !== 8) {
    errors.push("supported_max_steps must be 8");
  }

  if (value.max_parallel_tools !== 3) {
    errors.push("max_parallel_tools must be 3");
  }

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
  }

  errors.push(
    ...validateStringArray(value.required_step_phases, requiredStepPhases, "required_step_phases")
  );
  errors.push(
    ...validateStringArray(
      value.required_progress_events,
      requiredProgressEvents,
      "required_progress_events"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_stop_conditions,
      requiredStopConditions,
      "required_stop_conditions"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_call_fields,
      requiredToolCallFields,
      "required_tool_call_fields"
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
