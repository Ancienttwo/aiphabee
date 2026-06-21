#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/account/package-pricing.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredPlanCodes = ["pro", "developer"];
const requiredUsageChannels = ["web_agent", "mcp"];
const requiredTables = [
  "core.subscription_plan",
  "core.plan_pricing_catalog",
  "core.plan_entitlement_bundle",
  "governance.package_pricing_contract"
];
const requiredValidationGates = [
  "data_authorization_cost_review",
  "target_market_interview",
  "unit_economics_margin_review"
];
const requiredPlanShape = {
  developer: {
    amount: 68800,
    creditLimit: 10000,
    displayPrice: "HK$688+",
    overageEnabled: true
  },
  pro: {
    amount: 22800,
    creditLimit: 5000,
    displayPrice: "HK$228",
    overageEnabled: false
  }
};
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
    currency: contract.currency,
    plans: contract.plan_codes.length,
    route: contract.route,
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

  if (value.version !== "2026-06-21.phase3.package-pricing-scaffold.v0") {
    errors.push("version must match the package pricing scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/account-runtime") {
    errors.push("package must be @aiphabee/account-runtime");
  }

  if (value.runtime_route !== "GET /account/runtime") {
    errors.push("runtime_route must be GET /account/runtime");
  }

  if (value.route !== "GET /account/package-pricing") {
    errors.push("route must be GET /account/package-pricing");
  }

  for (const field of [
    "billing_provider_calls",
    "frontend",
    "live_prices",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.currency !== "HKD") {
    errors.push("currency must be HKD");
  }

  if (value.pricing_source !== "docs/researches/AiphaBee_PRD_v1.0.md#15.2") {
    errors.push("pricing_source must point to PRD section 15.2");
  }

  if (value.price_status !== "validation_assumption_not_final_quote") {
    errors.push("price_status must preserve validation assumption status");
  }

  errors.push(...validateStringArray(value.plan_codes, requiredPlanCodes, "plan_codes"));
  errors.push(
    ...validateStringArray(value.usage_channels, requiredUsageChannels, "usage_channels")
  );
  errors.push(
    ...validateStringArray(
      value.validation_required_after,
      requiredValidationGates,
      "validation_required_after"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validatePlans(value.plans));
  errors.push(...validateRedistribution(value.redistribution));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validatePlans(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["plans must be an array"];
  }

  const plansByCode = new Map(
    value
      .filter((plan) => isRecord(plan) && typeof plan.plan_code === "string")
      .map((plan) => [plan.plan_code, plan])
  );

  for (const [planCode, expected] of Object.entries(requiredPlanShape)) {
    const plan = plansByCode.get(planCode);

    if (!isRecord(plan)) {
      errors.push(`plans must include ${planCode}`);
      continue;
    }

    if (plan.monthly_amount_minor !== expected.amount) {
      errors.push(`${planCode} monthly_amount_minor must be ${expected.amount}`);
    }

    if (plan.display_price !== expected.displayPrice) {
      errors.push(`${planCode} display_price must be ${expected.displayPrice}`);
    }

    if (plan.credit_limit !== expected.creditLimit) {
      errors.push(`${planCode} credit_limit must be ${expected.creditLimit}`);
    }

    if (plan.overage_enabled !== expected.overageEnabled) {
      errors.push(`${planCode} overage_enabled must be ${expected.overageEnabled}`);
    }

    if (!Array.isArray(plan.web_entitlements) || plan.web_entitlements.length === 0) {
      errors.push(`${planCode} web_entitlements must be non-empty`);
    }

    if (!Array.isArray(plan.mcp_entitlements) || plan.mcp_entitlements.length === 0) {
      errors.push(`${planCode} mcp_entitlements must be non-empty`);
    }
  }

  const developer = plansByCode.get("developer");

  if (isRecord(developer)) {
    if (developer.api_key !== true) {
      errors.push("developer api_key must be true");
    }

    if (developer.bulk_pagination !== true) {
      errors.push("developer bulk_pagination must be true");
    }
  }

  return errors;
}

function validateRedistribution(value) {
  if (!isRecord(value)) {
    return ["redistribution must be an object"];
  }

  const errors = [];

  if (value.commercial_external_redistribution !== false) {
    errors.push("commercial_external_redistribution must remain false");
  }

  if (value.export_requires_field_authorization !== true) {
    errors.push("export_requires_field_authorization must be true");
  }

  if (value.partner_rights_matrix_required !== true) {
    errors.push("partner_rights_matrix_required must be true");
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
