#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateGate0SignedEvidencePackets } from "./check-gate0-signed-evidence-packets.mjs";

const contractPath = "deploy/governance/gate0-signed-evidence-transition-review.contract.json";
const manifestPath = "deploy/governance/gate0-signed-evidence-manifest.contract.json";
const intakePath = "deploy/governance/gate0-external-evidence-intake.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.gate0-signed-evidence-transition-review.v0";
const expectedStatus = "pending_gate0_transition_review";
const checkerPath = "scripts/check-gate0-signed-evidence-transition-review-contract.mjs";
const fixtureCheckerPath = "scripts/check-gate0-signed-evidence-transition-review-fixtures.mjs";
const packetDirectoryPath = "deploy/governance/gate0-signed-evidence-packets";
const requiredPacketIds = [
  "field_rights_matrix",
  "hkex_vendor_licensing_memo",
  "type4_product_boundary_opinion",
  "pcpd_privacy_path_assessment",
  "commercial_settlement_schedule",
  "gate0_signature_register"
];
const packetSpecificBlockers = {
  commercial_settlement_schedule: "commercial_terms_missing",
  field_rights_matrix: "partner_signed_matrix_missing",
  gate0_signature_register: "gate0_signature_missing",
  hkex_vendor_licensing_memo: "partner_signed_matrix_missing",
  pcpd_privacy_path_assessment: "pcpd_path_missing",
  type4_product_boundary_opinion: "legal_opinion_missing"
};
const requiredCurrentGlobalBlockers = [
  "external_approvals_complete_missing",
  "partner_signed_matrix_missing",
  "legal_opinion_missing",
  "pcpd_path_missing",
  "commercial_terms_missing",
  "gate0_signature_missing",
  "manifest_external_approvals_incomplete",
  "manifest_release_transition_not_allowed"
];
const requiredTruePolicies = [
  "accepted_signed_evidence_packet_required",
  "manifest_packet_accepted_required",
  "intake_external_approval_required",
  "tracker_checkbox_change_requires_review",
  "sprint_exit_gate_change_requires_review",
  "accepted_packet_alone_never_completes_gate0",
  "hash_only_packet_validator_remains_source_of_truth",
  "default_deny_until_manifest_release_transition"
];

export { deriveGate0SignedEvidenceTransitionReview, validateGate0SignedEvidenceTransitionReview };

function runCli() {
  const contract = readJson(contractPath);
  const manifest = readJson(manifestPath);
  const intake = readJson(intakePath);
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
  const packetResult = validateGate0SignedEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists,
    packetFiles
  });
  const transitionReview = deriveGate0SignedEvidenceTransitionReview({
    intake,
    manifest,
    packetResult
  });
  const errors = validateGate0SignedEvidenceTransitionReview({
    contract,
    intake,
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

function deriveGate0SignedEvidenceTransitionReview({ intake, manifest, packetResult }) {
  const packetStatuses = packetResult?.packet_statuses ?? {};
  const manifestPacketMap = new Map((manifest?.required_packets ?? []).map((packet) => [packet.id, packet]));
  const intakePacketMap = new Map((intake?.required_evidence_packets ?? []).map((packet) => [packet.id, packet]));
  const globalBlockers = deriveGlobalBlockers({ intake, manifest });
  const reviews = requiredPacketIds.map((packetId) => {
    const packetStatus = packetStatuses[packetId] ?? "missing";
    const manifestPacketStatus = manifestPacketMap.get(packetId)?.status ?? "missing";
    const intakePacketStatus = intakePacketMap.get(packetId)?.status ?? "missing";
    const packetAccepted = packetStatus === "accepted";
    const manifestPacketAccepted = manifestPacketStatus === "accepted";
    const intakePacketApproved = intakePacketStatus === "accepted";
    const completionAllowed = packetAccepted && manifestPacketAccepted && intakePacketApproved;

    return {
      blocking_conditions: completionAllowed
        ? []
        : deriveBlockingConditions({
            intake,
            intakePacketApproved,
            manifestPacketAccepted,
            packetAccepted,
            packetId
          }),
      completion_allowed: completionAllowed,
      intake_packet_approved: intakePacketApproved,
      intake_packet_status: intakePacketStatus,
      linked_intake_packet: packetId,
      linked_manifest_packet: packetId,
      manifest_packet_accepted: manifestPacketAccepted,
      manifest_packet_status: manifestPacketStatus,
      packet_accepted: packetAccepted,
      packet_id: packetId,
      packet_status: packetStatus
    };
  });
  const completionAllowedCount = reviews.filter((review) => review.completion_allowed).length;
  const allCompletionAllowed = completionAllowedCount === requiredPacketIds.length;
  const releaseTransitionAllowed =
    allCompletionAllowed &&
    intake?.external_approvals_complete === true &&
    manifest?.external_approvals_complete === true &&
    manifest?.release_transition_allowed === true;

  return {
    all_completion_allowed: allCompletionAllowed,
    completion_allowed_count: completionAllowedCount,
    external_approvals_complete: releaseTransitionAllowed,
    gate0_transition_reviews: reviews,
    global_blockers: globalBlockers,
    release_transition_allowed: releaseTransitionAllowed
  };
}

function deriveBlockingConditions({
  intake,
  intakePacketApproved,
  manifestPacketAccepted,
  packetAccepted,
  packetId
}) {
  const conditions = [];

  if (!packetAccepted) {
    conditions.push("accepted_signed_evidence_packet_missing");
  }
  if (!manifestPacketAccepted) {
    conditions.push("manifest_packet_missing");
  }
  if (!intakePacketApproved) {
    conditions.push("intake_external_approval_missing");
  }

  const specificBlocker = packetSpecificBlockers[packetId];
  if (specificBlocker && intakeFlagForBlocker(intake, specificBlocker) === false) {
    conditions.push(specificBlocker);
  }

  return [...new Set(conditions)];
}

function deriveGlobalBlockers({ intake, manifest }) {
  const blockers = [];

  if (intake?.external_approvals_complete !== true) {
    blockers.push("external_approvals_complete_missing");
  }
  for (const blocker of [
    "partner_signed_matrix_missing",
    "legal_opinion_missing",
    "pcpd_path_missing",
    "commercial_terms_missing",
    "gate0_signature_missing"
  ]) {
    if (intakeFlagForBlocker(intake, blocker) === false) {
      blockers.push(blocker);
    }
  }
  if (manifest?.external_approvals_complete !== true) {
    blockers.push("manifest_external_approvals_incomplete");
  }
  if (manifest?.release_transition_allowed !== true) {
    blockers.push("manifest_release_transition_not_allowed");
  }

  return blockers;
}

function intakeFlagForBlocker(intake, blocker) {
  const fieldByBlocker = {
    commercial_terms_missing: "commercial_terms_signed",
    gate0_signature_missing: "gate0_signature_complete",
    legal_opinion_missing: "legal_opinion_received",
    partner_signed_matrix_missing: "partner_signed_matrix_loaded",
    pcpd_path_missing: "pcpd_path_approved"
  };
  const field = fieldByBlocker[blocker];

  return field ? intake?.[field] === true : undefined;
}

function validateGate0SignedEvidenceTransitionReview({
  contract,
  intake,
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
  expectEqual(errors, contract.signed_evidence_manifest_contract, manifestPath, "signed_evidence_manifest_contract");
  expectEqual(errors, contract.external_evidence_intake_contract, intakePath, "external_evidence_intake_contract");
  expectEqual(errors, contract.signed_evidence_packet_directory, packetDirectoryPath, "signed_evidence_packet_directory");
  expectEqual(errors, contract.tracker, trackerPath, "tracker");
  expectEqual(errors, contract.todos, todosPath, "todos");
  expectEqual(errors, contract.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, contract.external_approvals_complete, false, "external_approvals_complete");
  expectEqual(
    errors,
    contract.sprint0_1_external_approval_checkbox_complete,
    false,
    "sprint0_1_external_approval_checkbox_complete"
  );
  expectEqual(errors, contract.accepted_packets_are_sufficient_alone, false, "accepted_packets_are_sufficient_alone");
  expectArray(errors, contract.required_packet_ids, requiredPacketIds, "required_packet_ids");
  expectArray(errors, contract.global_blockers, requiredCurrentGlobalBlockers, "global_blockers");

  errors.push(...validateTransitionPolicy(contract.transition_policy));
  errors.push(...validateContractReviews(contract.gate0_transition_reviews, intake));
  errors.push(...validateLinkedFiles(contract));
  errors.push(...validateManifestLink(manifest));
  errors.push(...validateIntakeLink(intake));
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

function validateContractReviews(value, intake) {
  if (!Array.isArray(value)) {
    return ["gate0_transition_reviews must be an array"];
  }

  const errors = [];
  const intakePacketMap = new Map((intake?.required_evidence_packets ?? []).map((packet) => [packet.id, packet]));

  for (const [index, packetId] of requiredPacketIds.entries()) {
    const review = value[index];
    const intakePacket = intakePacketMap.get(packetId);

    if (!isRecord(review)) {
      errors.push(`gate0_transition_reviews[${index}] must be an object`);
      continue;
    }

    expectEqual(errors, review.packet_id, packetId, `gate0_transition_reviews[${index}].packet_id`);
    expectEqual(errors, review.tracker_status, "☐", `${packetId}.tracker_status`);
    expectEqual(errors, review.signed_evidence_packet_required, true, `${packetId}.signed_evidence_packet_required`);
    expectEqual(errors, review.linked_manifest_packet, packetId, `${packetId}.linked_manifest_packet`);
    expectEqual(errors, review.linked_intake_packet, packetId, `${packetId}.linked_intake_packet`);
    expectEqual(errors, review.packet_status, "missing", `${packetId}.packet_status`);
    expectEqual(errors, review.manifest_packet_status, "missing", `${packetId}.manifest_packet_status`);
    expectEqual(errors, review.intake_packet_status, "pending_external", `${packetId}.intake_packet_status`);
    expectEqual(errors, review.completion_allowed, false, `${packetId}.completion_allowed`);

    if (intakePacket?.status !== "pending_external") {
      errors.push(`${packetId}.intake packet must remain pending_external in current contract`);
    }

    const expectedBlockingConditions = deriveBlockingConditions({
      intake,
      intakePacketApproved: false,
      manifestPacketAccepted: false,
      packetAccepted: false,
      packetId
    });
    expectArray(errors, review.blocking_conditions, expectedBlockingConditions, `${packetId}.blocking_conditions`);
  }

  if (value.length !== requiredPacketIds.length) {
    errors.push(`gate0_transition_reviews must contain ${requiredPacketIds.length} entries`);
  }

  return errors;
}

function validateLinkedFiles(contract) {
  const paths = [
    contract.checker,
    contract.fixture_checker,
    contract.signed_evidence_manifest_contract,
    contract.external_evidence_intake_contract,
    contract.signed_evidence_packet_directory,
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
  expectEqual(
    errors,
    value.completion_policy?.transition_review_cross_checks_intake_and_manifest,
    true,
    "manifest.completion_policy.transition_review_cross_checks_intake_and_manifest"
  );
  expectEqual(
    errors,
    value.completion_policy?.accepted_packet_alone_never_completes_gate0,
    true,
    "manifest.completion_policy.accepted_packet_alone_never_completes_gate0"
  );

  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("gate0_transition_review_complete")) {
    errors.push("manifest not_claimed must include gate0_transition_review_complete");
  }

  return errors;
}

function validateIntakeLink(value) {
  const errors = [];

  if (!Array.isArray(value.linked_contracts) || !value.linked_contracts.includes(contractPath)) {
    errors.push(`intake linked_contracts must include ${contractPath}`);
  }

  for (const field of [
    "commercial_terms_signed",
    "external_approvals_complete",
    "gate0_signature_complete",
    "legal_opinion_received",
    "partner_signed_matrix_loaded",
    "pcpd_path_approved"
  ]) {
    expectEqual(errors, value[field], false, `intake.${field}`);
  }

  return errors;
}

function validatePackageScripts(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];
  const requiredScripts = {
    "check:gate0-signed-evidence-transition-review": `node ${checkerPath}`,
    "check:gate0-signed-evidence-transition-review-fixtures": `node ${fixtureCheckerPath}`
  };

  for (const [script, command] of Object.entries(requiredScripts)) {
    expectEqual(errors, scripts[script], command, `package.json ${script}`);

    if (!String(scripts.check ?? "").includes(`npm run ${script}`)) {
      errors.push(`root check must include ${script}`);
    }
  }

  return errors;
}

function validateTrackerAndTodos({ contract, todos, tracker }) {
  const errors = [];

  for (const fragment of contract.required_tracker_fragments ?? []) {
    if (!tracker.includes(fragment)) {
      errors.push(`tracker must mention ${fragment}`);
    }
  }

  for (const fragment of contract.required_todos_fragments ?? []) {
    if (!todos.includes(fragment)) {
      errors.push(`todos must mention ${fragment}`);
    }
  }

  if (!tracker.includes("| 0.1 | 法务·授权·监管 Gate | 🟦 | 2 / 8 | ☐ |")) {
    errors.push("tracker must keep Sprint 0.1 row at 2 / 8 and unchecked");
  }
  if (!tracker.includes("Sprint 0.1 的外部权利矩阵")) {
    errors.push("tracker must keep Sprint 0.1 external evidence summary open");
  }

  return errors;
}

function validatePendingState({ contract, packetResult, transitionReview }) {
  const errors = [];

  if (packetResult.errors.length > 0) {
    errors.push(...packetResult.errors.map((error) => `signed evidence packet validator: ${error}`));
  }
  if (packetResult.all_required_accepted !== false) {
    errors.push("signed evidence packets are all accepted; update manifest/intake and transition review before release can proceed");
  }
  expectEqual(
    errors,
    transitionReview.release_transition_allowed,
    contract.release_transition_allowed,
    "derived.release_transition_allowed"
  );
  expectEqual(
    errors,
    transitionReview.external_approvals_complete,
    contract.external_approvals_complete,
    "derived.external_approvals_complete"
  );
  expectArray(errors, transitionReview.global_blockers, requiredCurrentGlobalBlockers, "derived.global_blockers");

  if (transitionReview.gate0_transition_reviews.some((review) => review.completion_allowed)) {
    errors.push("production Gate0 transition reviews must all remain blocked in current pending state");
  }

  return errors;
}

function validateNotClaimed(value) {
  if (!Array.isArray(value)) {
    return ["not_claimed must be an array"];
  }

  return [
    "external_approvals_complete",
    "sprint0_1_external_approvals_complete",
    "phase0_gate_complete",
    "field_rights_matrix_signed",
    "type4_written_opinion",
    "pcpd_approval",
    "commercial_terms_signed",
    "gate0_decision_signed",
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

function expectEqual(errors, actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, label) {
  if (!Array.isArray(actual)) {
    errors.push(`${label} expected array`);
    return;
  }

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${label} mismatch: expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
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
