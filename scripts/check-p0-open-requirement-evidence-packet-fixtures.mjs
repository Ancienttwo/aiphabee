#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateP0OpenRequirementEvidencePackets } from "./check-p0-open-requirement-evidence-packets.mjs";

const contractPath = "deploy/governance/p0-open-requirement-evidence-handoff.contract.json";
const openRequirementAuditPath = "deploy/governance/p0-open-requirement-audit.contract.json";
const packagePath = "package.json";
const contract = readJson(contractPath);
const openRequirementAudit = readJson(openRequirementAuditPath);
const packageJson = readJson(packagePath);
const hashA = `sha256:${"a".repeat(64)}`;
const hashB = `sha256:${"b".repeat(64)}`;
const hashC = `sha256:${"c".repeat(64)}`;
const hashD = `sha256:${"d".repeat(64)}`;
const hashE = `sha256:${"e".repeat(64)}`;

const scenarios = [
  {
    name: "empty packet directory is valid while external evidence is pending",
    packetFiles: [],
    valid: true
  },
  {
    name: "missing templates are valid placeholders",
    packetFiles: [
      packetFile("AGT-01", missingPacket("AGT-01")),
      packetFile("AGT-07", missingPacket("AGT-07")),
      packetFile("MCP-09", missingPacket("MCP-09"))
    ],
    valid: true
  },
  {
    name: "all accepted hash-only packets are valid",
    packetFiles: [
      packetFile("AGT-01", acceptedPacket("AGT-01")),
      packetFile("AGT-07", acceptedPacket("AGT-07")),
      packetFile("MCP-09", acceptedPacket("MCP-09"))
    ],
    valid: true
  },
  {
    name: "accepted packet missing required hash is invalid",
    packetFiles: [
      packetFile("AGT-01", {
        ...acceptedPacket("AGT-01"),
        frontend_handoff_hash: null
      })
    ],
    valid: false
  },
  {
    name: "packet with secret-like text is invalid",
    packetFiles: [
      packetFile("AGT-07", {
        ...missingPacket("AGT-07"),
        source_locator: "Bearer abcdefghijklmnopqrstuvwxyz123456"
      })
    ],
    valid: false
  },
  {
    name: "packet with unexpected field is invalid",
    packetFiles: [
      packetFile("MCP-09", {
        ...missingPacket("MCP-09"),
        raw_console_payload: "not allowed"
      })
    ],
    valid: false
  },
  {
    name: "accepted packet with remaining missing evidence is invalid",
    packetFiles: [
      packetFile("AGT-01", {
        ...acceptedPacket("AGT-01"),
        missing_evidence: ["redaction_review"]
      })
    ],
    valid: false
  }
];

const results = scenarios.map((scenario) => {
  const result = validateP0OpenRequirementEvidencePackets({
    contract,
    openRequirementAudit,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: scenario.packetFiles
  });
  const actualValid = result.errors.length === 0;

  return {
    actual_valid: actualValid,
    expected_valid: scenario.valid,
    name: scenario.name,
    status: actualValid === scenario.valid ? "ok" : "unexpected"
  };
});
const failures = results.filter((result) => result.status !== "ok");

if (failures.length > 0) {
  emit(
    {
      failures,
      results,
      status: "invalid_p0_open_requirement_evidence_packet_fixtures"
    },
    1
  );
}

emit(
  {
    invalid_scenarios: scenarios.filter((scenario) => !scenario.valid).length,
    scenarios: scenarios.length,
    status: "ok",
    valid_scenarios: scenarios.filter((scenario) => scenario.valid).length
  },
  0
);

function packetFile(requirementCode, packet) {
  return {
    packet,
    relative: `deploy/governance/p0-open-requirement-evidence-packets/${requirementCode}.evidence.json`
  };
}

function missingPacket(requirementCode) {
  const requirement = contract.required_requirements.find(
    (item) => item.requirement_code === requirementCode
  );

  return {
    artifact_hashes: [],
    evidence_summary_hash: null,
    frontend_handoff_hash: null,
    linked_check_output_hash: null,
    live_smoke_hash: null,
    missing_evidence: requirement.required_evidence,
    observed_at: "2026-06-23T00:00:00.000Z",
    operator: "fixture",
    redaction_status: "missing",
    release_gate_hash: null,
    requirement_code: requirementCode,
    source_locator: `fixture:${requirementCode}:missing`,
    status: "missing_external_evidence"
  };
}

function acceptedPacket(requirementCode) {
  return {
    artifact_hashes: [hashA, hashB, hashC],
    evidence_summary_hash: hashA,
    frontend_handoff_hash: hashB,
    linked_check_output_hash: hashC,
    live_smoke_hash: hashD,
    missing_evidence: [],
    observed_at: "2026-06-23T00:00:00.000Z",
    operator: "fixture",
    redaction_status: "redacted_no_secrets",
    release_gate_hash: hashE,
    requirement_code: requirementCode,
    source_locator: `fixture:${requirementCode}:accepted`,
    status: "accepted"
  };
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
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

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;

  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
