#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/consensus-estimates.contract.json";
const packageJsonPath = "package.json";
const analyticsSourcePath = "packages/analytics-tools/src/index.ts";
const analyticsTestPath = "packages/analytics-tools/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredPhase4Items = [
  "get_consensus_or_estimates",
  "redistribution_rights_confirmed",
  "consensus_rating",
  "financial_estimates"
];
const requiredSections = ["consensus_rating", "target_price", "financial_estimates"];
const requiredMetrics = ["revenue", "eps", "ebitda"];
const requiredOutputFields = ["rights", "security", "consensus", "estimates", "source_record_ids"];
const requiredBlockedStatuses = ["blocked_redistribution_rights", "blocked_resolution"];
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
    route: contract.route,
    status: "ok",
    tool: contract.tool_name
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

  if (value.version !== "2026-06-22.phase4.consensus-estimates-scaffold.v0") {
    errors.push("version must match consensus estimates scaffold version");
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

  if (value.route !== "POST /analytics/consensus-estimates") {
    errors.push("route must be POST /analytics/consensus-estimates");
  }

  if (value.tool_name !== "get_consensus_or_estimates") {
    errors.push("tool_name must be get_consensus_or_estimates");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.redistribution_rights_required !== true) {
    errors.push("redistribution_rights_required must be true");
  }

  if (value.source_record_required !== true) {
    errors.push("source_record_required must be true");
  }

  for (const field of [
    "frontend",
    "investment_advice",
    "live_data_access",
    "persistent_writes",
    "raw_provider_payload",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_phase4_items, requiredPhase4Items, "covered_phase4_items")
  );
  errors.push(...validateStringArray(value.analytics_sections, requiredSections, "analytics_sections"));
  errors.push(...validateStringArray(value.supported_metrics, requiredMetrics, "supported_metrics"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(
    ...validateStringArray(value.blocked_statuses, requiredBlockedStatuses, "blocked_statuses")
  );
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

  const script = value.scripts["check:consensus-estimates"];
  const check = value.scripts.check;

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-consensus-estimates-contract.mjs")
  ) {
    errors.push("check:consensus-estimates must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:consensus-estimates")) {
    errors.push("root check script must include check:consensus-estimates");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    analytics: [
      "CONSENSUS_ESTIMATES_VERSION",
      "getConsensusOrEstimates",
      "getConsensusOrEstimatesCapabilities",
      "blocked_redistribution_rights",
      "redistribution_rights_required"
    ],
    analyticsTest: [
      "reports consensus estimates capabilities with redistribution rights gate",
      "blocks consensus estimates without redistribution rights",
      "plans consensus estimates only after redistribution rights are confirmed"
    ],
    worker: [
      'app.post("/analytics/consensus-estimates"',
      "getConsensusOrEstimatesCapabilities",
      "normalizeConsensusEstimateMetrics"
    ],
    workerTest: [
      "blocks consensus estimates route without redistribution rights",
      "plans consensus estimates route only with confirmed redistribution rights"
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

  if (!tracker.includes("- [x] `get_consensus_or_estimates`")) {
    errors.push("tracker must mark get_consensus_or_estimates complete");
  }

  if (!tracker.includes("npm run check:consensus-estimates")) {
    errors.push("tracker consensus estimates row must reference check:consensus-estimates");
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
