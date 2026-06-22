#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/p0-open-requirement-audit.contract.json";
const packageJsonPath = "package.json";
const expectedChangelog = "| 2026-06-23 | 1.0hf | 完成 `p0-open-requirement-audit`";

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const tracker = readText(contract.tracker);
const p0Ledger = readText(contract.p0_ledger);
const todos = readText(contract.todos);
const errors = [
  ...validateContract(contract),
  ...validatePackageScripts(packageJson),
  ...validateTraceabilityRows(contract, tracker),
  ...validateFragments(contract, tracker, p0Ledger, todos),
  ...validateLinkedContracts(contract),
  ...validateChangelog(tracker)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_p0_open_requirement_audit"
    },
    1
  );
}

emit(
  {
    guarded_open_p0_requirements: contract.guarded_open_requirements.length,
    non_p0_open_backlog: contract.non_p0_open_backlog.length,
    release_transition_allowed: false,
    status: "ok",
    version: contract.version
  },
  0
);

function validateContract(value) {
  const errors = [];

  expectEqual(errors, value.version, "2026-06-23.goal.p0-open-requirement-audit.v0", "version");
  expectEqual(errors, value.status, "active_guarded_open_requirements", "status");
  expectEqual(errors, value.checker, "scripts/check-p0-open-requirement-audit-contract.mjs", "checker");
  expectEqual(errors, value.tracker, "docs/AiphaBee_Sprint_Tracker_v1.0.md", "tracker");
  expectEqual(errors, value.p0_ledger, "docs/governance/p0-traceability-ledger.md", "p0_ledger");
  expectEqual(errors, value.todos, "tasks/todos.md", "todos");
  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, value.all_p0_requirements_complete, false, "all_p0_requirements_complete");
  expectEqual(errors, value.frontend_delegated, true, "frontend_delegated");
  expectEqual(errors, value.external_evidence_required, true, "external_evidence_required");

  if (!Array.isArray(value.guarded_open_requirements) || value.guarded_open_requirements.length !== 3) {
    errors.push("guarded_open_requirements must contain exactly AGT-01, AGT-07, and MCP-09");
  }
  if (!Array.isArray(value.non_p0_open_backlog) || value.non_p0_open_backlog.length !== 1) {
    errors.push("non_p0_open_backlog must contain exactly STK-07");
  }

  const summary = value.summary ?? {};
  expectEqual(errors, summary.open_traceability_rows, 4, "summary.open_traceability_rows");
  expectEqual(errors, summary.guarded_open_p0_count, 3, "summary.guarded_open_p0_count");
  expectEqual(errors, summary.non_p0_open_backlog_count, 1, "summary.non_p0_open_backlog_count");
  expectIncludes(
    errors,
    value.linked_evidence_handoffs,
    "deploy/governance/p0-open-requirement-evidence-handoff.contract.json",
    "linked_evidence_handoffs.p0_open_requirement_evidence"
  );
  expectIncludes(
    errors,
    value.linked_transition_reviews,
    "deploy/governance/p0-open-requirement-transition-review.contract.json",
    "linked_transition_reviews.p0_open_requirement_transition_review"
  );

  for (const path of [
    value.tracker,
    value.p0_ledger,
    value.todos,
    ...(value.linked_evidence_handoffs ?? []),
    ...(value.linked_transition_reviews ?? [])
  ]) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked path missing: ${path}`);
    }
  }

  const guarded = new Map((value.guarded_open_requirements ?? []).map((item) => [item.code, item]));
  for (const code of ["AGT-01", "AGT-07", "MCP-09"]) {
    const item = guarded.get(code);
    if (!item) {
      errors.push(`guarded_open_requirements missing ${code}`);
      continue;
    }
    expectEqual(errors, item.priority, "P0", `${code}.priority`);
    expectEqual(errors, item.status, "☐", `${code}.status`);
    if (!Array.isArray(item.existing_evidence) || item.existing_evidence.length === 0) {
      errors.push(`${code}.existing_evidence must list repo-local evidence contracts`);
    }
    for (const path of item.existing_evidence ?? []) {
      if (!existsSync(resolve(process.cwd(), path))) {
        errors.push(`${code}.existing_evidence missing path: ${path}`);
      }
    }
    if (!Array.isArray(item.missing_evidence) || item.missing_evidence.length < 4) {
      errors.push(`${code}.missing_evidence must list the remaining blocker evidence`);
    }
  }

  const nonP0 = value.non_p0_open_backlog?.[0];
  expectEqual(errors, nonP0?.code, "STK-07", "non_p0_open_backlog[0].code");
  expectEqual(errors, nonP0?.priority, "P1", "non_p0_open_backlog[0].priority");
  expectEqual(errors, nonP0?.status, "☐", "non_p0_open_backlog[0].status");
  expectEqual(errors, nonP0?.reason, "not_p0_release_blocker", "non_p0_open_backlog[0].reason");

  for (const claim of [
    "agt_01_complete",
    "agt_07_complete",
    "mcp_09_complete",
    "p0_transition_review_complete",
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

  if (
    scripts["check:p0-open-requirement-audit"] !==
    "node scripts/check-p0-open-requirement-audit-contract.mjs"
  ) {
    errors.push("package.json scripts.check:p0-open-requirement-audit must run the audit checker");
  }

  if (!String(scripts.check ?? "").includes("npm run check:p0-open-requirement-audit")) {
    errors.push("package.json scripts.check must include npm run check:p0-open-requirement-audit");
  }

  return errors;
}

function validateTraceabilityRows(value, trackerText) {
  const errors = [];
  const rows = parseTraceabilityRows(trackerText);

  for (const expected of value.guarded_open_requirements ?? []) {
    const row = rows.get(expected.code);

    if (!row) {
      errors.push(`tracker §M missing ${expected.code}`);
      continue;
    }

    expectEqual(errors, row.priority, expected.priority, `${expected.code}.priority`);
    expectEqual(errors, row.sprint, expected.sprint, `${expected.code}.sprint`);
    expectEqual(errors, row.status, "☐", `${expected.code}.status`);
  }

  for (const expected of value.non_p0_open_backlog ?? []) {
    const row = rows.get(expected.code);

    if (!row) {
      errors.push(`tracker §M missing ${expected.code}`);
      continue;
    }

    expectEqual(errors, row.priority, expected.priority, `${expected.code}.priority`);
    expectEqual(errors, row.sprint, expected.sprint, `${expected.code}.sprint`);
    expectEqual(errors, row.status, "☐", `${expected.code}.status`);
  }

  const openRows = [...rows.entries()].filter(([, row]) => row.status === "☐");
  const p0OpenRows = openRows.filter(([, row]) => row.priority === "P0");
  const nonP0OpenRows = openRows.filter(([, row]) => row.priority !== "P0");

  expectEqual(errors, openRows.length, value.summary?.open_traceability_rows, "open traceability row count");
  expectEqual(errors, p0OpenRows.length, value.summary?.guarded_open_p0_count, "open P0 row count");
  expectEqual(errors, nonP0OpenRows.length, value.summary?.non_p0_open_backlog_count, "open non-P0 row count");

  for (const [code] of p0OpenRows) {
    if (!["AGT-01", "AGT-07", "MCP-09"].includes(code)) {
      errors.push(`unexpected open P0 traceability row: ${code}`);
    }
  }

  return errors;
}

function validateFragments(value, trackerText, p0LedgerText, todosText) {
  const errors = [];

  for (const fragment of value.required_tracker_fragments ?? []) {
    if (!trackerText.includes(fragment)) {
      errors.push(`tracker missing required fragment: ${fragment}`);
    }
  }

  for (const fragment of value.required_ledger_fragments ?? []) {
    if (!p0LedgerText.includes(fragment)) {
      errors.push(`P0 ledger missing required fragment: ${fragment}`);
    }
  }

  for (const fragment of value.required_todos_fragments ?? []) {
    if (!todosText.includes(fragment)) {
      errors.push(`tasks/todos.md missing required fragment: ${fragment}`);
    }
  }

  return errors;
}

function validateLinkedContracts() {
  const errors = [];
  const toolLoop = readJson("deploy/agent/tool-loop-planner.contract.json");
  const liveModelStreaming = readJson("deploy/agent/live-model-streaming-release-gate.contract.json");
  const userToolLoop = readJson("deploy/agent/user-tool-loop-execution-release-gate.contract.json");
  const answerEvidence = readJson("deploy/agent/answer-evidence-contract.contract.json");
  const generatedEvidence = readJson("deploy/agent/generated-answer-evidence-smoke.contract.json");
  const postGeneration = readJson("deploy/governance/post-generation-evidence-binding.contract.json");
  const modelCorpus = readJson("deploy/agent/model-output-corpus-release-gate.contract.json");
  const developerConsole = readJson("deploy/mcp/developer-console.contract.json");
  const consoleLogStore = readJson("deploy/mcp/developer-console-log-store-smoke.contract.json");
  const targetClientHandoff = readJson("deploy/mcp/target-client-live-e2e-handoff.contract.json");
  const targetClientsConsoleGate = readJson("deploy/mcp/target-clients-console-release-gate.contract.json");
  const p0EvidenceHandoff = readJson("deploy/governance/p0-open-requirement-evidence-handoff.contract.json");
  const p0TransitionReview = readJson("deploy/governance/p0-open-requirement-transition-review.contract.json");

  expectEqual(errors, toolLoop.streaming_transport, "server_sent_events", "toolLoop.streaming_transport");
  expectEqual(errors, toolLoop.stream_model_calls, false, "toolLoop.stream_model_calls");
  expectEqual(errors, toolLoop.stream_actual_tool_execution, false, "toolLoop.stream_actual_tool_execution");
  expectEqual(errors, toolLoop.frontend, false, "toolLoop.frontend");

  expectEqual(errors, liveModelStreaming.release_transition_allowed, false, "liveModelStreaming.release_transition_allowed");
  expectEqual(errors, liveModelStreaming.frontend_rendering, false, "liveModelStreaming.frontend_rendering");
  expectEqual(errors, liveModelStreaming.live_model_streaming, false, "liveModelStreaming.live_model_streaming");
  expectEqual(
    errors,
    liveModelStreaming.release_gate?.gate_status,
    "blocked_user_facing_live_model_streaming",
    "liveModelStreaming.release_gate.gate_status"
  );
  expectIncludes(
    errors,
    liveModelStreaming.release_gate?.blockers,
    "frontend_streaming_ui",
    "liveModelStreaming.release_gate.blockers.frontend_streaming_ui"
  );
  expectIncludes(
    errors,
    liveModelStreaming.release_gate?.blockers,
    "route_does_not_execute_user_model_stream",
    "liveModelStreaming.release_gate.blockers.route_does_not_execute_user_model_stream"
  );

  expectEqual(errors, userToolLoop.release_transition_allowed, false, "userToolLoop.release_transition_allowed");
  expectEqual(errors, userToolLoop.arbitrary_user_tool_loop_execution, false, "userToolLoop.arbitrary_user_tool_loop_execution");
  expectEqual(errors, userToolLoop.frontend_rendering, false, "userToolLoop.frontend_rendering");
  expectEqual(
    errors,
    userToolLoop.release_gate?.gate_status,
    "blocked_arbitrary_user_tool_loop_execution",
    "userToolLoop.release_gate.gate_status"
  );

  expectEqual(errors, answerEvidence.evidence_card_payload, "planned", "answerEvidence.evidence_card_payload");
  expectEqual(errors, answerEvidence.frontend, false, "answerEvidence.frontend");
  expectEqual(errors, answerEvidence.frontend_rendering, false, "answerEvidence.frontend_rendering");
  for (const field of ["source_record_id", "data_version", "methodology_version"]) {
    expectIncludes(errors, answerEvidence.evidence_card_required_fields, field, `answerEvidence.evidence_card_required_fields.${field}`);
  }

  expectEqual(errors, generatedEvidence.evidence_card_binding_probe, true, "generatedEvidence.evidence_card_binding_probe");
  expectEqual(errors, generatedEvidence.frontend, false, "generatedEvidence.frontend");
  expectEqual(errors, generatedEvidence.live_evidence_writes, false, "generatedEvidence.live_evidence_writes");
  expectIncludes(errors, generatedEvidence.not_claimed, "frontend_ask_rendering", "generatedEvidence.not_claimed.frontend_ask_rendering");
  expectIncludes(errors, generatedEvidence.not_claimed, "live_evidence_writes", "generatedEvidence.not_claimed.live_evidence_writes");

  expectEqual(errors, postGeneration.post_generation_validation, "local_deterministic", "postGeneration.post_generation_validation");
  expectIncludes(
    errors,
    postGeneration.not_claimed,
    "frontend_evidence_card_rendering",
    "postGeneration.not_claimed.frontend_evidence_card_rendering"
  );

  expectEqual(errors, modelCorpus.release_transition_allowed, false, "modelCorpus.release_transition_allowed");
  expectEqual(errors, modelCorpus.production_sampling_enabled, false, "modelCorpus.production_sampling_enabled");
  expectEqual(errors, modelCorpus.frontend_rendering, false, "modelCorpus.frontend_rendering");
  expectIncludes(errors, modelCorpus.release_gate?.blockers, "frontend_evidence_cards", "modelCorpus.release_gate.blockers.frontend_evidence_cards");
  expectIncludes(
    errors,
    modelCorpus.release_gate?.blockers,
    "route_does_not_ingest_live_model_output_corpus",
    "modelCorpus.release_gate.blockers.route_does_not_ingest_live_model_output_corpus"
  );

  expectEqual(errors, developerConsole.developer_console_live, false, "developerConsole.developer_console_live");
  expectEqual(errors, developerConsole.frontend_rendering, false, "developerConsole.frontend_rendering");
  expectEqual(errors, developerConsole.persistent_writes, false, "developerConsole.persistent_writes");
  expectEqual(errors, developerConsole.live_api_key_generation, false, "developerConsole.live_api_key_generation");
  expectEqual(errors, developerConsole.live_console_log_store, false, "developerConsole.live_console_log_store");
  expectEqual(errors, developerConsole.live_oauth_provider, false, "developerConsole.live_oauth_provider");
  expectEqual(errors, developerConsole.live_usage_ledger_reads, false, "developerConsole.live_usage_ledger_reads");

  expectEqual(errors, consoleLogStore.frontend, false, "consoleLogStore.frontend");
  expectEqual(errors, consoleLogStore.live_usage_ledger_reads, false, "consoleLogStore.live_usage_ledger_reads");
  expectIncludes(errors, consoleLogStore.not_claimed, "production_console_log_store", "consoleLogStore.not_claimed.production_console_log_store");

  expectEqual(errors, targetClientHandoff.status, "pending_external_e2e", "targetClientHandoff.status");
  expectEqual(errors, targetClientHandoff.all_target_client_packets_accepted, false, "targetClientHandoff.all_target_client_packets_accepted");
  if (!Array.isArray(targetClientHandoff.required_target_clients) || targetClientHandoff.required_target_clients.length !== 5) {
    errors.push("targetClientHandoff.required_target_clients must contain 5 clients");
  }
  for (const client of targetClientHandoff.required_target_clients ?? []) {
    expectEqual(errors, client.status, "missing_external_e2e", `targetClientHandoff.${client.client_name}.status`);
  }

  expectEqual(errors, targetClientsConsoleGate.developer_console_live, false, "targetClientsConsoleGate.developer_console_live");
  expectEqual(errors, targetClientsConsoleGate.frontend_rendering, false, "targetClientsConsoleGate.frontend_rendering");
  expectEqual(errors, targetClientsConsoleGate.live_client_e2e_passed, false, "targetClientsConsoleGate.live_client_e2e_passed");
  expectEqual(errors, targetClientsConsoleGate.live_console_log_store, false, "targetClientsConsoleGate.live_console_log_store");
  expectEqual(errors, targetClientsConsoleGate.live_usage_ledger_reads, false, "targetClientsConsoleGate.live_usage_ledger_reads");
  expectEqual(
    errors,
    targetClientsConsoleGate.release_gate?.gate_status,
    "blocked_live_mcp_target_clients_console_validation",
    "targetClientsConsoleGate.release_gate.gate_status"
  );

  expectEqual(errors, p0EvidenceHandoff.status, "pending_external_requirement_evidence", "p0EvidenceHandoff.status");
  expectEqual(errors, p0EvidenceHandoff.release_transition_allowed, false, "p0EvidenceHandoff.release_transition_allowed");
  expectEqual(errors, p0EvidenceHandoff.all_required_packets_accepted, false, "p0EvidenceHandoff.all_required_packets_accepted");
  expectEqual(errors, p0EvidenceHandoff.all_p0_requirements_complete, false, "p0EvidenceHandoff.all_p0_requirements_complete");
  expectArray(
    errors,
    p0EvidenceHandoff.required_requirement_codes,
    ["AGT-01", "AGT-07", "MCP-09"],
    "p0EvidenceHandoff.required_requirement_codes"
  );
  expectIncludes(
    errors,
    p0EvidenceHandoff.not_claimed,
    "accepted_requirement_evidence",
    "p0EvidenceHandoff.not_claimed.accepted_requirement_evidence"
  );

  expectEqual(errors, p0TransitionReview.status, "pending_transition_review", "p0TransitionReview.status");
  expectEqual(errors, p0TransitionReview.release_transition_allowed, false, "p0TransitionReview.release_transition_allowed");
  expectEqual(errors, p0TransitionReview.all_p0_requirements_complete, false, "p0TransitionReview.all_p0_requirements_complete");
  expectEqual(
    errors,
    p0TransitionReview.accepted_packets_are_sufficient_alone,
    false,
    "p0TransitionReview.accepted_packets_are_sufficient_alone"
  );
  expectArray(
    errors,
    p0TransitionReview.required_requirement_codes,
    ["AGT-01", "AGT-07", "MCP-09"],
    "p0TransitionReview.required_requirement_codes"
  );

  return errors;
}

function validateChangelog(trackerText) {
  return trackerText.includes(expectedChangelog)
    ? []
    : [`tracker changelog must include ${expectedChangelog}`];
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
