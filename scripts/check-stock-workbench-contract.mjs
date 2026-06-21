#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/workbench/stock-workbench.contract.json";
const requiredItems = ["STK-01", "STK-02", "STK-03", "STK-04", "STK-05", "STK-06"];
const requiredSections = [
  "security_profile",
  "quote_snapshot",
  "price_history",
  "financial_facts",
  "derived_metrics",
  "announcement_search",
  "corporate_actions"
];
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_quote_snapshot",
  "get_price_history",
  "get_financial_facts",
  "get_corporate_actions"
];
const requiredUnsupported = ["full_announcement_document_search"];
const requiredOutputFields = [
  "announcement_search",
  "security_profile",
  "quote_snapshot",
  "price_history",
  "financial_facts",
  "derived_metrics",
  "corporate_actions",
  "data_quality",
  "evidence",
  "unsupported_sections"
];
const requiredAnnouncementCategories = ["results", "dividend", "buyback"];
const requiredAnnouncementFilters = [
  "instrument_id",
  "security_query",
  "from",
  "to",
  "categories",
  "keyword",
  "limit"
];
const requiredAnnouncementLocatorFields = [
  "document_id",
  "source_record_id",
  "page",
  "anchor",
  "original_url"
];
const requiredComputedMetrics = [
  "net_margin",
  "return_on_assets",
  "return_on_equity",
  "asset_turnover",
  "equity_multiplier"
];
const requiredBlockedMetrics = ["price_to_earnings", "price_to_sales", "price_to_book"];
const requiredAnomalyHandling = [
  "missing_input",
  "zero_denominator",
  "negative_denominator",
  "quality_hold",
  "market_cap_unavailable"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
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
    route: contract.route,
    sections: contract.sections.length,
    status: "ok",
    tools: contract.source_tools.length
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

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase1.stock-workbench-announcement-search-scaffold.v0") {
    errors.push("version must match stock workbench scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/workbench") {
    errors.push("package must be @aiphabee/workbench");
  }

  if (value.runtime_route !== "GET /workbench/runtime") {
    errors.push("runtime_route must be GET /workbench/runtime");
  }

  if (value.route !== "POST /workbench/stock/snapshot") {
    errors.push("route must be POST /workbench/stock/snapshot");
  }

  if (value.announcement_route !== "POST /workbench/stock/announcements") {
    errors.push("announcement_route must be POST /workbench/stock/announcements");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.actual_tool_execution !== true) {
    errors.push("actual_tool_execution must be true because this aggregates local tool handlers");
  }

  for (const field of ["frontend", "live_data_access", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_1_4_items,
      requiredItems,
      "covered_sprint_1_4_items"
    )
  );
  errors.push(...validateStringArray(value.sections, requiredSections, "sections"));
  errors.push(...validateStringArray(value.source_tools, requiredTools, "source_tools"));
  errors.push(
    ...validateStringArray(
      value.unsupported_sections,
      requiredUnsupported,
      "unsupported_sections"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(...validateDerivedMetricContract(value.derived_metric_contract));
  errors.push(...validateAnnouncementSearchContract(value.announcement_search_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateAnnouncementSearchContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["announcement_search_contract must be an object"];
  }

  if (value.route !== "POST /workbench/stock/announcements") {
    errors.push("announcement_search_contract.route must be POST /workbench/stock/announcements");
  }

  if (value.source !== "synthetic_announcement_fixture") {
    errors.push("announcement_search_contract.source must be synthetic_announcement_fixture");
  }

  if (value.max_limit !== 3) {
    errors.push("announcement_search_contract.max_limit must be 3");
  }

  for (const field of [
    "evidence_locator_ready",
    "ambiguous_security_blocks"
  ]) {
    if (value[field] !== true) {
      errors.push(`announcement_search_contract.${field} must be true`);
    }
  }

  for (const field of ["original_document_fetch", "external_href_authority"]) {
    if (value[field] !== false) {
      errors.push(`announcement_search_contract.${field} must be false`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.categories,
      requiredAnnouncementCategories,
      "announcement_search_contract.categories"
    )
  );
  errors.push(
    ...validateStringArray(
      value.filters,
      requiredAnnouncementFilters,
      "announcement_search_contract.filters"
    )
  );
  errors.push(
    ...validateStringArray(
      value.locator_fields,
      requiredAnnouncementLocatorFields,
      "announcement_search_contract.locator_fields"
    )
  );

  return errors;
}

function validateDerivedMetricContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["derived_metric_contract must be an object"];
  }

  if (value.formula_version !== "stock-workbench-derived-metrics-v0") {
    errors.push("derived_metric_contract.formula_version must be stock-workbench-derived-metrics-v0");
  }

  if (value.valuation_blocked_without_market_cap !== true) {
    errors.push("derived_metric_contract.valuation_blocked_without_market_cap must be true");
  }

  errors.push(
    ...validateStringArray(
      value.source_tools,
      ["get_financial_facts", "get_quote_snapshot"],
      "derived_metric_contract.source_tools"
    )
  );
  errors.push(
    ...validateStringArray(
      value.computed_metrics,
      requiredComputedMetrics,
      "derived_metric_contract.computed_metrics"
    )
  );
  errors.push(
    ...validateStringArray(
      value.blocked_metrics,
      requiredBlockedMetrics,
      "derived_metric_contract.blocked_metrics"
    )
  );
  errors.push(
    ...validateStringArray(
      value.anomaly_handling,
      requiredAnomalyHandling,
      "derived_metric_contract.anomaly_handling"
    )
  );

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
