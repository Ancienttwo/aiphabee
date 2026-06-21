#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/evidence/service.contract.json";
const requiredRoutes = ["GET /evidence/runtime", "POST /evidence/records/plan"];
const requiredTables = ["core.evidence_record", "core.evidence_source_ref"];
const requiredCapabilities = [
  "tool_call_linking",
  "source_record_linking",
  "data_version_linking",
  "methodology_version_linking",
  "user_visible_citations",
  "citation_planner",
  "durable_schema_ready"
];
const requiredRecordFields = [
  "evidenceRecordId",
  "requestId",
  "toolName",
  "toolVersion",
  "inputSchemaId",
  "outputSchemaId",
  "dataVersion",
  "methodologyVersion",
  "rightsState"
];
const requiredSourceRefFields = [
  "evidenceSourceRefId",
  "evidenceRecordId",
  "source",
  "sourceRecordId",
  "dataVersion",
  "methodologyVersion"
];
const requiredCitationFields = ["label", "sourceRecordIds", "visibility"];

let contract;

try {
  contract = JSON.parse(readFileSync(resolve(process.cwd(), contractPath), "utf8"));
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      path: contractPath,
      status: "invalid_json"
    },
    1
  );
}

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
    routes: contract.routes,
    status: "ok",
    tables: contract.tables
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until evidence service is provisioned");
  }

  if (value.package !== "@aiphabee/evidence-lineage") {
    errors.push("package must be @aiphabee/evidence-lineage");
  }

  if (value.governance_table !== "governance.evidence_lineage_service_contract") {
    errors.push("governance_table must be governance.evidence_lineage_service_contract");
  }

  for (const booleanField of ["live_db_writes", "partner_source_records_loaded", "sql_emitted"]) {
    if (value[booleanField] !== false) {
      errors.push(`${booleanField} must be false`);
    }
  }

  if (value.default_rights_status !== "default_deny") {
    errors.push("default_rights_status must be default_deny");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  errors.push(...validateStringArray(value.routes, requiredRoutes, "routes"));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateStringArray(value.capabilities, requiredCapabilities, "capabilities"));
  errors.push(
    ...validateStringArray(value.required_record_fields, requiredRecordFields, "required_record_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_source_ref_fields,
      requiredSourceRefFields,
      "required_source_ref_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.required_citation_fields, requiredCitationFields, "required_citation_fields")
  );
  errors.push(...validateNoSecretLikeValues(value));

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

function validateNoSecretLikeValues(value) {
  const serialized = JSON.stringify(value);
  const patterns = [
    /sk-[A-Za-z0-9_-]+/u,
    /postgres(?:ql)?:\/\//iu,
    /Bearer\s+[A-Za-z0-9._-]+/u,
    /gh[pousr]_[A-Za-z0-9_]+/u,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
  ];

  return patterns
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
