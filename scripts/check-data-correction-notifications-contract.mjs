#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/research/data-correction-notifications.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredCoveredItems = [
  "DAT-08",
  "US-O05",
  "data_correction",
  "saved_report_notification"
];
const requiredChannels = ["in_app", "email"];
const requiredOutputs = [
  "corrections",
  "affected_reports",
  "notification_plan",
  "persistence_plan",
  "replay",
  "validation"
];
const requiredTables = [
  "core.data_correction_event",
  "core.research_run_correction_impact",
  "core.user_notification"
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

function validateContract(value, databaseValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase2.data-correction-notifications-scaffold.v0") {
    errors.push("version must match data correction notifications scaffold version");
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

  if (value.route !== "POST /research/data-corrections/plan") {
    errors.push("route must be POST /research/data-corrections/plan");
  }

  if (value.tool_name !== "plan_data_correction_notifications") {
    errors.push("tool_name must be plan_data_correction_notifications");
  }

  if (value.event_queue !== "AIPHABEE_EVENTS_QUEUE") {
    errors.push("event_queue must be AIPHABEE_EVENTS_QUEUE");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend_rendering",
    "persistent_writes",
    "live_db_writes",
    "live_tool_execution",
    "notification_fanout",
    "queue_writes",
    "sql_emitted",
    "old_report_mutation_allowed",
    "silent_rewrite_allowed"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "affected_report_marking_required",
    "evidence_snapshot_marking_required",
    "saved_report_notification_required",
    "source_record_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_prd_items, requiredCoveredItems, "covered_prd_items")
  );
  errors.push(
    ...validateStringArray(
      value.supported_notification_channels,
      requiredChannels,
      "supported_notification_channels"
    )
  );
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputs, "required_output_fields")
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
