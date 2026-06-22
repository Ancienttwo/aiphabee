#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validatePhase3SecurityLoadDrReleaseEvidencePackets } from "./check-phase3-security-load-dr-release-evidence-packets.mjs";

const contractPath = "deploy/governance/phase3-security-load-dr-release-transition-review.contract.json";
const manifestPath = "deploy/governance/phase3-security-load-dr-release-evidence-manifest.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.phase3.security-load-dr-release-transition-review.v0";
const expectedStatus = "pending_phase3_security_load_dr_release_transition_review";
const checkerPath = "scripts/check-phase3-security-load-dr-release-transition-review-contract.mjs";
const fixtureCheckerPath = "scripts/check-phase3-security-load-dr-release-transition-review-fixtures.mjs";
const packetDirectoryPath = "deploy/governance/phase3-security-load-dr-release-evidence-packets";
const requiredGateIds = [
  "compliance_legal_security_signoff",
  "live_kill_switch_incident_audit_evidence",
  "live_performance_availability_slo_evidence",
  "live_load_test_artifact",
  "live_dr_restore_failover_rollback_evidence",
  "live_incident_status_comms_drill_evidence",
  "ops_sre_product_release_signoff"
];
const requiredTruePolicies = [
  "accepted_evidence_packet_alone_never_completes_sprint3_3",
  "accepted_evidence_packet_required",
  "hash_only_packet_validator_remains_source_of_truth",
  "linked_release_gate_contracts_remain_blocked_until_live_evidence",
  "manifest_block_flags_clear_required",
  "manifest_gate_accepted_required",
  "sprint_exit_gate_change_requires_review",
  "tracker_checkbox_change_requires_review"
];
const blockFlagMap = {
  external_compliance_legal_signoff: "external_compliance_legal_signoff_missing",
  live_kill_switch_incident_audit: "live_kill_switch_incident_audit_missing",
  live_performance_availability_slo: "live_performance_availability_slo_missing",
  live_load_test: "live_load_test_missing",
  live_dr_restore_failover: "live_dr_restore_failover_missing",
  live_incident_status_comms: "live_incident_status_comms_missing",
  ops_sre_product_signoff: "ops_sre_product_signoff_missing"
};

if (isMainModule()) {
  runCli();
}

export {
  derivePhase3SecurityLoadDrReleaseTransitionReview,
  validatePhase3SecurityLoadDrReleaseTransitionReview
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
  const packetResult = validatePhase3SecurityLoadDrReleaseEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });
  const transitionReview = derivePhase3SecurityLoadDrReleaseTransitionReview({
    manifest,
    packetResult
  });
  const errors = validatePhase3SecurityLoadDrReleaseTransitionReview({
    contract,
    manifest,
    packageJson,
    packetResult,
    todos,
    tracker,
    transitionReview
  });

  if (errors.length > 0) {
    emit({ errors, path: contractPath, status: "invalid_contract", transition_review: transitionReview }, 1);
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

function derivePhase3SecurityLoadDrReleaseTransitionReview({ manifest, packetResult }) {
  const packetStatuses = packetResult?.packet_statuses ?? {};
  const manifestGateMap = new Map((manifest?.required_gates ?? []).map((gate) => [gate.id, gate]));
  const securityLoadDrTransitionReviews = requiredGateIds.map((gateId) => {
    const manifestGate = manifestGateMap.get(gateId);
    const packetStatus = packetStatuses[gateId] ?? "missing";
    const manifestGateStatus = manifestGate?.status ?? "missing";
    const packetAccepted = packetStatus === "accepted";
    const manifestGateAccepted = manifestGateStatus === "accepted";
    const blockFlagsClear = (manifestGate?.blocks ?? []).every((block) => manifest?.[block] === true);
    const completionAllowed = packetAccepted && manifestGateAccepted && blockFlagsClear;

    return {
      blocking_conditions: completionAllowed
        ? []
        : deriveBlockingConditions({ manifest, manifestGate, manifestGateAccepted, packetAccepted }),
      block_flags_clear: blockFlagsClear,
      completion_allowed: completionAllowed,
      gate_id: gateId,
      manifest_gate_status: manifestGateStatus,
      manifest_gate_accepted: manifestGateAccepted,
      packet_accepted: packetAccepted,
      packet_status: packetStatus
    };
  });
  const completionAllowedCount = securityLoadDrTransitionReviews.filter((review) => review.completion_allowed).length;
  const allCompletionAllowed = completionAllowedCount === requiredGateIds.length;

  return {
    all_completion_allowed: allCompletionAllowed,
    all_security_load_dr_gates_complete: allCompletionAllowed,
    completion_allowed_count: completionAllowedCount,
    global_blockers: deriveGlobalBlockers(manifest),
    release_transition_allowed: allCompletionAllowed,
    security_load_dr_transition_reviews: securityLoadDrTransitionReviews
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

function validatePhase3SecurityLoadDrReleaseTransitionReview({
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
  expectEqual(errors, contract.all_security_load_dr_gates_complete, false, "all_security_load_dr_gates_complete");
  expectEqual(errors, contract.sprint3_3_exit_gate_complete, false, "sprint3_3_exit_gate_complete");
  expectEqual(errors, contract.accepted_evidence_packets_are_sufficient_alone, false, "accepted_evidence_packets_are_sufficient_alone");
  expectArray(errors, contract.required_gate_ids, requiredGateIds, "required_gate_ids");

  errors.push(...validateTransitionPolicy(contract.transition_policy));
  errors.push(...validateContractReviews(contract.security_load_dr_transition_reviews, manifest));
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
    return ["security_load_dr_transition_reviews must be an array"];
  }

  const errors = [];
  const manifestGateMap = new Map((manifest?.required_gates ?? []).map((gate) => [gate.id, gate]));

  for (const [index, gateId] of requiredGateIds.entries()) {
    const review = value[index];
    const manifestGate = manifestGateMap.get(gateId);

    if (!isRecord(review)) {
      errors.push(`security_load_dr_transition_reviews[${index}] must be an object`);
      continue;
    }

    expectEqual(errors, review.gate_id, gateId, `security_load_dr_transition_reviews[${index}].gate_id`);
    expectEqual(errors, review.tracker_status, "☐", `${gateId}.tracker_status`);
    expectEqual(errors, review.evidence_packet_required, true, `${gateId}.evidence_packet_required`);
    expectEqual(errors, review.linked_manifest_gate, gateId, `${gateId}.linked_manifest_gate`);
    expectEqual(errors, review.packet_status, "missing", `${gateId}.packet_status`);
    expectEqual(errors, review.manifest_gate_status, manifestGate?.status ?? "missing", `${gateId}.manifest_gate_status`);
    expectEqual(errors, review.completion_allowed, false, `${gateId}.completion_allowed`);
    expectArray(
      errors,
      review.blocking_conditions,
      deriveBlockingConditions({
        manifest,
        manifestGate,
        manifestGateAccepted: false,
        packetAccepted: false
      }),
      `${gateId}.blocking_conditions`
    );
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
  expectEqual(errors, manifest.all_security_load_dr_gates_accepted, false, "manifest.all_security_load_dr_gates_accepted");

  return errors;
}

function validatePackageScripts(packageJson) {
  const errors = [];
  const scripts = packageJson?.scripts ?? {};
  const expected = {
    "check:phase3-security-load-dr-release-evidence-packets": "node scripts/check-phase3-security-load-dr-release-evidence-packets.mjs",
    "check:phase3-security-load-dr-release-transition-review": checkerPath,
    "check:phase3-security-load-dr-release-transition-review-fixtures": fixtureCheckerPath
  };

  for (const [name, command] of Object.entries(expected)) {
    const expectedCommand = command.startsWith("node ") ? command : `node ${command}`;
    if (scripts[name] !== expectedCommand) {
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

  expectEqual(errors, packetResult.all_required_accepted, false, "packet_result.all_required_accepted");
  expectEqual(errors, transitionReview.release_transition_allowed, contract.release_transition_allowed, "derived.release_transition_allowed");
  expectEqual(errors, transitionReview.all_security_load_dr_gates_complete, contract.all_security_load_dr_gates_complete, "derived.all_security_load_dr_gates_complete");
  expectEqual(errors, transitionReview.completion_allowed_count, 0, "derived.completion_allowed_count");
  expectArray(errors, transitionReview.global_blockers, contract.global_blockers, "derived.global_blockers");

  return errors;
}

function validateNotClaimed(values) {
  return [
    "all_sprints_complete",
    "external_compliance_legal_signoff",
    "live_load_test",
    "phase3_ga_complete",
    "sprint3_3_exit_gate_complete"
  ]
    .filter((claim) => !Array.isArray(values) || !values.includes(claim))
    .map((claim) => `not_claimed must include ${claim}`);
}

function listPacketFiles(directory) {
  return readdirSync(resolve(process.cwd(), directory))
    .filter((name) => name.endsWith(".evidence.json"))
    .sort()
    .map((name) => ({
      path: resolve(process.cwd(), directory, name),
      relative: join(directory, name)
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
