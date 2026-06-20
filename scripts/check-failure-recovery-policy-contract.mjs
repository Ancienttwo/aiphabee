#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/failure-recovery-policy.contract.json";
const requiredRetryableErrorClasses = [
  "RATE_LIMITED",
  "TOOL_TIMEOUT",
  "UPSTREAM_5XX",
  "NETWORK_RESET"
];
const requiredNonRetryableErrorClasses = [
  "DATA_NOT_LICENSED",
  "DATA_QUALITY_HOLD",
  "INVALID_INPUT",
  "OUT_OF_RANGE",
  "SCOPE_DENIED",
  "TOO_MANY_ROWS"
];
const requiredStepRecoveryActions = [
  "retry_failed_tool_call_only",
  "preserve_completed_step",
  "return_partial_response"
];
const requiredValidationRules = [
  "preserve_completed_steps",
  "retry_failed_tool_call_only",
  "reuse_existing_evidence_records",
  "do_not_rebill_retries",
  "stop_after_two_same_errors",
  "surface_partial_response"
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
    no_double_charge: contract.no_double_charge,
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

  for (const field of ["actual_tool_execution", "frontend", "model_calls", "retry_billable"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.policy_status !== "failure_recovery_policy_scaffold") {
    errors.push("policy_status must be failure_recovery_policy_scaffold");
  }

  if (value.partial_retry !== true) {
    errors.push("partial_retry must be true");
  }

  if (value.retry_scope !== "failed_tool_call_only") {
    errors.push("retry_scope must be failed_tool_call_only");
  }

  if (value.max_attempts_per_tool !== 2) {
    errors.push("max_attempts_per_tool must be 2");
  }

  if (value.no_double_charge !== true) {
    errors.push("no_double_charge must be true");
  }

  if (value.charge_grain !== "tool_call_success") {
    errors.push("charge_grain must be tool_call_success");
  }

  if (value.usage_ledger_write !== "planned") {
    errors.push("usage_ledger_write must be planned");
  }

  if (value.stop_after_consecutive_same_error !== 2) {
    errors.push("stop_after_consecutive_same_error must be 2");
  }

  if (!isRecord(value.recovery_state)) {
    errors.push("recovery_state must be an object");
  } else {
    if (value.recovery_state.state_store !== "planned_run_state") {
      errors.push("recovery_state.state_store must be planned_run_state");
    }

    if (value.recovery_state.durable_runtime !== "planned") {
      errors.push("recovery_state.durable_runtime must be planned");
    }

    if (value.recovery_state.persisted !== false) {
      errors.push("recovery_state.persisted must be false");
    }

    for (const field of ["resume_token", "idempotency_key"]) {
      if (value.recovery_state[field] !== "planned") {
        errors.push(`recovery_state.${field} must be planned`);
      }
    }
  }

  if (!isRecord(value.graceful_degradation)) {
    errors.push("graceful_degradation must be an object");
  } else {
    for (const field of [
      "single_tool_failure_does_not_drop_run",
      "partial_answer_allowed",
      "evidence_binding_required_for_reused_outputs",
      "user_visible_recovery_state"
    ]) {
      if (value.graceful_degradation[field] !== true) {
        errors.push(`graceful_degradation.${field} must be true`);
      }
    }

    if (value.graceful_degradation.failed_tool_claim_label !== "unknown") {
      errors.push("graceful_degradation.failed_tool_claim_label must be unknown");
    }
  }

  errors.push(
    ...validateStringArray(
      value.retryable_error_classes,
      requiredRetryableErrorClasses,
      "retryable_error_classes"
    )
  );
  errors.push(
    ...validateStringArray(
      value.non_retryable_error_classes,
      requiredNonRetryableErrorClasses,
      "non_retryable_error_classes"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_step_recovery_actions,
      requiredStepRecoveryActions,
      "required_step_recovery_actions"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_validation_rules,
      requiredValidationRules,
      "required_validation_rules"
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
