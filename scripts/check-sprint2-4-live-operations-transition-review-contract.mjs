#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateSprint24LiveOperationsEvidencePackets } from "./check-sprint2-4-live-operations-evidence-packets.mjs";

const contractPath = "deploy/governance/sprint2-4-live-operations-transition-review.contract.json";
const manifestPath = "deploy/governance/sprint2-4-live-operations-evidence-manifest.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.phase2.sprint2-4-live-operations-transition-review.v0";
const expectedStatus = "pending_sprint2_4_live_operations_transition_review";
const checkerPath = "scripts/check-sprint2-4-live-operations-transition-review-contract.mjs";
const fixtureCheckerPath = "scripts/check-sprint2-4-live-operations-transition-review-fixtures.mjs";
const packetDirectoryPath = "deploy/governance/sprint2-4-live-operations-evidence-packets";
const requiredGateIds = [
  "live_billing_provider_contract",
  "subscription_lifecycle_live_writes",
  "invoice_proration_refund_preview_live",
  "usage_billing_reconciliation_live",
  "high_cost_reservation_predebit_refund_live",
  "workflow_task_live_execution_checkpoint",
  "deep_report_workflow_live_execution",
  "watchlist_alerts_live_fanout",
  "saved_screening_live_execution",
  "data_correction_live_fanout",
  "mcp_live_auth_credential_store",
  "kill_switch_live_flag_source",
  "frontend_billing_workflow_notification_ui"
];
const requiredTruePolicies = [
  "accepted_evidence_packet_required",
  "manifest_gate_accepted_required",
  "manifest_block_flags_clear_required",
  "tracker_checkbox_change_requires_review",
  "sprint_exit_gate_change_requires_review",
  "accepted_evidence_packet_alone_never_completes_sprint2_4",
  "hash_only_packet_validator_remains_source_of_truth"
];
const blockFlagMap = {
  frontend: "frontend_missing",
  live_billing_provider: "live_billing_provider_missing",
  live_billing_writes: "live_billing_writes_missing",
  live_flag_source: "live_flag_source_missing",
  live_mcp_auth_store: "live_mcp_auth_store_missing",
  live_notification_fanout: "live_notification_fanout_missing",
  live_workflow_execution: "live_workflow_execution_missing"
};

if (isMainModule()) {
  runCli();
}

export {
  deriveSprint24LiveOperationsTransitionReview,
  validateSprint24LiveOperationsTransitionReview
};

function runCli() {
  const contract = readJson(contractPath);
  const manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);
  const tracker = readText(trackerPath);
  const todos = readText(todosPath);
  const packetDirectoryExists = existsSync(resolve(process.cwd(), manifest.packet_directory ?? ""));
  const packetFiles = packetDirectoryExists
    ? listPacketFiles(manifest.packet_directory).map((file) => ({
        ...file,
        packet: readJson(file.path)
      }))
    : [];
  const packetResult = validateSprint24LiveOperationsEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });
  const transitionReview = deriveSprint24LiveOperationsTransitionReview({
    manifest,
    packetResult
  });
  const errors = validateSprint24LiveOperationsTransitionReview({
    contract,
    manifest,
    packageJson,
    packetResult,
    todos,
    tracker,
    transitionReview
  });

  if (errors.length > 0) {
    emit(
      {
        errors,
        path: contractPath,
        status: "invalid_contract",
        transition_review: transitionReview
      },
      1
    );
  }

  emit(
    {
      completion_allowed_count: transitionReview.completion_allowed_count,
      packet_result: {
        all_required_accepted: packetResult.all_required_accepted,
        packet_files: packetResult.packet_files,
        status: packetResult.status
      },
      release_transition_allowed: transitionReview.release_transition_allowed,
      status: "ok",
      transition_review: transitionReview,
      version: contract.version
    },
    0
  );
}

function deriveSprint24LiveOperationsTransitionReview({ manifest, packetResult }) {
  const packetStatuses = packetResult?.packet_statuses ?? {};
  const manifestGateMap = new Map((manifest?.required_gates ?? []).map((gate) => [gate.id, gate]));
  const liveOperationsTransitionReviews = requiredGateIds.map((gateId) => {
    const manifestGate = manifestGateMap.get(gateId);
    const packetStatus = packetStatuses[gateId] ?? "missing";
    const manifestGateStatus = manifestGate?.status ?? "missing";
    const packetAccepted = packetStatus === "accepted";
    const manifestGateAccepted = manifestGateStatus === "accepted";
    const blockFlagsClear = (manifestGate?.blocks ?? []).every((block) => manifest?.[block] === true);
    const completionAllowed = packetAccepted && manifestGateAccepted && blockFlagsClear;

    return {
      block_flags_clear: blockFlagsClear,
      blocking_conditions: completionAllowed
        ? []
        : deriveBlockingConditions({
            manifest,
            manifestGate,
            manifestGateAccepted,
            packetAccepted
          }),
      completion_allowed: completionAllowed,
      gate_id: gateId,
      manifest_gate_accepted: manifestGateAccepted,
      manifest_gate_status: manifestGateStatus,
      packet_accepted: packetAccepted,
      packet_status: packetStatus
    };
  });
  const completionAllowedCount = liveOperationsTransitionReviews.filter((review) => review.completion_allowed).length;
  const allCompletionAllowed = completionAllowedCount === requiredGateIds.length;

  return {
    all_completion_allowed: allCompletionAllowed,
    all_live_operations_gates_complete: allCompletionAllowed,
    completion_allowed_count: completionAllowedCount,
    global_blockers: deriveGlobalBlockers(manifest),
    live_operations_transition_reviews: liveOperationsTransitionReviews,
    release_transition_allowed: allCompletionAllowed
  };
}

function deriveBlockingConditions({ manifest, manifestGate, manifestGateAccepted, packetAccepted }) {
  const conditions = [];

  if (!packetAccepted) {
    conditions.push("accepted_evidence_packet_missing");
  }
  if (!manifestGateAccepted) {
    conditions.push("manifest_gate_missing");
  }
  for (const block of manifestGate?.blocks ?? []) {
    if (manifest?.[block] === false && blockFlagMap[block]) {
      conditions.push(blockFlagMap[block]);
    }
  }

  return [...new Set(conditions)];
}

function deriveGlobalBlockers(manifest) {
  return Object.entries(blockFlagMap)
    .filter(([flag]) => manifest?.[flag] === false)
    .map(([, blocker]) => blocker);
}

function validateSprint24LiveOperationsTransitionReview({
  contract,
  manifest,
  packageJson,
  packetResult,
  todos,
  tracker,
  transitionReview
}) {
  const errors = [];

  if (!isRecord(contract)) {
    return ["contract must be an object"];
  }

  expectEqual(errors, contract.version, expectedVersion, "version");
  expectEqual(errors, contract.status, expectedStatus, "status");
  expectEqual(errors, contract.checker, checkerPath, "checker");
  expectEqual(errors, contract.fixture_checker, fixtureCheckerPath, "fixture_checker");
  expectEqual(errors, contract.evidence_manifest_contract, manifestPath, "evidence_manifest_contract");
  expectEqual(errors, contract.evidence_packet_directory, packetDirectoryPath, "evidence_packet_directory");
  expectEqual(errors, contract.tracker, trackerPath, "tracker");
  expectEqual(errors, contract.todos, todosPath, "todos");
  expectEqual(errors, contract.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, contract.all_live_operations_gates_complete, false, "all_live_operations_gates_complete");
  expectEqual(errors, contract.sprint2_4_exit_gate_complete, false, "sprint2_4_exit_gate_complete");
  expectEqual(errors, contract.accepted_evidence_packets_are_sufficient_alone, false, "accepted_evidence_packets_are_sufficient_alone");
  expectArray(errors, contract.required_gate_ids, requiredGateIds, "required_gate_ids");

  errors.push(...validateTransitionPolicy(contract.transition_policy));
  errors.push(...validateContractReviews(contract.live_operations_transition_reviews, manifest));
  errors.push(...validateLinkedFiles(contract));
  errors.push(...validateManifestLink(manifest));
  errors.push(...validatePackageScripts(packageJson));
  errors.push(...validateTrackerAndTodos({ contract, todos, tracker }));
  errors.push(...validatePendingState({ contract, packetResult, transitionReview }));
  errors.push(...validateNotClaimed(contract.not_claimed));

  return errors;
}

function validateTransitionPolicy(value) {
  if (!isRecord(value)) {
    return ["transition_policy must be an object"];
  }

  return requiredTruePolicies
    .filter((policy) => value[policy] !== true)
    .map((policy) => `transition_policy.${policy} must be true`);
}

function validateContractReviews(value, manifest) {
  if (!Array.isArray(value)) {
    return ["live_operations_transition_reviews must be an array"];
  }

  const errors = [];
  const manifestGateMap = new Map((manifest?.required_gates ?? []).map((gate) => [gate.id, gate]));

  for (const [index, gateId] of requiredGateIds.entries()) {
    const review = value[index];
    const manifestGate = manifestGateMap.get(gateId);

    if (!isRecord(review)) {
      errors.push(`live_operations_transition_reviews[${index}] must be an object`);
      continue;
    }

    expectEqual(errors, review.gate_id, gateId, `live_operations_transition_reviews[${index}].gate_id`);
    expectEqual(errors, review.tracker_status, "☐", `${gateId}.tracker_status`);
    expectEqual(errors, review.evidence_packet_required, true, `${gateId}.evidence_packet_required`);
    expectEqual(errors, review.linked_manifest_gate, gateId, `${gateId}.linked_manifest_gate`);
    expectEqual(errors, review.packet_status, "missing", `${gateId}.packet_status`);
    expectEqual(errors, review.manifest_gate_status, "missing", `${gateId}.manifest_gate_status`);
    expectEqual(errors, review.completion_allowed, false, `${gateId}.completion_allowed`);
    if (!Array.isArray(review.blocking_conditions)) {
      errors.push(`${gateId}.blocking_conditions must be an array`);
      continue;
    }
    for (const condition of deriveBlockingConditions({
      manifest,
      manifestGate,
      manifestGateAccepted: false,
      packetAccepted: false
    })) {
      if (!review.blocking_conditions.includes(condition)) {
        errors.push(`${gateId}.blocking_conditions must include ${condition}`);
      }
    }
  }

  if (value.length !== requiredGateIds.length) {
    errors.push(`live_operations_transition_reviews must contain ${requiredGateIds.length} entries`);
  }

  return errors;
}

function validateLinkedFiles(contract) {
  const paths = [
    contract.checker,
    contract.fixture_checker,
    contract.evidence_manifest_contract,
    contract.evidence_packet_directory,
    contract.tracker,
    contract.todos
  ];

  return paths
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked path missing: ${path}`);
}

function validateManifestLink(manifest) {
  const errors = [];

  expectEqual(errors, manifest.transition_review_contract, contractPath, "manifest.transition_review_contract");
  expectEqual(errors, manifest.transition_review_checker, checkerPath, "manifest.transition_review_checker");
  expectEqual(errors, manifest.transition_review_fixture_checker, fixtureCheckerPath, "manifest.transition_review_fixture_checker");
  expectEqual(errors, manifest.release_transition_allowed, false, "manifest.release_transition_allowed");
  expectEqual(errors, manifest.all_live_operations_gates_accepted, false, "manifest.all_live_operations_gates_accepted");

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const expected = {
    "check:sprint2-4-live-operations-transition-review": `node ${checkerPath}`,
    "check:sprint2-4-live-operations-transition-review-fixtures": `node ${fixtureCheckerPath}`
  };

  for (const [name, command] of Object.entries(expected)) {
    if (scripts[name] !== command) {
      errors.push(`package.json ${name} script is missing`);
    }
    if (!String(scripts.check ?? "").includes(`npm run ${name}`)) {
      errors.push(`root check must include ${name}`);
    }
  }

  return errors;
}

function validateTrackerAndTodos({ contract, todos, tracker }) {
  const errors = [];

  for (const fragment of contract.required_tracker_fragments ?? []) {
    if (!tracker.includes(fragment)) {
      errors.push(`tracker missing required fragment: ${fragment}`);
    }
  }
  for (const fragment of contract.required_todos_fragments ?? []) {
    if (!todos.includes(fragment)) {
      errors.push(`tasks/todos.md missing required fragment: ${fragment}`);
    }
  }

  return errors;
}

function validatePendingState({ contract, packetResult, transitionReview }) {
  const errors = [];

  expectEqual(errors, packetResult.all_required_accepted, false, "packetResult.all_required_accepted");
  expectEqual(errors, transitionReview.release_transition_allowed, contract.release_transition_allowed, "derived.release_transition_allowed");
  expectEqual(errors, transitionReview.all_live_operations_gates_complete, contract.all_live_operations_gates_complete, "derived.all_live_operations_gates_complete");
  expectEqual(errors, transitionReview.completion_allowed_count, 0, "derived.completion_allowed_count");

  return errors;
}

function validateNotClaimed(value) {
  const errors = [];

  for (const claim of [
    "paid_billing_live",
    "workflow_execution_live",
    "mcp_live_auth_store",
    "frontend_billing_workflow_notification_ui",
    "release_transition_allowed",
    "sprint2_4_exit_gate_complete",
    "all_sprints_complete"
  ]) {
    if (!Array.isArray(value) || !value.includes(claim)) {
      errors.push(`not_claimed must include ${claim}`);
    }
  }

  return errors;
}

function listPacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".evidence.json"))
    .map((entry) => ({
      path: join(directory, entry.name),
      relative: join(directory, entry.name)
    }));
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMainModule() {
  return fileURLToPath(import.meta.url) === process.argv[1];
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    emit({ error: error instanceof Error ? error.message : String(error), path, status: "invalid_json" }, 1);
  }
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit({ error: error instanceof Error ? error.message : String(error), path, status: "missing_text" }, 1);
  }
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
