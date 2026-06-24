#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/usage-envelope.contract.json";
const quotaContractPath = "deploy/usage/quota-display.contract.json";
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_market_calendar",
  "get_quote_snapshot",
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_financial_ratios",
  "search_announcements",
  "get_announcement",
  "screen_securities",
  "compare_securities",
  "calculate_returns_risk",
  "get_event_timeline",
  "get_data_lineage",
  "get_entitlements",
  "get_ipo_profile",
  "search_ipo_calendar",
  "get_ipo_timetable",
  "get_ipo_offering",
  "get_ipo_allotment",
  "screen_ipos",
  "compare_ipos"
];
const requiredSprintItems = [
  "MCP-07",
  "usage",
  "remaining_quota",
  "request_id",
  "usage_reconciliation"
];
const requiredRuntimeCapabilityFields = [
  "usage_envelope_ready",
  "usage_envelope_version",
  "usage_remaining_ready",
  "usage_request_id_visible",
  "usage_reconciliation_ready",
  "usage_ledger_event_writer_version",
  "usage_quota_display_version"
];
const requiredUsageSummaryFields = [
  "request_id",
  "request_id_visible",
  "credits",
  "rows",
  "credit_limit",
  "credits_used",
  "credits_pending",
  "credits_remaining",
  "freshness_target_minutes",
  "usage_reconciliation_status"
];
const requiredToolCallUsageEnvelopeFields = [
  "request_id",
  "request_id_visible",
  "estimated_credits",
  "billable_credits",
  "credits_remaining_after_estimate",
  "quota_display",
  "ledger_event",
  "reconciliation"
];
const requiredQuotaFields = [
  "request_id",
  "credit_limit",
  "credits_used",
  "credits_pending",
  "credits_remaining",
  "plan_code"
];
const requiredLedgerEventFields = [
  "requestId",
  "operation",
  "channel",
  "dataset",
  "meteredRows",
  "toolName",
  "usageEventId"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const quotaContract = readJson(quotaContractPath);
const errors = [
  ...validateContract(contract),
  ...validateQuotaContract(quotaContract)
];

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
    usage_envelope_ready: contract.usage_envelope_ready,
    validated_tools: contract.validated_tools.length
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

  if (value.version !== "2026-06-21.phase2.mcp-usage-envelope-scaffold.v0") {
    errors.push("version must match MCP usage envelope scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.usage_ledger_package !== "@aiphabee/usage-ledger") {
    errors.push("usage_ledger_package must be @aiphabee/usage-ledger");
  }

  if (value.route !== "POST /mcp") {
    errors.push("route must be POST /mcp");
  }

  if (value.runtime_route !== "GET /mcp/runtime") {
    errors.push("runtime_route must be GET /mcp/runtime");
  }

  if (value.usage_quota_contract !== quotaContractPath) {
    errors.push(`usage_quota_contract must be ${quotaContractPath}`);
  }

  for (const field of [
    "frontend",
    "live_billing_reconciliation",
    "live_ledger_reads",
    "live_tool_execution",
    "persistent_writes"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "request_id_visible",
    "usage_envelope_ready",
    "usage_remaining_ready",
    "usage_reconciliation_ready"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  if (value.freshness_target_minutes !== 5) {
    errors.push("freshness_target_minutes must be 5");
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_3_items,
      requiredSprintItems,
      "covered_sprint_2_3_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "required_runtime_capability_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_usage_summary_fields,
      requiredUsageSummaryFields,
      "required_usage_summary_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_call_usage_envelope_fields,
      requiredToolCallUsageEnvelopeFields,
      "required_tool_call_usage_envelope_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.required_quota_fields, requiredQuotaFields, "required_quota_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_ledger_event_fields,
      requiredLedgerEventFields,
      "required_ledger_event_fields"
    )
  );
  errors.push(...validateStringArray(value.validated_methods, ["tools/call"], "validated_methods"));
  errors.push(...validateStringArray(value.validated_tools, requiredTools, "validated_tools"));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateQuotaContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["quota contract must be an object"];
  }

  if (value.request_id_visible !== true) {
    errors.push("quota contract request_id_visible must be true");
  }

  if (value.freshness_target_minutes !== 5) {
    errors.push("quota contract freshness_target_minutes must be 5");
  }

  errors.push(
    ...validateStringArray(
      value.display_fields,
      [
        "request_id",
        "credit_limit",
        "credits_used",
        "credits_pending",
        "credits_remaining",
        "freshness_target_minutes"
      ],
      "quota.display_fields"
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
