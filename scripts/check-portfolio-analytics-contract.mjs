#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/portfolio-analytics.contract.json";
const packageJsonPath = "package.json";
const analyticsSourcePath = "packages/analytics-tools/src/index.ts";
const analyticsTestPath = "packages/analytics-tools/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredPhase4Items = [
  "get_portfolio_analytics",
  "P1",
  "user_authorized_holdings",
  "no_trading_advice"
];
const requiredSourceTools = ["resolve_security", "get_quote_snapshot", "calculate_returns_risk"];
const requiredSections = ["allocation", "concentration", "returns_risk_summary"];
const requiredOutputFields = [
  "authorization",
  "allocation",
  "positions",
  "concentration",
  "risk_summary",
  "trading_advice",
  "source_record_ids"
];
const requiredBlockedStatuses = ["blocked_authorization", "blocked_empty_portfolio"];
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

  if (value.version !== "2026-06-22.phase4.portfolio-analytics-scaffold.v0") {
    errors.push("version must match portfolio analytics scaffold version");
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

  if (value.route !== "POST /analytics/portfolio") {
    errors.push("route must be POST /analytics/portfolio");
  }

  if (value.tool_name !== "get_portfolio_analytics") {
    errors.push("tool_name must be get_portfolio_analytics");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["frontend", "live_data_access", "persistent_writes", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_phase4_items, requiredPhase4Items, "covered_phase4_items")
  );
  errors.push(...validateStringArray(value.source_tools, requiredSourceTools, "source_tools"));
  errors.push(...validatePortfolioContract(value.portfolio_contract));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validatePortfolioContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["portfolio_contract must be an object"];
  }

  for (const field of [
    "authorized_holdings_required",
    "buy_sell_hold_recommendation",
    "personalized_advice",
    "rebalance_instruction",
    "trading_advice"
  ]) {
    const expected = field === "authorized_holdings_required";

    if (value[field] !== expected) {
      errors.push(`portfolio_contract.${field} must be ${expected}`);
    }
  }

  if (value.portfolio_scope !== "user_authorized_holdings_only") {
    errors.push("portfolio_contract.portfolio_scope must be user_authorized_holdings_only");
  }

  errors.push(
    ...validateStringArray(value.analytics_sections, requiredSections, "analytics_sections")
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.blocked_statuses, requiredBlockedStatuses, "blocked_statuses")
  );

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:portfolio-analytics"];
  const check = value.scripts.check;

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-portfolio-analytics-contract.mjs")
  ) {
    errors.push("check:portfolio-analytics must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:portfolio-analytics")) {
    errors.push("root check script must include check:portfolio-analytics");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    analytics: [
      "PORTFOLIO_ANALYTICS_VERSION",
      "getPortfolioAnalytics",
      "getPortfolioAnalyticsCapabilities",
      "authorized_holdings_required",
      "buy_sell_hold_recommendation"
    ],
    analyticsTest: [
      "reports portfolio analytics capabilities without trading advice",
      "blocks portfolio analytics without authorized holdings",
      "plans portfolio allocation, concentration, and weighted risk from authorized holdings"
    ],
    worker: [
      'app.post("/analytics/portfolio"',
      "normalizePortfolioPositionInputs",
      "getPortfolioAnalyticsCapabilities"
    ],
    workerTest: [
      "plans portfolio analytics only from authorized holdings without trading advice",
      "blocks portfolio analytics when authorized holdings are not supplied"
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

  if (!tracker.includes("- [x] 组合分析（仅用户授权持仓，不输出交易建议")) {
    errors.push("tracker must mark portfolio analytics phase4 item complete");
  }

  if (!tracker.includes("npm run check:portfolio-analytics")) {
    errors.push("tracker portfolio analytics row must reference check:portfolio-analytics");
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
