#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-22.phase0.live-smoke-evidence-ledger.v0";
const captureTransitionReviewPath = "deploy/governance/live-smoke-capture-transition-review.contract.json";
const requiredReadinessChecks = [
  "cloudflare_resource_live_readiness",
  "model_provider_live_readiness",
  "observability_live_readiness",
  "provider_secret_stores_live_readiness",
  "live_smoke_defaults"
];
const requiredLiveSmokeCommands = [
  "cloudflare_resource_inventory",
  "cloudflare_bindings_functional",
  "ai_gateway_model_execution",
  "ai_gateway_observability",
  "observability_otlp_eval_store",
  "provider_secret_store_rotation"
];
const requiredNonInferableEnv = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "AI_GATEWAY_SMOKE_MODEL",
  "OTLP_EXPORTER_OTLP_ENDPOINT",
  "OTLP_EXPORTER_OTLP_HEADERS",
  "GITHUB_REPOSITORY",
  "GITHUB_ENVIRONMENT",
  "SUPABASE_PROJECT_REF"
];
const requiredMissingEvidence = [
  "hyperdrive_select_1_smoke",
  "cron_natural_trigger_evidence",
  "ai_gateway_logs_api_read_verified",
  "ai_gateway_cost_log_verified",
  "otlp_http_log_export",
  "eval_store_record_write_read_delete",
  "cloudflare_workers_secret_set_rotate_delete",
  "github_actions_secret_set_rotate_delete",
  "supabase_secret_set_rotate_delete"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

if (isMainModule()) {
  runCli();
}

export { validateLedger };

function runCli() {
  const ledger = readJson(ledgerPath);
  const packageJson = readJson(packagePath);
  const tracker = readText(trackerPath);
  const todos = readText(todosPath);
  const contracts = {
    cloudflare: readJson("deploy/cloudflare/resource-smoke-readiness.contract.json"),
    modelProvider: readJson("deploy/model-providers/live-smoke-readiness.contract.json"),
    observability: readJson("deploy/observability/live-smoke-readiness.contract.json"),
    secrets: readJson("deploy/secrets/live-smoke-readiness.contract.json")
  };
  const errors = validateLedger({ contracts, ledger, packageJson, todos, tracker });

  if (errors.length > 0) {
    emit(
      {
        errors,
        path: ledgerPath,
        status: "invalid_contract"
      },
      1
    );
  }

  emit(
    {
      live_smoke_commands: ledger.live_smoke_commands.length,
      release_transition_allowed: ledger.release_transition_allowed,
      status: "ok",
      surfaces: ledger.surfaces.length
    },
    0
  );
}

function validateLedger({ contracts, ledger: value, packageJson, todos, tracker }) {
  const errors = [];

  if (!isRecord(value)) {
    return ["ledger must be an object"];
  }

  if (value.version !== expectedVersion) {
    errors.push(`version must be ${expectedVersion}`);
  }

  if (!["pending_live_evidence", "ready_for_sprint0_4_live_smoke_decision"].includes(value.status)) {
    errors.push("status must be pending_live_evidence or ready_for_sprint0_4_live_smoke_decision");
  }

  if (value.checker !== "scripts/check-live-smoke-evidence-ledger-contract.mjs") {
    errors.push("checker must point to scripts/check-live-smoke-evidence-ledger-contract.mjs");
  }

  if (!Array.isArray(value.linked_capture_transition_reviews)) {
    errors.push("linked_capture_transition_reviews must be an array");
  } else if (!value.linked_capture_transition_reviews.includes(captureTransitionReviewPath)) {
    errors.push(`linked_capture_transition_reviews must include ${captureTransitionReviewPath}`);
  }

  if (!existsSync(resolve(process.cwd(), captureTransitionReviewPath))) {
    errors.push(`${captureTransitionReviewPath} is missing`);
  }

  errors.push(...validateEvidencePolicy(value.evidence_policy));
  errors.push(...validateReadinessChecks(value.readiness_checks, contracts));
  errors.push(...validateLiveSmokeCommands(value.live_smoke_commands, contracts));
  errors.push(...validateSurfaces(value.surfaces, contracts));
  errors.push(...validateStringArray(value.non_inferable_env, requiredNonInferableEnv, "non_inferable_env"));
  errors.push(...validateTransitionState(value));
  errors.push(...validatePackageScripts(packageJson));
  errors.push(...validateTrackerAndTodos(tracker, todos));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateEvidencePolicy(value) {
  if (!isRecord(value)) {
    return ["evidence_policy must be an object"];
  }

  const errors = [];
  const requiredTrue = [
    "live_smoke_commands_not_run_by_checker",
    "raw_secrets_forbidden_in_repo",
    "raw_provider_outputs_forbidden_in_repo",
    "hash_only_evidence_required",
    "destructive_secret_smoke_requires_cleanup_evidence",
    "external_env_values_must_not_be_defaulted_from_contracts"
  ];

  for (const key of requiredTrue) {
    if (value[key] !== true) {
      errors.push(`evidence_policy.${key} must be true`);
    }
  }

  return errors;
}

function validateReadinessChecks(value, contracts) {
  if (!Array.isArray(value)) {
    return ["readiness_checks must be an array"];
  }

  const expected = {
    cloudflare_resource_live_readiness: {
      command: "npm run check:cloudflare-resource-live-readiness",
      contract: "deploy/cloudflare/resource-smoke-readiness.contract.json",
      current_status: contracts.cloudflare.status
    },
    live_smoke_defaults: {
      command: "npm run check:live-smoke-defaults",
      contract: "scripts/lib/live-smoke-defaults.mjs",
      current_status: "ok"
    },
    model_provider_live_readiness: {
      command: contracts.modelProvider.readiness_command,
      contract: "deploy/model-providers/live-smoke-readiness.contract.json",
      current_status: contracts.modelProvider.status
    },
    observability_live_readiness: {
      command: "npm run check:observability-live-readiness",
      contract: "deploy/observability/live-smoke-readiness.contract.json",
      current_status: contracts.observability.status
    },
    provider_secret_stores_live_readiness: {
      command: "npm run check:provider-secret-stores-live-readiness",
      contract: "deploy/secrets/live-smoke-readiness.contract.json",
      current_status: contracts.secrets.status
    }
  };

  return validateExpectedEntries(value, requiredReadinessChecks, expected, "readiness_checks");
}

function validateLiveSmokeCommands(value, contracts) {
  if (!Array.isArray(value)) {
    return ["live_smoke_commands must be an array"];
  }

  const observabilityLiveStatus = deriveAggregateStatus(contracts.observability.synthetic_surfaces);
  const providerSecretLiveStatus = deriveAggregateStatus(contracts.secrets.providers);
  const expected = {
    ai_gateway_model_execution: {
      command: contracts.modelProvider.live_smoke_command,
      current_status: contracts.modelProvider.status,
      script: contracts.modelProvider.live_smoke_script
    },
    ai_gateway_observability: {
      command: contracts.modelProvider.observability_smoke_command,
      current_status: contracts.modelProvider.latest_observability_probe.status,
      script: contracts.modelProvider.observability_smoke_script
    },
    cloudflare_bindings_functional: {
      command: contracts.cloudflare.functional_smoke_command,
      current_status: contracts.cloudflare.functional_smoke.status,
      script: contracts.cloudflare.functional_smoke_script
    },
    cloudflare_resource_inventory: {
      command: contracts.cloudflare.live_smoke_command,
      current_status: contracts.cloudflare.partial_provisioning.status,
      script: contracts.cloudflare.live_smoke_script
    },
    observability_otlp_eval_store: {
      command: "npm run smoke:observability-live",
      current_status: observabilityLiveStatus,
      script: contracts.observability.script
    },
    provider_secret_store_rotation: {
      command: "npm run smoke:provider-secret-stores-live",
      current_status: providerSecretLiveStatus,
      script: contracts.secrets.script
    }
  };

  return validateExpectedEntries(value, requiredLiveSmokeCommands, expected, "live_smoke_commands");
}

function validateSurfaces(value, contracts) {
  if (!Array.isArray(value)) {
    return ["surfaces must be an array"];
  }

  const errors = [];
  const seen = new Set();
  const expectedStatuses = {
    ai_gateway_model_execution: contracts.modelProvider.status,
    ai_gateway_observability: contracts.modelProvider.latest_observability_probe.status,
    cloudflare_bindings_functional: contracts.cloudflare.functional_smoke.status,
    cloudflare_resource_inventory: contracts.cloudflare.partial_provisioning.status,
    observability_otlp_eval_store: deriveAggregateStatus(contracts.observability.synthetic_surfaces),
    provider_secret_store_rotation: deriveAggregateStatus(contracts.secrets.providers)
  };
  const allPassed = value.every((surface) => isRecord(surface) && surface.current_status === "passed");
  const allMissingEvidence = [];

  for (const [index, surface] of value.entries()) {
    if (!isRecord(surface)) {
      errors.push(`surfaces[${index}] must be an object`);
      continue;
    }

    if (typeof surface.id === "string") {
      seen.add(surface.id);
    }

    if (!requiredLiveSmokeCommands.includes(surface.id)) {
      errors.push(`surfaces[${index}].id is unexpected`);
    }

    if (surface.current_status !== expectedStatuses[surface.id]) {
      errors.push(`${surface.id}.current_status must match source contract`);
    }

    if (!Array.isArray(surface.missing_evidence)) {
      errors.push(`${surface.id}.missing_evidence must be an array`);
    } else {
      allMissingEvidence.push(...surface.missing_evidence);
    }

    if (!Array.isArray(surface.evidence_refs)) {
      errors.push(`${surface.id}.evidence_refs must be an array`);
    } else if (surface.current_status === "passed" && surface.evidence_refs.length === 0) {
      errors.push(`${surface.id} passed surface must have evidence_refs`);
    }

    if (surface.current_status === "passed" && Array.isArray(surface.missing_evidence) && surface.missing_evidence.length !== 0) {
      errors.push(`${surface.id} passed surface must not keep missing_evidence`);
    }

    if (surface.blocks_sprint0_4_checkbox !== true) {
      errors.push(`${surface.id}.blocks_sprint0_4_checkbox must be true`);
    }
  }

  for (const id of requiredLiveSmokeCommands) {
    if (!seen.has(id)) {
      errors.push(`surfaces missing ${id}`);
    }
  }

  if (!allPassed) {
    for (const missing of requiredMissingEvidence) {
      if (!allMissingEvidence.includes(missing)) {
        errors.push(`missing_evidence must include ${missing}`);
      }
    }
  }

  return errors;
}

function validateExpectedEntries(value, requiredIds, expected, label) {
  const errors = [];
  const seen = new Set();

  for (const [index, entry] of value.entries()) {
    if (!isRecord(entry)) {
      errors.push(`${label}[${index}] must be an object`);
      continue;
    }

    if (typeof entry.id === "string") {
      seen.add(entry.id);
    }

    if (!requiredIds.includes(entry.id)) {
      errors.push(`${label}[${index}].id is unexpected`);
      continue;
    }

    for (const [key, expectedValue] of Object.entries(expected[entry.id])) {
      if (entry[key] !== expectedValue) {
        errors.push(`${label}.${entry.id}.${key} must be ${expectedValue}`);
      }
    }

    if (typeof entry.contract === "string" && entry.contract.endsWith(".json") && !existsSync(resolve(process.cwd(), entry.contract))) {
      errors.push(`${label}.${entry.id}.contract is missing`);
    }

    if (typeof entry.script === "string" && !existsSync(resolve(process.cwd(), entry.script))) {
      errors.push(`${label}.${entry.id}.script is missing`);
    }
  }

  for (const id of requiredIds) {
    if (!seen.has(id)) {
      errors.push(`${label} missing ${id}`);
    }
  }

  return errors;
}

function validateTransitionState(value) {
  const errors = [];
  const allPassed = Array.isArray(value.surfaces) && value.surfaces.every((surface) => isRecord(surface) && surface.current_status === "passed");

  if (value.all_live_smokes_passed !== allPassed) {
    errors.push("all_live_smokes_passed must equal whether all surfaces passed");
  }

  if (value.release_transition_allowed !== allPassed) {
    errors.push("release_transition_allowed must equal whether all surfaces passed");
  }

  if (allPassed && value.status !== "ready_for_sprint0_4_live_smoke_decision") {
    errors.push("status must be ready_for_sprint0_4_live_smoke_decision when all surfaces passed");
  }

  if (!allPassed && value.status !== "pending_live_evidence") {
    errors.push("status must remain pending_live_evidence until all live smoke evidence is present");
  }

  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("sprint0_4_live_smoke_checkbox_complete")) {
    errors.push("not_claimed must include sprint0_4_live_smoke_checkbox_complete");
  }

  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("capture_transition_review_complete")) {
    errors.push("not_claimed must include capture_transition_review_complete");
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const requiredScripts = {
    "check:cloudflare-resource-live-readiness": "node scripts/check-cloudflare-resource-live-readiness.mjs",
    "check:live-smoke-defaults": "node scripts/check-live-smoke-defaults.mjs",
    "check:live-smoke-external-env-preflight": "node scripts/check-live-smoke-external-env-preflight.mjs",
    "check:live-smoke-capture-artifacts": "node scripts/check-live-smoke-capture-artifacts-contract.mjs",
    "check:live-smoke-capture-packets": "node scripts/check-live-smoke-capture-packets.mjs",
    "check:live-smoke-capture-transition-review": "node scripts/check-live-smoke-capture-transition-review-contract.mjs",
    "check:live-smoke-capture-transition-review-fixtures": "node scripts/check-live-smoke-capture-transition-review-fixtures.mjs",
    "check:live-smoke-evidence-ledger": "node scripts/check-live-smoke-evidence-ledger-contract.mjs",
    "check:live-smoke-evidence-ledger-fixtures": "node scripts/check-live-smoke-evidence-ledger-fixtures.mjs",
    "check:model-provider-live-readiness": "node scripts/check-model-provider-live-readiness.mjs",
    "check:observability-live-readiness": "node scripts/check-observability-live-readiness.mjs",
    "check:provider-secret-stores-live-readiness": "node scripts/check-provider-secret-stores-live-readiness.mjs",
    "smoke:ai-gateway-live": "node scripts/smoke-ai-gateway-live.mjs",
    "smoke:ai-gateway-observability-live": "node scripts/smoke-ai-gateway-observability-live.mjs",
    "smoke:cloudflare-bindings-wrangler-live": "node scripts/smoke-cloudflare-bindings-wrangler-live.mjs",
    "smoke:cloudflare-resources-live": "node scripts/smoke-cloudflare-resources-live.mjs",
    "smoke:observability-live": "node scripts/smoke-observability-live.mjs",
    "smoke:provider-secret-stores-live": "node scripts/smoke-provider-secret-stores-live.mjs"
  };

  for (const [script, command] of Object.entries(requiredScripts)) {
    if (scripts[script] !== command) {
      errors.push(`package.json ${script} must be ${command}`);
    }
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-evidence-ledger")) {
    errors.push("root check must include check:live-smoke-evidence-ledger");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-external-env-preflight")) {
    errors.push("root check must include check:live-smoke-external-env-preflight");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-capture-artifacts")) {
    errors.push("root check must include check:live-smoke-capture-artifacts");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-capture-packets")) {
    errors.push("root check must include check:live-smoke-capture-packets");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-capture-transition-review")) {
    errors.push("root check must include check:live-smoke-capture-transition-review");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-capture-transition-review-fixtures")) {
    errors.push("root check must include check:live-smoke-capture-transition-review-fixtures");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-evidence-ledger-fixtures")) {
    errors.push("root check must include check:live-smoke-evidence-ledger-fixtures");
  }

  return errors;
}

function validateTrackerAndTodos(tracker, todos) {
  const errors = [];

  for (const text of [
    "live smoke evidence ledger",
    "Live smoke capture transition review",
    "npm run check:live-smoke-evidence-ledger",
    "npm run check:live-smoke-capture-transition-review",
    "Hyperdrive live `SELECT 1`",
    "provider secret"
  ]) {
    if (!tracker.includes(text) && !todos.includes(text)) {
      errors.push(`tracker/todos must mention ${text}`);
    }
  }

  if (!tracker.includes("- [ ] AI Gateway 接管模型调用日志/成本/限流/缓存/fallback")) {
    errors.push("tracker must keep AI Gateway live observability item unchecked");
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

  for (const item of value) {
    if (!/^[A-Z][A-Z0-9_]*$/u.test(item)) {
      errors.push(`${name} contains invalid env name ${item}`);
    }
  }

  return errors;
}

function deriveAggregateStatus(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "readiness_not_run";
  }

  if (items.every((item) => isRecord(item) && item.status === "passed")) {
    return "passed";
  }

  if (items.every((item) => isRecord(item) && item.status === "readiness_not_run")) {
    return "readiness_not_run";
  }

  return "partial_live_passed";
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `ledger contains forbidden secret-like pattern ${pattern.source}`);
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMainModule() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
