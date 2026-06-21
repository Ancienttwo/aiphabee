#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/multidimensional-rate-limit.contract.json";
const mcpToolLimiterContractPath = "deploy/mcp/tool-limiter.contract.json";
const mcpRuntimeSourcePath = "packages/mcp-runtime/src/index.ts";
const mcpRuntimeTestPath = "packages/mcp-runtime/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const packageJsonPath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredVersion = "2026-06-22.multidimensional-rate-limit-closeout.v0";
const requiredDimensions = [
  "user",
  "workspace",
  "client",
  "tool",
  "dataset",
  "ip_risk"
];
const requiredScopeFields = [
  "dimension_keys",
  "user",
  "workspace",
  "client",
  "tool",
  "dataset",
  "ip_risk",
  "key_material"
];
const requiredIpRiskFields = [
  "risk_level",
  "source",
  "client_ip_present",
  "live_reputation_lookup",
  "raw_ip_stored"
];
const requiredRuntimeCapabilityFields = [
  "mcp_tool_limiter_dimensions",
  "mcp_tool_limiter_ip_reputation_live",
  "mcp_tool_limiter_raw_ip_stored",
  "mcp_limiter_live",
  "mcp_tool_limiter_ready",
  "mcp_limiter_error_codes",
  "ordinary_pool_protection"
];
const requiredToolLimitFields = [
  "scope",
  "rate_limit",
  "concurrency",
  "budget",
  "durable_queue",
  "weight"
];
const requiredNotClaimed = [
  "live_limiter_window_reads",
  "live_concurrency_state_reads",
  "live_usage_ledger_debit_refund",
  "live_ip_reputation_lookup",
  "raw_ip_storage",
  "anomaly_detection_model",
  "enterprise_bulk_plan"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const mcpToolLimiterContract = readJson(mcpToolLimiterContractPath);
const packageJson = readJson(packageJsonPath);
const mcpRuntimeSource = readText(mcpRuntimeSourcePath);
const mcpRuntimeTests = readText(mcpRuntimeTestPath);
const tracker = readText(trackerPath);
const workerSource = readText(workerSourcePath);
const errors = validateContract({
  contract,
  mcpRuntimeSource,
  mcpRuntimeTests,
  mcpToolLimiterContract,
  packageJson,
  tracker,
  workerSource
});

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
    dimensions: requiredDimensions,
    linked_contracts: contract.linked_contracts.length,
    status: "ok"
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

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_file"
      },
      1
    );
  }
}

function validateContract({
  contract: value,
  mcpRuntimeSource,
  mcpRuntimeTests,
  mcpToolLimiterContract,
  packageJson,
  tracker,
  workerSource
}) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== requiredVersion) {
    errors.push(`version must be ${requiredVersion}`);
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.tracker_item !== "A3 multidimensional rate limit") {
    errors.push("tracker_item must be A3 multidimensional rate limit");
  }

  if (value.scope !== "mcp_tool_call_limiter_scope") {
    errors.push("scope must be mcp_tool_call_limiter_scope");
  }

  if (value.runtime_route !== "GET /mcp/runtime") {
    errors.push("runtime_route must be GET /mcp/runtime");
  }

  if (value.execution_route !== "POST /mcp") {
    errors.push("execution_route must be POST /mcp");
  }

  for (const field of [
    "frontend",
    "live_limiter_window_reads",
    "live_concurrency_reads",
    "live_budget_debit",
    "durable_queue_writes",
    "raw_ip_stored",
    "ip_reputation_live"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validateExactStringArray(value.required_dimensions, requiredDimensions, "required_dimensions"));
  errors.push(...validateStringArray(value.required_scope_fields, requiredScopeFields, "required_scope_fields"));
  errors.push(...validateStringArray(value.required_ip_risk_fields, requiredIpRiskFields, "required_ip_risk_fields"));
  errors.push(
    ...validateStringArray(
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "required_runtime_capability_fields"
    )
  );
  errors.push(...validateStringArray(value.required_tool_limit_fields, requiredToolLimitFields, "required_tool_limit_fields"));
  errors.push(...validateStringArray(value.required_error_codes, ["RATE_LIMITED", "BUDGET_EXCEEDED"], "required_error_codes"));
  errors.push(...validateStringArray(value.not_claimed, requiredNotClaimed, "not_claimed"));
  errors.push(...validateLinkedFiles(value.linked_contracts));
  errors.push(...validateMcpToolLimiterContract(mcpToolLimiterContract));
  errors.push(...validateMcpRuntimeSource(mcpRuntimeSource));
  errors.push(...validateMcpRuntimeTests(mcpRuntimeTests));
  errors.push(...validateWorkerSource(workerSource));
  errors.push(...validatePackageScript(packageJson));
  errors.push(...validateTracker(tracker));
  errors.push(...validateNoSecrets({ contract: value }));

  return errors;
}

function validateMcpToolLimiterContract(value) {
  if (!isRecord(value)) {
    return ["MCP tool limiter contract must be an object"];
  }

  const errors = [];

  if (value.multidimensional_scope !== true) {
    errors.push("MCP tool limiter contract must enable multidimensional_scope");
  }

  for (const field of [
    "live_rate_limiter",
    "live_concurrency_limiter",
    "live_budget_debit",
    "durable_queue_writes",
    "ip_reputation_live",
    "raw_ip_stored"
  ]) {
    if (value[field] !== false) {
      errors.push(`MCP tool limiter contract ${field} must be false`);
    }
  }

  errors.push(
    ...validateExactStringArray(
      value.required_scope_dimensions,
      requiredDimensions,
      "MCP tool limiter required_scope_dimensions"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_scope_fields,
      requiredScopeFields,
      "MCP tool limiter required_scope_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_ip_risk_fields,
      requiredIpRiskFields,
      "MCP tool limiter required_ip_risk_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "MCP tool limiter required_runtime_capability_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_limit_fields,
      requiredToolLimitFields,
      "MCP tool limiter required_tool_limit_fields"
    )
  );

  return errors;
}

function validateMcpRuntimeSource(source) {
  const errors = [];

  for (const token of [
    "export type McpIpRiskLevel",
    "clientIp?: string",
    "ipRiskLevel?: string",
    "export interface McpToolLimiterScope",
    "scope: McpToolLimiterScope",
    "function createMcpToolLimiterScope",
    "dimension_keys: [\"user\", \"workspace\", \"client\", \"tool\", \"dataset\", \"ip_risk\"]",
    "live_reputation_lookup: false",
    "raw_ip_stored: false",
    "budget_key:",
    "concurrency_key:",
    "rate_limit_key:",
    "function normalizeIpRiskLevel",
    "function toLimiterKeyPart"
  ]) {
    if (!source.includes(token)) {
      errors.push(`MCP runtime source missing ${token}`);
    }
  }

  for (const token of [
    "mcp_tool_limiter_dimensions",
    "mcp_tool_limiter_ip_reputation_live: false",
    "mcp_tool_limiter_raw_ip_stored: false",
    "mcp_limiter_live: false",
    "mcp_limiter_error_codes: [\"RATE_LIMITED\", \"BUDGET_EXCEEDED\"]"
  ]) {
    if (!source.includes(token)) {
      errors.push(`MCP runtime capability missing ${token}`);
    }
  }

  return errors;
}

function validateMcpRuntimeTests(source) {
  const errors = [];

  for (const token of [
    "mcp_tool_limiter_dimensions",
    "mcp_tool_limiter_ip_reputation_live: false",
    "mcp_tool_limiter_raw_ip_stored: false",
    "scope: {",
    "dimension_keys: [\"user\", \"workspace\", \"client\", \"tool\", \"dataset\", \"ip_risk\"]",
    "risk_level: \"medium\"",
    "risk_level: \"high\"",
    "raw_ip_stored: false",
    "client_ip_present: true",
    "dataset: {",
    "name: \"price_history\"",
    "name: \"market_calendar\"",
    "rate_user=acct_mcp_workspace=workspace_mcp"
  ]) {
    if (!source.includes(token)) {
      errors.push(`MCP runtime tests missing ${token}`);
    }
  }

  return errors;
}

function validateWorkerSource(source) {
  const errors = [];

  for (const token of [
    "clientIp: normalizeString",
    "cf-connecting-ip",
    "x-forwarded-for",
    "ipRiskLevel: normalizeString",
    "x-aiphabee-ip-risk"
  ]) {
    if (!source.includes(token)) {
      errors.push(`worker MCP route missing ${token}`);
    }
  }

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (
    value.scripts["check:multidimensional-rate-limit"] !==
    "node scripts/check-multidimensional-rate-limit-contract.mjs"
  ) {
    errors.push("package.json must define check:multidimensional-rate-limit");
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:multidimensional-rate-limit")
  ) {
    errors.push("package.json check script must include check:multidimensional-rate-limit");
  }

  return errors;
}

function validateTracker(value) {
  const errors = [];

  if (!/- \[x\] 多维限流（用户 × Workspace × 客户端 × 工具 × 数据集 × IP 风险）/u.test(value)) {
    errors.push("tracker A3 multidimensional rate limit item must be checked");
  }

  for (const token of [
    "check:multidimensional-rate-limit",
    "raw IP",
    "live limiter window reads",
    "anomaly detection",
    "enterprise bulk plan"
  ]) {
    if (!value.includes(token)) {
      errors.push(`tracker must mention ${token}`);
    }
  }

  if (!/- \[ \] MCP 被用于批量抓取 → 多维限流 \+ credits \+ 异常检测 \+ 企业批量套餐/u.test(value)) {
    errors.push("risk burn-down batch scraping row must remain unchecked until anomaly detection and enterprise bulk plan exist");
  }

  return errors;
}

function validateLinkedFiles(value) {
  if (!Array.isArray(value)) {
    return ["linked_contracts must be an array"];
  }

  return value
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${String(path)}`);
}

function validateExactStringArray(value, requiredValues, name) {
  const errors = validateStringArray(value, requiredValues, name);

  if (!Array.isArray(value)) {
    return errors;
  }

  for (const item of value) {
    if (!requiredValues.includes(item)) {
      errors.push(`${name} contains unexpected value ${item}`);
    }
  }

  return errors;
}

function validateStringArray(value, requiredValues, name) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${name} must be a string array`];
  }

  const errors = [];

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
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
