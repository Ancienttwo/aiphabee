#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const contractPath = "deploy/governance/sprint-exit-gate-transition-review.contract.json";
const packagePath = "package.json";
const expectedVersion = "2026-06-23.goal.sprint-exit-gate-transition-review.v0";
const expectedStatus = "pending_sprint_exit_gate_transition_review";
const checkerPath = "scripts/check-sprint-exit-gate-transition-review-contract.mjs";
const fixtureCheckerPath = "scripts/check-sprint-exit-gate-transition-review-fixtures.mjs";
const sprintCompletionAuditPath = "deploy/governance/sprint-completion-audit.contract.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedChangelog = "| 2026-06-23 | 1.0hr | 完成 `sprint-exit-gate-transition-review`";
const requiredSprintIds = [
  "0.1",
  "0.2",
  "0.3",
  "0.4",
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "2.1",
  "2.2",
  "2.3",
  "2.4",
  "3.1",
  "3.2",
  "3.3"
];
const requiredPhaseIds = ["0", "1", "2", "3"];
const requiredTruePolicies = [
  "backlog_row_complete_required",
  "completion_blocker_manifest_clear_required",
  "manual_blocking_conditions_must_be_empty",
  "phase_exit_gate_requires_child_sprints_complete",
  "tracker_exit_gate_change_requires_review",
  "backlog_count_alone_never_completes_sprint",
  "manual_blocking_conditions_require_owner_map"
];

if (isMainModule()) {
  runCli();
}

export {
  deriveSprintExitGateTransitionReview,
  validateSprintExitGateTransitionReview
};

function runCli() {
  const contract = readJson(contractPath);
  const packageJson = readJson(packagePath);
  const sprintCompletionAudit = readJson(contract.sprint_completion_audit_contract);
  const tracker = readText(contract.tracker);
  const todos = readText(contract.todos);
  const sprintRows = parseSprintRows(tracker);
  const phaseRows = parsePhaseRows(tracker);
  const blockerManifestStates = readBlockerManifestStates(sprintCompletionAudit);
  const transitionReview = deriveSprintExitGateTransitionReview({
    blockerManifestStates,
    phaseReviews: contract.phase_exit_gate_reviews,
    phaseRows,
    sprintReviews: contract.sprint_exit_gate_reviews,
    sprintRows
  });
  const errors = validateSprintExitGateTransitionReview({
    blockerManifestStates,
    contract,
    packageJson,
    phaseRows,
    sprintCompletionAudit,
    sprintRows,
    todos,
    tracker,
    transitionReview
  });

  if (errors.length > 0) {
    emit(
      {
        errors,
        path: contractPath,
        status: "invalid_sprint_exit_gate_transition_review",
        transition_review: transitionReview
      },
      1
    );
  }

  emit(
    {
      all_phase_exit_gates_complete: transitionReview.all_phase_exit_gates_complete,
      all_sprint_exit_gates_complete: transitionReview.all_sprint_exit_gates_complete,
      phase_completion_allowed_count: transitionReview.phase_completion_allowed_count,
      release_transition_allowed: transitionReview.release_transition_allowed,
      sprint_completion_allowed_count: transitionReview.sprint_completion_allowed_count,
      status: "ok",
      version: contract.version
    },
    0
  );
}

function deriveSprintExitGateTransitionReview({
  blockerManifestStates = {},
  phaseReviews = [],
  phaseRows = new Map(),
  sprintReviews = [],
  sprintRows = new Map()
}) {
  const sprintExitGateReviews = sprintReviews.map((review) => {
    const row = getMapValue(sprintRows, review.sprint_id) ?? {};
    const backlog = row.backlog ?? review.backlog;
    const backlogState = parseBacklog(backlog);
    const blockerManifestIds = review.blocker_manifest_ids ?? [];
    const requiredFrontendSurfaceIds = review.required_frontend_surface_ids ?? [];
    const manualBlockingConditions = review.manual_blocking_conditions ?? [];
    const blockerManifestsClear = blockerManifestIds.every((manifestId) =>
      isBlockerManifestClear({
        blockerManifestStates,
        manifestId,
        requiredFrontendSurfaceIds
      })
    );
    const completionAllowed =
      backlogState.complete &&
      blockerManifestsClear &&
      manualBlockingConditions.length === 0;

    return {
      backlog,
      backlog_complete: backlogState.complete,
      blocking_conditions: completionAllowed
        ? []
        : deriveBlockingConditions({
            backlogState,
            blockerManifestIds,
            blockerManifestStates,
            requiredFrontendSurfaceIds,
            manualBlockingConditions
          }),
      blocker_manifest_ids: blockerManifestIds,
      completion_allowed: completionAllowed,
      ...(requiredFrontendSurfaceIds.length > 0
        ? {
            frontend_surface_statuses: Object.fromEntries(
              requiredFrontendSurfaceIds.map((surfaceId) => [
                surfaceId,
                blockerManifestStates.frontend_release_evidence?.surface_statuses?.[surfaceId] ?? "missing_frontend_evidence"
              ])
            ),
            required_frontend_surface_ids: requiredFrontendSurfaceIds
          }
        : {}),
      manual_blocking_conditions: manualBlockingConditions,
      sprint_id: review.sprint_id,
      tracker_exit_gate: row.exitGate ?? review.tracker_exit_gate
    };
  });
  const sprintDecisionMap = new Map(
    sprintExitGateReviews.map((review) => [review.sprint_id, review])
  );
  const phaseExitGateReviews = phaseReviews.map((review) => {
    const row = getMapValue(phaseRows, review.phase_id) ?? {};
    const childSprintIds = review.child_sprint_ids ?? [];
    const blockerManifestIds = review.blocker_manifest_ids ?? [];
    const manualBlockingConditions = review.manual_blocking_conditions ?? [];
    const childSprintsClear = childSprintIds.every(
      (sprintId) => sprintDecisionMap.get(sprintId)?.completion_allowed === true
    );
    const blockerManifestsClear = blockerManifestIds.every(
      (manifestId) => blockerManifestStates[manifestId]?.release_transition_allowed === true
    );
    const completionAllowed =
      childSprintsClear &&
      blockerManifestsClear &&
      manualBlockingConditions.length === 0;

    return {
      blocking_conditions: completionAllowed
        ? []
        : derivePhaseBlockingConditions({
            blockerManifestIds,
            blockerManifestStates,
            childSprintIds,
            manualBlockingConditions,
            sprintDecisionMap
          }),
      blocker_manifest_ids: blockerManifestIds,
      child_sprint_ids: childSprintIds,
      completion_allowed: completionAllowed,
      manual_blocking_conditions: manualBlockingConditions,
      phase_id: review.phase_id,
      tracker_exit_gate: row.exitGate ?? review.tracker_exit_gate
    };
  });
  const sprintCompletionAllowedCount = sprintExitGateReviews.filter(
    (review) => review.completion_allowed
  ).length;
  const phaseCompletionAllowedCount = phaseExitGateReviews.filter(
    (review) => review.completion_allowed
  ).length;
  const allSprintExitGatesComplete = sprintCompletionAllowedCount === sprintExitGateReviews.length;
  const allPhaseExitGatesComplete = phaseCompletionAllowedCount === phaseExitGateReviews.length;

  return {
    all_phase_exit_gates_complete: allPhaseExitGatesComplete,
    all_sprint_exit_gates_complete: allSprintExitGatesComplete,
    phase_completion_allowed_count: phaseCompletionAllowedCount,
    phase_exit_gate_reviews: phaseExitGateReviews,
    release_transition_allowed: allSprintExitGatesComplete && allPhaseExitGatesComplete,
    sprint_completion_allowed_count: sprintCompletionAllowedCount,
    sprint_exit_gate_reviews: sprintExitGateReviews
  };
}

function validateSprintExitGateTransitionReview({
  blockerManifestStates,
  contract,
  packageJson,
  phaseRows,
  sprintCompletionAudit,
  sprintRows,
  todos,
  tracker,
  transitionReview
}) {
  const errors = [
    ...validateContract(contract),
    ...validatePackageScripts(packageJson),
    ...validateSprintCompletionAudit(contract, sprintCompletionAudit),
    ...validateLinkedBlockers(contract, blockerManifestStates),
    ...validateManualBlockerOwnerMap(contract, packageJson, blockerManifestStates),
    ...validateTrackerRows(contract, sprintRows, phaseRows, transitionReview),
    ...validateTrackerAndTodos(contract, tracker, todos),
    ...validatePendingState(contract, transitionReview)
  ];

  return errors;
}

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  expectEqual(errors, value.version, expectedVersion, "version");
  expectEqual(errors, value.status, expectedStatus, "status");
  expectEqual(errors, value.checker, checkerPath, "checker");
  expectEqual(errors, value.fixture_checker, fixtureCheckerPath, "fixture_checker");
  expectEqual(errors, value.sprint_completion_audit_contract, sprintCompletionAuditPath, "sprint_completion_audit_contract");
  expectEqual(errors, value.tracker, trackerPath, "tracker");
  expectEqual(errors, value.todos, todosPath, "todos");
  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, value.all_sprint_exit_gates_complete, false, "all_sprint_exit_gates_complete");
  expectEqual(errors, value.all_phase_exit_gates_complete, false, "all_phase_exit_gates_complete");
  expectEqual(errors, value.backlog_count_alone_never_completes_sprint, true, "backlog_count_alone_never_completes_sprint");
  expectEqual(errors, value.manual_blocker_owner_map_complete, true, "manual_blocker_owner_map_complete");
  expectArray(errors, value.required_sprint_ids, requiredSprintIds, "required_sprint_ids");
  expectArray(errors, value.required_phase_ids, requiredPhaseIds, "required_phase_ids");

  for (const key of requiredTruePolicies) {
    expectEqual(errors, value.transition_policy?.[key], true, `transition_policy.${key}`);
  }

  if (
    !Array.isArray(value.sprint_exit_gate_reviews) ||
    value.sprint_exit_gate_reviews.length !== requiredSprintIds.length
  ) {
    errors.push("sprint_exit_gate_reviews must contain 15 reviews");
  }

  if (
    !Array.isArray(value.phase_exit_gate_reviews) ||
    value.phase_exit_gate_reviews.length !== requiredPhaseIds.length
  ) {
    errors.push("phase_exit_gate_reviews must contain 4 reviews");
  }

  for (const id of requiredSprintIds) {
    const review = value.sprint_exit_gate_reviews?.find((item) => item.sprint_id === id);

    if (!review) {
      errors.push(`sprint_exit_gate_reviews missing Sprint ${id}`);
      continue;
    }

    if (typeof review.completion_allowed !== "boolean") {
      errors.push(`Sprint ${id}.completion_allowed must be boolean`);
    }
    expectEqual(
      errors,
      review.tracker_exit_gate,
      review.completion_allowed === true ? "☑" : "☐",
      `Sprint ${id}.tracker_exit_gate`
    );
    if (!Array.isArray(review.blocker_manifest_ids)) {
      errors.push(`Sprint ${id}.blocker_manifest_ids must be an array`);
    }
    if (review.required_frontend_surface_ids !== undefined) {
      if (!Array.isArray(review.required_frontend_surface_ids)) {
        errors.push(`Sprint ${id}.required_frontend_surface_ids must be an array`);
      } else if (!review.blocker_manifest_ids?.includes("frontend_release_evidence")) {
        errors.push(`Sprint ${id}.required_frontend_surface_ids requires frontend_release_evidence blocker manifest`);
      }
    }
    if (!Array.isArray(review.manual_blocking_conditions)) {
      errors.push(`Sprint ${id}.manual_blocking_conditions must be an array`);
    }
    if (review.completion_allowed === true) {
      expectArray(errors, review.blocking_conditions, [], `Sprint ${id}.blocking_conditions`);
      if (review.backlog_complete !== true) {
        errors.push(`Sprint ${id}.completion_allowed requires backlog_complete true`);
      }
    } else if (!Array.isArray(review.blocking_conditions) || review.blocking_conditions.length === 0) {
      errors.push(`Sprint ${id}.blocking_conditions must not be empty while blocked`);
    }
    if (review.backlog_complete === true && review.blocking_conditions?.includes("backlog_items_remaining")) {
      errors.push(`Sprint ${id}.blocking_conditions cannot use backlog_items_remaining when backlog is complete`);
    }
  }

  for (const id of requiredPhaseIds) {
    const review = value.phase_exit_gate_reviews?.find((item) => item.phase_id === id);

    if (!review) {
      errors.push(`phase_exit_gate_reviews missing Phase ${id}`);
      continue;
    }

    expectEqual(errors, review.tracker_exit_gate, "☐", `Phase ${id}.tracker_exit_gate`);
    expectEqual(errors, review.completion_allowed, false, `Phase ${id}.completion_allowed`);
    if (!Array.isArray(review.child_sprint_ids) || review.child_sprint_ids.length === 0) {
      errors.push(`Phase ${id}.child_sprint_ids must not be empty`);
    }
    if (!Array.isArray(review.blocking_conditions) || review.blocking_conditions.length === 0) {
      errors.push(`Phase ${id}.blocking_conditions must not be empty while blocked`);
    }
  }

  for (const claim of [
    "all_sprint_exit_gates_complete",
    "all_phase_exit_gates_complete",
    "release_transition_allowed",
    "all_sprints_complete",
    "goal_complete"
  ]) {
    expectIncludes(errors, value.not_claimed, claim, `not_claimed.${claim}`);
  }

  return errors;
}

function validateManualBlockerOwnerMap(contract, packageJson, blockerManifestStates) {
  const errors = [];
  const ownerMap = contract.manual_blocker_owner_map;
  const knownManifestIds = new Set(Object.keys(blockerManifestStates));
  const usedConditions = new Set();

  if (!isRecord(ownerMap)) {
    errors.push("manual_blocker_owner_map must be an object");
    return errors;
  }

  for (const review of [
    ...(contract.sprint_exit_gate_reviews ?? []),
    ...(contract.phase_exit_gate_reviews ?? [])
  ]) {
    for (const condition of review.manual_blocking_conditions ?? []) {
      usedConditions.add(condition);
      const entry = ownerMap[condition];
      const path = `manual_blocker_owner_map.${condition}`;

      if (!isRecord(entry)) {
        errors.push(`${path} must describe the manual blocker owner`);
        continue;
      }

      validateOwnerManifestIds({
        condition,
        entry,
        errors,
        knownManifestIds,
        path,
        review
      });
      validateOwnerCheckCommands({
        entry,
        errors,
        packageJson,
        path
      });
      validateClosureEvidenceRefs({
        entry,
        errors,
        path
      });
    }
  }

  for (const condition of Object.keys(ownerMap)) {
    if (!usedConditions.has(condition)) {
      errors.push(`manual_blocker_owner_map.${condition} is not referenced by any manual blocking condition`);
    }
  }

  return errors;
}

function validateOwnerManifestIds({
  condition,
  entry,
  errors,
  knownManifestIds,
  path,
  review
}) {
  if (!Array.isArray(entry.owner_manifest_ids) || entry.owner_manifest_ids.length === 0) {
    errors.push(`${path}.owner_manifest_ids must not be empty`);
    return;
  }

  const reviewManifestIds = new Set(review.blocker_manifest_ids ?? []);

  for (const manifestId of entry.owner_manifest_ids) {
    if (!knownManifestIds.has(manifestId)) {
      errors.push(`${path}.owner_manifest_ids references unknown blocker manifest ${manifestId}`);
    }
    if (!reviewManifestIds.has(manifestId)) {
      const reviewId = review.sprint_id ? `Sprint ${review.sprint_id}` : `Phase ${review.phase_id}`;
      errors.push(`${path}.owner_manifest_ids.${manifestId} must be listed on ${reviewId} blocker_manifest_ids for ${condition}`);
    }
  }
}

function validateOwnerCheckCommands({
  entry,
  errors,
  packageJson,
  path
}) {
  const scripts = packageJson?.scripts ?? {};

  if (!Array.isArray(entry.owner_check_commands) || entry.owner_check_commands.length === 0) {
    errors.push(`${path}.owner_check_commands must not be empty`);
    return;
  }

  for (const scriptName of entry.owner_check_commands) {
    if (typeof scriptName !== "string" || scripts[scriptName] === undefined) {
      errors.push(`${path}.owner_check_commands references missing package script ${scriptName}`);
      continue;
    }
    if (!String(scripts.check ?? "").includes(`npm run ${scriptName}`)) {
      errors.push(`${path}.owner_check_commands.${scriptName} must be included in root check`);
    }
  }
}

function validateClosureEvidenceRefs({
  entry,
  errors,
  path
}) {
  if (!Array.isArray(entry.closure_evidence_refs) || entry.closure_evidence_refs.length === 0) {
    errors.push(`${path}.closure_evidence_refs must not be empty`);
    return;
  }

  for (const ref of entry.closure_evidence_refs) {
    if (typeof ref !== "string" || ref.trim().length === 0) {
      errors.push(`${path}.closure_evidence_refs must contain non-empty strings`);
    }
  }
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};

  if (
    scripts["check:sprint-exit-gate-transition-review"] !==
    `node ${checkerPath}`
  ) {
    errors.push("package.json scripts.check:sprint-exit-gate-transition-review must run the checker");
  }
  if (
    scripts["check:sprint-exit-gate-transition-review-fixtures"] !==
    `node ${fixtureCheckerPath}`
  ) {
    errors.push("package.json scripts.check:sprint-exit-gate-transition-review-fixtures must run the fixture checker");
  }
  for (const scriptName of [
    "check:sprint-exit-gate-transition-review",
    "check:sprint-exit-gate-transition-review-fixtures"
  ]) {
    if (!String(scripts.check ?? "").includes(`npm run ${scriptName}`)) {
      errors.push(`package.json scripts.check must include npm run ${scriptName}`);
    }
  }

  return errors;
}

function validateSprintCompletionAudit(contract, audit) {
  const errors = [];

  expectEqual(errors, audit.status, "active_open_blocker_audit", "sprint_completion_audit.status");
  expectEqual(errors, audit.all_sprints_complete, false, "sprint_completion_audit.all_sprints_complete");
  expectEqual(errors, audit.release_transition_allowed, false, "sprint_completion_audit.release_transition_allowed");

  const linkedReview = audit.linked_transition_reviews?.find(
    (review) => review.path === contractPath
  );
  if (!linkedReview) {
    errors.push("sprint completion audit must link sprint exit gate transition review");
  } else {
    expectEqual(errors, linkedReview.expected_status, expectedStatus, "linked_transition_reviews.expected_status");
    expectEqual(errors, linkedReview.checker, checkerPath, "linked_transition_reviews.checker");
    expectEqual(errors, linkedReview.fixture_checker, fixtureCheckerPath, "linked_transition_reviews.fixture_checker");
  }

  for (const row of audit.expected_sprint_rows ?? []) {
    const review = contract.sprint_exit_gate_reviews?.find((item) => item.sprint_id === row.id);
    if (!review) {
      errors.push(`sprint completion audit row ${row.id} missing from sprint exit review`);
      continue;
    }
    expectEqual(errors, review.backlog, row.backlog, `Sprint ${row.id}.audit_backlog`);
    expectEqual(errors, review.tracker_exit_gate, row.exit_gate, `Sprint ${row.id}.audit_exit_gate`);
  }

  return errors;
}

function validateLinkedBlockers(contract, blockerManifestStates) {
  const errors = [];
  const knownIds = new Set(Object.keys(blockerManifestStates));

  for (const review of contract.sprint_exit_gate_reviews ?? []) {
    for (const manifestId of review.blocker_manifest_ids ?? []) {
      if (!knownIds.has(manifestId)) {
        errors.push(`Sprint ${review.sprint_id} references unknown blocker manifest ${manifestId}`);
      }
    }
  }

  for (const review of contract.phase_exit_gate_reviews ?? []) {
    for (const manifestId of review.blocker_manifest_ids ?? []) {
      if (!knownIds.has(manifestId)) {
        errors.push(`Phase ${review.phase_id} references unknown blocker manifest ${manifestId}`);
      }
    }
  }

  for (const [id, state] of Object.entries(blockerManifestStates)) {
    if (!existsSync(resolve(process.cwd(), state.path))) {
      errors.push(`blocker manifest path missing for ${id}: ${state.path}`);
    }
    expectEqual(errors, state.release_transition_allowed, false, `${id}.release_transition_allowed`);
  }

  return errors;
}

function validateTrackerRows(contract, sprintRows, phaseRows, transitionReview) {
  const errors = [];

  if (sprintRows.size !== requiredSprintIds.length) {
    errors.push(`tracker sprint table expected 15 rows but found ${sprintRows.size}`);
  }
  if (phaseRows.size < requiredPhaseIds.length) {
    errors.push(`tracker phase table expected at least 4 release phases but found ${phaseRows.size}`);
  }

  for (const expected of contract.sprint_exit_gate_reviews ?? []) {
    const actual = sprintRows.get(expected.sprint_id);
    const derived = transitionReview.sprint_exit_gate_reviews.find(
      (review) => review.sprint_id === expected.sprint_id
    );

    if (!actual) {
      errors.push(`tracker missing Sprint ${expected.sprint_id}`);
      continue;
    }

    expectEqual(errors, actual.backlog, expected.backlog, `Sprint ${expected.sprint_id}.tracker_backlog`);
    expectEqual(errors, actual.exitGate, expected.tracker_exit_gate, `Sprint ${expected.sprint_id}.tracker_exit_gate`);
    expectEqual(errors, derived?.backlog_complete, expected.backlog_complete, `Sprint ${expected.sprint_id}.derived_backlog_complete`);
    expectEqual(errors, derived?.completion_allowed, expected.completion_allowed, `Sprint ${expected.sprint_id}.derived_completion_allowed`);
    expectArray(
      errors,
      derived?.blocking_conditions,
      expected.blocking_conditions,
      `Sprint ${expected.sprint_id}.derived_blocking_conditions`
    );

    if (expected.backlog_complete === true && expected.completion_allowed === false) {
      const hasNonBacklogBlocker = expected.blocking_conditions?.some(
        (condition) => condition !== "backlog_items_remaining"
      );
      if (!hasNonBacklogBlocker) {
        errors.push(`Sprint ${expected.sprint_id} full backlog row must list non-backlog blockers`);
      }
    }
  }

  for (const expected of contract.phase_exit_gate_reviews ?? []) {
    const actual = phaseRows.get(expected.phase_id);
    const derived = transitionReview.phase_exit_gate_reviews.find(
      (review) => review.phase_id === expected.phase_id
    );

    if (!actual) {
      errors.push(`tracker missing Phase ${expected.phase_id}`);
      continue;
    }

    expectEqual(errors, actual.exitGate, expected.tracker_exit_gate, `Phase ${expected.phase_id}.tracker_exit_gate`);
    expectEqual(errors, derived?.completion_allowed, expected.completion_allowed, `Phase ${expected.phase_id}.derived_completion_allowed`);
    expectArray(
      errors,
      derived?.blocking_conditions,
      expected.blocking_conditions,
      `Phase ${expected.phase_id}.derived_blocking_conditions`
    );
  }

  return errors;
}

function validateTrackerAndTodos(contract, tracker, todos) {
  const errors = [];

  if (!tracker.includes(expectedChangelog)) {
    errors.push(`tracker changelog must include ${expectedChangelog}`);
  }

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

function validatePendingState(contract, transitionReview) {
  const errors = [];

  expectEqual(errors, transitionReview.release_transition_allowed, contract.release_transition_allowed, "derived.release_transition_allowed");
  expectEqual(errors, transitionReview.all_sprint_exit_gates_complete, contract.all_sprint_exit_gates_complete, "derived.all_sprint_exit_gates_complete");
  expectEqual(errors, transitionReview.all_phase_exit_gates_complete, contract.all_phase_exit_gates_complete, "derived.all_phase_exit_gates_complete");
  expectEqual(
    errors,
    transitionReview.sprint_completion_allowed_count,
    contract.sprint_completion_allowed_count ?? 0,
    "derived.sprint_completion_allowed_count"
  );
  expectEqual(
    errors,
    transitionReview.phase_completion_allowed_count,
    contract.phase_completion_allowed_count ?? 0,
    "derived.phase_completion_allowed_count"
  );

  return errors;
}

function deriveBlockingConditions({
  backlogState,
  blockerManifestIds,
  blockerManifestStates,
  requiredFrontendSurfaceIds = [],
  manualBlockingConditions
}) {
  const conditions = [];

  if (!backlogState.complete) {
    conditions.push(backlogState.parseError ? "backlog_parse_failed" : "backlog_items_remaining");
  }

  for (const manifestId of blockerManifestIds) {
    if (
      manifestId === "frontend_release_evidence" &&
      requiredFrontendSurfaceIds.length > 0
    ) {
      for (const surfaceId of requiredFrontendSurfaceIds) {
        if (blockerManifestStates.frontend_release_evidence?.surface_statuses?.[surfaceId] !== "accepted") {
          conditions.push(`frontend_surface:${surfaceId}`);
        }
      }
    } else if (blockerManifestStates[manifestId]?.release_transition_allowed !== true) {
      conditions.push(`blocker_manifest:${manifestId}`);
    }
  }

  conditions.push(...manualBlockingConditions);

  return [...new Set(conditions)];
}

function isBlockerManifestClear({
  blockerManifestStates,
  manifestId,
  requiredFrontendSurfaceIds
}) {
  if (
    manifestId === "frontend_release_evidence" &&
    requiredFrontendSurfaceIds.length > 0
  ) {
    return requiredFrontendSurfaceIds.every(
      (surfaceId) =>
        blockerManifestStates.frontend_release_evidence?.surface_statuses?.[surfaceId] === "accepted"
    );
  }

  return blockerManifestStates[manifestId]?.release_transition_allowed === true;
}

function derivePhaseBlockingConditions({
  blockerManifestIds,
  blockerManifestStates,
  childSprintIds,
  manualBlockingConditions,
  sprintDecisionMap
}) {
  const conditions = [];

  for (const sprintId of childSprintIds) {
    if (sprintDecisionMap.get(sprintId)?.completion_allowed !== true) {
      conditions.push(`child_sprint:${sprintId}`);
    }
  }

  for (const manifestId of blockerManifestIds) {
    if (blockerManifestStates[manifestId]?.release_transition_allowed !== true) {
      conditions.push(`blocker_manifest:${manifestId}`);
    }
  }

  conditions.push(...manualBlockingConditions);

  return [...new Set(conditions)];
}

function readBlockerManifestStates(audit) {
  const states = {};

  for (const manifest of audit.completion_blocker_manifests ?? []) {
    const data = readJson(manifest.path);
    states[manifest.id] = {
      path: manifest.path,
      release_transition_allowed: data.release_transition_allowed === true,
      ...(manifest.id === "frontend_release_evidence"
        ? {
            surface_statuses: readFrontendSurfaceStatuses(data)
          }
        : {}),
      status: data.status
    };
  }

  return states;
}

function readFrontendSurfaceStatuses(handoff) {
  const statuses = {};
  const packetDirectory = handoff.packet_directory;

  if (typeof packetDirectory !== "string") {
    return statuses;
  }

  const absoluteDirectory = resolve(process.cwd(), packetDirectory);
  if (!existsSync(absoluteDirectory)) {
    return statuses;
  }

  for (const file of readdirSync(absoluteDirectory).filter((name) => name.endsWith(".evidence.json")).sort()) {
    const packet = readJson(join(packetDirectory, file));
    if (isRecord(packet) && typeof packet.surface_id === "string") {
      statuses[packet.surface_id] = packet.status;
    }
  }

  return statuses;
}

function parseBacklog(value) {
  const match = String(value ?? "").trim().match(/^(\d+)\s*\/\s*(\d+)$/u);
  if (!match) {
    return { complete: false, parseError: true };
  }

  const completed = Number(match[1]);
  const total = Number(match[2]);

  return {
    complete: total > 0 && completed === total,
    completed,
    parseError: false,
    total
  };
}

function parseSprintRows(text) {
  const rows = new Map();

  for (const line of text.split("\n")) {
    const match = line.match(/^\|\s*(\d\.\d)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|$/u);
    if (!match || !requiredSprintIds.includes(match[1].trim())) {
      continue;
    }

    rows.set(match[1].trim(), {
      backlog: match[4].trim(),
      exitGate: match[5].trim(),
      status: match[3].trim(),
      topic: match[2].trim()
    });
  }

  return rows;
}

function parsePhaseRows(text) {
  const rows = new Map();

  for (const line of text.split("\n")) {
    const match = line.match(/^\|\s*([0-4])\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|$/u);
    if (!match || !requiredPhaseIds.includes(match[1].trim())) {
      continue;
    }

    rows.set(match[1].trim(), {
      childSprints: match[3].trim(),
      exitGate: match[5].trim(),
      name: match[2].trim(),
      status: match[4].trim()
    });
  }

  return rows;
}

function getMapValue(value, key) {
  if (value instanceof Map) {
    return value.get(key);
  }

  return value?.[key];
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual)) {
    errors.push(`${path} must be an array`);
    return;
  }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectIncludes(errors, values, expected, path) {
  if (!Array.isArray(values) || !values.includes(expected)) {
    errors.push(`${path} must include ${JSON.stringify(expected)}`);
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
        status: "missing_text"
      },
      1
    );
  }
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;

  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
