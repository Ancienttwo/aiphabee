#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/model-execution-audit-smoke.contract.json";
const modelProviderReadinessPath = "deploy/model-providers/live-smoke-readiness.contract.json";
const modelRoutingAuditPath = "deploy/agent/model-routing-audit.contract.json";
const observabilityEventPath = "deploy/observability/events.contract.json";
const packagePath = "package.json";
const testPath = "apps/worker/src/agent-model-execution-audit-smoke.test.ts";
const workerPath = "apps/worker/src/index.ts";
const expectedVersion = "2026-06-22.phase1.agent-model-execution-audit-smoke.v0";
const expectedScript = "node scripts/check-agent-model-execution-audit-smoke-contract.mjs";
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const modelProviderReadiness = readJson(modelProviderReadinessPath);
const modelRoutingAudit = readJson(modelRoutingAuditPath);
const observabilityEvents = readJson(observabilityEventPath);
const packageJson = readJson(packagePath);
const testSource = readText(testPath);
const workerSource = readText(workerPath);
const errors = [
  ...validateContract(contract),
  ...validateLinkedContracts(modelProviderReadiness, modelRoutingAudit, observabilityEvents),
  ...validatePackage(packageJson),
  ...validateTestSource(testSource),
  ...validateWorkerSource(workerSource),
  ...validateNoSecrets(contract)
];

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
    token_binding: contract.smoke_token_binding
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["agent model execution audit smoke contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-agent-model-execution-audit-smoke-contract.mjs",
    model_provider_readiness_contract: modelProviderReadinessPath,
    model_provider_route: "POST /agent/model-provider/live-smoke",
    model_routing_audit_contract: modelRoutingAuditPath,
    observability_event_contract: observabilityEventPath,
    route: "POST /agent/runs/model-execution-audit-smoke",
    smoke_token_binding: "AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN",
    status: "local_contract",
    test_file: testPath,
    version: expectedVersion,
    worker_entrypoint: workerPath
  };

  for (const [field, expected] of Object.entries(expectedFields)) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  if (!isRecord(value.smoke_header)) {
    errors.push("smoke_header must be an object");
  } else {
    if (value.smoke_header.name !== "x-aiphabee-smoke") {
      errors.push("smoke_header.name must be x-aiphabee-smoke");
    }

    if (value.smoke_header.value !== "agent-model-execution-audit-v1") {
      errors.push("smoke_header.value must be agent-model-execution-audit-v1");
    }
  }

  errors.push(
    ...validateStringArray(
      value.required_ai_gateway_env,
      [
        "CLOUDFLARE_ACCOUNT_ID",
        "CLOUDFLARE_API_TOKEN or AI_GATEWAY_LIVE_SMOKE_TOKEN",
        "AI_GATEWAY_NAME",
        "AI_GATEWAY_SMOKE_MODEL"
      ],
      "required_ai_gateway_env"
    )
  );

  for (const field of [
    "actual_model_execution",
    "ai_sdk_generate_text",
    "ai_sdk_stream_text",
    "audit_event_preview",
    "auth_enforced_before_model_execution",
    "hash_only_response"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "frontend",
    "live_evidence_writes",
    "live_usage_ledger_writes",
    "persistent_writes",
    "raw_model_output_returned"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(...validateGatewayLogEvidence(value.gateway_log_evidence));
  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "ai_gateway_logs_read",
        "cost_log_verified",
        "cache_log_verified",
        "rate_limit_log_verified",
        "fallback_log_verified",
        "live_usage_ledger_writes",
        "frontend_ask_rendering"
      ],
      "not_claimed"
    )
  );
  errors.push(...validateVerification(value.verification));

  return errors;
}

function validateGatewayLogEvidence(value) {
  if (!isRecord(value)) {
    return ["gateway_log_evidence must be an object"];
  }

  const errors = [];

  for (const field of [
    "ai_gateway_logs_read",
    "cache_log_verified",
    "cost_log_verified",
    "fallback_log_verified",
    "rate_limit_log_verified"
  ]) {
    if (value[field] !== false) {
      errors.push(`gateway_log_evidence.${field} must remain false`);
    }
  }

  if (value.status !== "blocked_external_permission") {
    errors.push("gateway_log_evidence.status must be blocked_external_permission");
  }

  errors.push(
    ...validateStringArray(
      value.required_permissions,
      ["AI Gateway Read", "Account Analytics Read"],
      "gateway_log_evidence.required_permissions"
    )
  );

  return errors;
}

function validateLinkedContracts(modelProviderValue, modelRoutingValue, observabilityValue) {
  const errors = [];

  if (modelProviderValue.status !== "partial_live_passed") {
    errors.push("model provider readiness must remain partial_live_passed");
  }

  if (!isRecord(modelProviderValue.latest_observability_probe)) {
    errors.push("model provider readiness must include latest_observability_probe");
  } else if (modelProviderValue.latest_observability_probe.status !== "permission_denied") {
    errors.push("latest_observability_probe must remain permission_denied");
  }

  if (modelRoutingValue.policy_status !== "model_routing_audit_scaffold") {
    errors.push("model routing audit policy_status must remain scaffold");
  }

  if (!isRecord(modelRoutingValue.audit_contract)) {
    errors.push("model routing audit contract must include audit_contract");
  } else {
    errors.push(
      ...validateStringArray(
        modelRoutingValue.audit_contract.required_fields,
        [
          "model_provider",
          "model_id",
          "model_version",
          "input_tokens",
          "output_tokens",
          "estimated_cost",
          "latency_ms",
          "output_hash",
          "fallback_from_model",
          "fallback_to_model"
        ],
        "model_routing_audit.audit_contract.required_fields"
      )
    );
  }

  const runAuditEvent = Array.isArray(observabilityValue.event_types)
    ? observabilityValue.event_types.find((eventType) => eventType?.type === "run.audit")
    : undefined;

  if (!isRecord(runAuditEvent)) {
    errors.push("observability event contract must include run.audit");
  } else {
    errors.push(
      ...validateStringArray(
        runAuditEvent.audit_required_fields,
        [
          "model_provider",
          "model_id",
          "model_version",
          "model_calls",
          "input_tokens",
          "output_tokens",
          "total_tokens",
          "estimated_cost_usd",
          "latency_ms",
          "output_hash"
        ],
        "observability.run.audit.audit_required_fields"
      )
    );
  }

  return errors;
}

function validateVerification(value) {
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }

  const errors = [];
  const expectedCommands = {
    contract_check: "npm run check:agent-model-execution-audit-smoke",
    unit_test: "npm run test -- apps/worker/src/agent-model-execution-audit-smoke.test.ts",
    worker_typecheck: "npm run typecheck --workspace @aiphabee/worker"
  };

  for (const [field, command] of Object.entries(expectedCommands)) {
    if (value[field] !== command) {
      errors.push(`verification.${field} must be ${command}`);
    }
  }

  return errors;
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];

  if (scripts["check:agent-model-execution-audit-smoke"] !== expectedScript) {
    errors.push(`package.json check:agent-model-execution-audit-smoke must be ${expectedScript}`);
  }

  const rootCheck = String(scripts.check ?? "");
  const modelRoutingIndex = rootCheck.indexOf("npm run check:model-routing-audit");
  const modelProviderReadinessIndex = rootCheck.indexOf("npm run check:model-provider-live-readiness");
  const smokeIndex = rootCheck.indexOf("npm run check:agent-model-execution-audit-smoke");
  const observabilityIndex = rootCheck.indexOf("npm run check:observability");

  if (smokeIndex < 0) {
    errors.push("root check must include check:agent-model-execution-audit-smoke");
  }

  if (modelRoutingIndex < 0 || smokeIndex < modelRoutingIndex) {
    errors.push("root check must run agent model execution audit smoke after model routing audit");
  }

  if (modelProviderReadinessIndex < 0 || smokeIndex < modelProviderReadinessIndex) {
    errors.push("root check must run agent model execution audit smoke after model provider live readiness");
  }

  if (observabilityIndex < 0 || smokeIndex > observabilityIndex) {
    errors.push("root check must run agent model execution audit smoke before observability checks");
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN",
    "agent-model-execution-audit-v1",
    "generateText",
    "streamText",
    "run.audit",
    "blocked_external_permission",
    "not.toContain(\"AIPHABEE_AI_GATEWAY_SMOKE_OK\")",
    "not.toContain(\"@cf/aiphabee/synthetic-model\")",
    "not.toContain(\"synthetic-smoke-token\")"
  ]) {
    if (!source.includes(text)) {
      errors.push(`test source must include ${text}`);
    }
  }

  return errors;
}

function validateWorkerSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_AGENT_MODEL_AUDIT_SMOKE_TOKEN",
    "AGENT_MODEL_EXECUTION_AUDIT_SMOKE_ROUTE",
    "AGENT_MODEL_EXECUTION_AUDIT_SMOKE_HEADER_VALUE",
    "isAgentModelExecutionAuditSmokeAuthorized",
    "missingAgentModelExecutionAuditSmokeEnv",
    "createAgentModelExecutionAuditSmokeResult",
    "runAiGatewayLiveSmoke",
    "event_type: \"run.audit\"",
    "ai_gateway_log_permission_required",
    "blocked_external_permission",
    "raw_model_output_returned: false"
  ]) {
    if (!source.includes(text)) {
      errors.push(`worker source must include ${text}`);
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

  if (new Set(value).size !== value.length) {
    errors.push(`${name} must not contain duplicates`);
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
