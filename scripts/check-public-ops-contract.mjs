#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/public-ops/public-status-docs.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredComponents = [
  "worker_api",
  "remote_mcp",
  "data_gateway",
  "usage_billing",
  "public_documentation"
];
const requiredDocumentKinds = [
  "api_reference",
  "mcp_reference",
  "privacy_policy",
  "terms_of_service"
];
const requiredTables = [
  "core.public_status_component",
  "core.public_document_publication",
  "governance.public_operations_contract"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const errors = validateContract(contract, databaseContract);

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
    docs: contract.documents.length,
    route: contract.runtime_route,
    status: "ok",
    status_components: contract.status_components.length
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

function validateContract(value, databaseValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase3.public-status-docs-scaffold.v0") {
    errors.push("version must match the public status/docs scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/public-ops") {
    errors.push("package must be @aiphabee/public-ops");
  }

  if (value.runtime_route !== "GET /public/runtime") {
    errors.push("runtime_route must be GET /public/runtime");
  }

  if (value.status_route !== "GET /public/status") {
    errors.push("status_route must be GET /public/status");
  }

  if (value.docs_route !== "GET /public/docs") {
    errors.push("docs_route must be GET /public/docs");
  }

  for (const field of [
    "auth_required",
    "frontend",
    "live_deployment_verified",
    "live_incident_feed",
    "live_publication_verified",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.request_id_visible !== true) {
    errors.push("request_id_visible must be true");
  }

  errors.push(
    ...validateStringArray(value.status_components, requiredComponents, "status_components")
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateDocuments(value.documents));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateDocuments(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["documents must be an array"];
  }

  const documentsByKind = new Map(
    value
      .filter((document) => isRecord(document) && typeof document.kind === "string")
      .map((document) => [document.kind, document])
  );

  for (const kind of requiredDocumentKinds) {
    const document = documentsByKind.get(kind);

    if (!isRecord(document)) {
      errors.push(`documents must include ${kind}`);
      continue;
    }

    if (document.publication_status !== "local_draft_ready") {
      errors.push(`${kind} publication_status must be local_draft_ready`);
    }

    if (typeof document.path !== "string" || document.path.length === 0) {
      errors.push(`${kind} path must be a non-empty string`);
      continue;
    }

    if (!Array.isArray(document.required_sections)) {
      errors.push(`${kind} required_sections must be an array`);
      continue;
    }

    const markdown = readText(document.path);

    for (const section of document.required_sections) {
      if (typeof section !== "string" || !markdown.includes(`## ${section}`)) {
        errors.push(`${document.path} must include section ${section}`);
      }
    }

    if (kind === "privacy_policy" || kind === "terms_of_service") {
      if (document.legal_review_required !== true) {
        errors.push(`${kind} legal_review_required must be true`);
      }
    }
  }

  return errors;
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch {
    return "";
  }
}

function validateDatabaseTables(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  for (const table of requiredTables) {
    if (!serialized.includes(table)) {
      errors.push(`database contract must include ${table}`);
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
