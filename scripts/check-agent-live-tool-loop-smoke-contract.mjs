#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/live-tool-loop-smoke.contract.json";
const toolLoopPlannerPath = "deploy/agent/tool-loop-planner.contract.json";
const toolExecutionSmokePath = "deploy/agent/tool-execution-evidence-smoke.contract.json";
const modelExecutionAuditSmokePath = "deploy/agent/model-execution-audit-smoke.contract.json";
const packagePath = "package.json";
const testPath = "apps/worker/src/agent-live-tool-loop-smoke.test.ts";
const workerPath = "apps/worker/src/index.ts";
const expectedVersion = "2026-06-22.phase1.agent-live-tool-loop-smoke.v0";
const expectedScript = "node scripts/check-agent-live-tool-loop-smoke-contract.mjs";
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const toolLoopPlanner = readJson(toolLoopPlannerPath);
const toolExecutionSmoke = readJson(toolExecutionSmokePath);
const modelExecutionAuditSmoke = readJson(modelExecutionAuditSmokePath);
const packageJson = readJson(packagePath);
const testSource = readText(testPath);
const workerSource = readText(workerPath);
const errors = [
  ...validateContract(contract),
  ...validateLinkedContracts(toolLoopPlanner, toolExecutionSmoke, modelExecutionAuditSmoke),
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
    sample_tool_name: contract.sample_tool_name,
    status: "ok",
    token_binding: contract.smoke_token_binding
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["agent live ToolLoop smoke contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-agent-live-tool-loop-smoke-contract.mjs",
    model_execution_audit_smoke_contract: modelExecutionAuditSmokePath,
    route: "POST /agent/runs/live-tool-loop-smoke",
    sample_instrument_id: "eq_hk_00700",
    sample_tool_name: "get_quote_snapshot",
    sample_tool_route: "POST /tools/get-quote-snapshot",
    smoke_token_binding: "AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN",
    status: "local_contract",
    test_file: testPath,
    tool_execution_smoke_contract: toolExecutionSmokePath,
    tool_loop_planner_contract: toolLoopPlannerPath,
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

    if (value.smoke_header.value !== "agent-live-tool-loop-v1") {
      errors.push("smoke_header.value must be agent-live-tool-loop-v1");
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
    "actual_tool_execution",
    "audit_event_preview",
    "auth_enforced_before_execution",
    "evidence_card_binding_probe",
    "hash_only_response",
    "live_tool_loop_execution",
    "tool_loop_plan_bound",
    "unsourced_numeric_probe"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "arbitrary_tool_execution",
    "frontend",
    "general_user_tool_loop_execution",
    "live_evidence_writes",
    "live_usage_ledger_writes",
    "persistent_writes",
    "raw_model_output_returned",
    "raw_tool_output_returned"
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
        "arbitrary_tool_execution",
        "user_facing_live_model_streaming",
        "generated_answer_evidence_binding",
        "ai_gateway_logs_read",
        "live_evidence_writes",
        "live_usage_ledger_writes",
        "frontend_ask_rendering"
      ],
      "not_claimed"
    )
  );
  errors.push(...validateVerification(value.verification));

  return errors;
}

function validateLinkedContracts(toolLoopValue, toolValue, modelValue) {
  const errors = [];

  if (toolLoopValue.status !== "local_contract") {
    errors.push("tool-loop planner contract must remain local_contract");
  }

  if (toolLoopValue.actual_tool_execution !== false || toolLoopValue.model_calls !== false) {
    errors.push("tool-loop planner contract must remain planner-only");
  }

  errors.push(
    ...validateStringArray(
      toolLoopValue.required_step_phases,
      ["data_fetch", "answer_contract"],
      "tool_loop.required_step_phases"
    )
  );

  if (toolValue.route !== "POST /agent/runs/tool-execution-evidence-smoke") {
    errors.push("tool execution smoke route mismatch");
  }

  if (toolValue.actual_worker_route_execution !== true) {
    errors.push("tool execution smoke must prove actual Worker route execution");
  }

  if (toolValue.evidence_card_binding_probe !== true || toolValue.unsourced_numeric_probe !== true) {
    errors.push("tool execution smoke must keep evidence and unsourced probes");
  }

  if (modelValue.route !== "POST /agent/runs/model-execution-audit-smoke") {
    errors.push("model execution audit smoke route mismatch");
  }

  if (modelValue.actual_model_execution !== true || modelValue.audit_event_preview !== true) {
    errors.push("model execution audit smoke must prove model execution and audit preview");
  }

  errors.push(...validateGatewayLogEvidence(modelValue.gateway_log_evidence));

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

function validateVerification(value) {
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }

  const errors = [];
  const expectedCommands = {
    contract_check: "npm run check:agent-live-tool-loop-smoke",
    unit_test: "npm run test -- apps/worker/src/agent-live-tool-loop-smoke.test.ts",
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

  if (scripts["check:agent-live-tool-loop-smoke"] !== expectedScript) {
    errors.push(`package.json check:agent-live-tool-loop-smoke must be ${expectedScript}`);
  }

  const rootCheck = String(scripts.check ?? "");
  const toolLoopIndex = rootCheck.indexOf("npm run check:tool-loop-agent");
  const toolSmokeIndex = rootCheck.indexOf("npm run check:agent-tool-execution-evidence-smoke");
  const modelSmokeIndex = rootCheck.indexOf("npm run check:agent-model-execution-audit-smoke");
  const liveLoopIndex = rootCheck.indexOf("npm run check:agent-live-tool-loop-smoke");
  const observabilityIndex = rootCheck.indexOf("npm run check:observability");

  if (liveLoopIndex < 0) {
    errors.push("root check must include check:agent-live-tool-loop-smoke");
  }

  if (toolLoopIndex < 0 || liveLoopIndex < toolLoopIndex) {
    errors.push("root check must run live ToolLoop smoke after tool-loop-agent");
  }

  if (toolSmokeIndex < 0 || liveLoopIndex < toolSmokeIndex) {
    errors.push("root check must run live ToolLoop smoke after tool execution evidence smoke");
  }

  if (modelSmokeIndex < 0 || liveLoopIndex < modelSmokeIndex) {
    errors.push("root check must run live ToolLoop smoke after model execution audit smoke");
  }

  if (observabilityIndex < 0 || liveLoopIndex > observabilityIndex) {
    errors.push("root check must run live ToolLoop smoke before observability checks");
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN",
    "agent-live-tool-loop-v1",
    "get_quote_snapshot",
    "run_id_hash",
    "live_tool_loop_execution: true",
    "general_user_tool_loop_execution: false",
    "blocked_external_permission",
    "UNSOURCED_NUMERIC_CLAIM",
    "not.toContain(\"AIPHABEE_AI_GATEWAY_SMOKE_OK\")",
    "not.toContain(\"@cf/aiphabee/synthetic-model\")",
    "not.toContain(\"382.4\")",
    "not.toContain(\"eq_hk_00700\")"
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
    "AIPHABEE_AGENT_LIVE_TOOL_LOOP_SMOKE_TOKEN",
    "AGENT_LIVE_TOOL_LOOP_SMOKE_ROUTE",
    "AGENT_LIVE_TOOL_LOOP_SMOKE_HEADER_VALUE",
    "isAgentLiveToolLoopSmokeAuthorized",
    "missingAgentLiveToolLoopSmokeEnv",
    "executeAgentLiveToolLoopSmoke",
    "createToolLoopAgentPlan",
    "executeAgentToolExecutionEvidenceSmoke",
    "createAgentModelExecutionAuditSmokeResult",
    "runAiGatewayLiveSmoke",
    "general_user_tool_loop_execution: false",
    "live_tool_loop_execution: status === \"passed\"",
    "raw_model_output_returned: false",
    "raw_tool_output_returned: false"
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
