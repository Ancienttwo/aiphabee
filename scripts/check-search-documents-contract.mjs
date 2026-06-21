#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/documents/search-documents.contract.json";
const requiredItems = ["PRD-11.4", "pgvector_document_search"];
const requiredTools = ["search_announcements", "get_announcement", "document_sanitizer"];
const requiredFilters = [
  "query",
  "instrument_id",
  "document_ids",
  "from",
  "to",
  "categories",
  "language",
  "min_score",
  "limit"
];
const requiredOutputFields = [
  "results",
  "chunk_id",
  "document_id",
  "section_id",
  "sanitized_snippet",
  "similarity_score",
  "rank",
  "score_explanation",
  "source_record_id",
  "evidence_locator",
  "page",
  "paragraph",
  "metadata"
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

  if (value.version !== "2026-06-21.phase2.semantic-document-search-scaffold.v0") {
    errors.push("version must match semantic document search scaffold version");
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

  if (value.route !== "POST /documents/search-documents") {
    errors.push("route must be POST /documents/search-documents");
  }

  if (value.tool_name !== "search_documents") {
    errors.push("tool_name must be search_documents");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_data_access",
    "live_pgvector",
    "sql_emitted",
    "original_document_fetch"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.vector_search !== true) {
    errors.push("vector_search must be true");
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

  if (value.source !== "synthetic_document_chunk_fixture") {
    errors.push("search_contract.source must be synthetic_document_chunk_fixture");
  }

  if (value.search_engine !== "synthetic_pgvector_scaffold") {
    errors.push("search_contract.search_engine must be synthetic_pgvector_scaffold");
  }

  if (value.index_name !== "document_chunks_pgvector_synthetic") {
    errors.push("search_contract.index_name must be document_chunks_pgvector_synthetic");
  }

  if (value.embedding_model !== "synthetic-text-embedding-v0") {
    errors.push("search_contract.embedding_model must be synthetic-text-embedding-v0");
  }

  if (value.date_basis !== "published_at") {
    errors.push("search_contract.date_basis must be published_at");
  }

  if (value.max_limit !== 5) {
    errors.push("search_contract.max_limit must be 5");
  }

  if (value.min_score_default !== 0.15) {
    errors.push("search_contract.min_score_default must be 0.15");
  }

  for (const field of [
    "pgvector_first",
    "vectorize_optional",
    "metadata_filter_pushdown",
    "sanitized_snippets_only",
    "untrusted_document_policy",
    "content_is_untrusted_data",
    "prompt_injection_isolated"
  ]) {
    if (value[field] !== true) {
      errors.push(`search_contract.${field} must be true`);
    }
  }

  if (value.scripts_executable !== false) {
    errors.push("search_contract.scripts_executable must be false");
  }

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
