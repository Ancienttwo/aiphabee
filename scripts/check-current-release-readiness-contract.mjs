#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/release-checklists/current-release-readiness.contract.json";
const packageJsonPath = "package.json";
const expectedVersion = "2026-06-23.goal.current-release-readiness.v0";
const expectedStatus = "blocked_pending_evidence";
const checkerPath = "scripts/check-current-release-readiness-contract.mjs";

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const tracker = readText(contract.tracker);
const todos = readText(contract.todos);
const sprintCompletionAudit = readJson(contract.sprint_completion_audit_contract);
const sprintExitGateTransitionReview = readJson(contract.sprint_exit_gate_transition_review_contract);
const mainlinePublicationReadiness = readJson(contract.mainline_publication_readiness_contract);
const errors = [
  ...validateContract(contract),
  ...validatePackageScripts(packageJson),
  ...validateLinkedReadinessState({
    contract,
    mainlinePublicationReadiness,
    sprintCompletionAudit,
    sprintExitGateTransitionReview
  }),
  ...validateBlockerManifestAlignment(contract, sprintCompletionAudit),
  ...validateFragments(contract, tracker, todos)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_current_release_readiness"
    },
    1
  );
}

emit(
  {
    blockers: contract.required_blocker_manifests.length,
    large_module_completed_this_slice: contract.large_module_completed_this_slice,
    next_release_slice: contract.next_release_slice.id,
    pr_creation_allowed: contract.pr_creation_allowed,
    release_transition_allowed: contract.release_transition_allowed,
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
  expectEqual(errors, value.tracker, "docs/AiphaBee_Sprint_Tracker_v1.0.md", "tracker");
  expectEqual(errors, value.todos, "tasks/todos.md", "todos");
  expectEqual(
    errors,
    value.sprint_completion_audit_contract,
    "deploy/governance/sprint-completion-audit.contract.json",
    "sprint_completion_audit_contract"
  );
  expectEqual(
    errors,
    value.sprint_exit_gate_transition_review_contract,
    "deploy/governance/sprint-exit-gate-transition-review.contract.json",
    "sprint_exit_gate_transition_review_contract"
  );
  expectEqual(
    errors,
    value.mainline_publication_readiness_contract,
    "deploy/governance/mainline-publication-readiness.contract.json",
    "mainline_publication_readiness_contract"
  );

  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");
  if (typeof value.pr_creation_allowed !== "boolean") {
    errors.push("pr_creation_allowed must be boolean");
  }
  if (typeof value.large_module_completed_this_slice !== "boolean") {
    errors.push("large_module_completed_this_slice must be boolean");
  }

  [
    "external_or_live_or_frontend_evidence_required"
  ].forEach((flag) => expectEqual(errors, value[flag], true, flag));
  if (typeof value.publication_ready_without_new_pr !== "boolean") {
    errors.push("publication_ready_without_new_pr must be boolean");
  }

  if (
    !Array.isArray(value.required_blocker_manifests) ||
    value.required_blocker_manifests.length !== 8
  ) {
    errors.push("required_blocker_manifests must contain 8 blocker manifests");
  }

  if (value.next_release_slice?.id !== "credentialed_live_smoke_capture_packets") {
    errors.push("next_release_slice.id must be credentialed_live_smoke_capture_packets");
  }

  if (value.next_release_slice?.entrypoint !== "npm run check:live-smoke-external-env-preflight") {
    errors.push("next_release_slice.entrypoint must use the live-smoke env preflight");
  }
  for (const check of [
    "npm run check:live-smoke-operator-run-plan",
    "npm run check:live-smoke-capture-handoff",
    "npm run check:live-smoke-capture-packets",
    "npm run check:live-smoke-capture-transition-review",
    "npm run check:live-smoke-ledger-update-review",
    "npm run check:live-smoke-evidence-ledger",
    "npm run check:current-release-readiness"
  ]) {
    expectIncludes(errors, value.next_release_slice?.followup_checks, check, `next_release_slice.followup_checks.${check}`);
  }

  for (const path of [
    value.tracker,
    value.todos,
    value.sprint_completion_audit_contract,
    value.sprint_exit_gate_transition_review_contract,
    value.mainline_publication_readiness_contract,
    ...(value.required_blocker_manifests ?? []).flatMap((manifest) => [
      manifest.path,
      manifest.next_packet_directory
    ])
  ].filter(Boolean)) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked path missing: ${path}`);
    }
  }

  for (const claim of [
    "credentialed_live_smoke_complete",
    "pr_created"
  ]) {
    expectIncludes(errors, value.not_claimed, claim, `not_claimed.${claim}`);
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};

  if (
    scripts["check:current-release-readiness"] !==
    "node scripts/check-current-release-readiness-contract.mjs"
  ) {
    errors.push("package.json scripts.check:current-release-readiness must run the readiness checker");
  }

  if (!String(scripts.check ?? "").includes("npm run check:current-release-readiness")) {
    errors.push("package.json scripts.check must include npm run check:current-release-readiness");
  }

  return errors;
}

function validateLinkedReadinessState({
  contract,
  mainlinePublicationReadiness,
  sprintCompletionAudit,
  sprintExitGateTransitionReview
}) {
  const errors = [];

  expectEqual(errors, sprintCompletionAudit.release_transition_allowed, false, "sprint_completion_audit.release_transition_allowed");
  expectEqual(errors, sprintCompletionAudit.all_sprints_complete, false, "sprint_completion_audit.all_sprints_complete");
  expectEqual(errors, sprintCompletionAudit.goal_complete, false, "sprint_completion_audit.goal_complete");
  expectEqual(
    errors,
    sprintCompletionAudit.checker,
    "scripts/check-sprint-completion-audit-contract.mjs",
    "sprint_completion_audit.checker"
  );

  expectEqual(errors, sprintExitGateTransitionReview.release_transition_allowed, false, "sprint_exit_gate_transition_review.release_transition_allowed");
  expectEqual(errors, sprintExitGateTransitionReview.all_sprint_exit_gates_complete, false, "sprint_exit_gate_transition_review.all_sprint_exit_gates_complete");
  expectEqual(errors, sprintExitGateTransitionReview.all_phase_exit_gates_complete, false, "sprint_exit_gate_transition_review.all_phase_exit_gates_complete");
  if (contract.large_module_completed_this_slice === true) {
    if ((sprintExitGateTransitionReview.sprint_completion_allowed_count ?? 0) < 1) {
      errors.push("large_module_completed_this_slice requires at least one sprint completion allowed");
    }
  }
  expectEqual(
    errors,
    sprintExitGateTransitionReview.sprint_completion_audit_contract,
    contract.sprint_completion_audit_contract,
    "sprint_exit_gate_transition_review.sprint_completion_audit_contract"
  );

  expectEqual(errors, mainlinePublicationReadiness.frontend_merge_required, false, "mainline_publication_readiness.frontend_merge_required");
  expectEqual(errors, mainlinePublicationReadiness.publish_performed, false, "mainline_publication_readiness.publish_performed");
  expectEqual(errors, mainlinePublicationReadiness.push_required_for_remote_ci, true, "mainline_publication_readiness.push_required_for_remote_ci");

  if (contract.pr_creation_allowed !== contract.large_module_completed_this_slice) {
    errors.push("pr_creation_allowed must track large_module_completed_this_slice");
  }

  return errors;
}

function validateBlockerManifestAlignment(value, sprintCompletionAudit) {
  const errors = [];
  const auditBlockers = new Map(
    (sprintCompletionAudit.completion_blocker_manifests ?? []).map((manifest) => [
      manifest.id,
      manifest
    ])
  );
  const checklistBlockers = new Map(
    (value.required_blocker_manifests ?? []).map((manifest) => [manifest.id, manifest])
  );

  expectArray(
    errors,
    [...checklistBlockers.keys()].sort(),
    [...auditBlockers.keys()].sort(),
    "required_blocker_manifests.ids"
  );

  for (const [id, manifest] of checklistBlockers) {
    const auditManifest = auditBlockers.get(id);

    if (auditManifest === undefined) {
      errors.push(`required blocker ${id} missing from sprint completion audit`);
      continue;
    }

    expectEqual(errors, manifest.path, auditManifest.path, `${id}.path`);

    const data = readJson(manifest.path);
    expectEqual(errors, data.status, manifest.expected_status, `${id}.status`);
    expectEqual(errors, data.release_transition_allowed, false, `${id}.release_transition_allowed`);
  }

  return errors;
}

function validateFragments(value, trackerText, todosText) {
  const errors = [];

  for (const fragment of value.required_tracker_fragments ?? []) {
    if (!trackerText.includes(fragment)) {
      errors.push(`tracker missing required fragment: ${fragment}`);
    }
  }

  for (const fragment of value.required_todos_fragments ?? []) {
    if (!todosText.includes(fragment)) {
      errors.push(`tasks/todos.md missing required fragment: ${fragment}`);
    }
  }

  return errors;
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
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
