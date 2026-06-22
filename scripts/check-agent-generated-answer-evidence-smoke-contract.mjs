#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/generated-answer-evidence-smoke.contract.json";
const postGenerationPath = "deploy/governance/post-generation-evidence-binding.contract.json";
const toolExecutionSmokePath = "deploy/agent/tool-execution-evidence-smoke.contract.json";
const liveToolLoopSmokePath = "deploy/agent/live-tool-loop-smoke.contract.json";
const packagePath = "package.json";
const testPath = "apps/worker/src/agent-generated-answer-evidence-smoke.test.ts";
const workerPath = "apps/worker/src/index.ts";
const expectedVersion = "2026-06-22.phase1.agent-generated-answer-evidence-smoke.v0";
const expectedScript = "node scripts/check-agent-generated-answer-evidence-smoke-contract.mjs";
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const postGenerationContract = readJson(postGenerationPath);
const toolExecutionSmoke = readJson(toolExecutionSmokePath);
const liveToolLoopSmoke = readJson(liveToolLoopSmokePath);
const packageJson = readJson(packagePath);
const testSource = readText(testPath);
const workerSource = readText(workerPath);
const errors = [
  ...validateContract(contract),
  ...validateLinkedContracts(postGenerationContract, toolExecutionSmoke, liveToolLoopSmoke),
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
    return ["agent generated answer evidence smoke contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-agent-generated-answer-evidence-smoke-contract.mjs",
    live_tool_loop_smoke_contract: liveToolLoopSmokePath,
    post_generation_evidence_binding_contract: postGenerationPath,
    post_generation_validator_route: "POST /agent/runs/validate-answer",
    route: "POST /agent/runs/generated-answer-evidence-smoke",
    sample_instrument_id: "eq_hk_00700",
    sample_tool_name: "get_quote_snapshot",
    sample_tool_route: "POST /tools/get-quote-snapshot",
    smoke_token_binding: "AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN",
    status: "local_contract",
    test_file: testPath,
    tool_execution_smoke_contract: toolExecutionSmokePath,
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

    if (value.smoke_header.value !== "agent-generated-answer-evidence-v1") {
      errors.push("smoke_header.value must be agent-generated-answer-evidence-v1");
    }
  }

  for (const field of [
    "actual_tool_execution",
    "auth_enforced_before_validation",
    "evidence_card_binding_probe",
    "generated_answer_validation",
    "hash_only_response",
    "unsourced_generated_answer_probe"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "answer_text_returned",
    "frontend",
    "live_evidence_writes",
    "live_model_output_corpus",
    "live_usage_ledger_writes",
    "model_calls",
    "model_generation_live",
    "persistent_writes",
    "raw_tool_output_returned"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "live_model_output_corpus",
        "arbitrary_user_tool_loop_execution",
        "user_facing_live_model_streaming",
        "frontend_ask_rendering",
        "live_evidence_writes",
        "live_usage_ledger_writes",
        "production_unsourced_numeric_sampling",
        "ai_gateway_logs_read"
      ],
      "not_claimed"
    )
  );
  errors.push(...validateVerification(value.verification));

  return errors;
}

function validateLinkedContracts(postGenerationValue, toolValue, liveToolLoopValue) {
  const errors = [];

  if (postGenerationValue.post_generation_validation !== "local_deterministic") {
    errors.push("post-generation contract must remain local_deterministic");
  }

  if (postGenerationValue.validator_route !== "POST /agent/runs/validate-answer") {
    errors.push("post-generation validator route mismatch");
  }

  if (postGenerationValue.failure_code !== "UNSOURCED_NUMERIC_CLAIM") {
    errors.push("post-generation failure code must be UNSOURCED_NUMERIC_CLAIM");
  }

  for (const field of ["actual_tool_execution", "live_evidence_binding", "model_calls"]) {
    if (postGenerationValue[field] !== false) {
      errors.push(`post-generation contract ${field} must remain false`);
    }
  }

  errors.push(
    ...validateStringArray(
      postGenerationValue.required_probes,
      [
        "unsourced_financial_number_blocks_answer",
        "evidence_card_bound_number_allows_answer"
      ],
      "post_generation.required_probes"
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

  if (liveToolLoopValue.route !== "POST /agent/runs/live-tool-loop-smoke") {
    errors.push("live ToolLoop smoke route mismatch");
  }

  if (liveToolLoopValue.live_tool_loop_execution !== true) {
    errors.push("live ToolLoop smoke must keep fixed run-level orchestration proof");
  }

  if (liveToolLoopValue.actual_tool_execution !== true) {
    errors.push("live ToolLoop smoke must still prove actual tool execution");
  }

  return errors;
}

function validateVerification(value) {
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }

  const errors = [];
  const expectedCommands = {
    contract_check: "npm run check:agent-generated-answer-evidence-smoke",
    unit_test: "npm run test -- apps/worker/src/agent-generated-answer-evidence-smoke.test.ts",
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

  if (scripts["check:agent-generated-answer-evidence-smoke"] !== expectedScript) {
    errors.push(`package.json check:agent-generated-answer-evidence-smoke must be ${expectedScript}`);
  }

  const rootCheck = String(scripts.check ?? "");
  const postGenerationIndex = rootCheck.indexOf("npm run check:post-generation-evidence-binding");
  const toolSmokeIndex = rootCheck.indexOf("npm run check:agent-tool-execution-evidence-smoke");
  const liveLoopIndex = rootCheck.indexOf("npm run check:agent-live-tool-loop-smoke");
  const generatedAnswerIndex = rootCheck.indexOf(
    "npm run check:agent-generated-answer-evidence-smoke"
  );
  const observabilityIndex = rootCheck.indexOf("npm run check:observability");

  if (generatedAnswerIndex < 0) {
    errors.push("root check must include check:agent-generated-answer-evidence-smoke");
  }

  if (postGenerationIndex < 0 || generatedAnswerIndex < postGenerationIndex) {
    errors.push("root check must run generated answer evidence smoke after post-generation binding");
  }

  if (toolSmokeIndex < 0 || generatedAnswerIndex < toolSmokeIndex) {
    errors.push("root check must run generated answer evidence smoke after tool execution smoke");
  }

  if (liveLoopIndex < 0 || generatedAnswerIndex < liveLoopIndex) {
    errors.push("root check must run generated answer evidence smoke after live ToolLoop smoke");
  }

  if (observabilityIndex < 0 || generatedAnswerIndex > observabilityIndex) {
    errors.push("root check must run generated answer evidence smoke before observability checks");
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN",
    "agent-generated-answer-evidence-v1",
    "get_quote_snapshot",
    "/tools/get-quote-snapshot",
    "POST /agent/runs/validate-answer",
    "UNSOURCED_NUMERIC_CLAIM",
    "actual_tool_execution: true",
    "answer_text_returned: false",
    "generated_answer_validation: true",
    "model_generation_live: false",
    "live_model_output_corpus: false",
    "not.toContain(\"382.4\")",
    "not.toContain(\"eq_hk_00700\")",
    "not.toContain(\"source_record_id\")",
    "not.toContain(\"Tencent quote snapshot returned\")"
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
    "AIPHABEE_AGENT_GENERATED_ANSWER_SMOKE_TOKEN",
    "AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_ROUTE",
    "AGENT_GENERATED_ANSWER_EVIDENCE_SMOKE_HEADER_VALUE",
    "missingAgentGeneratedAnswerEvidenceSmokeEnv",
    "isAgentGeneratedAnswerEvidenceSmokeAuthorized",
    "executeAgentGeneratedAnswerEvidenceSmoke",
    "executeRegisteredWorkerToolRouteSmoke",
    "validatePostGenerationEvidenceBinding",
    "answer_text_returned: false",
    "generated_answer_validation: true",
    "live_model_output_corpus: false",
    "model_generation_live: false",
    "hashRuntimeSmokeString(generatedAnswerText)",
    "hashRuntimeSmokeString(sourceRecord.sourceRecordId)",
    "UNSOURCED_NUMERIC_CLAIM"
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
