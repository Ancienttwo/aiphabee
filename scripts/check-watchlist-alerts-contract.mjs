#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/watchlist/alerts.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredCoveredItems = ["RES-05", "US-W09", "create_alert", "alerts.write"];
const requiredKinds = ["price", "announcement", "metric"];
const requiredFrequencies = ["realtime", "daily", "weekly"];
const requiredChannels = ["in_app", "email", "webhook"];
const requiredOutputs = [
  "watchlist",
  "alert_rule",
  "dedupe",
  "frequency",
  "evaluation_plan",
  "notification",
  "persistence_plan",
  "validation"
];
const requiredTables = [
  "core.watchlist",
  "core.watchlist_item",
  "core.watchlist_alert_rule",
  "core.watchlist_alert_event"
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
    scope: contract.create_alert_scope,
    status: "ok"
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

  if (value.version !== "2026-06-21.phase2.watchlist-alerts-scaffold.v0") {
    errors.push("version must match watchlist alerts scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/watchlist-runtime") {
    errors.push("package must be @aiphabee/watchlist-runtime");
  }

  if (value.runtime_route !== "GET /watchlist/runtime") {
    errors.push("runtime_route must be GET /watchlist/runtime");
  }

  if (value.route !== "POST /watchlist/alerts/plan") {
    errors.push("route must be POST /watchlist/alerts/plan");
  }

  if (value.tool_name !== "plan_watchlist_alerts") {
    errors.push("tool_name must be plan_watchlist_alerts");
  }

  if (value.event_queue !== "AIPHABEE_EVENTS_QUEUE") {
    errors.push("event_queue must be AIPHABEE_EVENTS_QUEUE");
  }

  if (value.create_alert_scope !== "alerts.write") {
    errors.push("create_alert_scope must be alerts.write");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "persistent_writes",
    "live_db_writes",
    "live_tool_execution",
    "notification_fanout",
    "queue_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "explicit_confirmation_required",
    "independent_scope_required",
    "idempotency_key_required",
    "dedupe_required",
    "frequency_controls_required",
    "quiet_period_controls_required",
    "source_record_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_prd_items, requiredCoveredItems, "covered_prd_items")
  );
  errors.push(...validateStringArray(value.supported_alert_kinds, requiredKinds, "supported_alert_kinds"));
  errors.push(
    ...validateStringArray(
      value.supported_frequencies,
      requiredFrequencies,
      "supported_frequencies"
    )
  );
  errors.push(...validateStringArray(value.supported_channels, requiredChannels, "supported_channels"));
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
