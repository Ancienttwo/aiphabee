#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/untrusted-input-boundary.contract.json";
const packageJsonPath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const agentRuntimeSourcePath = "packages/agent-runtime/src/index.ts";
const requiredVersion = "2026-06-22.always-on-untrusted-input-boundary.v0";
const requiredInputClasses = [
  "announcement_document",
  "webpage_url",
  "user_prompt_tool_request",
  "mcp_origin"
];
const requiredChecks = [
  "announcement_documents_marked_untrusted",
  "document_origin_instructions_ignored",
  "sanitized_excerpts_only",
  "webpage_url_fetch_not_allowed_as_arbitrary_tool",
  "user_prompt_tool_requests_pre_execution_denied",
  "system_instructions_source_runtime_only",
  "untrusted_mcp_origin_denied"
];
const documentContracts = [
  {
    key: "search_contract",
    path: "deploy/documents/search-announcements.contract.json",
    route: "POST /documents/search-announcements"
  },
  {
    key: "excerpt_contract",
    path: "deploy/documents/get-announcement.contract.json",
    route: "POST /documents/get-announcement"
  },
  {
    key: "search_contract",
    path: "deploy/documents/search-documents.contract.json",
    route: "POST /documents/search-documents"
  },
  {
    key: "extraction_contract",
    path: "deploy/documents/announcement-diff-extraction.contract.json",
    route: "POST /documents/diff-announcements"
  }
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const tracker = readText(trackerPath);
const agentRuntimeSource = readText(agentRuntimeSourcePath);
const sanitizerContract = readJson("deploy/documents/document-sanitizer.contract.json");
const promptGateContract = readJson("deploy/agent/prompt-injection-tool-denial-release-gate.contract.json");
const toolEnforcementContract = readJson("deploy/agent/tool-enforcement.contract.json");
const mcpProtocolContract = readJson("deploy/mcp/protocol-release-gate.contract.json");
const loadedDocumentContracts = documentContracts.map((entry) => ({
  ...entry,
  value: readJson(entry.path)
}));
const errors = validateContract({
  agentRuntimeSource,
  contract,
  documentContracts: loadedDocumentContracts,
  mcpProtocolContract,
  packageJson,
  promptGateContract,
  sanitizerContract,
  toolEnforcementContract,
  tracker
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
    checks: requiredChecks.length,
    input_classes: requiredInputClasses.length,
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
  agentRuntimeSource,
  contract: value,
  documentContracts,
  mcpProtocolContract,
  packageJson,
  promptGateContract,
  sanitizerContract,
  toolEnforcementContract,
  tracker
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

  if (value.tracker_item !== "A3.untrusted_documents_webpages_user_input_isolated") {
    errors.push("tracker_item must identify the A3 untrusted input item");
  }

  for (const field of [
    "frontend",
    "live_document_fetch",
    "live_tool_execution",
    "model_calls",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validateExactStringArray(value.input_classes, requiredInputClasses, "input_classes"));
  errors.push(...validateExactStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(...validateBoundaryPolicy(value.boundary_policy));
  errors.push(...validateLinkedFiles(value.linked_contracts));
  errors.push(...validateDocumentContracts(documentContracts));
  errors.push(...validateSanitizerContract(sanitizerContract));
  errors.push(...validatePromptGateContract(promptGateContract));
  errors.push(...validateToolEnforcementContract(toolEnforcementContract));
  errors.push(...validateMcpProtocolContract(mcpProtocolContract));
  errors.push(...validateAgentRuntimeSource(agentRuntimeSource));
  errors.push(...validatePackageScript(packageJson));
  errors.push(...validateTrackerSync(tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateBoundaryPolicy(value) {
  if (!isRecord(value)) {
    return ["boundary_policy must be an object"];
  }

  const errors = [];

  if (value.untrusted_content_role !== "data") {
    errors.push("boundary_policy.untrusted_content_role must be data");
  }

  if (value.system_instructions_source !== "runtime_only") {
    errors.push("boundary_policy.system_instructions_source must be runtime_only");
  }

  if (value.untrusted_origin_error !== "ORIGIN_NOT_ALLOWED") {
    errors.push("boundary_policy.untrusted_origin_error must be ORIGIN_NOT_ALLOWED");
  }

  for (const field of [
    "document_tool_invocation_allowed",
    "raw_excerpt_returned",
    "arbitrary_url_fetch_allowed",
    "arbitrary_sql_allowed",
    "unregistered_tool_allowed"
  ]) {
    if (value[field] !== false) {
      errors.push(`boundary_policy.${field} must be false`);
    }
  }

  if (value.raw_document_instructions_ignored !== true) {
    errors.push("boundary_policy.raw_document_instructions_ignored must be true");
  }

  return errors;
}

function validateDocumentContracts(entries) {
  const errors = [];

  for (const { key, path, route, value } of entries) {
    if (!isRecord(value)) {
      errors.push(`${path} must be an object`);
      continue;
    }

    if (value.route !== route) {
      errors.push(`${path}.route must be ${route}`);
    }

    for (const field of ["frontend", "live_data_access", "original_document_fetch"]) {
      if (value[field] !== false) {
        errors.push(`${path}.${field} must be false`);
      }
    }

    const nested = value[key];
    if (!isRecord(nested)) {
      errors.push(`${path}.${key} must be an object`);
      continue;
    }

    for (const field of [
      "untrusted_document_policy",
      "content_is_untrusted_data",
      "prompt_injection_isolated"
    ]) {
      if (nested[field] !== true) {
        errors.push(`${path}.${key}.${field} must be true`);
      }
    }

    if (nested.scripts_executable !== false) {
      errors.push(`${path}.${key}.scripts_executable must be false`);
    }
  }

  return errors;
}

function validateSanitizerContract(value) {
  if (!isRecord(value) || !isRecord(value.sanitizer_contract)) {
    return ["document sanitizer contract must expose sanitizer_contract"];
  }

  const errors = [];
  const policy = value.sanitizer_contract;

  for (const field of [
    "content_is_untrusted_data",
    "prompt_injection_isolated",
    "scripts_removed",
    "hidden_text_removed",
    "suspicious_instructions_neutralized",
    "raw_document_instructions_ignored"
  ]) {
    if (policy[field] !== true) {
      errors.push(`sanitizer_contract.${field} must be true`);
    }
  }

  for (const field of [
    "raw_excerpt_returned",
    "output_contains_raw_html",
    "scripts_executable",
    "tool_invocation_allowed_from_document"
  ]) {
    if (policy[field] !== false) {
      errors.push(`sanitizer_contract.${field} must be false`);
    }
  }

  return errors;
}

function validatePromptGateContract(value) {
  if (!isRecord(value)) {
    return ["prompt injection gate contract must be an object"];
  }

  const errors = [];

  for (const field of [
    "content_is_untrusted_data",
    "prompt_injection_isolated",
    "raw_document_instructions_ignored",
    "registered_tools_only",
    "pre_execution_denial"
  ]) {
    if (value[field] !== true) {
      errors.push(`prompt gate ${field} must be true`);
    }
  }

  for (const field of [
    "document_tool_invocation_allowed",
    "allow_arbitrary_sql",
    "allow_arbitrary_url",
    "live_document_fetch",
    "live_tool_execution",
    "model_calls"
  ]) {
    if (value[field] !== false) {
      errors.push(`prompt gate ${field} must be false`);
    }
  }

  for (const probe of ["sql.query", "http.fetch", "admin.override"]) {
    if (!Array.isArray(value.denied_tool_probes) || !value.denied_tool_probes.includes(probe)) {
      errors.push(`prompt gate denied_tool_probes must include ${probe}`);
    }
  }

  return errors;
}

function validateToolEnforcementContract(value) {
  if (!isRecord(value)) {
    return ["tool enforcement contract must be an object"];
  }

  const errors = [];

  for (const field of [
    "registered_tools_only",
    "versioned_tools",
    "schema_bound",
    "permission_aware"
  ]) {
    if (value[field] !== true) {
      errors.push(`tool enforcement ${field} must be true`);
    }
  }

  if (value.registered_tool_count !== 16) {
    errors.push("tool enforcement registered_tool_count must be 16");
  }

  if (!Array.isArray(value.forbidden_tool_names) || !value.forbidden_tool_names.includes("http.fetch")) {
    errors.push("tool enforcement must forbid http.fetch");
  }

  if (!Array.isArray(value.forbidden_input_properties) || !value.forbidden_input_properties.includes("url")) {
    errors.push("tool enforcement must forbid raw url input properties");
  }

  return errors;
}

function validateMcpProtocolContract(value) {
  if (!isRecord(value) || !isRecord(value.protocol_gate_policy)) {
    return ["MCP protocol contract must expose protocol_gate_policy"];
  }

  const errors = [];

  if (value.protocol_gate_policy.origin_required !== true) {
    errors.push("MCP protocol origin_required must be true");
  }

  if (value.protocol_gate_policy.untrusted_origin_error !== "ORIGIN_NOT_ALLOWED") {
    errors.push("MCP protocol untrusted origin error must be ORIGIN_NOT_ALLOWED");
  }

  return errors;
}

function validateAgentRuntimeSource(source) {
  const errors = [];

  if (!source.includes('system_instructions_source: "runtime_only"')) {
    errors.push("agent runtime must keep system_instructions_source runtime_only");
  }

  if (!source.includes('untrusted_content_role: "data"')) {
    errors.push("agent runtime must mark untrusted content role as data");
  }

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be present"];
  }

  const errors = [];

  if (value.scripts["check:untrusted-input-boundary"] !== "node scripts/check-untrusted-input-boundary-contract.mjs") {
    errors.push("package.json must define check:untrusted-input-boundary");
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:untrusted-input-boundary")
  ) {
    errors.push("package.json check script must include check:untrusted-input-boundary");
  }

  return errors;
}

function validateTrackerSync(value) {
  const expected = "- [x] 公告/网页/用户输入标记为「不可信数据」，与系统指令隔离";

  if (!value.includes(expected) || !value.includes("check:untrusted-input-boundary")) {
    return ["Sprint tracker must mark A3 untrusted input item with check:untrusted-input-boundary evidence"];
  }

  return [];
}

function validateLinkedFiles(value) {
  if (!Array.isArray(value)) {
    return ["linked_contracts must be an array"];
  }

  const errors = [];

  for (const path of value) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked file missing: ${path}`);
    }
  }

  return errors;
}

function validateExactStringArray(value, requiredValues, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${label} must be a string array`];
  }

  const errors = [];

  for (const required of requiredValues) {
    if (!value.includes(required)) {
      errors.push(`${label} must include ${required}`);
    }
  }

  for (const item of value) {
    if (!requiredValues.includes(item)) {
      errors.push(`${label} contains unexpected value ${item}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern}`);
    }
  }

  return errors;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
