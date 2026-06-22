#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/protocol-tool-execution-smoke.contract.json";
const packagePath = "package.json";
const testPath = "apps/worker/src/mcp-protocol-tool-execution-smoke.test.ts";
const workerPath = "apps/worker/src/index.ts";
const expectedVersion = "2026-06-22.phase1.mcp-protocol-tool-execution-smoke.v0";
const expectedScript = "node scripts/check-mcp-protocol-tool-execution-smoke-contract.mjs";
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
    protocol_route: contract.protocol_route,
    sample_tool_name: contract.sample_tool_name,
    status: "ok"
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["mcp protocol tool execution smoke contract must be an object"];
  }

  const expectedFields = {
    checker: "scripts/check-mcp-protocol-tool-execution-smoke-contract.mjs",
    protocol_route: "POST /mcp",
    sample_scope: "quotes:read",
    sample_tool_name: "get_quote_snapshot",
    sample_tool_route: "POST /tools/get-quote-snapshot",
    smoke_token_binding: "AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN",
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

  for (const field of [
    "mcp_protocol_tool_execution_smoke",
    "auth_enforced_before_tool_execution",
    "public_default_deny_preserved",
    "revoked_credential_denied_before_execution",
    "scope_required_before_execution",
    "actual_worker_route_execution"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of ["live_db_writes", "partner_source_rows", "frontend"]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.not_claimed,
      [
        "oauth_provider_live",
        "sdk_inspector_smoke",
        "target_client_e2e",
        "partner_source_rows",
        "live_db_writes"
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
    contract_check: "npm run check:mcp-protocol-tool-execution-smoke",
    readiness_check: "npm run check:tool-route-replay-readiness",
    unit_test: "npm run test -- apps/worker/src/mcp-protocol-tool-execution-smoke.test.ts"
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

  if (scripts["check:mcp-protocol-tool-execution-smoke"] !== expectedScript) {
    errors.push(`package.json check:mcp-protocol-tool-execution-smoke must be ${expectedScript}`);
  }

  const rootCheck = String(scripts.check ?? "");
  const releaseGateIndex = rootCheck.indexOf("npm run check:mcp-protocol-release-gate");
  const smokeIndex = rootCheck.indexOf("npm run check:mcp-protocol-tool-execution-smoke");
  const readinessIndex = rootCheck.indexOf("npm run check:tool-route-replay-readiness");

  if (smokeIndex < 0) {
    errors.push("root check must include check:mcp-protocol-tool-execution-smoke");
  }

  if (releaseGateIndex < 0 || smokeIndex < releaseGateIndex) {
    errors.push("root check must run mcp protocol tool execution smoke after protocol release gate");
  }

  if (readinessIndex < 0 || smokeIndex > readinessIndex) {
    errors.push("root check must run mcp protocol tool execution smoke before tool route replay readiness");
  }

  return errors;
}

function validateTestSource(source) {
  const errors = [];

  for (const text of [
    "AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN",
    "DATA_NOT_LICENSED",
    "AUTH_REQUIRED",
    "TOOL_SCOPE_REQUIRED",
    "MCP_CREDENTIAL_REVOKED",
    "tool_result",
    "get_quote_snapshot",
    "/tools/get-quote-snapshot",
    "executed_mcp_tool_call_smoke"
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
    "AIPHABEE_MCP_LIVE_EXECUTION_SMOKE_TOKEN",
    "MCP_TOOL_EXECUTION_ROUTE_MAP",
    "executeMcpToolCallSmoke",
    "isMcpLiveExecutionSmokeAuthorized",
    "executed_mcp_tool_call_smoke",
    "\"/tools/get-quote-snapshot\"",
    "structured_content_validation: \"executed_synthetic_tool_route\""
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
