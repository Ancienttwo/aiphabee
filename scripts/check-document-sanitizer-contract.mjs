#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/documents/document-sanitizer.contract.json";
const requiredItems = ["DOC-03", "A3"];
const requiredRemovedClasses = [
  "script_tag",
  "hidden_text",
  "suspicious_instruction",
  "html_tag"
];
const requiredFixtureCases = [
  "script_tag_removed",
  "hidden_text_removed",
  "suspicious_tool_instruction_neutralized"
];
const requiredOutputFields = [
  "document_trust_policy",
  "sanitization_policy",
  "sanitization_summary",
  "sanitization",
  "removed_items",
  "document_instruction_executed",
  "raw_excerpt_returned",
  "excerpt"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
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
    applied_route: contract.applied_route,
    status: "ok",
    tool_name: contract.tool_name
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

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase2.document-sanitizer-scaffold.v0") {
    errors.push("version must match document sanitizer scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/document-tools") {
    errors.push("package must be @aiphabee/document-tools");
  }

  if (value.runtime_route !== "GET /documents/runtime") {
    errors.push("runtime_route must be GET /documents/runtime");
  }

  if (value.applied_route !== "POST /documents/get-announcement") {
    errors.push("applied_route must be POST /documents/get-announcement");
  }

  if (value.tool_name !== "document_sanitizer") {
    errors.push("tool_name must be document_sanitizer");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_data_access",
    "sql_emitted",
    "vector_search",
    "original_document_fetch",
    "document_origin_tool_invocation"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_2_items,
      requiredItems,
      "covered_sprint_2_2_items"
    )
  );
  errors.push(...validateSanitizerContract(value.sanitizer_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateSanitizerContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["sanitizer_contract must be an object"];
  }

  if (value.source !== "synthetic_malicious_document_fixture") {
    errors.push("sanitizer_contract.source must be synthetic_malicious_document_fixture");
  }

  for (const field of [
    "content_is_untrusted_data",
    "prompt_injection_isolated",
    "scripts_removed",
    "hidden_text_removed",
    "suspicious_instructions_neutralized",
    "raw_document_instructions_ignored"
  ]) {
    if (value[field] !== true) {
      errors.push(`sanitizer_contract.${field} must be true`);
    }
  }

  for (const field of [
    "raw_excerpt_returned",
    "output_contains_raw_html",
    "scripts_executable",
    "tool_invocation_allowed_from_document"
  ]) {
    if (value[field] !== false) {
      errors.push(`sanitizer_contract.${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.removed_content_classes,
      requiredRemovedClasses,
      "sanitizer_contract.removed_content_classes"
    )
  );
  errors.push(
    ...validateStringArray(
      value.fixture_cases,
      requiredFixtureCases,
      "sanitizer_contract.fixture_cases"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "sanitizer_contract.required_output_fields"
    )
  );

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
