#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { validateMcpTargetClientLiveE2ePackets } from "./check-mcp-target-client-live-e2e-packets.mjs";

const contractPath = "deploy/mcp/target-client-live-e2e-handoff.contract.json";
const packagePath = "package.json";
const readmePath = "deploy/mcp/target-client-live-e2e-templates/README.md";
const requiredClientNames = [
  "mcp_inspector",
  "typescript_sdk_client",
  "claude_desktop",
  "cursor",
  "chatgpt_connector"
];
const requiredEvidenceNames = [
  "connectivity",
  "initialize",
  "tools_list",
  "tools_call",
  "developer_console_request_log_row",
  "usage_panel_reconciliation",
  "scope_panel_reconciliation",
  "credential_panel_reconciliation",
  "error_panel_reconciliation",
  "redaction_review"
];
const requiredHashFields = [
  "initialize_result_hash",
  "tools_list_result_hash",
  "tool_call_result_hash",
  "console_log_row_hash",
  "usage_panel_hash",
  "scope_panel_hash",
  "credential_panel_hash",
  "error_panel_hash"
];
const requiredBlockers = [
  "live_target_client_e2e_missing",
  "developer_console_ui_missing",
  "live_console_log_store_missing",
  "live_usage_ledger_reads_missing",
  "public_status_page_deploy_missing"
];
const requiredLinkedContracts = [
  "deploy/mcp/target-client-live-e2e-transition-review.contract.json",
  "deploy/mcp/target-clients-console-release-gate.contract.json",
  "deploy/mcp/developer-console.contract.json",
  "deploy/mcp/developer-console-log-store-smoke.contract.json",
  "deploy/mcp/compatibility.contract.json",
  "deploy/mcp/protocol-release-gate.contract.json",
  "deploy/mcp/auth-limits-release-gate.contract.json",
  "deploy/database/migrations.contract.json"
];

const contract = readJson(contractPath);
const packageJson = readJson(packagePath);
const targetGateContract = readJson(contract.target_clients_console_gate_contract);
const developerConsoleContract = readJson(contract.developer_console_contract);
const logStoreSmokeContract = readJson(contract.developer_console_log_store_smoke_contract);
const readme = readText(readmePath);
const templateDirectory = contract.template_directory;
const templateDirectoryExists =
  typeof templateDirectory === "string" && existsSync(resolve(process.cwd(), templateDirectory));
const templateFiles = templateDirectoryExists ? listTemplatePacketFiles(templateDirectory) : [];
const errors = validateHandoff({
  contract,
  developerConsoleContract,
  logStoreSmokeContract,
  packageJson,
  readme,
  targetGateContract,
  templateDirectoryExists,
  templateFiles
});

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contract.template_directory,
      status: "invalid_mcp_target_client_live_e2e_handoff"
    },
    1
  );
}

emit(
  {
    status: "ok",
    target_clients: templateFiles.length,
    template_status: "target_client_e2e_packets_missing_external_e2e"
  },
  0
);

function validateHandoff({
  contract: value,
  developerConsoleContract,
  logStoreSmokeContract,
  packageJson,
  readme,
  targetGateContract,
  templateDirectoryExists,
  templateFiles
}) {
  const errors = [];

  if (!isRecord(value)) {
    return ["target-client live E2E handoff contract must be an object"];
  }

  expectEqual(
    errors,
    value.version,
    "2026-06-23.phase2.mcp-target-client-live-e2e-handoff.v0",
    "version"
  );
  expectEqual(errors, value.status, "pending_external_e2e", "status");
  expectEqual(errors, value.checker, "scripts/check-mcp-target-client-live-e2e-handoff.mjs", "checker");
  expectEqual(
    errors,
    value.packet_checker,
    "scripts/check-mcp-target-client-live-e2e-packets.mjs",
    "packet_checker"
  );
  expectEqual(
    errors,
    value.packet_fixture_checker,
    "scripts/check-mcp-target-client-live-e2e-packet-fixtures.mjs",
    "packet_fixture_checker"
  );
  expectEqual(
    errors,
    value.transition_review_checker,
    "scripts/check-mcp-target-client-live-e2e-transition-review-contract.mjs",
    "transition_review_checker"
  );
  expectEqual(errors, value.route, "POST /mcp/release-gates/target-clients-console/plan", "route");
  expectEqual(errors, value.protocol_route, "POST /mcp", "protocol_route");
  expectEqual(errors, value.compatibility_status_route, "GET /mcp/compatibility/status", "compatibility_status_route");
  expectEqual(errors, value.developer_console_route, "POST /mcp/developer-console/plan", "developer_console_route");
  expectEqual(
    errors,
    value.developer_console_log_store_smoke_route,
    "POST /mcp/developer-console/log-store-smoke",
    "developer_console_log_store_smoke_route"
  );
  expectEqual(errors, value.packet_directory, "deploy/mcp/target-client-live-e2e-packets", "packet_directory");
  expectEqual(errors, value.packet_file_pattern, "<client_name>.e2e.json", "packet_file_pattern");
  expectEqual(errors, value.template_directory, "deploy/mcp/target-client-live-e2e-templates", "template_directory");
  expectEqual(errors, value.template_file_pattern, "<client_name>.e2e.json", "template_file_pattern");
  expectEqual(errors, value.target_protocol_version, "2025-03-26", "target_protocol_version");
  expectEqual(errors, value.connection_guide_version, "docs/public/mcp.md", "connection_guide_version");
  expectEqual(errors, existsSync(resolve(process.cwd(), "docs/public/mcp.md")), true, "docs/public/mcp.md exists");

  [
    "all_target_client_packets_accepted",
    "developer_console_live",
    "developer_console_ui",
    "frontend",
    "live_api_key_generation",
    "live_console_log_store",
    "live_oauth_provider",
    "live_target_client_e2e",
    "live_tool_execution",
    "live_usage_ledger_reads",
    "production_console_log_store",
    "public_status_page_deploy",
    "release_transition_allowed"
  ].forEach((flag) => expectEqual(errors, value[flag], false, flag));

  expectEqual(errors, value.external_credentials_required_for_accepted_packets, true, "external_credentials_required_for_accepted_packets");
  expectEqual(errors, value.hash_only_evidence, true, "hash_only_evidence");
  expectArray(errors, value.allowed_transports, ["streamable_http"], "allowed_transports");
  expectEqual(errors, value.min_artifact_hashes_per_accepted_packet, 3, "min_artifact_hashes_per_accepted_packet");
  expectArray(errors, value.hash_fields, requiredHashFields, "hash_fields");
  expectArray(errors, value.required_evidence_names, requiredEvidenceNames, "required_evidence_names");
  expectArray(
    errors,
    value.required_target_clients?.map((client) => client.client_name),
    requiredClientNames,
    "required_target_clients.client_name"
  );
  expectArray(errors, value.release_gate?.blockers, requiredBlockers, "release_gate.blockers");
  expectEqual(
    errors,
    value.release_gate?.gate_status,
    "blocked_live_mcp_target_clients_console_validation",
    "release_gate.gate_status"
  );
  expectEqual(errors, value.release_gate?.no_live_release_claim, true, "release_gate.no_live_release_claim");
  expectArray(errors, value.linked_contracts, requiredLinkedContracts, "linked_contracts");

  for (const linkedContract of requiredLinkedContracts) {
    if (!existsSync(resolve(process.cwd(), linkedContract))) {
      errors.push(`linked contract missing ${linkedContract}`);
    }
  }

  if (!value.evidence_policy?.operator_handoff_templates_validate_as_missing_packets) {
    errors.push("evidence policy must require handoff templates to validate as missing packets");
  }
  if (!value.evidence_policy?.operator_handoff_readme_lists_clients_and_evidence) {
    errors.push("evidence policy must require handoff README to list clients and evidence");
  }
  if (!value.evidence_policy?.target_clients_console_gate_remains_source_of_truth) {
    errors.push("evidence policy must keep target-clients Console gate as source of truth");
  }
  if (!value.evidence_policy?.hash_only_evidence_refs_required) {
    errors.push("evidence policy must require hash-only evidence refs");
  }
  if (!value.evidence_policy?.raw_secret_forbidden) {
    errors.push("evidence policy must forbid raw secrets");
  }
  if (!value.evidence_policy?.raw_prompt_forbidden) {
    errors.push("evidence policy must forbid raw prompts");
  }
  if (!value.evidence_policy?.raw_response_body_forbidden) {
    errors.push("evidence policy must forbid raw response bodies");
  }
  if (!value.evidence_policy?.accepted_packet_alone_never_completes_mcp09) {
    errors.push("evidence policy must prove accepted packet alone never completes MCP-09");
  }
  if (!Array.isArray(value.not_claimed) || !value.not_claimed.includes("target_client_e2e_transition_review_complete")) {
    errors.push("not_claimed must include target_client_e2e_transition_review_complete");
  }

  validateLinkedNoLiveClaims(errors, value, targetGateContract, developerConsoleContract, logStoreSmokeContract);
  validatePackageScripts(errors, packageJson);
  validateTemplates(errors, value, packageJson, readme, targetGateContract, templateDirectoryExists, templateFiles);

  return errors;
}

function validateLinkedNoLiveClaims(errors, contract, targetGate, developerConsole, logStoreSmoke) {
  expectArray(
    errors,
    targetGate.target_client_policy?.target_clients,
    requiredClientNames,
    "target_clients_console_gate.target_client_policy.target_clients"
  );
  expectEqual(
    errors,
    targetGate.target_client_policy?.live_e2e_passed,
    false,
    "target_clients_console_gate.target_client_policy.live_e2e_passed"
  );
  expectEqual(errors, targetGate.developer_console_live, false, "target_clients_console_gate.developer_console_live");
  expectEqual(errors, targetGate.live_console_log_store, false, "target_clients_console_gate.live_console_log_store");
  expectEqual(errors, targetGate.live_usage_ledger_reads, false, "target_clients_console_gate.live_usage_ledger_reads");
  expectArray(errors, targetGate.release_gate?.blockers, requiredBlockers, "target_clients_console_gate.release_gate.blockers");

  expectEqual(errors, developerConsole.developer_console_live, false, "developer_console.developer_console_live");
  expectEqual(errors, developerConsole.frontend_rendering, false, "developer_console.frontend_rendering");
  expectEqual(errors, developerConsole.live_console_log_store, false, "developer_console.live_console_log_store");
  expectEqual(errors, developerConsole.live_usage_ledger_reads, false, "developer_console.live_usage_ledger_reads");

  expectEqual(
    errors,
    logStoreSmoke.live_console_log_store_smoke,
    true,
    "developer_console_log_store_smoke.live_console_log_store_smoke"
  );
  expectEqual(
    errors,
    logStoreSmoke.production_console_log_store,
    false,
    "developer_console_log_store_smoke.production_console_log_store"
  );
  expectEqual(
    errors,
    logStoreSmoke.developer_console_live,
    false,
    "developer_console_log_store_smoke.developer_console_live"
  );
  expectEqual(
    errors,
    contract.developer_console_log_store_smoke_contract,
    "deploy/mcp/developer-console-log-store-smoke.contract.json",
    "developer_console_log_store_smoke_contract"
  );
}

function validatePackageScripts(errors, packageJson) {
  const scripts = packageJson?.scripts ?? {};
  const expectedScripts = {
    "check:mcp-target-client-live-e2e-handoff":
      "node scripts/check-mcp-target-client-live-e2e-handoff.mjs",
    "check:mcp-target-client-live-e2e-packet-fixtures":
      "node scripts/check-mcp-target-client-live-e2e-packet-fixtures.mjs",
    "check:mcp-target-client-live-e2e-packets":
      "node scripts/check-mcp-target-client-live-e2e-packets.mjs",
    "check:mcp-target-client-live-e2e-transition-review":
      "node scripts/check-mcp-target-client-live-e2e-transition-review-contract.mjs",
    "check:mcp-target-client-live-e2e-transition-review-fixtures":
      "node scripts/check-mcp-target-client-live-e2e-transition-review-fixtures.mjs"
  };

  for (const [scriptName, command] of Object.entries(expectedScripts)) {
    if (scripts[scriptName] !== command) {
      errors.push(`package.json ${scriptName} script is missing`);
    }
    if (typeof scripts.check !== "string" || !scripts.check.includes(`npm run ${scriptName}`)) {
      errors.push(`root check must include ${scriptName}`);
    }
  }
}

function validateTemplates(errors, contract, packageJson, readme, targetGateContract, templateDirectoryExists, templateFiles) {
  if (!templateDirectoryExists) {
    errors.push(`template directory missing ${contract.template_directory}`);
    return;
  }

  const missingTemplates = requiredClientNames.filter(
    (clientName) => !templateFiles.some((file) => basename(file.path) === `${clientName}.e2e.json`)
  );
  const unexpectedTemplates = templateFiles.filter(
    (file) => !requiredClientNames.includes(basename(file.path).replace(/\.e2e\.json$/u, ""))
  );

  for (const clientName of missingTemplates) {
    errors.push(`template missing ${clientName}.e2e.json`);
  }
  for (const file of unexpectedTemplates) {
    errors.push(`unexpected template ${file.relative}`);
  }

  const validation = validateMcpTargetClientLiveE2ePackets({
    contract,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: templateFiles,
    targetGateContract
  });

  errors.push(...validation.errors.map((error) => `template packet invalid: ${error}`));

  if (validation.status !== "target_client_e2e_packets_missing_external_e2e") {
    errors.push(`template packet status must be target_client_e2e_packets_missing_external_e2e, got ${validation.status}`);
  }

  for (const file of templateFiles) {
    const packet = file.packet;

    if (!isRecord(packet)) {
      continue;
    }
    if (packet.status !== "missing_external_e2e") {
      errors.push(`${file.relative}: template status must be missing_external_e2e`);
    }
    if (packet.client_version !== null) {
      errors.push(`${file.relative}: template client_version must be null`);
    }
    if (packet.request_id !== null) {
      errors.push(`${file.relative}: template request_id must be null`);
    }
    if (packet.redaction_status !== "missing") {
      errors.push(`${file.relative}: template redaction_status must be missing`);
    }
    if (!Array.isArray(packet.artifact_hashes) || packet.artifact_hashes.length !== 0) {
      errors.push(`${file.relative}: template artifact_hashes must be empty`);
    }
    for (const field of requiredHashFields) {
      if (packet[field] !== null) {
        errors.push(`${file.relative}: template ${field} must be null`);
      }
    }
  }

  for (const text of [
    "npm run check:mcp-target-client-live-e2e-handoff",
    "npm run check:mcp-target-client-live-e2e-packets",
    "npm run check:mcp-target-client-live-e2e-packet-fixtures",
    "deploy/mcp/target-client-live-e2e-packets",
    "sha256:"
  ]) {
    if (!readme.includes(text)) {
      errors.push(`handoff README must mention ${text}`);
    }
  }

  for (const clientName of requiredClientNames) {
    if (!readme.includes(clientName)) {
      errors.push(`handoff README must mention ${clientName}`);
    }
  }
  for (const evidenceName of requiredEvidenceNames) {
    if (!readme.includes(evidenceName)) {
      errors.push(`handoff README must mention ${evidenceName}`);
    }
  }
}

function listTemplatePacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".e2e.json"))
    .map((entry) => {
      const path = join(absoluteDirectory, entry.name);
      return {
        packet: readJson(path),
        path,
        relative: join(directory, entry.name)
      };
    })
    .sort((a, b) => a.relative.localeCompare(b.relative));
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
