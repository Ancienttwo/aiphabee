#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { validateFrontendReleaseEvidencePackets } from "./check-frontend-release-evidence-packets.mjs";
import { validateP0OpenRequirementEvidencePackets } from "./check-p0-open-requirement-evidence-packets.mjs";

const contractPath = "deploy/governance/p0-open-requirement-transition-review.contract.json";
const packagePath = "package.json";
const expectedChangelog = "| 2026-06-23 | 1.0hh | 完成 `p0-open-requirement-transition-review`";
const requiredCodes = ["AGT-01", "AGT-07", "MCP-09"];
const frontendEvidenceHandoffPath = "deploy/governance/frontend-release-evidence-handoff.contract.json";
const requirementFrontendSurfaceIds = {
  "AGT-01": "agent_ask_progress_ui",
  "AGT-07": "agent_evidence_card_ui",
  "MCP-09": "developer_console_ui"
};
const expectedFrontendEvidenceAccepted = {
  "AGT-01": true,
  "AGT-07": true,
  "MCP-09": true
};

if (isMainModule()) {
  runCli();
}

export {
  deriveP0OpenRequirementTransitionReview,
  validateP0OpenRequirementTransitionReview
};

function runCli() {
  const contract = readJson(contractPath);
  const packageJson = readJson(packagePath);
  const openRequirementAudit = readJson(contract.open_requirement_audit_contract);
  const evidenceHandoff = readJson(contract.evidence_handoff_contract);
  const frontendEvidenceHandoff = readJson(contract.frontend_evidence_handoff_contract);
  const tracker = readText(contract.tracker);
  const todos = readText(contract.todos);
  const packetDirectory = evidenceHandoff.packet_directory;
  const packetFiles = existsSync(resolve(process.cwd(), packetDirectory))
    ? listPacketFiles(packetDirectory)
    : [];
  const packetResult = validateP0OpenRequirementEvidencePackets({
    contract: evidenceHandoff,
    openRequirementAudit,
    packageJson,
    packetDirectoryExists: existsSync(resolve(process.cwd(), packetDirectory)),
    packetFiles
  });
  const frontendPacketDirectory = frontendEvidenceHandoff.packet_directory;
  const frontendPacketFiles = existsSync(resolve(process.cwd(), frontendPacketDirectory))
    ? listPacketFiles(frontendPacketDirectory)
    : [];
  const frontendPacketResult = validateFrontendReleaseEvidencePackets({
    contract: frontendEvidenceHandoff,
    packageJson,
    packetDirectoryExists: existsSync(resolve(process.cwd(), frontendPacketDirectory)),
    packetFiles: frontendPacketFiles
  });
  const linkedContracts = readLinkedContracts();
  const transitionReview = deriveP0OpenRequirementTransitionReview({
    frontendPacketResult,
    linkedContracts,
    packetResult
  });
  const errors = validateP0OpenRequirementTransitionReview({
    contract,
    evidenceHandoff,
    frontendEvidenceHandoff,
    frontendPacketResult,
    linkedContracts,
    openRequirementAudit,
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
        frontend_packet_result: frontendPacketResult,
        packet_result: packetResult,
        status: "invalid_p0_open_requirement_transition_review",
        transition_review: transitionReview
      },
      1
    );
  }

  emit(
    {
      completion_allowed_count: transitionReview.decisions.filter((decision) => decision.completion_allowed).length,
      frontend_packet_result: {
        all_required_accepted: frontendPacketResult.all_required_accepted,
        packet_files: frontendPacketResult.packet_files,
        status: frontendPacketResult.status
      },
      packet_result: {
        all_required_accepted: packetResult.all_required_accepted,
        packet_files: packetResult.packet_files,
        status: packetResult.status
      },
      release_transition_allowed: false,
      status: "ok",
      transition_review: transitionReview,
      version: contract.version
    },
    0
  );
}

function deriveP0OpenRequirementTransitionReview({ frontendPacketResult = {}, linkedContracts, packetResult }) {
  const packetStatuses = packetResult.packet_statuses ?? {};
  const frontendPacketStatuses = frontendPacketResult.packet_statuses ?? {};
  const frontendEvidenceAccepted = (code) =>
    frontendPacketStatuses[requirementFrontendSurfaceIds[code]] === "accepted";
  const buildDecision = ({ code, linked_release_gates_ready }) => ({
    completion_allowed:
      packetStatuses[code] === "accepted" &&
      frontendEvidenceAccepted(code) &&
      linked_release_gates_ready,
    frontend_evidence_accepted: frontendEvidenceAccepted(code),
    frontend_surface_id: requirementFrontendSurfaceIds[code],
    linked_release_gates_ready,
    packet_accepted: packetStatuses[code] === "accepted",
    requirement_code: code
  });

  const decisions = [
    buildDecision({
      code: "AGT-01",
      linked_release_gates_ready:
        linkedContracts.liveModelStreaming.release_transition_allowed === true &&
        linkedContracts.userToolLoop.release_transition_allowed === true
    }),
    buildDecision({
      code: "AGT-07",
      linked_release_gates_ready:
        linkedContracts.modelCorpus.release_transition_allowed === true &&
        linkedContracts.generatedEvidence.frontend === true &&
        linkedContracts.generatedEvidence.live_evidence_writes === true &&
        !linkedContracts.postGeneration.not_claimed?.includes("frontend_evidence_card_rendering")
    }),
    buildDecision({
      code: "MCP-09",
      linked_release_gates_ready:
        linkedContracts.targetClientHandoff.all_target_client_packets_accepted === true &&
        linkedContracts.targetClientsConsoleGate.live_client_e2e_passed === true &&
        linkedContracts.targetClientsConsoleGate.frontend_rendering === true &&
        linkedContracts.targetClientsConsoleGate.live_console_log_store === true &&
        linkedContracts.targetClientsConsoleGate.live_usage_ledger_reads === true &&
        linkedContracts.developerConsole.developer_console_live === true &&
        linkedContracts.developerConsole.frontend_rendering === true &&
        linkedContracts.developerConsole.live_console_log_store === true &&
        linkedContracts.developerConsole.live_usage_ledger_reads === true
    })
  ];

  return {
    all_completion_allowed: decisions.every((decision) => decision.completion_allowed),
    decisions
  };
}

function validateP0OpenRequirementTransitionReview({
  contract,
  evidenceHandoff,
  frontendEvidenceHandoff,
  frontendPacketResult,
  linkedContracts,
  openRequirementAudit,
  packageJson,
  packetResult,
  todos,
  tracker,
  transitionReview
}) {
  const errors = [
    ...validateContract(contract),
    ...validatePackageScripts(packageJson),
    ...validateTracker(contract, tracker),
    ...validateTodos(contract, todos),
    ...validateEvidenceHandoff(contract, evidenceHandoff, packetResult),
    ...validateFrontendEvidenceHandoff(contract, frontendEvidenceHandoff, frontendPacketResult),
    ...validateOpenRequirementAudit(contract, openRequirementAudit),
    ...validateLinkedGateState(linkedContracts),
    ...validateTransitionDecisions(contract, transitionReview)
  ];

  if (packetResult.errors.length > 0) {
    errors.push(...packetResult.errors.map((error) => `packet validator failed: ${error}`));
  }
  if (frontendPacketResult.errors.length > 0) {
    errors.push(...frontendPacketResult.errors.map((error) => `frontend packet validator failed: ${error}`));
  }

  return errors;
}

function validateContract(value) {
  const errors = [];

  expectEqual(errors, value.version, "2026-06-23.goal.p0-open-requirement-transition-review.v0", "version");
  expectEqual(errors, value.status, "pending_transition_review", "status");
  expectEqual(errors, value.checker, "scripts/check-p0-open-requirement-transition-review-contract.mjs", "checker");
  expectEqual(errors, value.fixture_checker, "scripts/check-p0-open-requirement-transition-review-fixtures.mjs", "fixture_checker");
  expectEqual(errors, value.open_requirement_audit_contract, "deploy/governance/p0-open-requirement-audit.contract.json", "open_requirement_audit_contract");
  expectEqual(errors, value.evidence_handoff_contract, "deploy/governance/p0-open-requirement-evidence-handoff.contract.json", "evidence_handoff_contract");
  expectEqual(errors, value.frontend_evidence_handoff_contract, frontendEvidenceHandoffPath, "frontend_evidence_handoff_contract");
  expectEqual(errors, value.tracker, "docs/AiphaBee_Sprint_Tracker_v1.0.md", "tracker");
  expectEqual(errors, value.todos, "tasks/todos.md", "todos");
  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, value.all_p0_requirements_complete, false, "all_p0_requirements_complete");
  expectEqual(errors, value.accepted_packets_are_sufficient_alone, false, "accepted_packets_are_sufficient_alone");
  expectArray(errors, value.required_requirement_codes, requiredCodes, "required_requirement_codes");

  for (const [key, expected] of Object.entries({
    accepted_packet_alone_never_completes_requirement: true,
    accepted_packet_required: true,
    frontend_release_evidence_required: true,
    hash_only_packet_validator_remains_source_of_truth: true,
    linked_release_gate_required: true,
    sprint_exit_gate_change_requires_review: true,
    tracker_checkbox_change_requires_review: true
  })) {
    expectEqual(errors, value.transition_policy?.[key], expected, `transition_policy.${key}`);
  }

  if (!Array.isArray(value.requirement_transition_reviews) || value.requirement_transition_reviews.length !== 3) {
    errors.push("requirement_transition_reviews must contain 3 reviews");
  }

  for (const code of requiredCodes) {
    const review = value.requirement_transition_reviews?.find((item) => item.requirement_code === code);

    if (!review) {
      errors.push(`requirement_transition_reviews missing ${code}`);
      continue;
    }

    expectEqual(errors, review.tracker_status, "☐", `${code}.tracker_status`);
    expectEqual(errors, review.evidence_packet_required, true, `${code}.evidence_packet_required`);
    expectEqual(errors, review.frontend_evidence_required, true, `${code}.frontend_evidence_required`);
    expectEqual(errors, review.frontend_surface_id, requirementFrontendSurfaceIds[code], `${code}.frontend_surface_id`);
    expectEqual(errors, review.completion_allowed, false, `${code}.completion_allowed`);
    if (!Array.isArray(review.linked_release_gates) || review.linked_release_gates.length === 0) {
      errors.push(`${code}.linked_release_gates must not be empty`);
    }
    for (const path of review.linked_release_gates ?? []) {
      if (!existsSync(resolve(process.cwd(), path))) {
        errors.push(`${code}.linked_release_gates missing ${path}`);
      }
    }
    if (!Array.isArray(review.blocking_conditions) || review.blocking_conditions.length === 0) {
      errors.push(`${code}.blocking_conditions must not be empty`);
    }
  }

  for (const claim of [
    "accepted_packets_present",
    "frontend_release_surfaces_complete",
    "release_transition_allowed",
    "all_p0_requirements_complete",
    "all_sprints_complete"
  ]) {
    expectIncludes(errors, value.not_claimed, claim, `not_claimed.${claim}`);
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const expected = {
    "check:p0-open-requirement-transition-review": "node scripts/check-p0-open-requirement-transition-review-contract.mjs",
    "check:p0-open-requirement-transition-review-fixtures": "node scripts/check-p0-open-requirement-transition-review-fixtures.mjs"
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

function validateTracker(value, text) {
  const errors = [];
  const rows = parseTraceabilityRows(text);

  for (const code of requiredCodes) {
    expectEqual(errors, rows.get(code)?.status, "☐", `${code}.tracker_status`);
  }

  for (const fragment of value.required_tracker_fragments ?? []) {
    if (!text.includes(fragment)) {
      errors.push(`tracker missing required fragment: ${fragment}`);
    }
  }
  if (!text.includes(expectedChangelog)) {
    errors.push(`tracker changelog must include ${expectedChangelog}`);
  }

  return errors;
}

function validateTodos(value, text) {
  const errors = [];

  for (const fragment of value.required_todos_fragments ?? []) {
    if (!text.includes(fragment)) {
      errors.push(`tasks/todos.md missing required fragment: ${fragment}`);
    }
  }

  return errors;
}

function validateEvidenceHandoff(value, evidenceHandoff, packetResult) {
  const errors = [];

  expectEqual(errors, evidenceHandoff.status, "pending_external_requirement_evidence", "evidenceHandoff.status");
  expectEqual(errors, evidenceHandoff.release_transition_allowed, false, "evidenceHandoff.release_transition_allowed");
  expectEqual(errors, evidenceHandoff.all_required_packets_accepted, false, "evidenceHandoff.all_required_packets_accepted");
  expectEqual(errors, evidenceHandoff.all_p0_requirements_complete, false, "evidenceHandoff.all_p0_requirements_complete");
  expectArray(errors, evidenceHandoff.required_requirement_codes, value.required_requirement_codes, "evidenceHandoff.required_requirement_codes");
  expectIncludes(
    errors,
    evidenceHandoff.linked_transition_reviews,
    "deploy/governance/p0-open-requirement-transition-review.contract.json",
    "evidenceHandoff.linked_transition_reviews"
  );

  if (packetResult.all_required_accepted === true) {
    errors.push("current repo must not contain all accepted P0 evidence packets while transition review is pending");
  }

  return errors;
}

function validateFrontendEvidenceHandoff(value, frontendEvidenceHandoff, frontendPacketResult) {
  const errors = [];

  expectEqual(errors, frontendEvidenceHandoff.status, "pending_frontend_release_evidence", "frontendEvidenceHandoff.status");
  expectEqual(errors, frontendEvidenceHandoff.release_transition_allowed, false, "frontendEvidenceHandoff.release_transition_allowed");
  expectEqual(errors, frontendEvidenceHandoff.all_required_surfaces_accepted, false, "frontendEvidenceHandoff.all_required_surfaces_accepted");
  expectEqual(errors, frontendEvidenceHandoff.frontend_release_surfaces_complete, false, "frontendEvidenceHandoff.frontend_release_surfaces_complete");
  expectIncludes(
    errors,
    frontendEvidenceHandoff.linked_contracts,
    contractPath,
    "frontendEvidenceHandoff.linked_contracts.p0_transition_review"
  );

  for (const code of value.required_requirement_codes ?? []) {
    expectIncludes(
      errors,
      frontendEvidenceHandoff.required_surface_ids,
      requirementFrontendSurfaceIds[code],
      `frontendEvidenceHandoff.required_surface_ids.${code}`
    );
  }

  return errors;
}

function validateOpenRequirementAudit(value, openRequirementAudit) {
  const errors = [];

  expectEqual(errors, openRequirementAudit.release_transition_allowed, false, "openRequirementAudit.release_transition_allowed");
  expectEqual(errors, openRequirementAudit.all_p0_requirements_complete, false, "openRequirementAudit.all_p0_requirements_complete");
  expectArray(
    errors,
    (openRequirementAudit.guarded_open_requirements ?? []).map((item) => item.code),
    value.required_requirement_codes,
    "openRequirementAudit.guarded_open_requirements.code"
  );
  expectIncludes(
    errors,
    openRequirementAudit.linked_transition_reviews,
    "deploy/governance/p0-open-requirement-transition-review.contract.json",
    "openRequirementAudit.linked_transition_reviews"
  );
  expectIncludes(
    errors,
    openRequirementAudit.linked_evidence_handoffs,
    frontendEvidenceHandoffPath,
    "openRequirementAudit.linked_evidence_handoffs.frontend_release_evidence"
  );

  return errors;
}

function validateLinkedGateState(linkedContracts) {
  const errors = [];

  expectEqual(errors, linkedContracts.liveModelStreaming.release_transition_allowed, false, "liveModelStreaming.release_transition_allowed");
  expectEqual(errors, linkedContracts.userToolLoop.release_transition_allowed, false, "userToolLoop.release_transition_allowed");
  expectEqual(errors, linkedContracts.modelCorpus.release_transition_allowed, false, "modelCorpus.release_transition_allowed");
  expectEqual(errors, linkedContracts.generatedEvidence.frontend, false, "generatedEvidence.frontend");
  expectEqual(errors, linkedContracts.generatedEvidence.live_evidence_writes, false, "generatedEvidence.live_evidence_writes");
  expectIncludes(errors, linkedContracts.postGeneration.not_claimed, "frontend_evidence_card_rendering", "postGeneration.not_claimed.frontend_evidence_card_rendering");
  expectEqual(errors, linkedContracts.targetClientHandoff.all_target_client_packets_accepted, false, "targetClientHandoff.all_target_client_packets_accepted");
  expectEqual(errors, linkedContracts.targetClientsConsoleGate.live_client_e2e_passed, false, "targetClientsConsoleGate.live_client_e2e_passed");
  expectEqual(errors, linkedContracts.targetClientsConsoleGate.frontend_rendering, false, "targetClientsConsoleGate.frontend_rendering");
  expectEqual(errors, linkedContracts.targetClientsConsoleGate.live_console_log_store, false, "targetClientsConsoleGate.live_console_log_store");
  expectEqual(errors, linkedContracts.targetClientsConsoleGate.live_usage_ledger_reads, false, "targetClientsConsoleGate.live_usage_ledger_reads");
  expectEqual(errors, linkedContracts.developerConsole.developer_console_live, false, "developerConsole.developer_console_live");
  expectEqual(errors, linkedContracts.developerConsole.frontend_rendering, false, "developerConsole.frontend_rendering");
  expectEqual(errors, linkedContracts.developerConsole.live_console_log_store, false, "developerConsole.live_console_log_store");
  expectEqual(errors, linkedContracts.developerConsole.live_usage_ledger_reads, false, "developerConsole.live_usage_ledger_reads");

  return errors;
}

function validateTransitionDecisions(value, transitionReview) {
  const errors = [];

  expectEqual(errors, transitionReview.all_completion_allowed, false, "transitionReview.all_completion_allowed");
  expectArray(
    errors,
    transitionReview.decisions.map((decision) => decision.requirement_code),
    value.required_requirement_codes,
    "transitionReview.decisions.requirement_code"
  );

  for (const decision of transitionReview.decisions) {
    const review = value.requirement_transition_reviews.find(
      (item) => item.requirement_code === decision.requirement_code
    );

    expectEqual(errors, decision.completion_allowed, false, `${decision.requirement_code}.completion_allowed`);
    expectEqual(errors, decision.completion_allowed, review?.completion_allowed, `${decision.requirement_code}.contract_completion_allowed`);
    expectEqual(
      errors,
      decision.frontend_evidence_accepted,
      expectedFrontendEvidenceAccepted[decision.requirement_code],
      `${decision.requirement_code}.frontend_evidence_accepted`
    );
    expectEqual(errors, decision.frontend_surface_id, review?.frontend_surface_id, `${decision.requirement_code}.contract_frontend_surface_id`);
  }

  return errors;
}

function readLinkedContracts() {
  return {
    developerConsole: readJson("deploy/mcp/developer-console.contract.json"),
    generatedEvidence: readJson("deploy/agent/generated-answer-evidence-smoke.contract.json"),
    liveModelStreaming: readJson("deploy/agent/live-model-streaming-release-gate.contract.json"),
    modelCorpus: readJson("deploy/agent/model-output-corpus-release-gate.contract.json"),
    postGeneration: readJson("deploy/governance/post-generation-evidence-binding.contract.json"),
    targetClientHandoff: readJson("deploy/mcp/target-client-live-e2e-handoff.contract.json"),
    targetClientsConsoleGate: readJson("deploy/mcp/target-clients-console-release-gate.contract.json"),
    userToolLoop: readJson("deploy/agent/user-tool-loop-execution-release-gate.contract.json")
  };
}

function listPacketFiles(directory) {
  return readdirSync(resolve(process.cwd(), directory))
    .filter((file) => file.endsWith(".evidence.json"))
    .sort()
    .map((file) => {
      const relative = join(directory, file);

      return {
        packet: readJson(relative),
        relative
      };
    });
}

function parseTraceabilityRows(text) {
  const matrix = extractSection(text, "## §M 需求 → Sprint 追溯矩阵", "## §F 接入 harness");
  const rows = new Map();

  for (const line of matrix.split("\n")) {
    const match = line.match(/^\|\s*([A-Z]+-\d{2})\s+([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([☐☑])\s*\|\s*$/u);
    if (match) {
      rows.set(match[1], {
        priority: match[3].trim(),
        sprint: match[4].trim(),
        status: match[5].trim(),
        title: match[2].trim()
      });
    }
  }

  return rows;
}

function extractSection(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);

  if (start === -1 || end === -1 || end <= start) {
    emit(
      {
        endMarker,
        startMarker,
        status: "missing_section"
      },
      1
    );
  }

  return text.slice(start, end);
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

  if (actual.length !== expected.length) {
    errors.push(`${path} expected ${expected.length} items but received ${actual.length}`);
    return;
  }

  expected.forEach((value, index) => {
    if (actual[index] !== value) {
      errors.push(`${path}[${index}] expected ${JSON.stringify(value)} but received ${JSON.stringify(actual[index])}`);
    }
  });
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

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
