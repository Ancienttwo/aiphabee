#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/sprint-completion-audit.contract.json";
const packageJsonPath = "package.json";
const expectedChangelog = "| 2026-06-23 | 1.0hd | 完成 `sprint-completion-audit`";

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const tracker = readText(contract.tracker);
const todos = readText(contract.todos);
const errors = [
  ...validateContract(contract),
  ...validatePackageScripts(packageJson),
  ...validateSprintRows(contract, tracker),
  ...validateFragments(contract, tracker, todos),
  ...validateManifestBlockers(contract, packageJson),
  ...validateBlockerCoverage(contract),
  ...validateLinkedTransitionReviews(contract, packageJson),
  ...validateChangelog(tracker)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_sprint_completion_audit"
    },
    1
  );
}

emit(
  {
    all_sprints_complete: false,
    blocker_manifests: contract.completion_blocker_manifests.length,
    completed_sprints: (contract.completed_sprint_ids ?? []).length,
    open_sprints: contract.expected_sprint_rows.filter((row) => row.exit_gate === "☐").length,
    status: "ok",
    version: contract.version
  },
  0
);

function validateContract(value) {
  const errors = [];

  expectEqual(
    errors,
    value.version,
    "2026-06-23.goal.sprint-completion-audit.v0",
    "version"
  );
  expectEqual(errors, value.status, "active_open_blocker_audit", "status");
  expectEqual(errors, value.checker, "scripts/check-sprint-completion-audit-contract.mjs", "checker");
  expectEqual(errors, value.tracker, "docs/AiphaBee_Sprint_Tracker_v1.0.md", "tracker");
  expectEqual(errors, value.todos, "tasks/todos.md", "todos");

  [
    "all_sprints_complete",
    "goal_complete",
    "release_transition_allowed"
  ].forEach((flag) => expectEqual(errors, value[flag], false, flag));

  [
    "external_evidence_required",
    "frontend_delegated",
    "live_credentials_required"
  ].forEach((flag) => expectEqual(errors, value[flag], true, flag));

  if (!Array.isArray(value.expected_sprint_rows) || value.expected_sprint_rows.length !== 15) {
    errors.push("expected_sprint_rows must contain 15 sprint rows");
  }

  if (
    !Array.isArray(value.completion_blocker_manifests) ||
    value.completion_blocker_manifests.length !== 8
  ) {
    errors.push("completion_blocker_manifests must contain 8 blocker manifests");
  }

  for (const path of [
    value.tracker,
    value.todos,
    ...(value.linked_transition_reviews ?? []).flatMap((transitionReview) => [
      transitionReview.path,
      transitionReview.checker,
      transitionReview.fixture_checker
    ]),
    ...(value.completion_blocker_manifests ?? []).flatMap((manifest) => [
      manifest.path,
      ...(manifest.transition_reviews ?? []).flatMap((transitionReview) => [
        transitionReview.path,
        transitionReview.checker,
        transitionReview.fixture_checker
      ])
    ])
  ]) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked path missing: ${path}`);
    }
  }

  return errors;
}

function validateLinkedTransitionReviews(value, packageJson) {
  const errors = [];

  if (!Array.isArray(value.linked_transition_reviews) || value.linked_transition_reviews.length !== 1) {
    errors.push("linked_transition_reviews must contain sprint exit gate transition review");
    return errors;
  }

  for (const transitionReview of value.linked_transition_reviews) {
    const transition = readJson(transitionReview.path);
    const transitionPath = `linked_transition_reviews.${transitionReview.path}`;

    expectEqual(errors, transition.status, transitionReview.expected_status, `${transitionPath}.status`);
    expectEqual(errors, transition.release_transition_allowed, false, `${transitionPath}.release_transition_allowed`);
    expectEqual(errors, transition.checker, transitionReview.checker, `${transitionPath}.checker`);
    expectEqual(errors, transition.fixture_checker, transitionReview.fixture_checker, `${transitionPath}.fixture_checker`);
    expectEqual(errors, transition.sprint_completion_audit_contract, contractPath, `${transitionPath}.sprint_completion_audit_contract`);
    expectIncludes(errors, transition.not_claimed, "all_sprints_complete", `${transitionPath}.not_claimed.all_sprints_complete`);
    validatePackageCommandForScript(errors, packageJson, transitionReview.checker, transitionPath);
    validatePackageCommandForScript(errors, packageJson, transitionReview.fixture_checker, transitionPath);
  }

  return errors;
}

function validateBlockerCoverage(value) {
  const errors = [];
  const sprintExitReview = value.linked_transition_reviews?.find(
    (review) => review.path === "deploy/governance/sprint-exit-gate-transition-review.contract.json"
  );

  if (!sprintExitReview) {
    errors.push("blocker coverage requires sprint exit gate transition review");
    return errors;
  }

  const transition = readJson(sprintExitReview.path);
  const expectedBlocksByManifest = deriveBlocksByManifest(transition);

  for (const manifest of value.completion_blocker_manifests ?? []) {
    const expectedBlocks = expectedBlocksByManifest.get(manifest.id) ?? [];
    expectArray(errors, manifest.blocks ?? [], expectedBlocks, `${manifest.id}.blocks`);
  }

  for (const manifestId of expectedBlocksByManifest.keys()) {
    if (!(value.completion_blocker_manifests ?? []).some((manifest) => manifest.id === manifestId)) {
      errors.push(`sprint exit gate references unknown audit blocker manifest ${manifestId}`);
    }
  }

  return errors;
}

function deriveBlocksByManifest(transition) {
  const blocksByManifest = new Map();

  for (const review of transition.sprint_exit_gate_reviews ?? []) {
    for (const manifestId of review.blocker_manifest_ids ?? []) {
      addBlock(blocksByManifest, manifestId, `Sprint ${review.sprint_id}`);
    }
  }

  for (const review of transition.phase_exit_gate_reviews ?? []) {
    for (const manifestId of review.blocker_manifest_ids ?? []) {
      addBlock(blocksByManifest, manifestId, `Phase ${review.phase_id}`);
    }
  }

  return blocksByManifest;
}

function addBlock(blocksByManifest, manifestId, block) {
  const blocks = blocksByManifest.get(manifestId) ?? [];

  if (!blocks.includes(block)) {
    blocks.push(block);
  }

  blocksByManifest.set(manifestId, blocks);
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};

  if (
    scripts["check:sprint-completion-audit"] !==
    "node scripts/check-sprint-completion-audit-contract.mjs"
  ) {
    errors.push("package.json scripts.check:sprint-completion-audit must run the audit checker");
  }

  if (!String(scripts.check ?? "").includes("npm run check:sprint-completion-audit")) {
    errors.push("package.json scripts.check must include npm run check:sprint-completion-audit");
  }

  return errors;
}

function validateSprintRows(value, trackerText) {
  const errors = [];
  const sprintRows = parseSprintRows(trackerText);
  const completedSprintIds = new Set(value.completed_sprint_ids ?? []);

  for (const expected of value.expected_sprint_rows ?? []) {
    const actual = sprintRows.get(expected.id);

    if (actual === undefined) {
      errors.push(`tracker missing Sprint ${expected.id}`);
      continue;
    }

    expectEqual(errors, actual.backlog, expected.backlog, `Sprint ${expected.id} backlog`);
    expectEqual(errors, actual.exitGate, expected.exit_gate, `Sprint ${expected.id} exit gate`);

    if (actual.exitGate !== "☐" && !completedSprintIds.has(expected.id)) {
      errors.push(`Sprint ${expected.id} must remain open until its blockers close`);
    }
    if (completedSprintIds.has(expected.id) && actual.exitGate !== "☑") {
      errors.push(`Sprint ${expected.id} completed_sprint_ids requires exit gate ☑`);
    }
  }

  if (sprintRows.size !== 15) {
    errors.push(`tracker sprint table expected 15 rows but found ${sprintRows.size}`);
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

function validateManifestBlockers(value, packageJson) {
  const errors = [];

  for (const manifest of value.completion_blocker_manifests ?? []) {
    const data = readJson(manifest.path);

    expectEqual(errors, data.status, manifest.expected_status, `${manifest.id}.status`);
    expectEqual(errors, data.release_transition_allowed, false, `${manifest.id}.release_transition_allowed`);
    errors.push(...validateTransitionReviews(manifest, data, packageJson));

    if (manifest.id === "gate0_signed_evidence") {
      validatePacketSet(errors, manifest, data.required_packets, "accepted");
      expectEqual(errors, data.external_approvals_complete, false, `${manifest.id}.external_approvals_complete`);
    } else if (manifest.id === "phase0_live_smoke_evidence") {
      validateLiveSmokeLedger(errors, manifest, data);
    } else if (manifest.id === "sprint1_live_data_evidence") {
      validatePacketSet(errors, manifest, data.required_gates, "accepted");
      expectEqual(errors, data.all_activation_gates_accepted, false, `${manifest.id}.all_activation_gates_accepted`);
    } else if (manifest.id === "agent_model_output_corpus_release_gate") {
      validateAgentModelOutputCorpusReleaseGate(errors, manifest, data, packageJson);
    } else if (manifest.id === "mcp_target_client_live_e2e") {
      validateTargetClientE2e(errors, manifest, data);
    } else if (manifest.id === "frontend_release_evidence") {
      validateFrontendReleaseEvidence(errors, manifest, data);
    } else if (manifest.id === "sprint2_4_live_operations_evidence") {
      validateSprint24LiveOperationsEvidence(errors, manifest, data);
    } else if (manifest.id === "phase3_security_load_dr_release_evidence") {
      validatePhase3SecurityLoadDrReleaseEvidence(errors, manifest, data);
    } else {
      errors.push(`unknown blocker manifest id ${manifest.id}`);
    }
  }

  return errors;
}

function validateTransitionReviews(manifest, data, packageJson) {
  const errors = [];

  if (!Array.isArray(manifest.transition_reviews) || manifest.transition_reviews.length === 0) {
    if (manifest.release_gate_checker !== undefined) {
      validatePackageCommandForScript(errors, packageJson, manifest.release_gate_checker, `${manifest.id}.release_gate_checker`);
      return errors;
    }

    errors.push(`${manifest.id}.transition_reviews must list at least one transition review`);
    return errors;
  }

  for (const transitionReview of manifest.transition_reviews) {
    const transition = readJson(transitionReview.path);
    const transitionPath = `${manifest.id}.transition_reviews.${transitionReview.path}`;

    expectEqual(errors, transition.status, transitionReview.expected_status, `${transitionPath}.status`);
    expectEqual(errors, transition.release_transition_allowed, false, `${transitionPath}.release_transition_allowed`);
    expectEqual(errors, transition.checker, transitionReview.checker, `${transitionPath}.checker`);
    expectEqual(errors, transition.fixture_checker, transitionReview.fixture_checker, `${transitionPath}.fixture_checker`);
    expectIncludes(errors, transition.not_claimed, "all_sprints_complete", `${transitionPath}.not_claimed.all_sprints_complete`);
    validatePackageCommandForScript(errors, packageJson, transitionReview.checker, transitionPath);
    validatePackageCommandForScript(errors, packageJson, transitionReview.fixture_checker, transitionPath);

    if (!transitionReferencesManifest(transition, transitionReview.path, manifest.path, data)) {
      errors.push(`${transitionPath} must reference blocker manifest ${manifest.path}`);
    }
  }

  return errors;
}

function transitionReferencesManifest(transition, transitionReviewPath, manifestPath, manifestData) {
  const directReferences = [
    transition.signed_evidence_manifest_contract,
    transition.ledger_contract,
    transition.evidence_manifest_contract,
    transition.target_client_handoff_contract,
    transition.frontend_evidence_handoff_contract
  ];

  if (directReferences.includes(manifestPath)) {
    return true;
  }

  const linkedReviews = [
    ...(manifestData.linked_capture_transition_reviews ?? []),
    ...(manifestData.linked_transition_reviews ?? []),
    manifestData.transition_review_contract
  ].filter(Boolean);

  return linkedReviews.includes(transitionReviewPath) || Object.values(transition).includes(manifestPath);
}

function validatePackageCommandForScript(errors, packageJson, scriptPath, path) {
  const scripts = packageJson?.scripts ?? {};
  const command = `node ${scriptPath}`;
  const scriptName = Object.entries(scripts).find(([, value]) => value === command)?.[0];

  if (scriptName === undefined) {
    errors.push(`${path} package.json script for ${scriptPath} is missing`);
    return;
  }

  if (!String(scripts.check ?? "").includes(`npm run ${scriptName}`)) {
    errors.push(`${path} root check must include ${scriptName}`);
  }
}

function validatePacketSet(errors, manifest, packets, acceptedStatus) {
  if (!Array.isArray(packets)) {
    errors.push(`${manifest.id} packets must be an array`);
    return;
  }

  const acceptedCount = packets.filter((packet) => packet.status === acceptedStatus).length;

  expectEqual(errors, packets.length, manifest.expected_required_count, `${manifest.id}.required_count`);
  expectEqual(errors, acceptedCount, manifest.expected_accepted_count, `${manifest.id}.accepted_count`);

  for (const packet of packets) {
    if (packet.status !== "missing") {
      errors.push(`${manifest.id}.${packet.id ?? packet.gate_id} must remain missing until evidence arrives`);
    }
    if (Array.isArray(packet.evidence_refs) && packet.evidence_refs.length !== 0) {
      errors.push(`${manifest.id}.${packet.id ?? packet.gate_id} evidence_refs must remain empty`);
    }
  }
}

function validateLiveSmokeLedger(errors, manifest, data) {
  const surfaces = data.surfaces ?? [];
  const passedCount = surfaces.filter((surface) => surface.current_status === "passed").length;

  expectEqual(errors, data.all_live_smokes_passed, false, `${manifest.id}.all_live_smokes_passed`);
  expectEqual(errors, surfaces.length, manifest.expected_required_count, `${manifest.id}.required_count`);
  expectEqual(errors, passedCount, manifest.expected_accepted_count, `${manifest.id}.accepted_count`);

  for (const surface of surfaces) {
    if (!Array.isArray(surface.missing_evidence) || surface.missing_evidence.length === 0) {
      errors.push(`${manifest.id}.${surface.id} must list missing_evidence while incomplete`);
    }
    if (surface.blocks_sprint0_4_checkbox !== true) {
      errors.push(`${manifest.id}.${surface.id} must block Sprint 0.4 checkbox`);
    }
  }
}

function validateTargetClientE2e(errors, manifest, data) {
  const clients = data.required_target_clients ?? [];
  const acceptedCount = clients.filter((client) => client.status === "accepted").length;

  expectEqual(errors, data.all_target_client_packets_accepted, false, `${manifest.id}.all_target_client_packets_accepted`);
  expectEqual(errors, clients.length, manifest.expected_required_count, `${manifest.id}.required_count`);
  expectEqual(errors, acceptedCount, manifest.expected_accepted_count, `${manifest.id}.accepted_count`);

  for (const client of clients) {
    if (client.status !== "missing_external_e2e") {
      errors.push(`${manifest.id}.${client.client_name} must remain missing_external_e2e`);
    }
  }
}

function validateFrontendReleaseEvidence(errors, manifest, data) {
  const surfaces = data.required_surfaces ?? [];
  const acceptedCount = surfaces.filter((surface) => surface.status === "accepted").length;

  expectEqual(errors, data.all_required_surfaces_accepted, false, `${manifest.id}.all_required_surfaces_accepted`);
  expectEqual(errors, data.frontend_release_surfaces_complete, false, `${manifest.id}.frontend_release_surfaces_complete`);
  expectEqual(errors, surfaces.length, manifest.expected_required_count, `${manifest.id}.required_count`);
  expectEqual(errors, acceptedCount, manifest.expected_accepted_count, `${manifest.id}.accepted_count`);

  for (const surface of surfaces) {
    if (surface.status !== "missing_frontend_evidence") {
      errors.push(`${manifest.id}.${surface.surface_id} must remain missing_frontend_evidence`);
    }
    if (!Array.isArray(surface.required_evidence) || surface.required_evidence.length === 0) {
      errors.push(`${manifest.id}.${surface.surface_id} must list required_evidence`);
    }
  }
}

function validateAgentModelOutputCorpusReleaseGate(errors, manifest, data, packageJson) {
  const blockers = data.release_gate?.blockers ?? [];
  const linkedChecks = data.linked_checks ?? [];

  expectEqual(errors, data.release_gate?.gate_status, "blocked_model_output_corpus_evidence", `${manifest.id}.release_gate.gate_status`);
  expectEqual(errors, data.release_gate?.no_live_release_claim, true, `${manifest.id}.release_gate.no_live_release_claim`);
  expectEqual(errors, data.production_sampling_enabled, false, `${manifest.id}.production_sampling_enabled`);
  expectEqual(errors, data.live_model_output_corpus_enabled, false, `${manifest.id}.live_model_output_corpus_enabled`);
  expectEqual(errors, data.persistent_eval_writes, false, `${manifest.id}.persistent_eval_writes`);
  expectEqual(errors, data.frontend_rendering, false, `${manifest.id}.frontend_rendering`);
  expectEqual(errors, blockers.length, manifest.expected_required_count, `${manifest.id}.required_count`);
  expectEqual(errors, data.release_transition_allowed === true ? blockers.length : 0, manifest.expected_accepted_count, `${manifest.id}.accepted_count`);

  for (const blocker of [
    "partner_approved_model_output_corpus",
    "persistent_eval_writes",
    "frontend_evidence_cards",
    "route_does_not_ingest_live_model_output_corpus"
  ]) {
    expectIncludes(errors, blockers, blocker, `${manifest.id}.release_gate.blockers.${blocker}`);
  }

  for (const claim of [
    "partner_approved_production_corpus",
    "live_model_output_corpus",
    "production_live_generated_answer_sampling",
    "persistent_eval_writes",
    "release_transition"
  ]) {
    expectIncludes(errors, data.not_claimed, claim, `${manifest.id}.not_claimed.${claim}`);
  }

  for (const contractPath of data.linked_contracts ?? []) {
    if (typeof contractPath !== "string" || !existsSync(resolve(process.cwd(), contractPath))) {
      errors.push(`${manifest.id}.linked_contracts path missing: ${contractPath}`);
    }
  }

  for (const checkCommand of linkedChecks) {
    if (typeof checkCommand !== "string" || !checkCommand.startsWith("npm run ")) {
      errors.push(`${manifest.id}.linked_checks must contain npm run commands`);
      continue;
    }
    const scriptName = checkCommand.replace(/^npm run /u, "");
    if (packageJson?.scripts?.[scriptName] === undefined) {
      errors.push(`${manifest.id}.linked_checks references missing package script ${scriptName}`);
    }
    if (!String(packageJson?.scripts?.check ?? "").includes(`npm run ${scriptName}`)) {
      errors.push(`${manifest.id}.linked_checks.${scriptName} must be included in root check`);
    }
  }
}

function validateSprint24LiveOperationsEvidence(errors, manifest, data) {
  validatePacketSet(errors, manifest, data.required_gates, "accepted");
  expectEqual(errors, data.all_live_operations_gates_accepted, false, `${manifest.id}.all_live_operations_gates_accepted`);

  for (const flag of [
    "frontend",
    "live_billing_provider",
    "live_billing_writes",
    "live_flag_source",
    "live_mcp_auth_store",
    "live_notification_fanout",
    "live_workflow_execution"
  ]) {
    expectEqual(errors, data[flag], false, `${manifest.id}.${flag}`);
  }

  for (const required of [
    "packet_checker",
    "packet_fixture_checker",
    "handoff_checker",
    "transition_review_contract",
    "transition_review_checker",
    "transition_review_fixture_checker"
  ]) {
    if (typeof data[required] !== "string" || !existsSync(resolve(process.cwd(), data[required]))) {
      errors.push(`${manifest.id}.${required} linked path missing`);
    }
  }
}

function validatePhase3SecurityLoadDrReleaseEvidence(errors, manifest, data) {
  validatePacketSet(errors, manifest, data.required_gates, "accepted");
  expectEqual(errors, data.all_security_load_dr_gates_accepted, false, `${manifest.id}.all_security_load_dr_gates_accepted`);

  for (const flag of [
    "external_compliance_legal_signoff",
    "live_dr_restore_failover",
    "live_incident_status_comms",
    "live_kill_switch_incident_audit",
    "live_load_test",
    "live_performance_availability_slo",
    "ops_sre_product_signoff"
  ]) {
    expectEqual(errors, data[flag], false, `${manifest.id}.${flag}`);
  }

  for (const required of [
    "packet_checker",
    "packet_fixture_checker",
    "handoff_checker",
    "transition_review_contract",
    "transition_review_checker",
    "transition_review_fixture_checker"
  ]) {
    if (typeof data[required] !== "string" || !existsSync(resolve(process.cwd(), data[required]))) {
      errors.push(`${manifest.id}.${required} linked path missing`);
    }
  }

  for (const releaseGate of data.linked_release_gate_contracts ?? []) {
    if (typeof releaseGate.path !== "string" || !existsSync(resolve(process.cwd(), releaseGate.path))) {
      errors.push(`${manifest.id}.${releaseGate.id}.path linked path missing`);
    }
    if (typeof releaseGate.checker !== "string" || !existsSync(resolve(process.cwd(), releaseGate.checker))) {
      errors.push(`${manifest.id}.${releaseGate.id}.checker linked path missing`);
    }
  }
}

function validateChangelog(trackerText) {
  return trackerText.includes(expectedChangelog)
    ? []
    : [`tracker changelog must include ${expectedChangelog}`];
}

function parseSprintRows(text) {
  const rows = new Map();

  for (const line of text.split("\n")) {
    const match = line.match(/^\|\s*(\d\.\d)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|$/u);
    if (!match) {
      continue;
    }

    const id = match[1].trim();
    if (!/^[0-3]\.[1-4]$/u.test(id)) {
      continue;
    }

    rows.set(id, {
      backlog: match[4].trim(),
      exitGate: match[5].trim(),
      status: match[3].trim(),
      topic: match[2].trim()
    });
  }

  return rows;
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectIncludes(errors, values, expected, path) {
  if (!Array.isArray(values) || !values.includes(expected)) {
    errors.push(`${path} must include ${JSON.stringify(expected)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual)) {
    errors.push(`${path} must be an array`);
    return;
  }
  if (!Array.isArray(expected)) {
    errors.push(`${path} expected value must be an array`);
    return;
  }
  if (actual.length !== expected.length) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
    return;
  }
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
      return;
    }
  }
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
