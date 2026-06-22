#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/watchlist/create-alert.contract.json";
const packageJsonPath = "package.json";
const runtimeSourcePath = "packages/watchlist-runtime/src/index.ts";
const runtimeTestPath = "packages/watchlist-runtime/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredPhase4Items = [
  "create_alert",
  "explicit_confirmation",
  "alerts.write",
  "idempotency_key"
];
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
  "validation",
  "planner"
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
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  runtime: readText(runtimeSourcePath),
  runtimeTest: readText(runtimeTestPath),
  tracker: readText(trackerPath),
  worker: readText(workerSourcePath),
  workerTest: readText(workerTestPath)
};
const errors = validateContract(contract, packageJson, sourceFiles);

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

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_file"
      },
      1
    );
  }
}

function validateContract(value, packageValue, sourceFilesValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase4.create-alert-tool-scaffold.v0") {
    errors.push("version must match create_alert tool scaffold version");
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

  if (value.route !== "POST /tools/create-alert") {
    errors.push("route must be POST /tools/create-alert");
  }

  if (value.alert_planner_route !== "POST /watchlist/alerts/plan") {
    errors.push("alert_planner_route must be POST /watchlist/alerts/plan");
  }

  if (value.tool_name !== "create_alert") {
    errors.push("tool_name must be create_alert");
  }

  if (value.planner_tool_name !== "plan_watchlist_alerts") {
    errors.push("planner_tool_name must be plan_watchlist_alerts");
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
    ...validateStringArray(value.covered_phase4_items, requiredPhase4Items, "covered_phase4_items")
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
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:create-alert"];
  const check = value.scripts.check;

  if (typeof script !== "string" || !script.includes("scripts/check-create-alert-contract.mjs")) {
    errors.push("check:create-alert must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:create-alert")) {
    errors.push("root check script must include check:create-alert");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    runtime: [
      "CREATE_ALERT_TOOL_VERSION",
      "CreateAlertToolCapabilities",
      "createAlertToolPlan",
      "getCreateAlertToolCapabilities",
      "toolName: \"create_alert\""
    ],
    runtimeTest: [
      "reports create_alert tool capabilities",
      "plans create_alert through the watchlist alert planner without writes"
    ],
    worker: [
      'app.post("/tools/create-alert"',
      "normalizeWatchlistAlertsPlanInput",
      "getCreateAlertToolCapabilities"
    ],
    workerTest: [
      "plans create_alert tool writes with confirmation scope and idempotency"
    ]
  };

  for (const [fileKey, tokens] of Object.entries(requiredByFile)) {
    const text = value[fileKey];

    if (typeof text !== "string") {
      errors.push(`${fileKey} source missing`);
      continue;
    }

    for (const token of tokens) {
      if (!text.includes(token)) {
        errors.push(`${fileKey} must include ${token}`);
      }
    }
  }

  return errors;
}

function validateTrackerSync(tracker) {
  const errors = [];

  if (!tracker.includes("- [x] `create_alert` 写操作")) {
    errors.push("tracker must mark create_alert phase4 item complete");
  }

  if (!tracker.includes("npm run check:create-alert")) {
    errors.push("tracker create_alert row must reference check:create-alert");
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
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
