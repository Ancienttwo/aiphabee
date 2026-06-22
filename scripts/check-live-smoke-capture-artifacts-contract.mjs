#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/live-smoke-capture-artifacts.contract.json";
const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-22.phase0.live-smoke-capture-artifacts.v0";
const expectedStatus = "ready_for_external_env_capture";
const requiredCaptureIds = [
  "cloudflare_resource_inventory",
  "cloudflare_bindings_functional",
  "ai_gateway_model_execution",
  "ai_gateway_observability",
  "observability_otlp_eval_store",
  "provider_secret_store_rotation"
];
const requiredSchema = {
  capture_id: "ledger.live_smoke_commands.id",
  cleanup_verified: "required_for_destructive_provider_secret_store_captures",
  command: "ledger.live_smoke_commands.command",
  evidence_refs: "hash_only_refs_for_passed_captures",
  exit_code: "integer",
  observed_at: "ISO-8601",
  output_sha256: "sha256:hex_sha256_of_redacted_json_output",
  redaction_status: "redacted_no_secrets",
  runner: "redacted_runner_label",
  script: "ledger.live_smoke_commands.script",
  source_locator: "redacted_file_or_external_record_id",
  status: "passed|missing_env|permission_denied|failed"
};
const requiredTruePolicies = [
  "checker_does_not_run_live_smoke",
  "raw_outputs_forbidden_in_repo",
  "hash_only_refs_required",
  "missing_env_capture_does_not_unlock",
  "passed_capture_requires_output_sha256",
  "secret_store_capture_requires_cleanup",
  "ledger_transition_still_owned_by_live_smoke_evidence_ledger"
];
const requiredForbiddenFields = [
  "authorization",
  "api_key",
  "token",
  "secret",
  "password",
  "raw_response",
  "raw_output",
  "raw_prompt",
  "raw_model_output",
  "otlp_headers",
  "env_file_contents",
  "account_id",
  "resource_id",
  "env_value"
];
const forbiddenTextPatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const ledger = readJson(ledgerPath);
const packageJson = readJson(packagePath);
const tracker = readText(trackerPath);
const todos = readText(todosPath);
const errors = validateContract({ contract, ledger, packageJson, todos, tracker });

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
    capture_packets: contract.required_captures.length,
    ledger_contract: contract.ledger_contract,
    status: "ok"
  },
  0
);

function validateContract({ contract: value, ledger, packageJson, todos, tracker }) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== expectedVersion) {
    errors.push(`version must be ${expectedVersion}`);
  }

  if (value.status !== expectedStatus) {
    errors.push(`status must be ${expectedStatus}`);
  }

  if (value.ledger_contract !== ledgerPath) {
    errors.push(`ledger_contract must be ${ledgerPath}`);
  }

  if (value.preflight_checker !== "scripts/check-live-smoke-external-env-preflight.mjs") {
    errors.push("preflight_checker must be scripts/check-live-smoke-external-env-preflight.mjs");
  }

  if (value.checker !== "scripts/check-live-smoke-capture-artifacts-contract.mjs") {
    errors.push("checker must be scripts/check-live-smoke-capture-artifacts-contract.mjs");
  }

  errors.push(...validateSchema(value.capture_packet_schema));
  errors.push(...validateArtifactPolicy(value.artifact_policy));
  errors.push(...validateCaptures(value.required_captures, ledger));
  errors.push(...validateForbiddenFields(value.forbidden_fields));
  errors.push(...validateNotClaimed(value.not_claimed));
  errors.push(...validateLinkedFiles(value));
  errors.push(...validatePackageScripts(packageJson));
  errors.push(...validateTrackerAndTodos(tracker, todos));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateSchema(value) {
  if (!isRecord(value)) {
    return ["capture_packet_schema must be an object"];
  }

  const errors = [];

  for (const [key, expected] of Object.entries(requiredSchema)) {
    if (value[key] !== expected) {
      errors.push(`capture_packet_schema.${key} must be ${expected}`);
    }
  }

  return errors;
}

function validateArtifactPolicy(value) {
  if (!isRecord(value)) {
    return ["artifact_policy must be an object"];
  }

  const errors = [];

  for (const key of requiredTruePolicies) {
    if (value[key] !== true) {
      errors.push(`artifact_policy.${key} must be true`);
    }
  }

  return errors;
}

function validateCaptures(value, ledger) {
  if (!Array.isArray(value)) {
    return ["required_captures must be an array"];
  }

  const errors = [];
  const seen = new Set();
  const ledgerCommands = new Map((ledger.live_smoke_commands ?? []).map((entry) => [entry.id, entry]));

  if (value.length !== requiredCaptureIds.length) {
    errors.push(`required_captures must contain ${requiredCaptureIds.length} entries`);
  }

  for (const [index, capture] of value.entries()) {
    if (!isRecord(capture)) {
      errors.push(`required_captures[${index}] must be an object`);
      continue;
    }

    if (!requiredCaptureIds.includes(capture.id)) {
      errors.push(`required_captures[${index}].id is unexpected`);
      continue;
    }

    if (seen.has(capture.id)) {
      errors.push(`duplicate capture id ${capture.id}`);
    }
    seen.add(capture.id);

    const ledgerCommand = ledgerCommands.get(capture.id);

    if (!ledgerCommand) {
      errors.push(`ledger live_smoke_commands missing ${capture.id}`);
      continue;
    }

    if (capture.command !== ledgerCommand.command) {
      errors.push(`${capture.id}.command must match ledger command`);
    }

    if (capture.script !== ledgerCommand.script) {
      errors.push(`${capture.id}.script must match ledger script`);
    }

    if (capture.expected_success_status !== "passed") {
      errors.push(`${capture.id}.expected_success_status must be passed`);
    }

    if (capture.blocks_sprint0_4_checkbox !== true) {
      errors.push(`${capture.id}.blocks_sprint0_4_checkbox must be true`);
    }

    if (capture.cleanup_evidence_required !== (capture.id === "provider_secret_store_rotation")) {
      errors.push(`${capture.id}.cleanup_evidence_required is incorrect`);
    }
  }

  for (const id of requiredCaptureIds) {
    if (!seen.has(id)) {
      errors.push(`required_captures missing ${id}`);
    }
  }

  return errors;
}

function validateForbiddenFields(value) {
  if (!Array.isArray(value) || value.some((field) => typeof field !== "string")) {
    return ["forbidden_fields must be a string array"];
  }

  const errors = [];

  for (const field of requiredForbiddenFields) {
    if (!value.includes(field)) {
      errors.push(`forbidden_fields must include ${field}`);
    }
  }

  return errors;
}

function validateNotClaimed(value) {
  if (!Array.isArray(value)) {
    return ["not_claimed must be an array"];
  }

  const errors = [];

  for (const claim of [
    "live_smoke_outputs_captured",
    "all_live_smokes_passed",
    "sprint0_4_live_smoke_checkbox_complete"
  ]) {
    if (!value.includes(claim)) {
      errors.push(`not_claimed must include ${claim}`);
    }
  }

  return errors;
}

function validateLinkedFiles(value) {
  const errors = [];

  for (const path of [value.ledger_contract, value.preflight_checker]) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked file missing ${path}`);
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];

  if (scripts["check:live-smoke-capture-artifacts"] !== "node scripts/check-live-smoke-capture-artifacts-contract.mjs") {
    errors.push("package.json check:live-smoke-capture-artifacts script is missing");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-capture-artifacts")) {
    errors.push("root check must include check:live-smoke-capture-artifacts");
  }

  return errors;
}

function validateTrackerAndTodos(tracker, todos) {
  const errors = [];

  for (const text of [
    "live smoke capture artifacts",
    "npm run check:live-smoke-capture-artifacts",
    "hash-only",
    "cleanup proof"
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

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
