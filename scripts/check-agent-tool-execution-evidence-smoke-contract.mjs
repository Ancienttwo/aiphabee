#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/tool-execution-evidence-smoke.contract.json";
const packagePath = "package.json";
const testPath = "apps/worker/src/agent-tool-execution-evidence-smoke.test.ts";
const workerPath = "apps/worker/src/index.ts";
const expectedVersion = "2026-06-22.phase1.agent-tool-execution-evidence-smoke.v0";
const expectedScript = "node scripts/check-agent-tool-execution-evidence-smoke-contract.mjs";
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const testSource = readText(testPath);
const workerSource = readText(workerPath);
const errors = [
  ...validateContract(contract),
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
    status: "ok"
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["agent tool execution evidence smoke contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-agent-tool-execution-evidence-smoke-contract.mjs",
    post_generation_validator_route: "POST /agent/runs/validate-answer",
    route: "POST /agent/runs/tool-execution-evidence-smoke",
    sample_instrument_id: "eq_hk_00700",
    sample_tool_name: "get_quote_snapshot",
    sample_tool_route: "POST /tools/get-quote-snapshot",
    smoke_token_binding: "AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN",
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

    if (value.smoke_header.value !== "agent-tool-execution-evidence-v1") {
      errors.push("smoke_header.value must be agent-tool-execution-evidence-v1");
    }
  }

  for (const field of [
    "actual_worker_route_execution",
    "agent_tool_execution_smoke",
    "auth_enforced_before_tool_execution",
    "evidence_card_binding_probe",
    "hash_only_response",
    "public_default_deny_preserved",
    "unsourced_numeric_probe"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of [
    "frontend",
    "live_evidence_writes",
    "live_model_execution",
    "live_model_token_streaming",
    "live_usage_ledger_writes"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "live_model_execution",
        "live_model_token_streaming",
        "live_evidence_writes",
        "live_usage_ledger_writes",
        "production_unsourced_numeric_sampling",
        "frontend_evidence_card_rendering"
      ],
      "not_claimed"
    )
  );
  errors.push(...validateVerification(value.verification));

  return errors;
}

function validateVerification(value) {
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }

  const errors = [];
  const expectedCommands = {
    contract_check: "npm run check:agent-tool-execution-evidence-smoke",
    unit_test: "npm run test -- apps/worker/src/agent-tool-execution-evidence-smoke.test.ts",
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

  if (scripts["check:agent-tool-execution-evidence-smoke"] !== expectedScript) {
    errors.push(`package.json check:agent-tool-execution-evidence-smoke must be ${expectedScript}`);
  }

  const rootCheck = String(scripts.check ?? "");
  const postGenerationIndex = rootCheck.indexOf("npm run check:post-generation-evidence-binding");
  const smokeIndex = rootCheck.indexOf("npm run check:agent-tool-execution-evidence-smoke");
  const toolLoopIndex = rootCheck.indexOf("npm run check:tool-loop-agent");

  if (smokeIndex < 0) {
    errors.push("root check must include check:agent-tool-execution-evidence-smoke");
  }

  if (postGenerationIndex < 0 || smokeIndex < postGenerationIndex) {
    errors.push("root check must run agent tool execution evidence smoke after post-generation evidence binding");
  }

  if (toolLoopIndex < 0 || smokeIndex > toolLoopIndex) {
    errors.push("root check must run agent tool execution evidence smoke before tool-loop-agent");
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN",
    "agent-tool-execution-evidence-v1",
    "get_quote_snapshot",
    "/tools/get-quote-snapshot",
    "POST /agent/runs/validate-answer",
    "UNSOURCED_NUMERIC_CLAIM",
    "actual_tool_execution: true",
    "hash_only_response: true",
    "not.toContain(\"382.4\")",
    "not.toContain(\"eq_hk_00700\")",
    "not.toContain(\"source_record_id\")"
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
    "AIPHABEE_AGENT_TOOL_EXECUTION_SMOKE_TOKEN",
    "AGENT_TOOL_EXECUTION_SMOKE_ROUTE",
    "AGENT_TOOL_EXECUTION_SMOKE_HEADER_VALUE",
    "isAgentToolExecutionSmokeAuthorized",
    "executeAgentToolExecutionEvidenceSmoke",
    "executeRegisteredWorkerToolRouteSmoke",
    "validatePostGenerationEvidenceBinding",
    "hashRuntimeSmokeString(sourceRecord.sourceRecordId)",
    "hashRuntimeSmokeString(JSON.stringify(toolResult.data ?? null))",
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
