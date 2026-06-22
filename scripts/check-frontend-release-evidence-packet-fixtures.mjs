#!/usr/bin/env node
import {
  validateFrontendReleaseEvidencePackets
} from "./check-frontend-release-evidence-packets.mjs";

const surfaceIds = [
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
const goodHash = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const contract = makeContract();
const packageJson = {
  scripts: {
    check: "npm run check:frontend-release-evidence-packets",
    "check:frontend-release-evidence-packets": "node scripts/check-frontend-release-evidence-packets.mjs"
  }
};
const scenarios = [
  {
    expected_status: "awaiting_frontend_release_evidence_packets",
    files: [],
    name: "empty packet directory is allowed while awaiting Claude handoff"
  },
  {
    expected_status: "frontend_release_evidence_incomplete",
    files: surfaceIds.map((surfaceId) => missingPacketFile(surfaceId)),
    name: "templates validate as missing frontend evidence"
  },
  {
    expected_error: "accepted packet requires",
    files: [acceptedPacketFile("agent_ask_progress_ui", { screenshot_hash: null })],
    name: "accepted packet requires all required hash fields"
  },
  {
    expected_error: "forbidden field raw_screenshot",
    files: [acceptedPacketFile("agent_ask_progress_ui", { raw_screenshot: "raw pixels" })],
    name: "raw screenshot payload is forbidden"
  },
  {
    expected_error: "artifact_hashes[0] must be a sha256 hash",
    files: [acceptedPacketFile("agent_ask_progress_ui", { artifact_hashes: ["not-a-hash"] })],
    name: "artifact hashes must be sha256"
  },
  {
    expected_status: "all_required_frontend_release_evidence_accepted",
    files: surfaceIds.map((surfaceId) => acceptedPacketFile(surfaceId)),
    name: "all accepted redacted packets complete the packet set"
  }
];
const errors = [];
let validScenarios = 0;
let invalidScenarios = 0;

for (const scenario of scenarios) {
  const result = validateFrontendReleaseEvidencePackets({
    contract,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: scenario.files
  });
  const joinedErrors = result.errors.join("\n");

  if (scenario.expected_error) {
    invalidScenarios += 1;
    if (!joinedErrors.includes(scenario.expected_error)) {
      errors.push(`${scenario.name}: expected error containing ${scenario.expected_error}`);
    }
    continue;
  }

  validScenarios += 1;
  if (result.errors.length > 0) {
    errors.push(`${scenario.name}: unexpected errors ${joinedErrors}`);
  }
  if (result.status !== scenario.expected_status) {
    errors.push(`${scenario.name}: expected ${scenario.expected_status} but received ${result.status}`);
  }
}

if (errors.length > 0) {
  emit(
    {
      errors,
      status: "invalid_frontend_release_evidence_packet_fixtures"
    },
    1
  );
}

emit(
  {
    invalid_scenarios: invalidScenarios,
    scenarios: scenarios.length,
    status: "ok",
    valid_scenarios: validScenarios
  },
  0
);

function makeContract() {
  return {
    all_required_surfaces_accepted: false,
    allowed_redaction_statuses: ["missing", "redacted_no_secrets", "needs_redaction"],
    allowed_statuses: ["accepted", "missing_frontend_evidence", "needs_redaction", "rejected"],
    evidence_packet_schema: {
      accessibility_audit_hash: "hash",
      artifact_hashes: "hashes",
      build_output_hash: "hash",
      frontend_handoff_hash: "hash",
      missing_evidence: "missing",
      observed_at: "time",
      operator: "operator",
      redaction_status: "redaction",
      review_summary_hash: "hash",
      route_test_hash: "hash",
      screenshot_hash: "hash",
      source_locator: "locator",
      status: "status",
      surface_id: "surface"
    },
    forbidden_fields: [
      "raw_screenshot",
      "base64_screenshot",
      "raw_video",
      "raw_dom",
      "raw_html",
      "raw_console_payload",
      "api_key",
      "token",
      "secret",
      "account_id",
      "workspace_id"
    ],
    frontend_release_surfaces_complete: false,
    hash_only_evidence: true,
    min_artifact_hashes_per_accepted_packet: 3,
    packet_checker: "scripts/check-frontend-release-evidence-packets.mjs",
    packet_directory: "deploy/governance/frontend-release-evidence-packets",
    packet_file_pattern: "<surface_id>.evidence.json",
    release_transition_allowed: false,
    required_hash_fields: requiredHashFields,
    required_surface_ids: surfaceIds,
    required_surfaces: surfaceIds.map((surfaceId) => ({
      required_evidence: missingEvidence(surfaceId),
      surface_id: surfaceId
    }))
  };
}

function missingPacketFile(surfaceId) {
  return {
    packet: {
      ...basePacket(surfaceId),
      missing_evidence: missingEvidence(surfaceId),
      redaction_status: "missing",
      status: "missing_frontend_evidence"
    },
    relative: `deploy/governance/frontend-release-evidence-templates/${surfaceId}.evidence.json`
  };
}

function acceptedPacketFile(surfaceId, overrides = {}) {
  const packet = {
    ...basePacket(surfaceId),
    artifact_hashes: [goodHash, goodHash, goodHash],
    missing_evidence: [],
    redaction_status: "redacted_no_secrets",
    status: "accepted"
  };

  for (const field of requiredHashFields) {
    packet[field] = goodHash;
  }

  return {
    packet: {
      ...packet,
      ...overrides
    },
    relative: `deploy/governance/frontend-release-evidence-packets/${surfaceId}.evidence.json`
  };
}

function basePacket(surfaceId) {
  const packet = {
    artifact_hashes: [],
    missing_evidence: [],
    observed_at: "2026-06-23T00:00:00.000Z",
    operator: "fixture",
    redaction_status: "missing",
    source_locator: `fixture:${surfaceId}`,
    status: "missing_frontend_evidence",
    surface_id: surfaceId
  };

  for (const field of requiredHashFields) {
    packet[field] = null;
  }

  return packet;
}

function missingEvidence(surfaceId) {
  return [`${surfaceId}_evidence`, "redaction_review"];
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;

  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
