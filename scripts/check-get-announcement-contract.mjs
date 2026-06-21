#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/documents/get-announcement.contract.json";
const requiredItems = ["DOC-02", "US-W06"];
const requiredTools = ["search_announcements"];
const requiredOptionalInputs = ["sections", "max_excerpt_chars"];
const requiredSections = [
  "document_summary",
  "dividend_timetable",
  "financial_highlights",
  "management_discussion",
  "repurchase_summary",
  "segment_results"
];
const requiredOutputFields = [
  "document_id",
  "source",
  "allowed_sections",
  "excerpts",
  "section_id",
  "section_title",
  "excerpt",
  "authorization",
  "evidence_locator",
  "page",
  "paragraph",
  "source_record_id"
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

  if (value.version !== "2026-06-21.phase2.get-announcement-scaffold.v0") {
    errors.push("version must match get announcement scaffold version");
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

  if (value.route !== "POST /documents/get-announcement") {
    errors.push("route must be POST /documents/get-announcement");
  }

  if (value.tool_name !== "get_announcement") {
    errors.push("tool_name must be get_announcement");
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
    "full_document_returned"
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
  errors.push(...validateExcerptContract(value.excerpt_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateExcerptContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["excerpt_contract must be an object"];
  }

  if (value.source !== "synthetic_announcement_fixture") {
    errors.push("excerpt_contract.source must be synthetic_announcement_fixture");
  }

  if (value.required_input !== "document_id") {
    errors.push("excerpt_contract.required_input must be document_id");
  }

  if (value.max_excerpt_chars !== 400) {
    errors.push("excerpt_contract.max_excerpt_chars must be 400");
  }

  if (value.allowed_excerpt_scope !== "synthetic_excerpt_allowlist") {
    errors.push("excerpt_contract.allowed_excerpt_scope must be synthetic_excerpt_allowlist");
  }

  for (const field of [
    "evidence_locator_ready",
    "document_id_required",
    "page_locator_required",
    "paragraph_locator_required",
    "source_record_locator_required",
    "untrusted_document_policy",
    "content_is_untrusted_data",
    "prompt_injection_isolated"
  ]) {
    if (value[field] !== true) {
      errors.push(`excerpt_contract.${field} must be true`);
    }
  }

  for (const field of ["external_href_authority", "scripts_executable"]) {
    if (value[field] !== false) {
      errors.push(`excerpt_contract.${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.optional_inputs,
      requiredOptionalInputs,
      "excerpt_contract.optional_inputs"
    )
  );
  errors.push(
    ...validateStringArray(
      value.supported_sections,
      requiredSections,
      "excerpt_contract.supported_sections"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "excerpt_contract.required_output_fields"
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
