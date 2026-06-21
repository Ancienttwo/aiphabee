#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/documents/search-announcements.contract.json";
const requiredItems = ["DOC-01"];
const requiredTools = ["resolve_security"];
const requiredCategories = ["results", "dividend", "buyback"];
const requiredFilters = [
  "instrument_id",
  "security_query",
  "from",
  "to",
  "categories",
  "keyword",
  "language"
];
const requiredOutputFields = [
  "results",
  "document_id",
  "title",
  "published_at",
  "category",
  "language",
  "summary",
  "source_record_id",
  "evidence_locator",
  "page",
  "anchor"
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

  if (value.version !== "2026-06-21.phase2.search-announcements-scaffold.v0") {
    errors.push("version must match search announcements scaffold version");
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

  if (value.route !== "POST /documents/search-announcements") {
    errors.push("route must be POST /documents/search-announcements");
  }

  if (value.tool_name !== "search_announcements") {
    errors.push("tool_name must be search_announcements");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_data_access",
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
  errors.push(...validateSearchContract(value.search_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateSearchContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["search_contract must be an object"];
  }

  if (value.source !== "synthetic_announcement_fixture") {
    errors.push("search_contract.source must be synthetic_announcement_fixture");
  }

  if (value.date_basis !== "published_at") {
    errors.push("search_contract.date_basis must be published_at");
  }

  if (value.max_limit !== 5) {
    errors.push("search_contract.max_limit must be 5");
  }

  for (const field of [
    "evidence_locator_ready",
    "ambiguous_security_blocks",
    "untrusted_document_policy",
    "content_is_untrusted_data",
    "prompt_injection_isolated"
  ]) {
    if (value[field] !== true) {
      errors.push(`search_contract.${field} must be true`);
    }
  }

  for (const field of ["external_href_authority", "scripts_executable"]) {
    if (value[field] !== false) {
      errors.push(`search_contract.${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.supported_categories,
      requiredCategories,
      "search_contract.supported_categories"
    )
  );
  errors.push(
    ...validateStringArray(
      value.supported_filters,
      requiredFilters,
      "search_contract.supported_filters"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "search_contract.required_output_fields"
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
