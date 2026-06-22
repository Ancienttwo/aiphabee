#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/market-statistics.contract.json";
const packageJsonPath = "package.json";
const analyticsSourcePath = "packages/analytics-tools/src/index.ts";
const analyticsTestPath = "packages/analytics-tools/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredPhase4Items = [
  "get_market_breadth",
  "get_ownership_and_short_selling",
  "get_buybacks_and_placements",
  "authorized_market_statistics"
];
const requiredRoutes = [
  "POST /analytics/market-breadth",
  "POST /analytics/ownership-short-selling",
  "POST /analytics/buybacks-placements"
];
const requiredToolNames = [
  "get_market_breadth",
  "get_ownership_and_short_selling",
  "get_buybacks_and_placements"
];
const requiredBlockedStatuses = ["blocked_authorization", "blocked_resolution"];
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
  analytics: readText(analyticsSourcePath),
  analyticsTest: readText(analyticsTestPath),
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
    routes: contract.routes,
    status: "ok",
    tools: requiredToolNames
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

  if (value.version !== "2026-06-22.phase4.market-statistics-scaffold.v0") {
    errors.push("version must match market statistics scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/analytics-tools") {
    errors.push("package must be @aiphabee/analytics-tools");
  }

  if (value.runtime_route !== "GET /analytics/runtime") {
    errors.push("runtime_route must be GET /analytics/runtime");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.authorized_market_statistics_required !== true) {
    errors.push("authorized_market_statistics_required must be true");
  }

  for (const field of ["frontend", "live_data_access", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.source_record_required !== true) {
    errors.push("source_record_required must be true");
  }

  errors.push(
    ...validateStringArray(value.covered_phase4_items, requiredPhase4Items, "covered_phase4_items")
  );
  errors.push(...validateStringArray(value.routes, requiredRoutes, "routes"));
  errors.push(...validateStringArray(value.blocked_statuses, requiredBlockedStatuses, "blocked_statuses"));
  errors.push(...validateTools(value.tools));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateTools(value) {
  const errors = [];

  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    return ["tools must be an array of objects"];
  }

  for (const toolName of requiredToolNames) {
    const tool = value.find((item) => item.tool_name === toolName);

    if (!isRecord(tool)) {
      errors.push(`tools must include ${toolName}`);
      continue;
    }

    if (!requiredRoutes.includes(tool.route)) {
      errors.push(`${toolName} route must be one of required routes`);
    }

    if (!Array.isArray(tool.analytics_sections) || tool.analytics_sections.length === 0) {
      errors.push(`${toolName} analytics_sections must be non-empty`);
    }

    if (!Array.isArray(tool.required_output_fields) || !tool.required_output_fields.includes("authorization")) {
      errors.push(`${toolName} required_output_fields must include authorization`);
    }

    if (!Array.isArray(tool.required_output_fields) || !tool.required_output_fields.includes("source_record_ids")) {
      errors.push(`${toolName} required_output_fields must include source_record_ids`);
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:market-statistics"];
  const check = value.scripts.check;

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-market-statistics-contract.mjs")
  ) {
    errors.push("check:market-statistics must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:market-statistics")) {
    errors.push("root check script must include check:market-statistics");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    analytics: [
      "MARKET_STATISTICS_VERSION",
      "getMarketBreadth",
      "getOwnershipAndShortSelling",
      "getBuybacksAndPlacements",
      "authorized_market_statistics_required",
      "blocked_authorization"
    ],
    analyticsTest: [
      "reports market statistics capabilities",
      "plans market breadth only when market statistics are authorized",
      "blocks ownership and short-selling data without authorization",
      "plans authorized buybacks placements and rights issues with source records"
    ],
    worker: [
      'app.post("/analytics/market-breadth"',
      'app.post("/analytics/ownership-short-selling"',
      'app.post("/analytics/buybacks-placements"',
      "getMarketBreadthCapabilities"
    ],
    workerTest: [
      "plans authorized market breadth without live data",
      "blocks ownership and short-selling route without market statistics authorization",
      "plans authorized ownership short-selling and buybacks placements routes"
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

  if (!tracker.includes("- [x] `get_market_breadth`")) {
    errors.push("tracker must mark market statistics phase4 item complete");
  }

  if (!tracker.includes("npm run check:market-statistics")) {
    errors.push("tracker market statistics row must reference check:market-statistics");
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
