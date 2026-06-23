#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const contractPath = "deploy/governance/live-smoke-operator-run-plan.contract.json";
const packageJsonPath = "package.json";
const expectedVersion = "2026-06-23.phase0.live-smoke-operator-run-plan.v0";
const expectedStatus = "ready_for_credentialed_operator";
const checkerPath = "scripts/check-live-smoke-operator-run-plan-contract.mjs";

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const captureArtifacts = readJson(contract.capture_artifacts_contract);
const releaseReadiness = readJson(contract.release_readiness_contract);
const tracker = readText(contract.tracker);
const todos = readText(contract.todos);
const preflight = runPreflight(contract.preflight_checker);
const errors = [
  ...validateContract(contract),
  ...validatePackageScripts(packageJson),
  ...validatePreflightAlignment(contract, preflight),
  ...validateCaptureArtifactAlignment(contract, captureArtifacts),
  ...validateReleaseReadinessAlignment(contract, releaseReadiness),
  ...validateFragments(tracker, todos)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      preflight_status: preflight?.status,
      status: "invalid_live_smoke_operator_run_plan"
    },
    1
  );
}

emit(
  {
    current_preflight_status: preflight.status,
    operator_commands: contract.command_run_plan.length,
    release_transition_allowed: false,
    status: "ok",
    version: contract.version
  },
  0
);

function validateContract(value) {
  const errors = [];

  expectEqual(errors, value.version, expectedVersion, "version");
  expectEqual(errors, value.status, expectedStatus, "status");
  expectEqual(errors, value.checker, checkerPath, "checker");
  expectEqual(errors, value.preflight_checker, "scripts/check-live-smoke-external-env-preflight.mjs", "preflight_checker");
  expectEqual(errors, value.capture_artifacts_contract, "deploy/governance/live-smoke-capture-artifacts.contract.json", "capture_artifacts_contract");
  expectEqual(errors, value.capture_packet_directory, "deploy/governance/live-smoke-capture-packets", "capture_packet_directory");
  expectEqual(errors, value.capture_template_directory, "deploy/governance/live-smoke-capture-templates", "capture_template_directory");
  expectEqual(errors, value.release_readiness_contract, "deploy/release-checklists/current-release-readiness.contract.json", "release_readiness_contract");

  for (const flag of [
    "checker_does_not_run_live_smoke",
    "checker_does_not_write_capture_packets",
    "raw_outputs_forbidden_in_repo",
    "env_values_forbidden_in_repo",
    "hash_only_evidence_required_for_passed_packets",
    "missing_env_packets_do_not_unlock_release",
    "provider_secret_store_capture_requires_cleanup"
  ]) {
    expectEqual(errors, value.operator_policy?.[flag], true, `operator_policy.${flag}`);
  }

  if (!Array.isArray(value.command_run_plan) || value.command_run_plan.length !== 6) {
    errors.push("command_run_plan must contain six live smoke commands");
  }

  for (const path of [
    value.preflight_checker,
    value.capture_artifacts_contract,
    value.capture_packet_directory,
    value.capture_template_directory,
    value.release_readiness_contract,
    value.tracker,
    value.todos,
    ...(value.command_run_plan ?? []).flatMap((entry) => [
      entry.script,
      entry.packet_template,
      dirname(entry.packet_output ?? "")
    ])
  ]) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked path missing: ${path}`);
    }
  }

  for (const claim of [
    "live_smoke_executed",
    "capture_packets_created",
    "all_live_smokes_passed",
    "release_transition_allowed"
  ]) {
    expectIncludes(errors, value.not_claimed, claim, `not_claimed.${claim}`);
  }

  for (const forbidden of [
    "raw command outputs",
    "API tokens",
    "OTLP headers",
    "environment values"
  ]) {
    expectIncludes(errors, value.forbidden_payload_policy, forbidden, `forbidden_payload_policy.${forbidden}`);
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};

  if (
    scripts["check:live-smoke-operator-run-plan"] !==
    "node scripts/check-live-smoke-operator-run-plan-contract.mjs"
  ) {
    errors.push("package.json scripts.check:live-smoke-operator-run-plan must run the operator run plan checker");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-operator-run-plan")) {
    errors.push("package.json scripts.check must include npm run check:live-smoke-operator-run-plan");
  }

  return errors;
}

function validatePreflightAlignment(value, preflightResult) {
  const errors = [];

  if (!isRecord(preflightResult) || !Array.isArray(preflightResult.command_preflights)) {
    errors.push("preflight checker did not return command_preflights");
    return errors;
  }

  const expectedIds = [
    "cloudflare_resource_inventory",
    "cloudflare_bindings_functional",
    "ai_gateway_model_execution",
    "ai_gateway_observability",
    "observability_otlp_eval_store",
    "provider_secret_store_rotation"
  ];
  const preflightById = new Map(preflightResult.command_preflights.map((entry) => [entry.id, entry]));
  const planById = new Map((value.command_run_plan ?? []).map((entry) => [entry.id, entry]));

  expectArray(errors, [...planById.keys()], expectedIds, "command_run_plan.ids");

  for (const id of expectedIds) {
    const plan = planById.get(id);
    const preflight = preflightById.get(id);

    if (!plan || !preflight) {
      errors.push(`missing command preflight or plan for ${id}`);
      continue;
    }

    expectEqual(errors, plan.command, preflight.command, `${id}.command`);
    expectEqual(errors, plan.script, preflight.script, `${id}.script`);
    expectArray(errors, plan.required_env, preflight.required_env, `${id}.required_env`);
    expectArray(errors, plan.auth_sources, preflight.auth_sources, `${id}.auth_sources`);
    expectEqual(errors, plan.packet_template, `${value.capture_template_directory}/${id}.capture.json`, `${id}.packet_template`);
    expectEqual(errors, plan.packet_output, `${value.capture_packet_directory}/${id}.capture.json`, `${id}.packet_output`);
    expectEqual(errors, plan.blocks_sprint0_4_checkbox, true, `${id}.blocks_sprint0_4_checkbox`);
  }

  return errors;
}

function validateCaptureArtifactAlignment(value, captureArtifacts) {
  const errors = [];
  const capturesById = new Map((captureArtifacts.required_captures ?? []).map((entry) => [entry.id, entry]));

  expectEqual(errors, captureArtifacts.preflight_checker, value.preflight_checker, "capture_artifacts.preflight_checker");
  expectEqual(errors, captureArtifacts.artifact_directory, value.capture_packet_directory, "capture_artifacts.artifact_directory");
  expectEqual(errors, captureArtifacts.template_directory, value.capture_template_directory, "capture_artifacts.template_directory");

  for (const plan of value.command_run_plan ?? []) {
    const capture = capturesById.get(plan.id);

    if (!capture) {
      errors.push(`capture artifact missing required capture ${plan.id}`);
      continue;
    }

    expectEqual(errors, capture.command, plan.command, `${plan.id}.capture.command`);
    expectEqual(errors, capture.script, plan.script, `${plan.id}.capture.script`);
    expectEqual(errors, capture.cleanup_evidence_required, plan.cleanup_required, `${plan.id}.cleanup_required`);
    expectEqual(errors, capture.blocks_sprint0_4_checkbox, true, `${plan.id}.capture.blocks_sprint0_4_checkbox`);
  }

  return errors;
}

function validateReleaseReadinessAlignment(value, releaseReadiness) {
  const errors = [];

  expectEqual(errors, releaseReadiness.release_transition_allowed, false, "release_readiness.release_transition_allowed");
  if (typeof releaseReadiness.pr_creation_allowed !== "boolean") {
    errors.push("release_readiness.pr_creation_allowed must be boolean");
  }
  if (releaseReadiness.pr_creation_allowed === true && releaseReadiness.large_module_completed_this_slice !== true) {
    errors.push("release_readiness.pr_creation_allowed requires large_module_completed_this_slice");
  }
  expectEqual(errors, releaseReadiness.next_release_slice?.id, "credentialed_live_smoke_capture_packets", "release_readiness.next_release_slice.id");
  expectEqual(errors, releaseReadiness.next_release_slice?.entrypoint, "npm run check:live-smoke-external-env-preflight", "release_readiness.next_release_slice.entrypoint");

  for (const check of [
    "npm run check:live-smoke-operator-run-plan",
    "npm run check:live-smoke-capture-packets",
    "npm run check:live-smoke-capture-transition-review",
    "npm run check:live-smoke-evidence-ledger"
  ]) {
    expectIncludes(errors, releaseReadiness.next_release_slice?.followup_checks, check, `release_readiness.next_release_slice.followup_checks.${check}`);
  }

  return errors;
}

function validateFragments(trackerText, todosText) {
  const errors = [];

  for (const fragment of [
    "Live smoke operator run plan 已建立",
    "| 2026-06-23 | 1.0im | 完成 `live-smoke-operator-run-plan`"
  ]) {
    if (!trackerText.includes(fragment)) {
      errors.push(`tracker missing required fragment: ${fragment}`);
    }
  }

  for (const fragment of [
    "Live smoke operator run plan",
    "check:live-smoke-operator-run-plan",
    "credentialed operator"
  ]) {
    if (!todosText.includes(fragment)) {
      errors.push(`tasks/todos.md missing required fragment: ${fragment}`);
    }
  }

  return errors;
}

function runPreflight(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status !== 0) {
    return {
      errors: [result.stderr.trim() || result.stdout.trim()],
      status: "preflight_failed"
    };
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    return {
      errors: [error.message],
      raw_stdout: result.stdout,
      status: "preflight_parse_failed"
    };
  }
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

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

function expectIncludes(errors, values, expected, path) {
  if (!Array.isArray(values) || !values.includes(expected)) {
    errors.push(`${path} must include ${expected}`);
  }
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
