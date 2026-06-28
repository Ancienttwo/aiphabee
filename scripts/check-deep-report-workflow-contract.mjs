#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/research/deep-report-workflow.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredCoveredItems = [
  "PRD-6.5",
  "RES-04",
  "AGT-09",
  "deep_report_workflow",
  "evidence_index",
  "rerun_seed"
];
const requiredStages = [
  "data_fetch",
  "deterministic_analysis",
  "section_generation",
  "citation_validation",
  "evidence_index",
  "rerun_seed"
];
const requiredOutputs = [
  "task_id",
  "workflow_task_id",
  "workflow_task",
  "workflow",
  "stages",
  "data_fetch_plan",
  "deterministic_analysis_plan",
  "section_plan",
  "citation_validation",
  "evidence_index",
  "report_snapshot",
  "rerun",
  "usage_estimate",
  "persistence_plan"
];
const requiredStaticReportMetadata = [
  "generated_at",
  "as_of",
  "data_delay_minutes",
  "version",
  "disclaimer"
];
const requiredTables = [
  "aiphabee_core.deep_report_snapshot",
  "aiphabee_core.deep_report_evidence_index",
  "aiphabee_core.workflow_task",
  "aiphabee_core.workflow_task_checkpoint"
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
    route: contract.route,
    status: "ok",
    workflow_binding: contract.workflow_binding
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

  if (value.version !== "2026-06-21.phase2.deep-report-workflow-scaffold.v0") {
    errors.push("version must match deep report workflow scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/research-runtime") {
    errors.push("package must be @aiphabee/research-runtime");
  }

  if (value.runtime_route !== "GET /research/runtime") {
    errors.push("runtime_route must be GET /research/runtime");
  }

  if (value.route !== "POST /research/reports/deep/plan") {
    errors.push("route must be POST /research/reports/deep/plan");
  }

  if (value.linked_agent_workflow_route !== "POST /agent/workflows/tasks/plan") {
    errors.push("linked_agent_workflow_route must be POST /agent/workflows/tasks/plan");
  }

  if (value.rerun_route !== "POST /research/runs/replay/plan") {
    errors.push("rerun_route must be POST /research/runs/replay/plan");
  }

  if (value.tool_name !== "plan_deep_report_workflow") {
    errors.push("tool_name must be plan_deep_report_workflow");
  }

  if (value.workflow_binding !== "AIPHABEE_RESEARCH_WORKFLOW") {
    errors.push("workflow_binding must be AIPHABEE_RESEARCH_WORKFLOW");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "live_workflow_execution",
    "live_tool_execution",
    "live_model_calls",
    "persistent_writes",
    "live_db_writes",
    "r2_writes",
    "sql_emitted",
    "old_report_mutation_allowed",
    "silent_rewrite_allowed"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "high_cost_confirmation_required",
    "task_id_required",
    "citation_validation_required",
    "evidence_index_required",
    "immutable_report_snapshot"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_prd_items, requiredCoveredItems, "covered_prd_items")
  );
  errors.push(...validateExactStringArray(value.required_stages, requiredStages, "required_stages"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputs, "required_output_fields")
  );
  errors.push(
    ...validateStringArray(
      value.static_report_metadata,
      requiredStaticReportMetadata,
      "static_report_metadata"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
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

function validateExactStringArray(value, requiredValues, name) {
  const errors = validateStringArray(value, requiredValues, name);

  if (errors.length > 0) {
    return errors;
  }

  if (value.join("\n") !== requiredValues.join("\n")) {
    errors.push(`${name} must preserve required order`);
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
