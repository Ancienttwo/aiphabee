#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateSprint1LiveDataEvidencePackets } from "./check-sprint1-live-data-evidence-packets.mjs";

const contractPath = "deploy/governance/sprint1-live-data-transition-review.contract.json";
const manifestPath = "deploy/governance/sprint1-live-data-evidence-manifest.contract.json";
const activationPath = "deploy/governance/sprint1-live-data-activation.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.phase1.sprint1-live-data-transition-review.v0";
const expectedStatus = "pending_live_data_transition_review";
const checkerPath = "scripts/check-sprint1-live-data-transition-review-contract.mjs";
const fixtureCheckerPath = "scripts/check-sprint1-live-data-transition-review-fixtures.mjs";
const packetDirectoryPath = "deploy/governance/sprint1-live-data-evidence-packets";
const requiredGateIds = [
  "signed_partner_data_contract",
  "partner_serving_rows_loaded",
  "field_rights_policy_source_live",
  "hyperdrive_select_1_passed",
  "serving_sql_execution_enabled",
  "quality_owner_cutover_approved",
  "usage_event_live_write_passed",
  "usage_ledger_entry_live_write_passed",
  "billing_reconciliation_live_read_passed"
];
const requiredTruePolicies = [
  "accepted_evidence_packet_required",
  "manifest_gate_accepted_required",
  "activation_gate_accepted_required",
  "tracker_checkbox_change_requires_review",
  "sprint_exit_gate_change_requires_review",
  "accepted_evidence_packet_alone_never_completes_live_data",
  "hash_only_packet_validator_remains_source_of_truth"
];
const blockFlagMap = {
  billing_reconciliation_posting: "billing_reconciliation_posting_missing",
  live_serving_reads: "live_serving_reads_missing",
  live_serving_sql_execution: "live_serving_sql_execution_missing",
  live_usage_writes: "live_usage_writes_missing"
};

export {
  deriveSprint1LiveDataTransitionReview,
  validateSprint1LiveDataTransitionReview
};

function runCli() {
  const contract = readJson(contractPath);
  const manifest = readJson(manifestPath);
  const activation = readJson(activationPath);
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
  const packetResult = validateSprint1LiveDataEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });
  const transitionReview = deriveSprint1LiveDataTransitionReview({
    activation,
    manifest,
    packetResult
  });
  const errors = validateSprint1LiveDataTransitionReview({
    activation,
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
        status: "invalid_contract"
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

function deriveSprint1LiveDataTransitionReview({ activation, manifest, packetResult }) {
  const packetStatuses = packetResult?.packet_statuses ?? {};
  const manifestGateMap = new Map((manifest?.required_gates ?? []).map((gate) => [gate.id, gate]));
  const activationGateMap = new Map((activation?.activation_gates ?? []).map((gate) => [gate.id, gate]));
  const liveDataTransitionReviews = requiredGateIds.map((gateId) => {
    const manifestGate = manifestGateMap.get(gateId);
    const activationGate = activationGateMap.get(gateId);
    const packetStatus = packetStatuses[gateId] ?? "missing";
    const manifestGateStatus = manifestGate?.status ?? "missing";
    const activationGateStatus = activationGate?.status ?? "missing";
    const packetAccepted = packetStatus === "accepted";
    const manifestGateAccepted = manifestGateStatus === "accepted";
    const activationGateAccepted = activationGateStatus === "accepted";
    const completionAllowed = packetAccepted && manifestGateAccepted && activationGateAccepted;

    return {
      activation_gate_accepted: activationGateAccepted,
      activation_gate_status: activationGateStatus,
      blocking_conditions: completionAllowed
        ? []
        : deriveBlockingConditions({
            activation,
            activationGate,
            activationGateAccepted,
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
  const completionAllowedCount = liveDataTransitionReviews.filter((review) => review.completion_allowed).length;
  const allCompletionAllowed = completionAllowedCount === requiredGateIds.length;

  return {
    all_completion_allowed: allCompletionAllowed,
    all_live_data_gates_complete: allCompletionAllowed,
    completion_allowed_count: completionAllowedCount,
    global_blockers: deriveGlobalBlockers(activation),
    live_data_transition_reviews: liveDataTransitionReviews,
    release_transition_allowed: allCompletionAllowed
  };
}

function deriveBlockingConditions({
  activation,
  activationGate,
  activationGateAccepted,
  manifestGateAccepted,
  packetAccepted
}) {
  const conditions = [];

  if (!packetAccepted) {
    conditions.push("accepted_evidence_packet_missing");
  }
  if (!manifestGateAccepted) {
    conditions.push("manifest_gate_missing");
  }
  if (!activationGateAccepted) {
    conditions.push("activation_gate_missing");
  }

  for (const block of activationGate?.blocks ?? []) {
    if (activation?.[block] === false && blockFlagMap[block]) {
      conditions.push(blockFlagMap[block]);
    }
  }

  return [...new Set(conditions)];
}

function deriveGlobalBlockers(activation) {
  return Object.entries(blockFlagMap)
    .filter(([flag]) => activation?.[flag] === false)
    .map(([, blocker]) => blocker);
}

function validateSprint1LiveDataTransitionReview({
  activation,
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
  expectEqual(errors, contract.activation_contract, activationPath, "activation_contract");
  expectEqual(errors, contract.evidence_packet_directory, packetDirectoryPath, "evidence_packet_directory");
  expectEqual(errors, contract.tracker, trackerPath, "tracker");
  expectEqual(errors, contract.todos, todosPath, "todos");
  expectEqual(errors, contract.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, contract.all_live_data_gates_complete, false, "all_live_data_gates_complete");
  expectEqual(
    errors,
    contract.sprint1_1_live_data_checkbox_complete,
    false,
    "sprint1_1_live_data_checkbox_complete"
  );
  expectEqual(
    errors,
    contract.accepted_evidence_packets_are_sufficient_alone,
    false,
    "accepted_evidence_packets_are_sufficient_alone"
  );

  expectArray(errors, contract.required_gate_ids, requiredGateIds, "required_gate_ids");
  errors.push(...validateTransitionPolicy(contract.transition_policy));
  errors.push(...validateContractReviews(contract.live_data_transition_reviews, activation));
  errors.push(...validateLinkedFiles(contract));
  errors.push(...validateManifestLink(manifest));
  errors.push(...validateActivationLink(activation));
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

function validateContractReviews(value, activation) {
  if (!Array.isArray(value)) {
    return ["live_data_transition_reviews must be an array"];
  }

  const errors = [];
  const activationGateMap = new Map((activation?.activation_gates ?? []).map((gate) => [gate.id, gate]));

  for (const [index, gateId] of requiredGateIds.entries()) {
    const review = value[index];
    const activationGate = activationGateMap.get(gateId);

    if (!isRecord(review)) {
      errors.push(`live_data_transition_reviews[${index}] must be an object`);
      continue;
    }

    expectEqual(errors, review.gate_id, gateId, `live_data_transition_reviews[${index}].gate_id`);
    expectEqual(errors, review.tracker_status, "\u2610", `${gateId}.tracker_status`);
    expectEqual(errors, review.evidence_packet_required, true, `${gateId}.evidence_packet_required`);
    expectEqual(errors, review.linked_manifest_gate, gateId, `${gateId}.linked_manifest_gate`);
    expectEqual(errors, review.linked_activation_gate, gateId, `${gateId}.linked_activation_gate`);
    expectEqual(errors, review.packet_status, "missing", `${gateId}.packet_status`);
    expectEqual(errors, review.manifest_gate_status, "missing", `${gateId}.manifest_gate_status`);
    expectEqual(errors, review.activation_gate_status, "missing", `${gateId}.activation_gate_status`);
    expectEqual(errors, review.completion_allowed, false, `${gateId}.completion_allowed`);

    if (!Array.isArray(review.blocking_conditions)) {
      errors.push(`${gateId}.blocking_conditions must be an array`);
      continue;
    }

    for (const condition of deriveBlockingConditions({
      activation,
      activationGate,
      activationGateAccepted: false,
      manifestGateAccepted: false,
      packetAccepted: false
    })) {
      if (!review.blocking_conditions.includes(condition)) {
        errors.push(`${gateId}.blocking_conditions must include ${condition}`);
      }
    }
  }

  if (value.length !== requiredGateIds.length) {
    errors.push(`live_data_transition_reviews must contain ${requiredGateIds.length} entries`);
  }

  return errors;
}

function validateLinkedFiles(contract) {
  const paths = [
    contract.checker,
    contract.fixture_checker,
    contract.evidence_manifest_contract,
    contract.activation_contract,
    contract.evidence_packet_directory,
    contract.tracker,
    contract.todos
  ];

  return paths
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing ${path}`);
}

function validateManifestLink(value) {
  const errors = [];

  expectEqual(errors, value.transition_review_contract, contractPath, "manifest.transition_review_contract");
  expectEqual(errors, value.transition_review_checker, checkerPath, "manifest.transition_review_checker");
  expectEqual(
    errors,
    value.transition_review_fixture_checker,
    fixtureCheckerPath,
    "manifest.transition_review_fixture_checker"
  );

  if (value.evidence_policy?.accepted_evidence_packet_alone_never_completes_live_data !== true) {
    errors.push("manifest evidence policy must keep accepted_evidence_packet_alone_never_completes_live_data=true");
  }
  if (value.evidence_policy?.transition_review_cross_checks_activation_gates !== true) {
    errors.push("manifest evidence policy must keep transition_review_cross_checks_activation_gates=true");
  }
  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("live_data_transition_review_complete")) {
    errors.push("manifest not_claimed must include live_data_transition_review_complete");
  }

  return errors;
}

function validateActivationLink(value) {
  const errors = [];

  expectEqual(errors, value.transition_review_checker, checkerPath, "activation.transition_review_checker");
  expectEqual(
    errors,
    value.transition_review_fixture_checker,
    fixtureCheckerPath,
    "activation.transition_review_fixture_checker"
  );
  expectArray(errors, value.linked_transition_reviews, [contractPath], "activation.linked_transition_reviews");
  expectEqual(errors, value.release_transition_allowed, false, "activation.release_transition_allowed");

  for (const field of [
    "billing_reconciliation_posting",
    "live_serving_reads",
    "live_serving_sql_execution",
    "live_usage_writes"
  ]) {
    expectEqual(errors, value[field], false, `activation.${field}`);
  }

  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("live_data_transition_review_complete")) {
    errors.push("activation not_claimed must include live_data_transition_review_complete");
  }

  return errors;
}

function validatePackageScripts(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];
  const requiredScripts = {
    "check:sprint1-live-data-transition-review": `node ${checkerPath}`,
    "check:sprint1-live-data-transition-review-fixtures": `node ${fixtureCheckerPath}`
  };

  for (const [script, command] of Object.entries(requiredScripts)) {
    if (scripts[script] !== command) {
      errors.push(`package.json ${script} must be ${command}`);
    }
    if (!String(scripts.check ?? "").includes(`npm run ${script}`)) {
      errors.push(`root check must include ${script}`);
    }
  }

  return errors;
}

function validateTrackerAndTodos({ contract, todos, tracker }) {
  const errors = [];

  for (const text of contract.required_tracker_fragments ?? []) {
    if (!tracker.includes(text)) {
      errors.push(`tracker must mention ${text}`);
    }
  }

  for (const text of contract.required_todos_fragments ?? []) {
    if (!todos.includes(text)) {
      errors.push(`todos must mention ${text}`);
    }
  }

  if (!tracker.includes("- [ ] **Data Access Gateway live Serving**")) {
    errors.push("tracker must keep Data Access Gateway live Serving unchecked");
  }
  if (!tracker.includes("- [ ] **Usage ledger live writes + billing reconciliation**")) {
    errors.push("tracker must keep Usage ledger live writes unchecked");
  }

  return errors;
}

function validatePendingState({ contract, packetResult, transitionReview }) {
  const errors = [];

  if (packetResult.errors.length > 0) {
    errors.push(...packetResult.errors.map((error) => `evidence packet validator: ${error}`));
  }
  if (packetResult.all_required_accepted !== false) {
    errors.push("evidence packets are all accepted; update activation ledger and transition review before release can proceed");
  }
  if (transitionReview.release_transition_allowed !== contract.release_transition_allowed) {
    errors.push("derived release_transition_allowed must match contract");
  }
  if (transitionReview.all_live_data_gates_complete !== contract.all_live_data_gates_complete) {
    errors.push("derived all_live_data_gates_complete must match contract");
  }
  if (transitionReview.live_data_transition_reviews.some((review) => review.completion_allowed)) {
    errors.push("production live-data transition reviews must all remain blocked in current pending state");
  }

  return errors;
}

function validateNotClaimed(value) {
  if (!Array.isArray(value)) {
    return ["not_claimed must be an array"];
  }

  return [
    "partner_rows_loaded",
    "live_serving_reads_complete",
    "live_serving_sql_execution_complete",
    "live_usage_writes_complete",
    "billing_reconciliation_posted",
    "sprint1_1_live_data_complete",
    "sprint1_2_partner_source_rows_complete",
    "all_sprints_complete"
  ]
    .filter((claim) => !value.includes(claim))
    .map((claim) => `not_claimed must include ${claim}`);
}

function listPacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".evidence.json"))
    .map((entry) => ({
      path: join(absoluteDirectory, entry.name),
      relative: join(directory, entry.name)
    }))
    .sort((a, b) => a.relative.localeCompare(b.relative));
}

function expectArray(errors, actual, requiredValues, label) {
  if (!Array.isArray(actual) || actual.some((value) => typeof value !== "string")) {
    errors.push(`${label} must be a string array`);
    return;
  }

  for (const requiredValue of requiredValues) {
    if (!actual.includes(requiredValue)) {
      errors.push(`${label} must include ${requiredValue}`);
    }
  }
}

function expectEqual(errors, actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} must be ${JSON.stringify(expected)}`);
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

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
