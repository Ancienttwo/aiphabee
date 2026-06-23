#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateCapturePackets } from "./check-live-smoke-capture-packets.mjs";
import { deriveLiveSmokeCaptureTransitionReview } from "./check-live-smoke-capture-transition-review-contract.mjs";

const contractPath = "deploy/governance/live-smoke-ledger-update-review.contract.json";
const captureArtifactsPath = "deploy/governance/live-smoke-capture-artifacts.contract.json";
const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const transitionReviewPath = "deploy/governance/live-smoke-capture-transition-review.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.goal.live-smoke-ledger-update-review.v0";
const requiredCaptureIds = [
  "cloudflare_resource_inventory",
  "cloudflare_bindings_functional",
  "ai_gateway_model_execution",
  "ai_gateway_observability",
  "observability_otlp_eval_store",
  "provider_secret_store_rotation"
];
const requiredTruePolicies = [
  "review_does_not_write_ledger",
  "passed_capture_packet_required_before_ledger_surface_passed",
  "ledger_surface_pass_requires_hash_only_evidence_refs",
  "packets_alone_do_not_unlock_release",
  "ledger_alone_without_packets_does_not_unlock_release",
  "capture_transition_review_remains_final_gate"
];

export { deriveLiveSmokeLedgerUpdateReview, validateLiveSmokeLedgerUpdateReview };

function runCli() {
  const contract = readJson(contractPath);
  const captureArtifacts = readJson(captureArtifactsPath);
  const ledger = readJson(ledgerPath);
  const packageJson = readJson(packagePath);
  const tracker = readText(trackerPath);
  const todos = readText(todosPath);
  const artifactDirectoryExists = existsSync(resolve(process.cwd(), captureArtifacts.artifact_directory ?? ""));
  const packetFiles = artifactDirectoryExists
    ? listPacketFiles(captureArtifacts.artifact_directory).map((file) => ({
        ...file,
        packet: readJson(file.path)
      }))
    : [];
  const capturePacketResult = validateCapturePackets({
    artifactDirectoryExists,
    contract: captureArtifacts,
    ledger,
    packageJson,
    packetFiles
  });
  const ledgerUpdateReview = deriveLiveSmokeLedgerUpdateReview({ capturePacketResult, ledger });
  const transitionReview = deriveLiveSmokeCaptureTransitionReview({ capturePacketResult, ledger });
  const errors = validateLiveSmokeLedgerUpdateReview({
    captureArtifacts,
    capturePacketResult,
    contract,
    ledger,
    ledgerUpdateReview,
    packageJson,
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
      capture_packet_result: {
        all_required_passed: capturePacketResult.all_required_passed,
        packet_files: capturePacketResult.packet_files,
        status: capturePacketResult.status
      },
      completion_allowed_count: ledgerUpdateReview.completion_allowed_count,
      ready_for_ledger_update_count: ledgerUpdateReview.ready_for_ledger_update_count,
      release_transition_allowed: ledgerUpdateReview.release_transition_allowed,
      status: "ok",
      version: contract.version
    },
    0
  );
}

function deriveLiveSmokeLedgerUpdateReview({ capturePacketResult, ledger }) {
  const packetStatuses = capturePacketResult?.packet_statuses ?? {};
  const surfaceMap = new Map((ledger?.surfaces ?? []).map((surface) => [surface.id, surface]));
  const ledgerUpdateReviews = requiredCaptureIds.map((captureId) => {
    const surface = surfaceMap.get(captureId);
    const packetStatus = packetStatuses[captureId] ?? "missing";
    const ledgerSurfaceStatus = surface?.current_status ?? "missing";
    const packetPassed = packetStatus === "passed";
    const ledgerSurfacePassed = ledgerSurfaceStatus === "passed";
    const readyForLedgerUpdate = packetPassed && !ledgerSurfacePassed;
    const completionAllowed = packetPassed && ledgerSurfacePassed;

    return {
      blocking_conditions: completionAllowed ? [] : deriveBlockingConditions({ ledgerSurfacePassed, packetPassed, surface }),
      capture_id: captureId,
      completion_allowed: completionAllowed,
      ledger_surface_status: ledgerSurfaceStatus,
      packet_status: packetStatus,
      ready_for_ledger_update: readyForLedgerUpdate
    };
  });
  const readyForLedgerUpdateCount = ledgerUpdateReviews.filter((review) => review.ready_for_ledger_update).length;
  const completionAllowedCount = ledgerUpdateReviews.filter((review) => review.completion_allowed).length;
  const releaseTransitionAllowed = completionAllowedCount === requiredCaptureIds.length;

  return {
    all_completion_allowed: releaseTransitionAllowed,
    all_live_smokes_passed: releaseTransitionAllowed,
    all_ready_for_ledger_update: readyForLedgerUpdateCount === requiredCaptureIds.length,
    completion_allowed_count: completionAllowedCount,
    ledger_update_reviews: ledgerUpdateReviews,
    ready_for_ledger_update_count: readyForLedgerUpdateCount,
    release_transition_allowed: releaseTransitionAllowed
  };
}

function deriveBlockingConditions({ ledgerSurfacePassed, packetPassed, surface }) {
  const conditions = [];

  if (!packetPassed) {
    conditions.push("passed_capture_packet_missing");
  }
  if (!surface) {
    conditions.push("ledger_surface_missing");
    return conditions;
  }
  if (ledgerSurfacePassed && !packetPassed) {
    conditions.push("ledger_surface_passed_without_packet");
  }
  if (!ledgerSurfacePassed) {
    conditions.push(...(surface.missing_evidence ?? []));
  }

  return conditions;
}

function validateLiveSmokeLedgerUpdateReview({
  captureArtifacts,
  capturePacketResult,
  contract,
  ledger,
  ledgerUpdateReview,
  packageJson,
  todos,
  tracker,
  transitionReview
}) {
  const errors = [];

  if (!isRecord(contract)) {
    return ["contract must be an object"];
  }

  if (contract.version !== expectedVersion) {
    errors.push(`version must be ${expectedVersion}`);
  }
  if (contract.status !== "pending_ledger_update_review") {
    errors.push("status must be pending_ledger_update_review");
  }
  if (contract.checker !== "scripts/check-live-smoke-ledger-update-review-contract.mjs") {
    errors.push("checker must be scripts/check-live-smoke-ledger-update-review-contract.mjs");
  }
  if (contract.fixture_checker !== "scripts/check-live-smoke-ledger-update-review-fixtures.mjs") {
    errors.push("fixture_checker must be scripts/check-live-smoke-ledger-update-review-fixtures.mjs");
  }
  if (contract.capture_artifacts_contract !== captureArtifactsPath) {
    errors.push(`capture_artifacts_contract must be ${captureArtifactsPath}`);
  }
  if (contract.ledger_contract !== ledgerPath) {
    errors.push(`ledger_contract must be ${ledgerPath}`);
  }
  if (contract.capture_transition_review_contract !== transitionReviewPath) {
    errors.push(`capture_transition_review_contract must be ${transitionReviewPath}`);
  }
  if (contract.capture_packet_directory !== "deploy/governance/live-smoke-capture-packets") {
    errors.push("capture_packet_directory must be deploy/governance/live-smoke-capture-packets");
  }
  if (contract.tracker !== trackerPath || contract.todos !== todosPath) {
    errors.push("tracker/todos paths must point to the canonical tracker and deferred ledger");
  }

  errors.push(...validateRequiredCaptureIds(contract.required_capture_ids));
  errors.push(...validateLedgerUpdatePolicy(contract.ledger_update_policy));
  errors.push(...validateLinkedFiles(contract));
  errors.push(...validatePackageScripts(packageJson));
  errors.push(...validateCaptureArtifacts(captureArtifacts));
  errors.push(...validateLedgerLink(ledger));
  errors.push(...validateContractReviews(contract.ledger_update_reviews, ledgerUpdateReview));
  errors.push(...validateCurrentPendingState({ capturePacketResult, contract, ledgerUpdateReview, transitionReview }));
  errors.push(...validateTrackerAndTodos({ contract, todos, tracker }));
  errors.push(...validateNotClaimed(contract.not_claimed));

  return errors;
}

function validateRequiredCaptureIds(value) {
  const errors = [];

  if (!Array.isArray(value) || value.length !== requiredCaptureIds.length) {
    return [`required_capture_ids must contain ${requiredCaptureIds.length} entries`];
  }
  for (const [index, id] of requiredCaptureIds.entries()) {
    if (value[index] !== id) {
      errors.push(`required_capture_ids[${index}] must be ${id}`);
    }
  }

  return errors;
}

function validateLedgerUpdatePolicy(value) {
  if (!isRecord(value)) {
    return ["ledger_update_policy must be an object"];
  }

  return requiredTruePolicies
    .filter((policy) => value[policy] !== true)
    .map((policy) => `ledger_update_policy.${policy} must be true`);
}

function validateLinkedFiles(contract) {
  return [
    contract.capture_artifacts_contract,
    contract.ledger_contract,
    contract.capture_transition_review_contract,
    contract.capture_packet_directory,
    contract.tracker,
    contract.todos
  ]
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked path missing: ${path}`);
}

function validatePackageScripts(packageJson) {
  const errors = [];
  const scripts = packageJson?.scripts ?? {};

  if (scripts["check:live-smoke-ledger-update-review"] !== "node scripts/check-live-smoke-ledger-update-review-contract.mjs") {
    errors.push("package.json check:live-smoke-ledger-update-review script is missing");
  }
  if (scripts["check:live-smoke-ledger-update-review-fixtures"] !== "node scripts/check-live-smoke-ledger-update-review-fixtures.mjs") {
    errors.push("package.json check:live-smoke-ledger-update-review-fixtures script is missing");
  }
  for (const check of [
    "npm run check:live-smoke-capture-packets",
    "npm run check:live-smoke-ledger-update-review",
    "npm run check:live-smoke-ledger-update-review-fixtures",
    "npm run check:live-smoke-capture-transition-review"
  ]) {
    if (!String(scripts.check ?? "").includes(check)) {
      errors.push(`root check must include ${check}`);
    }
  }

  return errors;
}

function validateCaptureArtifacts(captureArtifacts) {
  const errors = [];

  if (captureArtifacts.packet_checker !== "scripts/check-live-smoke-capture-packets.mjs") {
    errors.push("capture artifacts must keep packet checker as source of truth");
  }
  if (captureArtifacts.artifact_directory !== "deploy/governance/live-smoke-capture-packets") {
    errors.push("capture artifacts directory mismatch");
  }

  return errors;
}

function validateLedgerLink(ledger) {
  const errors = [];

  if (!Array.isArray(ledger.linked_capture_transition_reviews) || !ledger.linked_capture_transition_reviews.includes(transitionReviewPath)) {
    errors.push(`ledger linked_capture_transition_reviews must include ${transitionReviewPath}`);
  }
  if (!Array.isArray(ledger.linked_ledger_update_reviews) || !ledger.linked_ledger_update_reviews.includes(contractPath)) {
    errors.push(`ledger linked_ledger_update_reviews must include ${contractPath}`);
  }

  return errors;
}

function validateContractReviews(contractReviews, derivedReview) {
  const errors = [];

  if (!Array.isArray(contractReviews) || contractReviews.length !== requiredCaptureIds.length) {
    return [`ledger_update_reviews must contain ${requiredCaptureIds.length} entries`];
  }

  for (const [index, expectedId] of requiredCaptureIds.entries()) {
    const actual = contractReviews[index];
    const derived = derivedReview.ledger_update_reviews[index];

    if (!isRecord(actual)) {
      errors.push(`ledger_update_reviews[${index}] must be an object`);
      continue;
    }
    for (const key of [
      "capture_id",
      "packet_status",
      "ledger_surface_status",
      "ready_for_ledger_update",
      "completion_allowed"
    ]) {
      if (actual[key] !== derived[key]) {
        errors.push(`${expectedId}.${key} must match derived review`);
      }
    }
    if (!arraysEqual(actual.blocking_conditions, derived.blocking_conditions)) {
      errors.push(`${expectedId}.blocking_conditions must match derived review`);
    }
  }

  return errors;
}

function validateCurrentPendingState({ capturePacketResult, contract, ledgerUpdateReview, transitionReview }) {
  const errors = [];

  if (capturePacketResult.errors.length > 0) {
    errors.push(...capturePacketResult.errors.map((error) => `capture packet validator: ${error}`));
  }
  if (capturePacketResult.all_required_passed) {
    errors.push("capture packets are all passed; run ledger update review and update ledger before this pending contract can remain valid");
  }
  if (ledgerUpdateReview.release_transition_allowed !== contract.release_transition_allowed) {
    errors.push("derived release_transition_allowed must match contract");
  }
  if (ledgerUpdateReview.all_live_smokes_passed !== contract.all_live_smokes_passed) {
    errors.push("derived all_live_smokes_passed must match contract");
  }
  if (transitionReview.release_transition_allowed !== ledgerUpdateReview.release_transition_allowed) {
    errors.push("ledger update review must agree with capture transition review");
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
  if (!tracker.includes("| 0.4 | 工程地基（脚手架·CI·绑定） | 🟦 | 19 / 23 | ☐ |")) {
    errors.push("tracker must keep Sprint 0.4 row at 19 / 23 and unchecked");
  }

  return errors;
}

function validateNotClaimed(value) {
  if (!Array.isArray(value)) {
    return ["not_claimed must be an array"];
  }

  return [
    "live_smoke_outputs_captured",
    "ledger_surfaces_updated_to_passed",
    "all_live_smokes_passed",
    "release_transition_allowed",
    "sprint0_4_live_smoke_checkbox_complete",
    "all_sprints_complete"
  ]
    .filter((claim) => !value.includes(claim))
    .map((claim) => `not_claimed must include ${claim}`);
}

function listPacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => ({
      path: join(absoluteDirectory, entry.name),
      relative: join(directory, entry.name)
    }))
    .sort((a, b) => a.relative.localeCompare(b.relative));
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

function arraysEqual(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
