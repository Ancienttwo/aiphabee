#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { validateP0OpenRequirementEvidencePackets } from "./check-p0-open-requirement-evidence-packets.mjs";

const contractPath = "deploy/governance/p0-open-requirement-evidence-handoff.contract.json";
const packagePath = "package.json";
const templateReadmePath = "deploy/governance/p0-open-requirement-evidence-templates/README.md";
const packetReadmePath = "deploy/governance/p0-open-requirement-evidence-packets/README.md";
const expectedChangelog = "| 2026-06-23 | 1.0hg | 完成 `p0-open-requirement-evidence-handoff`";
const requiredCodes = ["AGT-01", "AGT-07", "MCP-09"];
const requiredHashFields = [
  "frontend_handoff_hash",
  "live_smoke_hash",
  "release_gate_hash",
  "evidence_summary_hash",
  "linked_check_output_hash"
];
const requiredLinkedContracts = [
  "deploy/governance/p0-open-requirement-audit.contract.json",
  "deploy/agent/live-model-streaming-release-gate.contract.json",
  "deploy/agent/user-tool-loop-execution-release-gate.contract.json",
  "deploy/agent/model-output-corpus-release-gate.contract.json",
  "deploy/mcp/target-client-live-e2e-handoff.contract.json",
  "deploy/mcp/target-clients-console-release-gate.contract.json"
];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const openRequirementAudit = readJson(contract.open_requirement_audit_contract);
const tracker = readText(contract.tracker);
const todos = readText("tasks/todos.md");
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
  ...validateLinkedContracts(contract, openRequirementAudit),
  ...validateTemplates(contract, openRequirementAudit, packageJson, templateDirectoryExists, templateFiles)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_p0_open_requirement_evidence_handoff"
    },
    1
  );
}

emit(
  {
    required_requirements: requiredCodes.length,
    status: "ok",
    template_status: "p0_requirement_evidence_packets_missing_external_evidence",
    templates: templateFiles.length,
    version: contract.version
  },
  0
);

function validateContract(value) {
  const errors = [];

  expectEqual(errors, value.version, "2026-06-23.goal.p0-open-requirement-evidence-handoff.v0", "version");
  expectEqual(errors, value.status, "pending_external_requirement_evidence", "status");
  expectEqual(errors, value.checker, "scripts/check-p0-open-requirement-evidence-handoff.mjs", "checker");
  expectEqual(errors, value.packet_checker, "scripts/check-p0-open-requirement-evidence-packets.mjs", "packet_checker");
  expectEqual(errors, value.packet_fixture_checker, "scripts/check-p0-open-requirement-evidence-packet-fixtures.mjs", "packet_fixture_checker");
  expectEqual(errors, value.open_requirement_audit_contract, "deploy/governance/p0-open-requirement-audit.contract.json", "open_requirement_audit_contract");
  expectEqual(errors, value.tracker, "docs/AiphaBee_Sprint_Tracker_v1.0.md", "tracker");
  expectEqual(errors, value.packet_directory, "deploy/governance/p0-open-requirement-evidence-packets", "packet_directory");
  expectEqual(errors, value.packet_file_pattern, "<requirement_code>.evidence.json", "packet_file_pattern");
  expectEqual(errors, value.template_directory, "deploy/governance/p0-open-requirement-evidence-templates", "template_directory");
  expectEqual(errors, value.template_file_pattern, "<requirement_code>.evidence.json", "template_file_pattern");
  expectEqual(errors, value.release_transition_allowed, false, "release_transition_allowed");
  expectEqual(errors, value.all_required_packets_accepted, false, "all_required_packets_accepted");
  expectEqual(errors, value.all_p0_requirements_complete, false, "all_p0_requirements_complete");
  expectEqual(errors, value.hash_only_evidence, true, "hash_only_evidence");
  expectEqual(errors, value.external_credentials_required_for_accepted_packets, true, "external_credentials_required_for_accepted_packets");
  expectEqual(errors, value.min_artifact_hashes_per_accepted_packet, 3, "min_artifact_hashes_per_accepted_packet");
  expectArray(errors, value.required_requirement_codes, requiredCodes, "required_requirement_codes");
  expectArray(errors, value.required_hash_fields, requiredHashFields, "required_hash_fields");
  expectArray(errors, value.linked_contracts, requiredLinkedContracts, "linked_contracts");

  if (!Array.isArray(value.required_requirements) || value.required_requirements.length !== requiredCodes.length) {
    errors.push("required_requirements must contain 3 P0 requirements");
  }

  const requirementMap = new Map((value.required_requirements ?? []).map((item) => [item.requirement_code, item]));
  for (const code of requiredCodes) {
    const requirement = requirementMap.get(code);
    if (!requirement) {
      errors.push(`required_requirements missing ${code}`);
      continue;
    }
    expectEqual(errors, requirement.priority, "P0", `${code}.priority`);
    expectEqual(errors, requirement.status, "missing_external_evidence", `${code}.status`);
    if (!Array.isArray(requirement.required_evidence) || requirement.required_evidence.length < 5) {
      errors.push(`${code}.required_evidence must list external/frontend/live evidence requirements`);
    }
  }

  for (const claim of [
    "accepted_requirement_evidence",
    "frontend_release_surfaces_complete",
    "live_model_or_tool_loop_release",
    "developer_console_release",
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
    "check:p0-open-requirement-evidence-handoff": "node scripts/check-p0-open-requirement-evidence-handoff.mjs",
    "check:p0-open-requirement-evidence-packet-fixtures": "node scripts/check-p0-open-requirement-evidence-packet-fixtures.mjs",
    "check:p0-open-requirement-evidence-packets": "node scripts/check-p0-open-requirement-evidence-packets.mjs"
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
  if (!trackerText.includes(expectedChangelog)) {
    errors.push(`tracker changelog must include ${expectedChangelog}`);
  }

  for (const fragment of value.required_todos_fragments ?? []) {
    if (!todosText.includes(fragment)) {
      errors.push(`tasks/todos.md missing required fragment: ${fragment}`);
    }
  }

  for (const code of requiredCodes) {
    if (!templateReadme.includes(code)) {
      errors.push(`template README must mention ${code}`);
    }
    if (!packetReadme.includes(code)) {
      errors.push(`packet README must mention ${code}`);
    }
  }

  for (const forbidden of ["raw API keys", "OAuth tokens", "Console payloads", "connection strings"]) {
    if (!packetReadme.includes(forbidden)) {
      errors.push(`packet README must warn against ${forbidden}`);
    }
  }

  return errors;
}

function validateLinkedContracts(value, openRequirementAudit) {
  const errors = [];

  for (const linkedContract of requiredLinkedContracts) {
    if (!existsSync(resolve(process.cwd(), linkedContract))) {
      errors.push(`linked contract missing ${linkedContract}`);
    }
  }

  expectArray(
    errors,
    (openRequirementAudit?.guarded_open_requirements ?? []).map((item) => item.code),
    requiredCodes,
    "openRequirementAudit.guarded_open_requirements.code"
  );
  expectEqual(errors, openRequirementAudit.release_transition_allowed, false, "openRequirementAudit.release_transition_allowed");
  expectIncludes(
    errors,
    openRequirementAudit.linked_evidence_handoffs,
    "deploy/governance/p0-open-requirement-evidence-handoff.contract.json",
    "openRequirementAudit.linked_evidence_handoffs"
  );

  if (!Array.isArray(value.required_requirements)) {
    return errors;
  }

  for (const requirement of value.required_requirements) {
    const auditRequirement = openRequirementAudit.guarded_open_requirements.find(
      (item) => item.code === requirement.requirement_code
    );
    if (!auditRequirement) {
      errors.push(`open requirement audit missing ${requirement.requirement_code}`);
      continue;
    }
    expectEqual(errors, auditRequirement.status, "☐", `${requirement.requirement_code}.audit.status`);
    expectEqual(errors, auditRequirement.priority, "P0", `${requirement.requirement_code}.audit.priority`);
  }

  return errors;
}

function validateTemplates(value, openRequirementAudit, packageJson, templateDirectoryExists, templateFiles) {
  const errors = [];

  if (!templateDirectoryExists) {
    errors.push(`template directory missing ${value.template_directory}`);
    return errors;
  }

  if (templateFiles.length !== requiredCodes.length) {
    errors.push(`template directory expected ${requiredCodes.length} evidence templates but found ${templateFiles.length}`);
  }

  const templateResult = validateP0OpenRequirementEvidencePackets({
    contract: value,
    openRequirementAudit,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: templateFiles
  });

  if (templateResult.errors.length > 0) {
    errors.push(...templateResult.errors.map((error) => `template invalid: ${error}`));
  }

  if (templateResult.status !== "p0_requirement_evidence_incomplete") {
    errors.push(`template packet status expected p0_requirement_evidence_incomplete but received ${templateResult.status}`);
  }

  for (const file of templateFiles) {
    const code = file.packet?.requirement_code;

    if (!requiredCodes.includes(code)) {
      errors.push(`${file.relative}: unexpected template requirement_code ${code}`);
      continue;
    }
    if (basename(file.relative) !== `${code}.evidence.json`) {
      errors.push(`${file.relative}: template filename must match requirement code`);
    }
    if (file.packet.status !== "missing_external_evidence") {
      errors.push(`${file.relative}: template status must be missing_external_evidence`);
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
