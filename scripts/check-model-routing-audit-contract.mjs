#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/model-routing-audit.contract.json";
const providerContractPath = "deploy/model-providers/providers.contract.json";
const requiredGatewayFeatures = ["logging", "caching", "rate_limiting", "fallback", "guardrails"];
const requiredEnv = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "AI_GATEWAY_NAME"];
const requiredRoutingTiers = {
  deterministic_code: ["financial_calculation", "screening", "structured_transform"],
  lightweight: [
    "intent_detection",
    "security_resolution_assist",
    "simple_formatting",
    "summary_draft"
  ],
  main: ["research_planning", "evidence_synthesis", "cross_document_explanation"]
};
const requiredFallbackTriggers = ["MODEL_TIMEOUT", "RATE_LIMITED", "UPSTREAM_5XX"];
const requiredAuditFields = [
  "user_id",
  "workspace_id",
  "token_client_id",
  "ip_risk_summary",
  "tool_name",
  "tool_version",
  "input_summary_hash",
  "authorization_policy_version",
  "dataset",
  "data_version",
  "source_record_id",
  "cache_hit",
  "model_provider",
  "model_id",
  "model_version",
  "prompt_version",
  "input_tokens",
  "output_tokens",
  "estimated_cost",
  "latency_ms",
  "output_hash",
  "error_code",
  "retry_count",
  "fallback_from_model",
  "fallback_to_model",
  "human_intervention"
];
const requiredCacheKeyMaterial = [
  "workspace_id",
  "task_layer",
  "model_id",
  "prompt_version",
  "input_summary_hash",
  "data_version"
];
const requiredValidationRules = [
  "require_ai_gateway_logs",
  "require_model_change_audit",
  "require_budget_ledger_link",
  "block_arbitrary_model_id",
  "keep_deterministic_financial_calculations_out_of_model",
  "redact_sensitive_audit_payloads"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const providerContract = readJson(providerContractPath);
const errors = validateContract(contract, providerContract);

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
    fallback: contract.fallback_policy.strategy,
    provider: contract.ai_gateway.provider,
    route: contract.route,
    status: "ok"
  },
  0
);

function validateContract(value, providerContract) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  if (value.route !== "POST /agent/runs/plan") {
    errors.push("route must be POST /agent/runs/plan");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  if (value.provider_route !== "GET /agent/model-provider") {
    errors.push("provider_route must be GET /agent/model-provider");
  }

  if (value.provider_contract !== providerContractPath) {
    errors.push(`provider_contract must be ${providerContractPath}`);
  }

  for (const field of ["actual_tool_execution", "frontend", "live_model_routing", "model_calls"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.policy_status !== "model_routing_audit_scaffold") {
    errors.push("policy_status must be model_routing_audit_scaffold");
  }

  errors.push(...validateGateway(value.ai_gateway, providerContract));
  errors.push(...validateRoutingTiers(value.routing_tiers));
  errors.push(...validateFallbackPolicy(value.fallback_policy));
  errors.push(...validateAuditContract(value.audit_contract));
  errors.push(...validateCachePolicy(value.cache_policy));
  errors.push(
    ...validateStringArray(
      value.required_validation_rules,
      requiredValidationRules,
      "required_validation_rules"
    )
  );
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateGateway(value, providerContract) {
  const errors = [];

  if (!isRecord(value)) {
    return ["ai_gateway must be an object"];
  }

  if (value.provider !== "cloudflare_ai_gateway") {
    errors.push("ai_gateway.provider must be cloudflare_ai_gateway");
  }

  if (value.status !== "planned") {
    errors.push("ai_gateway.status must be planned");
  }

  if (value.gateway_id !== "default") {
    errors.push("ai_gateway.gateway_id must be default");
  }

  if (value.unified_billing !== true) {
    errors.push("ai_gateway.unified_billing must be true");
  }

  errors.push(...validateStringArray(value.features, requiredGatewayFeatures, "ai_gateway.features"));
  errors.push(...validateStringArray(value.required_env, requiredEnv, "ai_gateway.required_env"));

  if (!isRecord(providerContract.gateway)) {
    errors.push("provider contract gateway must exist");
  } else {
    if (providerContract.gateway.provider !== value.provider) {
      errors.push("provider contract gateway.provider must match model routing audit provider");
    }

    if (providerContract.gateway.gateway_id !== value.gateway_id) {
      errors.push("provider contract gateway.gateway_id must match model routing audit gateway_id");
    }
  }

  return errors;
}

function validateRoutingTiers(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["routing_tiers must be an array"];
  }

  const tiers = new Map();

  value.forEach((tier, index) => {
    if (!isRecord(tier)) {
      errors.push(`routing_tiers[${index}] must be an object`);
      return;
    }

    if (typeof tier.task_layer === "string") {
      tiers.set(tier.task_layer, tier);
    }

    if (tier.model_calls !== false) {
      errors.push(`routing_tiers[${index}].model_calls must be false`);
    }

    if (!["planned", "wired_no_model"].includes(tier.status)) {
      errors.push(`routing_tiers[${index}].status must be planned or wired_no_model`);
    }
  });

  for (const [tierName, requiredTasks] of Object.entries(requiredRoutingTiers)) {
    const tier = tiers.get(tierName);

    if (!tier) {
      errors.push(`missing routing tier ${tierName}`);
      continue;
    }

    errors.push(...validateStringArray(tier.tasks, requiredTasks, `routing_tiers.${tierName}.tasks`));

    if (tierName === "deterministic_code" && tier.status !== "wired_no_model") {
      errors.push("deterministic_code tier must be wired_no_model");
    }
  }

  return errors;
}

function validateFallbackPolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["fallback_policy must be an object"];
  }

  if (value.strategy !== "switch_to_backup_model") {
    errors.push("fallback_policy.strategy must be switch_to_backup_model");
  }

  if (value.fallback_model_status !== "planned") {
    errors.push("fallback_policy.fallback_model_status must be planned");
  }

  if (value.max_fallbacks_per_run !== 1) {
    errors.push("fallback_policy.max_fallbacks_per_run must be 1");
  }

  if (value.records_model_change !== true) {
    errors.push("fallback_policy.records_model_change must be true");
  }

  errors.push(
    ...validateStringArray(value.triggers, requiredFallbackTriggers, "fallback_policy.triggers")
  );

  return errors;
}

function validateAuditContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["audit_contract must be an object"];
  }

  for (const field of [
    "cost_latency_required",
    "product_analytics_separate",
    "prompt_version_required",
    "redact_sensitive_content"
  ]) {
    if (value[field] !== true) {
      errors.push(`audit_contract.${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(value.required_fields, requiredAuditFields, "audit_contract.required_fields")
  );

  return errors;
}

function validateCachePolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["cache_policy must be an object"];
  }

  if (value.safe_reusable_results_only !== true) {
    errors.push("cache_policy.safe_reusable_results_only must be true");
  }

  if (value.non_sensitive_only !== true) {
    errors.push("cache_policy.non_sensitive_only must be true");
  }

  if (value.user_private_prompt_content_cacheable !== false) {
    errors.push("cache_policy.user_private_prompt_content_cacheable must be false");
  }

  errors.push(
    ...validateStringArray(
      value.cache_key_material,
      requiredCacheKeyMaterial,
      "cache_policy.cache_key_material"
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
      errors.push(`${name} missing ${requiredValue}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract must not contain secret-like value matching ${pattern}`);
    }
  }

  return errors;
}

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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
