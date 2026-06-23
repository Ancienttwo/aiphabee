#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/workflow-task.contract.json";
const bindingsContractPath = "deploy/cloudflare/bindings.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredRequestFields = ["prompt", "workflow_kind", "tools", "user_id", "workspace_id"];
const requiredOutputs = [
  "task",
  "task_id",
  "workflow",
  "resume",
  "notification",
  "long_task_boundary",
  "tool_loop_plan"
];
const requiredTaskKinds = [
  "deep_report",
  "event_research",
  "long_document",
  "multi_company_analysis"
];
const requiredTables = ["aiphabee_core.workflow_task", "aiphabee_core.workflow_task_checkpoint"];
const requiredBindings = [
  "AIPHABEE_RESEARCH_WORKFLOW",
  "AIPHABEE_EVENTS_QUEUE",
  "AIPHABEE_RUN_COORDINATOR"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const bindingsContract = readJson(bindingsContractPath);
const databaseContract = readJson(databaseContractPath);
const errors = validateContract(contract, bindingsContract, databaseContract);

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

function validateContract(value, bindingsValue, databaseValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase2.workflow-task-scaffold.v0") {
    errors.push("version must match the workflow task scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  if (value.route !== "POST /agent/workflows/tasks/plan") {
    errors.push("route must be POST /agent/workflows/tasks/plan");
  }

  if (value.resume_route !== "GET /agent/workflows/tasks/:task_id") {
    errors.push("resume_route must be GET /agent/workflows/tasks/:task_id");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "actual_workflow_execution",
    "live_workflow_execution",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "task_id_visible",
    "resumable",
    "disconnect_safe",
    "notification_plan"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  if (value.workflow_binding !== "AIPHABEE_RESEARCH_WORKFLOW") {
    errors.push("workflow_binding must be AIPHABEE_RESEARCH_WORKFLOW");
  }

  if (value.event_queue !== "AIPHABEE_EVENTS_QUEUE") {
    errors.push("event_queue must be AIPHABEE_EVENTS_QUEUE");
  }

  if (value.durable_object_binding !== "AIPHABEE_RUN_COORDINATOR") {
    errors.push("durable_object_binding must be AIPHABEE_RUN_COORDINATOR");
  }

  errors.push(
    ...validateStringArray(
      value.required_request_fields,
      requiredRequestFields,
      "required_request_fields"
    )
  );
  errors.push(...validateStringArray(value.planned_outputs, requiredOutputs, "planned_outputs"));
  errors.push(...validateStringArray(value.task_kinds, requiredTaskKinds, "task_kinds"));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateBindings(bindingsValue));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateBindings(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  for (const binding of requiredBindings) {
    if (!serialized.includes(binding)) {
      errors.push(`bindings contract must include ${binding}`);
    }
  }

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
