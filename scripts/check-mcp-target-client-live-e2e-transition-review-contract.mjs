#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateMcpTargetClientLiveE2ePackets } from "./check-mcp-target-client-live-e2e-packets.mjs";

const contractPath = "deploy/mcp/target-client-live-e2e-transition-review.contract.json";
const handoffPath = "deploy/mcp/target-client-live-e2e-handoff.contract.json";
const targetGatePath = "deploy/mcp/target-clients-console-release-gate.contract.json";
const developerConsolePath = "deploy/mcp/developer-console.contract.json";
const logStoreSmokePath = "deploy/mcp/developer-console-log-store-smoke.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const expectedVersion = "2026-06-23.phase2.mcp-target-client-live-e2e-transition-review.v0";
const expectedStatus = "pending_target_client_transition_review";
const checkerPath = "scripts/check-mcp-target-client-live-e2e-transition-review-contract.mjs";
const fixtureCheckerPath = "scripts/check-mcp-target-client-live-e2e-transition-review-fixtures.mjs";
const requiredClientNames = [
  "mcp_inspector",
  "typescript_sdk_client",
  "claude_desktop",
  "cursor",
  "chatgpt_connector"
];
const requiredTruePolicies = [
  "accepted_target_client_packet_required",
  "target_clients_console_gate_required",
  "developer_console_live_required",
  "developer_console_ui_required",
  "production_console_log_store_required",
  "live_usage_ledger_reads_required",
  "live_api_key_generation_required",
  "live_oauth_provider_required",
  "public_status_page_deploy_required",
  "accepted_packets_alone_never_complete_mcp09",
  "frontend_delegate_not_bypassed"
];
const requiredCurrentGlobalBlockers = [
  "live_target_client_e2e_missing",
  "developer_console_live_missing",
  "developer_console_ui_missing",
  "production_console_log_store_missing",
  "live_usage_ledger_reads_missing",
  "live_api_key_secret_generation_missing",
  "live_oauth_provider_missing",
  "public_status_page_deploy_missing"
];

export {
  deriveMcpTargetClientLiveE2eTransitionReview,
  validateMcpTargetClientLiveE2eTransitionReview
};

function runCli() {
  const contract = readJson(contractPath);
  const handoff = readJson(handoffPath);
  const targetGate = readJson(targetGatePath);
  const developerConsole = readJson(developerConsolePath);
  const logStoreSmoke = readJson(logStoreSmokePath);
  const packageJson = readJson(packagePath);
  const tracker = readText(trackerPath);
  const todos = readText(todosPath);
  const packetDirectoryExists = existsSync(resolve(process.cwd(), handoff.packet_directory ?? ""));
  const packetFiles = packetDirectoryExists
    ? listPacketFiles(handoff.packet_directory).map((file) => ({
        ...file,
        packet: readJson(file.path)
      }))
    : [];
  const packetResult = validateMcpTargetClientLiveE2ePackets({
    contract: handoff,
    packageJson,
    packetDirectoryExists,
    packetFiles,
    targetGateContract: targetGate
  });
  const transitionReview = deriveMcpTargetClientLiveE2eTransitionReview({
    developerConsole,
    handoff,
    logStoreSmoke,
    packetResult,
    targetGate
  });
  const errors = validateMcpTargetClientLiveE2eTransitionReview({
    contract,
    developerConsole,
    handoff,
    logStoreSmoke,
    packageJson,
    packetResult,
    targetGate,
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

function deriveMcpTargetClientLiveE2eTransitionReview({
  developerConsole,
  handoff,
  logStoreSmoke,
  packetResult,
  targetGate
}) {
  const packetStatuses = packetResult?.packet_statuses ?? {};
  const globalBlockers = deriveGlobalBlockers({ developerConsole, handoff, logStoreSmoke, targetGate });
  const globalReady = globalBlockers.length === 0;
  const decisions = requiredClientNames.map((clientName) => {
    const packetStatus = packetStatuses[clientName] ?? "missing";
    const packetAccepted = packetStatus === "accepted";
    const blockingConditions = [];

    if (!packetAccepted) {
      blockingConditions.push("accepted_e2e_packet_missing");
    }
    blockingConditions.push(...globalBlockers);

    return {
      blocking_conditions: blockingConditions,
      client_name: clientName,
      completion_allowed: packetAccepted && globalReady,
      packet_accepted: packetAccepted,
      packet_status: packetStatus
    };
  });
  const completionAllowedCount = decisions.filter((decision) => decision.completion_allowed).length;
  const allCompletionAllowed = completionAllowedCount === requiredClientNames.length;

  return {
    all_completion_allowed: allCompletionAllowed,
    completion_allowed_count: completionAllowedCount,
    decisions,
    global_blockers: globalBlockers,
    mcp_09_complete: allCompletionAllowed,
    release_transition_allowed: allCompletionAllowed
  };
}

function deriveGlobalBlockers({ developerConsole, handoff, logStoreSmoke, targetGate }) {
  const blockers = [];

  if (targetGate?.target_client_policy?.live_e2e_passed !== true || handoff?.live_target_client_e2e !== true) {
    blockers.push("live_target_client_e2e_missing");
  }
  if (targetGate?.developer_console_live !== true || developerConsole?.developer_console_live !== true) {
    blockers.push("developer_console_live_missing");
  }
  if (targetGate?.frontend_rendering !== true || developerConsole?.frontend_rendering !== true || handoff?.developer_console_ui !== true) {
    blockers.push("developer_console_ui_missing");
  }
  if (
    targetGate?.live_console_log_store !== true ||
    developerConsole?.live_console_log_store !== true ||
    logStoreSmoke?.production_console_log_store !== true
  ) {
    blockers.push("production_console_log_store_missing");
  }
  if (targetGate?.live_usage_ledger_reads !== true || developerConsole?.live_usage_ledger_reads !== true) {
    blockers.push("live_usage_ledger_reads_missing");
  }
  if (developerConsole?.credential_policy?.api_key?.live_api_key_generation !== true) {
    blockers.push("live_api_key_secret_generation_missing");
  }
  if (developerConsole?.credential_policy?.oauth?.live_oauth_provider !== true) {
    blockers.push("live_oauth_provider_missing");
  }
  if (handoff?.public_status_page_deploy !== true) {
    blockers.push("public_status_page_deploy_missing");
  }

  return blockers;
}

function validateMcpTargetClientLiveE2eTransitionReview({
  contract,
  developerConsole,
  handoff,
  logStoreSmoke,
  packageJson,
  packetResult,
  targetGate,
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
  expectEqual(errors, contract.target_client_handoff_contract, handoffPath, "target_client_handoff_contract");
  expectEqual(errors, contract.target_clients_console_gate_contract, targetGatePath, "target_clients_console_gate_contract");
  expectEqual(errors, contract.developer_console_contract, developerConsolePath, "developer_console_contract");
  expectEqual(
    errors,
    contract.developer_console_log_store_smoke_contract,
    logStoreSmokePath,
    "developer_console_log_store_smoke_contract"
  );
  expectEqual(errors, contract.packet_directory, "deploy/mcp/target-client-live-e2e-packets", "packet_directory");
  expectEqual(errors, contract.tracker, trackerPath, "tracker");
  expectEqual(errors, contract.todos, todosPath, "todos");
  expectEqual(errors, contract.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, contract.all_target_client_packets_accepted, false, "all_target_client_packets_accepted");
  expectEqual(errors, contract.mcp_09_complete, false, "mcp_09_complete");
  expectEqual(errors, contract.accepted_packets_are_sufficient_alone, false, "accepted_packets_are_sufficient_alone");
  expectArray(errors, contract.required_client_names, requiredClientNames, "required_client_names");
  expectArray(errors, contract.global_blockers, requiredCurrentGlobalBlockers, "global_blockers");

  validateTransitionPolicy(errors, contract.transition_policy);
  validateDecisionContracts(errors, contract.target_client_transition_reviews);
  validateLinkedFiles(errors, contract);
  validatePackageScripts(errors, packageJson);
  validateHandoffLink(errors, handoff);
  validateTargetGateLink(errors, targetGate);
  validateLinkedNoLiveState(errors, { developerConsole, handoff, logStoreSmoke, targetGate });
  validateTrackerAndTodos(errors, { contract, todos, tracker });
  validatePendingState(errors, { contract, packetResult, transitionReview });
  validateNotClaimed(errors, contract.not_claimed);

  return errors;
}

function validateTransitionPolicy(errors, value) {
  if (!isRecord(value)) {
    errors.push("transition_policy must be an object");
    return;
  }

  for (const policy of requiredTruePolicies) {
    expectEqual(errors, value[policy], true, `transition_policy.${policy}`);
  }
}

function validateDecisionContracts(errors, value) {
  if (!Array.isArray(value)) {
    errors.push("target_client_transition_reviews must be an array");
    return;
  }

  for (const [index, clientName] of requiredClientNames.entries()) {
    const review = value[index];

    if (!isRecord(review)) {
      errors.push(`target_client_transition_reviews[${index}] must be an object`);
      continue;
    }

    expectEqual(errors, review.client_name, clientName, `target_client_transition_reviews[${index}].client_name`);
    expectEqual(errors, review.tracker_status, "☐", `${clientName}.tracker_status`);
    expectEqual(errors, review.accepted_packet_required, true, `${clientName}.accepted_packet_required`);
    expectEqual(errors, review.completion_allowed, false, `${clientName}.completion_allowed`);

    const expectedBlockers = ["accepted_e2e_packet_missing", ...requiredCurrentGlobalBlockers];
    expectArray(errors, review.blocking_conditions, expectedBlockers, `${clientName}.blocking_conditions`);
  }

  if (value.length !== requiredClientNames.length) {
    errors.push(`target_client_transition_reviews must contain ${requiredClientNames.length} entries`);
  }
}

function validateLinkedFiles(errors, contract) {
  for (const path of [
    contract.checker,
    contract.fixture_checker,
    contract.target_client_handoff_contract,
    contract.target_clients_console_gate_contract,
    contract.developer_console_contract,
    contract.developer_console_log_store_smoke_contract,
    contract.packet_directory,
    contract.tracker,
    contract.todos
  ]) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked file missing ${path}`);
    }
  }
}

function validatePackageScripts(errors, value) {
  const scripts = value?.scripts ?? {};
  const requiredScripts = {
    "check:mcp-target-client-live-e2e-transition-review": `node ${checkerPath}`,
    "check:mcp-target-client-live-e2e-transition-review-fixtures": `node ${fixtureCheckerPath}`
  };

  for (const [script, command] of Object.entries(requiredScripts)) {
    expectEqual(errors, scripts[script], command, `package.json ${script}`);

    if (!String(scripts.check ?? "").includes(`npm run ${script}`)) {
      errors.push(`root check must include ${script}`);
    }
  }
}

function validateHandoffLink(errors, value) {
  expectEqual(errors, value.transition_review_checker, checkerPath, "handoff.transition_review_checker");
  expectEqual(
    errors,
    value.evidence_policy?.accepted_packet_alone_never_completes_mcp09,
    true,
    "handoff.evidence_policy.accepted_packet_alone_never_completes_mcp09"
  );
  if (!Array.isArray(value.linked_contracts) || !value.linked_contracts.includes(contractPath)) {
    errors.push(`handoff linked_contracts must include ${contractPath}`);
  }
  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("target_client_e2e_transition_review_complete")) {
    errors.push("handoff not_claimed must include target_client_e2e_transition_review_complete");
  }
}

function validateTargetGateLink(errors, value) {
  if (!Array.isArray(value.linked_contracts) || !value.linked_contracts.includes(contractPath)) {
    errors.push(`target clients Console release gate linked_contracts must include ${contractPath}`);
  }
}

function validateLinkedNoLiveState(errors, { developerConsole, handoff, logStoreSmoke, targetGate }) {
  expectEqual(errors, targetGate.target_client_policy?.live_e2e_passed, false, "targetGate.target_client_policy.live_e2e_passed");
  expectEqual(errors, targetGate.developer_console_live, false, "targetGate.developer_console_live");
  expectEqual(errors, targetGate.frontend_rendering, false, "targetGate.frontend_rendering");
  expectEqual(errors, targetGate.live_console_log_store, false, "targetGate.live_console_log_store");
  expectEqual(errors, targetGate.live_usage_ledger_reads, false, "targetGate.live_usage_ledger_reads");
  expectEqual(errors, developerConsole.developer_console_live, false, "developerConsole.developer_console_live");
  expectEqual(errors, developerConsole.frontend_rendering, false, "developerConsole.frontend_rendering");
  expectEqual(errors, developerConsole.live_console_log_store, false, "developerConsole.live_console_log_store");
  expectEqual(errors, developerConsole.live_usage_ledger_reads, false, "developerConsole.live_usage_ledger_reads");
  expectEqual(errors, developerConsole.credential_policy?.api_key?.live_api_key_generation, false, "developerConsole.api_key.live_api_key_generation");
  expectEqual(errors, developerConsole.credential_policy?.oauth?.live_oauth_provider, false, "developerConsole.oauth.live_oauth_provider");
  expectEqual(errors, logStoreSmoke.live_console_log_store_smoke, true, "logStoreSmoke.live_console_log_store_smoke");
  expectEqual(errors, logStoreSmoke.production_console_log_store, false, "logStoreSmoke.production_console_log_store");
  expectEqual(errors, handoff.public_status_page_deploy, false, "handoff.public_status_page_deploy");
}

function validateTrackerAndTodos(errors, { contract, todos, tracker }) {
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

  if (!tracker.includes("| 2.3 | Remote MCP OAuth + Developer Console | 🟦 | 11 / 11 | ☐ |")) {
    errors.push("tracker must keep Sprint 2.3 row at 11 / 11 and unchecked");
  }

  if (!tracker.includes("| MCP-09 Developer Console | P0 | 2.3 | ☐ |")) {
    errors.push("tracker must keep MCP-09 unchecked");
  }
}

function validatePendingState(errors, { contract, packetResult, transitionReview }) {
  if (packetResult.errors.length > 0) {
    errors.push(...packetResult.errors.map((error) => `target-client packet validator: ${error}`));
  }

  if (packetResult.all_required_accepted !== false) {
    errors.push("target-client E2E packets are all accepted; update target-client transition review before MCP-09 can proceed");
  }

  expectEqual(errors, transitionReview.release_transition_allowed, contract.release_transition_allowed, "derived.release_transition_allowed");
  expectEqual(errors, transitionReview.mcp_09_complete, contract.mcp_09_complete, "derived.mcp_09_complete");
  expectArray(errors, transitionReview.global_blockers, requiredCurrentGlobalBlockers, "derived.global_blockers");

  if (transitionReview.decisions.some((decision) => decision.completion_allowed)) {
    errors.push("production target-client transition reviews must all remain blocked in current pending state");
  }
}

function validateNotClaimed(errors, value) {
  if (!Array.isArray(value)) {
    errors.push("not_claimed must be an array");
    return;
  }

  for (const claim of [
    "developer_console_ui",
    "production_console_log_store",
    "live_usage_ledger_reads",
    "live_api_key_secret_generation",
    "live_oauth_provider",
    "live_target_client_e2e",
    "mcp_09_complete",
    "sprint2_3_exit_gate_complete",
    "all_sprints_complete"
  ]) {
    if (!value.includes(claim)) {
      errors.push(`not_claimed must include ${claim}`);
    }
  }
}

function listPacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".e2e.json"))
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

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function expectArray(errors, actual, expected, path) {
  if (!Array.isArray(actual)) {
    errors.push(`${path} expected array`);
    return;
  }

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${path} mismatch: expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
