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
  ...validateManifestBlockers(contract),
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
    open_sprints: contract.expected_sprint_rows.length,
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
    value.completion_blocker_manifests.length !== 5
  ) {
    errors.push("completion_blocker_manifests must contain 5 blocker manifests");
  }

  for (const path of [
    value.tracker,
    value.todos,
    ...(value.completion_blocker_manifests ?? []).map((manifest) => manifest.path)
  ]) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked path missing: ${path}`);
    }
  }

  return errors;
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

  for (const expected of value.expected_sprint_rows ?? []) {
    const actual = sprintRows.get(expected.id);

    if (actual === undefined) {
      errors.push(`tracker missing Sprint ${expected.id}`);
      continue;
    }

    expectEqual(errors, actual.backlog, expected.backlog, `Sprint ${expected.id} backlog`);
    expectEqual(errors, actual.exitGate, expected.exit_gate, `Sprint ${expected.id} exit gate`);

    if (actual.exitGate !== "☐") {
      errors.push(`Sprint ${expected.id} must remain open until external/live/frontend blockers close`);
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

function validateManifestBlockers(value) {
  const errors = [];

  for (const manifest of value.completion_blocker_manifests ?? []) {
    const data = readJson(manifest.path);

    expectEqual(errors, data.status, manifest.expected_status, `${manifest.id}.status`);
    expectEqual(errors, data.release_transition_allowed, false, `${manifest.id}.release_transition_allowed`);

    if (manifest.id === "gate0_signed_evidence") {
      validatePacketSet(errors, manifest, data.required_packets, "accepted");
      expectEqual(errors, data.external_approvals_complete, false, `${manifest.id}.external_approvals_complete`);
    } else if (manifest.id === "phase0_live_smoke_evidence") {
      validateLiveSmokeLedger(errors, manifest, data);
    } else if (manifest.id === "sprint1_live_data_evidence") {
      validatePacketSet(errors, manifest, data.required_gates, "accepted");
      expectEqual(errors, data.all_activation_gates_accepted, false, `${manifest.id}.all_activation_gates_accepted`);
    } else if (manifest.id === "mcp_target_client_live_e2e") {
      validateTargetClientE2e(errors, manifest, data);
    } else if (manifest.id === "frontend_release_evidence") {
      validateFrontendReleaseEvidence(errors, manifest, data);
    } else {
      errors.push(`unknown blocker manifest id ${manifest.id}`);
    }
  }

  return errors;
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
