#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/documents/announcement-diff-extraction.contract.json";
const requiredItems = [
  "DOC-04",
  "announcement_diff",
  "key_numeric_extraction",
  "schema_validation",
  "evidence_binding"
];
const requiredTools = [
  "search_announcements",
  "get_announcement",
  "document_sanitizer",
  "search_documents"
];
const requiredInputs = ["base_document_id", "comparison_document_id", "sections"];
const requiredNumericFields = ["revenue", "operating_profit"];
const requiredValueFields = [
  "document_id",
  "document_role",
  "field_id",
  "label",
  "period",
  "value",
  "unit",
  "scale",
  "source_record_id",
  "section_id",
  "evidence_locator",
  "schema_valid"
];
const requiredDiffFields = [
  "field_id",
  "label",
  "base_period",
  "comparison_period",
  "base_value",
  "comparison_value",
  "absolute_change",
  "percent_change",
  "unit",
  "evidence_locators",
  "schema_valid"
];
const requiredLocatorFields = [
  "document_id",
  "source_record_id",
  "page",
  "paragraph",
  "anchor",
  "original_url"
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
    route: contract.route,
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

  if (value.version !== "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0") {
    errors.push("version must match announcement diff extraction scaffold version");
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

  if (value.route !== "POST /documents/diff-announcements") {
    errors.push("route must be POST /documents/diff-announcements");
  }

  if (value.tool_name !== "diff_announcements") {
    errors.push("tool_name must be diff_announcements");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_data_access",
    "live_pgvector",
    "sql_emitted",
    "vector_search",
    "original_document_fetch"
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
  errors.push(...validateStringArray(value.source_tools, requiredTools, "source_tools"));
  errors.push(...validateExtractionContract(value.extraction_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateExtractionContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["extraction_contract must be an object"];
  }

  if (value.source !== "synthetic_announcement_section_fixture") {
    errors.push("extraction_contract.source must be synthetic_announcement_section_fixture");
  }

  if (value.comparison_engine !== "synthetic_schema_bound_numeric_diff") {
    errors.push(
      "extraction_contract.comparison_engine must be synthetic_schema_bound_numeric_diff"
    );
  }

  if (value.schema_id !== "announcement_numeric_extraction_v0") {
    errors.push("extraction_contract.schema_id must be announcement_numeric_extraction_v0");
  }

  for (const field of [
    "schema_validation_ready",
    "evidence_binding_ready",
    "untrusted_document_policy",
    "content_is_untrusted_data",
    "prompt_injection_isolated"
  ]) {
    if (value[field] !== true) {
      errors.push(`extraction_contract.${field} must be true`);
    }
  }

  if (value.scripts_executable !== false) {
    errors.push("extraction_contract.scripts_executable must be false");
  }

  errors.push(
    ...validateStringArray(value.supported_inputs, requiredInputs, "supported_inputs")
  );
  errors.push(
    ...validateStringArray(
      value.numeric_fields,
      requiredNumericFields,
      "numeric_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_value_fields,
      requiredValueFields,
      "required_value_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_diff_fields,
      requiredDiffFields,
      "required_diff_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_locator_fields,
      requiredLocatorFields,
      "required_locator_fields"
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
