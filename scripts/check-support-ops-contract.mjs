#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/support/request-id-investigation.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredTopics = [
  "account_billing",
  "mcp_connection",
  "data_quality",
  "usage_quota",
  "privacy_account",
  "incident_status"
];
const requiredLookupFields = [
  "request_id",
  "route",
  "tool_name",
  "data_version",
  "methodology_version",
  "error_code",
  "usage_event_id",
  "ledger_entry_id",
  "invoice_line_id"
];
const forbiddenDefaultFields = [
  "raw_prompt",
  "generated_answer",
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret",
  "api_key_material",
  "payment_method",
  "portfolio_holdings",
  "document_body",
  "personal_contact_detail"
];
const requiredSources = [
  "standard_response_envelope",
  "mcp_error_detail",
  "usage_ledger_event",
  "usage_billing_reconciliation",
  "public_status_component"
];
const requiredTables = [
  "aiphabee_core.support_ticket",
  "aiphabee_audit.support_investigation_event",
  "aiphabee_governance.support_request_id_contract"
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
    help_topics: contract.support_help_topics.length,
    route: contract.investigation_route,
    status: "ok",
    support_lookup_fields: contract.support_lookup_fields.length
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

  if (value.version !== "2026-06-21.phase3.support-request-id-investigation-scaffold.v0") {
    errors.push("version must match the support investigation scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/support-ops") {
    errors.push("package must be @aiphabee/support-ops");
  }

  if (value.runtime_route !== "GET /support/runtime") {
    errors.push("runtime_route must be GET /support/runtime");
  }

  if (value.help_center_route !== "GET /support/help-center") {
    errors.push("help_center_route must be GET /support/help-center");
  }

  if (value.investigation_route !== "POST /support/request-id-investigation/plan") {
    errors.push("investigation_route must be POST /support/request-id-investigation/plan");
  }

  for (const field of [
    "frontend",
    "live_log_reads",
    "live_billing_provider_reads",
    "persistent_writes",
    "sql_emitted",
    "default_sensitive_content_access"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "standard_response_envelope",
    "request_id_required",
    "request_id_visible",
    "support_agent_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(...validateStringArray(value.support_help_topics, requiredTopics, "support_help_topics"));
  errors.push(
    ...validateStringArray(value.support_lookup_fields, requiredLookupFields, "support_lookup_fields")
  );
  errors.push(
    ...validateStringArray(value.forbidden_default_fields, forbiddenDefaultFields, "forbidden_default_fields")
  );
  errors.push(...validateStringArray(value.planned_sources, requiredSources, "planned_sources"));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateHelpCenterDocument(value.help_center_document));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateHelpCenterDocument(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["help_center_document must be an object"];
  }

  if (value.path !== "docs/public/help-center.md") {
    errors.push("help_center_document.path must be docs/public/help-center.md");
  }

  if (!Array.isArray(value.required_sections)) {
    return [...errors, "help_center_document.required_sections must be an array"];
  }

  const markdown = readText(value.path);

  for (const section of value.required_sections) {
    if (typeof section !== "string" || !markdown.includes(`## ${section}`)) {
      errors.push(`${value.path} must include section ${section}`);
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
