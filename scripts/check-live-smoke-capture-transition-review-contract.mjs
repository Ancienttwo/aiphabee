#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCapturePackets } from "./check-live-smoke-capture-packets.mjs";

const contractPath = "deploy/governance/live-smoke-capture-transition-review.contract.json";
const captureArtifactsPath = "deploy/governance/live-smoke-capture-artifacts.contract.json";
const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.goal.live-smoke-capture-transition-review.v0";
const expectedStatus = "pending_capture_transition_review";
const checkerPath = "scripts/check-live-smoke-capture-transition-review-contract.mjs";
const fixtureCheckerPath = "scripts/check-live-smoke-capture-transition-review-fixtures.mjs";
const requiredCaptureIds = [
  "cloudflare_resource_inventory",
  "cloudflare_bindings_functional",
  "ai_gateway_model_execution",
  "ai_gateway_observability",
  "observability_otlp_eval_store",
  "provider_secret_store_rotation"
];
const requiredTruePolicies = [
  "passed_capture_packet_required",
  "ledger_surface_passed_required",
  "tracker_checkbox_change_requires_review",
  "sprint_exit_gate_change_requires_review",
  "passed_capture_packet_alone_never_completes_live_smoke",
  "hash_only_capture_packet_validator_remains_source_of_truth"
];

export { deriveLiveSmokeCaptureTransitionReview, validateLiveSmokeCaptureTransitionReview };

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
  const transitionReview = deriveLiveSmokeCaptureTransitionReview({
    capturePacketResult,
    ledger
  });
  const errors = validateLiveSmokeCaptureTransitionReview({
    captureArtifacts,
    capturePacketResult,
    contract,
    ledger,
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
      completion_allowed_count: transitionReview.completion_allowed_count,
      release_transition_allowed: transitionReview.release_transition_allowed,
      status: "ok",
      transition_review: transitionReview,
      version: contract.version
    },
    0
  );
}

function deriveLiveSmokeCaptureTransitionReview({ capturePacketResult, ledger }) {
  const packetStatuses = capturePacketResult?.packet_statuses ?? {};
  const surfaceMap = new Map((ledger?.surfaces ?? []).map((surface) => [surface.id, surface]));
  const captureTransitionReviews = requiredCaptureIds.map((captureId) => {
    const surface = surfaceMap.get(captureId);
    const packetStatus = packetStatuses[captureId] ?? "missing";
    const ledgerSurfaceStatus = surface?.current_status ?? "missing";
    const packetPassed = packetStatus === "passed";
    const ledgerSurfacePassed = ledgerSurfaceStatus === "passed";
    const completionAllowed = packetPassed && ledgerSurfacePassed;

    return {
      blocking_conditions: completionAllowed ? [] : deriveBlockingConditions({ packetPassed, surface }),
      capture_id: captureId,
      completion_allowed: completionAllowed,
      ledger_surface_passed: ledgerSurfacePassed,
      ledger_surface_status: ledgerSurfaceStatus,
      packet_passed: packetPassed,
      packet_status: packetStatus
    };
  });
  const completionAllowedCount = captureTransitionReviews.filter((review) => review.completion_allowed).length;
  const allCompletionAllowed = completionAllowedCount === requiredCaptureIds.length;

  return {
    all_completion_allowed: allCompletionAllowed,
    all_live_smokes_passed: allCompletionAllowed,
    capture_transition_reviews: captureTransitionReviews,
    completion_allowed_count: completionAllowedCount,
    release_transition_allowed: allCompletionAllowed
  };
}

function deriveBlockingConditions({ packetPassed, surface }) {
  const conditions = [];

  if (!packetPassed) {
    conditions.push("passed_capture_packet_missing");
  }

  if (!isRecord(surface)) {
    conditions.push("ledger_surface_missing");
    return conditions;
  }

  if (surface.current_status !== "passed") {
    conditions.push(...(surface.missing_evidence ?? []));
  }

  return conditions;
}

function validateLiveSmokeCaptureTransitionReview({
  captureArtifacts,
  capturePacketResult,
  contract,
  ledger,
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

  if (contract.status !== expectedStatus) {
    errors.push(`status must be ${expectedStatus}`);
  }

  if (contract.checker !== checkerPath) {
    errors.push(`checker must be ${checkerPath}`);
  }

  if (contract.fixture_checker !== fixtureCheckerPath) {
    errors.push(`fixture_checker must be ${fixtureCheckerPath}`);
  }

  if (contract.capture_artifacts_contract !== captureArtifactsPath) {
    errors.push(`capture_artifacts_contract must be ${captureArtifactsPath}`);
  }

  if (contract.ledger_contract !== ledgerPath) {
    errors.push(`ledger_contract must be ${ledgerPath}`);
  }

  if (contract.capture_packet_directory !== "deploy/governance/live-smoke-capture-packets") {
    errors.push("capture_packet_directory must be deploy/governance/live-smoke-capture-packets");
  }

  if (contract.tracker !== trackerPath) {
    errors.push(`tracker must be ${trackerPath}`);
  }

  if (contract.todos !== todosPath) {
    errors.push(`todos must be ${todosPath}`);
  }

  if (contract.release_transition_allowed !== false) {
    errors.push("release_transition_allowed must remain false while capture transition review is pending");
  }

  if (contract.all_live_smokes_passed !== false) {
    errors.push("all_live_smokes_passed must remain false while capture transition review is pending");
  }

  if (contract.sprint0_4_live_smoke_checkbox_complete !== false) {
    errors.push("sprint0_4_live_smoke_checkbox_complete must remain false");
  }

  if (contract.passed_capture_packets_are_sufficient_alone !== false) {
    errors.push("passed_capture_packets_are_sufficient_alone must be false");
  }

  errors.push(...validateRequiredCaptureIds(contract.required_capture_ids));
  errors.push(...validateTransitionPolicy(contract.transition_policy));
  errors.push(...validateContractReviews(contract.capture_transition_reviews, ledger));
  errors.push(...validateLinkedFiles(contract));
  errors.push(...validatePackageScripts(packageJson));
  errors.push(...validateCaptureArtifacts(captureArtifacts));
  errors.push(...validateLedgerLink(ledger));
  errors.push(...validateTrackerAndTodos({ contract, todos, tracker }));
  errors.push(...validatePendingState({ capturePacketResult, contract, transitionReview }));
  errors.push(...validateNotClaimed(contract.not_claimed));

  return errors;
}

function validateRequiredCaptureIds(value) {
  if (!Array.isArray(value)) {
    return ["required_capture_ids must be an array"];
  }

  const errors = [];

  for (const [index, captureId] of requiredCaptureIds.entries()) {
    if (value[index] !== captureId) {
      errors.push(`required_capture_ids[${index}] must be ${captureId}`);
    }
  }

  if (value.length !== requiredCaptureIds.length) {
    errors.push(`required_capture_ids must contain ${requiredCaptureIds.length} entries`);
  }

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

function validateContractReviews(value, ledger) {
  if (!Array.isArray(value)) {
    return ["capture_transition_reviews must be an array"];
  }

  const errors = [];
  const surfaceMap = new Map((ledger.surfaces ?? []).map((surface) => [surface.id, surface]));

  for (const [index, captureId] of requiredCaptureIds.entries()) {
    const review = value[index];
    const surface = surfaceMap.get(captureId);

    if (!isRecord(review)) {
      errors.push(`capture_transition_reviews[${index}] must be an object`);
      continue;
    }

    if (review.capture_id !== captureId) {
      errors.push(`capture_transition_reviews[${index}].capture_id must be ${captureId}`);
    }

    if (review.tracker_status !== "☐") {
      errors.push(`${captureId}.tracker_status must remain unchecked`);
    }

    if (review.capture_packet_required !== true) {
      errors.push(`${captureId}.capture_packet_required must be true`);
    }

    if (review.completion_allowed !== false) {
      errors.push(`${captureId}.completion_allowed must remain false until packet and ledger surface both pass`);
    }

    if (review.linked_ledger_surface !== captureId) {
      errors.push(`${captureId}.linked_ledger_surface must match capture id`);
    }

    const expectedBlockingConditions = surface?.missing_evidence ?? [];
    if (!Array.isArray(review.blocking_conditions)) {
      errors.push(`${captureId}.blocking_conditions must be an array`);
    } else {
      for (const condition of expectedBlockingConditions) {
        if (!review.blocking_conditions.includes(condition)) {
          errors.push(`${captureId}.blocking_conditions must include ${condition}`);
        }
      }
    }
  }

  if (value.length !== requiredCaptureIds.length) {
    errors.push(`capture_transition_reviews must contain ${requiredCaptureIds.length} entries`);
  }

  return errors;
}

function validateLinkedFiles(contract) {
  const paths = [
    contract.checker,
    contract.fixture_checker,
    contract.capture_artifacts_contract,
    contract.ledger_contract,
    contract.capture_packet_directory,
    contract.tracker,
    contract.todos
  ];

  return paths
    .filter((path) => typeof path !== "string" || !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing ${path}`);
}

function validatePackageScripts(value) {
  const scripts = value?.scripts ?? {};
  const errors = [];
  const requiredScripts = {
    "check:live-smoke-capture-transition-review": `node ${checkerPath}`,
    "check:live-smoke-capture-transition-review-fixtures": `node ${fixtureCheckerPath}`
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

function validateCaptureArtifacts(value) {
  const errors = [];

  if (value.transition_review_checker !== checkerPath) {
    errors.push(`capture artifacts transition_review_checker must be ${checkerPath}`);
  }

  if (value.artifact_policy?.passed_capture_alone_never_unlocks_sprint !== true) {
    errors.push("capture artifacts policy must keep passed_capture_alone_never_unlocks_sprint=true");
  }

  if (value.artifact_policy?.ledger_transition_still_owned_by_live_smoke_evidence_ledger !== true) {
    errors.push("capture artifacts policy must keep ledger_transition_still_owned_by_live_smoke_evidence_ledger=true");
  }

  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("capture_transition_review_complete")) {
    errors.push("capture artifacts not_claimed must include capture_transition_review_complete");
  }

  return errors;
}

function validateLedgerLink(value) {
  const errors = [];

  if (!Array.isArray(value.linked_capture_transition_reviews)) {
    errors.push("ledger linked_capture_transition_reviews must be an array");
  } else if (!value.linked_capture_transition_reviews.includes(contractPath)) {
    errors.push(`ledger linked_capture_transition_reviews must include ${contractPath}`);
  }

  if (value.release_transition_allowed !== false) {
    errors.push("ledger release_transition_allowed must remain false");
  }

  if (value.all_live_smokes_passed !== false) {
    errors.push("ledger all_live_smokes_passed must remain false");
  }

  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("capture_transition_review_complete")) {
    errors.push("ledger not_claimed must include capture_transition_review_complete");
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

  if (!tracker.includes("- [ ] AI Gateway 接管模型调用日志/成本/限流/缓存/fallback")) {
    errors.push("tracker must keep AI Gateway live observability item unchecked");
  }

  return errors;
}

function validatePendingState({ capturePacketResult, contract, transitionReview }) {
  const errors = [];

  if (capturePacketResult.errors.length > 0) {
    errors.push(...capturePacketResult.errors.map((error) => `capture packet validator: ${error}`));
  }

  if (capturePacketResult.all_required_passed !== false) {
    errors.push("capture packets are all passed; update ledger and transition review before release can proceed");
  }

  if (transitionReview.release_transition_allowed !== contract.release_transition_allowed) {
    errors.push("derived release_transition_allowed must match contract");
  }

  if (transitionReview.all_live_smokes_passed !== contract.all_live_smokes_passed) {
    errors.push("derived all_live_smokes_passed must match contract");
  }

  if (transitionReview.capture_transition_reviews.some((review) => review.completion_allowed)) {
    errors.push("production capture transition reviews must all remain blocked in current pending state");
  }

  return errors;
}

function validateNotClaimed(value) {
  if (!Array.isArray(value)) {
    return ["not_claimed must be an array"];
  }

  return [
    "live_smoke_outputs_captured",
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

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
