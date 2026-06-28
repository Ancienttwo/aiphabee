#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/watchlist/briefings.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredCoveredItems = [
  "RES-06",
  "watchlist_briefing",
  "material_changes_only",
  "evidence_required"
];
const requiredCadences = ["daily", "weekly"];
const requiredOutputs = [
  "briefing",
  "materiality_filter",
  "source_plan",
  "evidence_index",
  "notification",
  "persistence_plan",
  "validation"
];
const requiredSourceTools = [
  "get_quote_snapshot",
  "search_announcements",
  "get_financial_ratios"
];
const requiredTables = ["aiphabee_core.watchlist_briefing", "aiphabee_core.watchlist_briefing_item"];
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

  if (value.version !== "2026-06-21.phase2.watchlist-briefings-scaffold.v0") {
    errors.push("version must match watchlist briefings scaffold version");
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

  if (value.route !== "POST /watchlist/briefings/plan") {
    errors.push("route must be POST /watchlist/briefings/plan");
  }

  if (value.tool_name !== "plan_watchlist_briefing") {
    errors.push("tool_name must be plan_watchlist_briefing");
  }

  if (value.event_queue !== "AIPHABEE_EVENTS_QUEUE") {
    errors.push("event_queue must be AIPHABEE_EVENTS_QUEUE");
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
    "material_changes_only",
    "evidence_required",
    "source_record_required",
    "suppress_empty_briefings"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_prd_items, requiredCoveredItems, "covered_prd_items")
  );
  errors.push(...validateStringArray(value.supported_cadences, requiredCadences, "supported_cadences"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputs, "required_output_fields")
  );
  errors.push(...validateStringArray(value.source_tools, requiredSourceTools, "source_tools"));
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
