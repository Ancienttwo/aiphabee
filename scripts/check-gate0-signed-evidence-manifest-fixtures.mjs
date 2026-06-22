#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateManifest } from "./check-gate0-signed-evidence-manifest-contract.mjs";

const manifestPath = "deploy/governance/gate0-signed-evidence-manifest.contract.json";
const intakePath = "deploy/governance/gate0-external-evidence-intake.contract.json";
const packageJsonPath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";

const baseContext = {
  intake: readJson(intakePath),
  packageJson: readJson(packageJsonPath),
  tracker: readText(trackerPath)
};

const baseManifest = readJson(manifestPath);
const scenarios = [
  {
    expectValid: true,
    manifest: baseManifest,
    name: "current_pending_manifest"
  },
  {
    expectValid: true,
    manifest: makeAcceptedManifest(baseManifest),
    name: "complete_accepted_manifest"
  },
  {
    expectedError: "field_rights_matrix cannot be accepted without evidence_refs",
    expectValid: false,
    manifest: mutate(makeAcceptedManifest(baseManifest), (manifest) => {
      manifest.required_packets[0].evidence_refs = [];
    }),
    name: "accepted_without_evidence_refs"
  },
  {
    expectedError: "external_approvals_complete must equal all packets accepted",
    expectValid: false,
    manifest: makePartialReleaseManifest(baseManifest),
    name: "partial_packet_release_flags"
  },
  {
    expectedError: "field_rights_matrix.evidence_refs[0].sha256 must be a hex sha256",
    expectValid: false,
    manifest: mutate(makeAcceptedManifest(baseManifest), (manifest) => {
      manifest.required_packets[0].evidence_refs[0].sha256 = "not-a-sha256";
    }),
    name: "invalid_sha256_ref"
  },
  {
    expectedError: "field_rights_matrix.evidence_refs[0].approval_status must match packet status",
    expectValid: false,
    manifest: mutate(makeAcceptedManifest(baseManifest), (manifest) => {
      manifest.required_packets[0].evidence_refs[0].approval_status = "rejected";
    }),
    name: "approval_status_mismatch"
  },
  {
    expectedError: "field_rights_matrix.evidence_refs[0].redaction_status must be redacted_no_secrets",
    expectValid: false,
    manifest: mutate(makeAcceptedManifest(baseManifest), (manifest) => {
      manifest.required_packets[0].evidence_refs[0].redaction_status = "contains_raw_material";
    }),
    name: "unredacted_evidence_ref"
  },
  {
    expectedError: "field_rights_matrix.missing packet must not retain active evidence_refs",
    expectValid: false,
    manifest: mutate(baseManifest, (manifest) => {
      manifest.required_packets[0].evidence_refs = [makeEvidenceRef(manifest.required_packets[0], 0)];
    }),
    name: "missing_packet_retains_evidence_ref"
  }
];

const failures = [];

for (const scenario of scenarios) {
  const errors = validateManifest({ ...baseContext, manifest: scenario.manifest });

  if (scenario.expectValid && errors.length > 0) {
    failures.push({
      errors,
      name: scenario.name,
      status: "expected_valid"
    });
    continue;
  }

  if (!scenario.expectValid) {
    if (errors.length === 0) {
      failures.push({
        name: scenario.name,
        status: "expected_invalid"
      });
      continue;
    }

    if (!errors.includes(scenario.expectedError)) {
      failures.push({
        errors,
        expected_error: scenario.expectedError,
        name: scenario.name,
        status: "missing_expected_error"
      });
    }
  }
}

if (failures.length > 0) {
  emit(
    {
      failures,
      scenarios: scenarios.length,
      status: "invalid_fixtures"
    },
    1
  );
}

emit(
  {
    invalid_scenarios: scenarios.filter((scenario) => !scenario.expectValid).length,
    scenarios: scenarios.length,
    status: "ok",
    valid_scenarios: scenarios.filter((scenario) => scenario.expectValid).length
  },
  0
);

function makeAcceptedManifest(value) {
  const manifest = clone(value);
  manifest.status = "ready_for_gate0_decision";
  manifest.external_approvals_complete = true;
  manifest.release_transition_allowed = true;
  manifest.required_packets = manifest.required_packets.map((packet, index) => ({
    ...packet,
    evidence_refs: [makeEvidenceRef(packet, index)],
    status: "accepted"
  }));
  return manifest;
}

function makePartialReleaseManifest(value) {
  const manifest = clone(value);
  manifest.status = "ready_for_gate0_decision";
  manifest.external_approvals_complete = true;
  manifest.release_transition_allowed = true;
  manifest.required_packets[0].status = "accepted";
  manifest.required_packets[0].evidence_refs = [makeEvidenceRef(manifest.required_packets[0], 0)];
  return manifest;
}

function makeEvidenceRef(packet, index) {
  return {
    approval_status: "accepted",
    approver: packet.required_approver_roles[0],
    redaction_status: "redacted_no_secrets",
    sha256: makeFixtureSha256(index),
    signed_at: "2026-06-22",
    source_locator: `redacted://gate0-fixture/${packet.id}`
  };
}

function makeFixtureSha256(index) {
  const digit = ((index % 15) + 1).toString(16);
  return digit.repeat(64);
}

function mutate(value, mutator) {
  const manifest = clone(value);
  mutator(manifest);
  return manifest;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
