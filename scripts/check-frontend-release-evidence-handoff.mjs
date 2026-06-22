#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import {
  validateFrontendReleaseEvidencePackets
} from "./check-frontend-release-evidence-packets.mjs";

const contractPath = "deploy/governance/frontend-release-evidence-handoff.contract.json";
const packagePath = "package.json";
const templateReadmePath = "deploy/governance/frontend-release-evidence-templates/README.md";
const packetReadmePath = "deploy/governance/frontend-release-evidence-packets/README.md";
const requiredSurfaceIds = [
  "agent_ask_progress_ui",
  "agent_evidence_card_ui",
  "comparison_screening_ui",
  "research_library_ui",
  "developer_console_ui",
  "wcag_2_1_aa_audit"
];
const requiredHashFields = [
  "frontend_handoff_hash",
  "screenshot_hash",
  "route_test_hash",
  "accessibility_audit_hash",
  "build_output_hash",
  "review_summary_hash"
];
const requiredLinkedContracts = [
  "deploy/governance/mainline-publication-readiness.contract.json",
  "deploy/governance/p0-open-requirement-audit.contract.json",
  "deploy/governance/p0-open-requirement-transition-review.contract.json",
  "deploy/mcp/target-clients-console-release-gate.contract.json"
];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const tracker = readText(contract.tracker);
const todos = readText(contract.todos);
const templateReadme = readText(templateReadmePath);
const packetReadme = readText(packetReadmePath);
const templateDirectory = contract.template_directory;
const templateDirectoryExists =
  typeof templateDirectory === "string" && existsSync(resolve(process.cwd(), templateDirectory));
const templateFiles = templateDirectoryExists ? listTemplatePacketFiles(templateDirectory) : [];
const errors = [
  ...validateContract(contract),
  ...validatePackageScripts(packageJson),
  ...validateDocs(contract, tracker, todos, templateReadme, packetReadme),
  ...validateLinkedContracts(contract),
  ...validateTemplates(contract, packageJson, templateDirectoryExists, templateFiles)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_frontend_release_evidence_handoff"
    },
    1
  );
}

emit(
  {
    required_surfaces: requiredSurfaceIds.length,
    status: "ok",
    template_status: "frontend_release_evidence_missing",
    templates: templateFiles.length,
    version: contract.version
  },
  0
);

function validateContract(value) {
  const errors = [];

  expectEqual(errors, value.version, "2026-06-23.goal.frontend-release-evidence-handoff.v0", "version");
  expectEqual(errors, value.status, "pending_frontend_release_evidence", "status");
  expectEqual(errors, value.checker, "scripts/check-frontend-release-evidence-handoff.mjs", "checker");
  expectEqual(errors, value.packet_checker, "scripts/check-frontend-release-evidence-packets.mjs", "packet_checker");
  expectEqual(errors, value.packet_fixture_checker, "scripts/check-frontend-release-evidence-packet-fixtures.mjs", "packet_fixture_checker");
  expectEqual(errors, value.tracker, "docs/AiphaBee_Sprint_Tracker_v1.0.md", "tracker");
  expectEqual(errors, value.todos, "tasks/todos.md", "todos");
  expectEqual(errors, value.packet_directory, "deploy/governance/frontend-release-evidence-packets", "packet_directory");
  expectEqual(errors, value.packet_file_pattern, "<surface_id>.evidence.json", "packet_file_pattern");
  expectEqual(errors, value.template_directory, "deploy/governance/frontend-release-evidence-templates", "template_directory");
  expectEqual(errors, value.template_file_pattern, "<surface_id>.evidence.json", "template_file_pattern");
  expectEqual(errors, value.frontend_delegated, true, "frontend_delegated");
  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, value.all_required_surfaces_accepted, false, "all_required_surfaces_accepted");
  expectEqual(errors, value.frontend_release_surfaces_complete, false, "frontend_release_surfaces_complete");
  expectEqual(errors, value.hash_only_evidence, true, "hash_only_evidence");
  expectEqual(errors, value.min_artifact_hashes_per_accepted_packet, 3, "min_artifact_hashes_per_accepted_packet");
  expectArray(errors, value.required_surface_ids, requiredSurfaceIds, "required_surface_ids");
  expectArray(errors, value.required_hash_fields, requiredHashFields, "required_hash_fields");
  expectArray(errors, value.linked_contracts, requiredLinkedContracts, "linked_contracts");

  if (!Array.isArray(value.required_surfaces) || value.required_surfaces.length !== requiredSurfaceIds.length) {
    errors.push("required_surfaces must contain 6 frontend surfaces");
  }

  const surfaceMap = new Map((value.required_surfaces ?? []).map((item) => [item.surface_id, item]));
  for (const surfaceId of requiredSurfaceIds) {
    const surface = surfaceMap.get(surfaceId);
    if (!surface) {
      errors.push(`required_surfaces missing ${surfaceId}`);
      continue;
    }
    expectEqual(errors, surface.status, "missing_frontend_evidence", `${surfaceId}.status`);
    if (!Array.isArray(surface.required_evidence) || surface.required_evidence.length < 5) {
      errors.push(`${surfaceId}.required_evidence must list frontend evidence requirements`);
    }
  }

  for (const claim of [
    "frontend_release_surfaces_complete",
    "agt_01_complete",
    "agt_07_complete",
    "mcp_09_complete",
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
    "check:frontend-release-evidence-handoff": "node scripts/check-frontend-release-evidence-handoff.mjs",
    "check:frontend-release-evidence-packet-fixtures": "node scripts/check-frontend-release-evidence-packet-fixtures.mjs",
    "check:frontend-release-evidence-packets": "node scripts/check-frontend-release-evidence-packets.mjs"
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

function validateDocs(value, trackerText, todosText, templateReadme, packetReadme) {
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

  for (const surfaceId of requiredSurfaceIds) {
    if (!templateReadme.includes(surfaceId)) {
      errors.push(`template README must mention ${surfaceId}`);
    }
    if (!packetReadme.includes(surfaceId)) {
      errors.push(`packet README must mention ${surfaceId}`);
    }
  }

  for (const forbidden of ["raw screenshots", "raw API keys", "OAuth tokens", "Console payloads", "connection strings"]) {
    if (!packetReadme.includes(forbidden)) {
      errors.push(`packet README must warn against ${forbidden}`);
    }
  }

  return errors;
}

function validateLinkedContracts() {
  const errors = [];

  for (const linkedContract of requiredLinkedContracts) {
    if (!existsSync(resolve(process.cwd(), linkedContract))) {
      errors.push(`linked contract missing ${linkedContract}`);
    }
  }

  return errors;
}

function validateTemplates(value, packageJson, templateDirectoryExists, templateFiles) {
  const errors = [];

  if (!templateDirectoryExists) {
    errors.push(`template directory missing ${value.template_directory}`);
    return errors;
  }

  if (templateFiles.length !== requiredSurfaceIds.length) {
    errors.push(`template directory expected ${requiredSurfaceIds.length} evidence templates but found ${templateFiles.length}`);
  }

  const templateResult = validateFrontendReleaseEvidencePackets({
    contract: value,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: templateFiles
  });

  if (templateResult.errors.length > 0) {
    errors.push(...templateResult.errors.map((error) => `template invalid: ${error}`));
  }

  if (templateResult.status !== "frontend_release_evidence_incomplete") {
    errors.push(`template packet status expected frontend_release_evidence_incomplete but received ${templateResult.status}`);
  }

  for (const file of templateFiles) {
    const surfaceId = file.packet?.surface_id;

    if (!requiredSurfaceIds.includes(surfaceId)) {
      errors.push(`${file.relative}: unexpected template surface_id ${surfaceId}`);
      continue;
    }
    if (basename(file.relative) !== `${surfaceId}.evidence.json`) {
      errors.push(`${file.relative}: template filename must match surface id`);
    }
    if (file.packet.status !== "missing_frontend_evidence") {
      errors.push(`${file.relative}: template status must be missing_frontend_evidence`);
    }
  }

  return errors;
}

function listTemplatePacketFiles(directory) {
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
