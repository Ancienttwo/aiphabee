#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateSprint1LiveDataEvidenceManifest } from "./check-sprint1-live-data-evidence-manifest-contract.mjs";

const manifestPath = "deploy/governance/sprint1-live-data-evidence-manifest.contract.json";
const activationPath = "deploy/governance/sprint1-live-data-activation.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";
const docsPath = "docs/governance/sprint1-live-data-evidence-manifest.md";
const activationDocsPath = "docs/governance/sprint1-live-data-activation.md";

const baseContext = {
  activation: readJson(activationPath),
  activationDocs: readText(activationDocsPath),
  docs: readText(docsPath),
  packageJson: readJson(packagePath),
  todos: readText(todosPath),
  tracker: readText(trackerPath)
};
const baseManifest = readJson(manifestPath);
const acceptedManifest = makeAcceptedManifest(baseManifest);
const scenarios = [
  {
    expectValid: true,
    manifest: baseManifest,
    name: "current_pending_manifest"
  },
  {
    expectValid: true,
    manifest: acceptedManifest,
    name: "complete_accepted_manifest"
  },
  {
    expectedError: "release_transition_allowed must equal whether all gates are accepted",
    expectValid: false,
    manifest: mutate(baseManifest, (manifest) => {
      manifest.release_transition_allowed = true;
    }),
    name: "partial_release_transition"
  },
  {
    expectedError: "signed_partner_data_contract cannot be accepted without evidence_refs",
    expectValid: false,
    manifest: mutate(acceptedManifest, (manifest) => {
      manifest.required_gates[0].evidence_refs = [];
    }),
    name: "accepted_without_evidence_refs"
  },
  {
    expectedError: "signed_partner_data_contract.evidence_refs[0] must be a sha256 ref",
    expectValid: false,
    manifest: mutate(acceptedManifest, (manifest) => {
      manifest.required_gates[0].evidence_refs[0] = "redacted://partner-contract";
    }),
    name: "accepted_with_non_hash_ref"
  },
  {
    expectedError: "signed_partner_data_contract.missing gate must not retain evidence_refs",
    expectValid: false,
    manifest: mutate(baseManifest, (manifest) => {
      manifest.required_gates[0].evidence_refs = [`sha256:${makeFixtureSha256(0)}`];
    }),
    name: "missing_gate_retains_evidence_refs"
  },
  {
    expectedError: "signed_partner_data_contract.redaction_status must be redacted_no_secrets",
    expectValid: false,
    manifest: mutate(acceptedManifest, (manifest) => {
      manifest.required_gates[0].redaction_status = "contains_raw_rows";
    }),
    name: "unredacted_evidence"
  },
  {
    expectedError: "signed_partner_data_contract.blocks must include live_serving_reads",
    expectValid: false,
    manifest: mutate(baseManifest, (manifest) => {
      manifest.required_gates[0].blocks = ["live_usage_writes"];
    }),
    name: "activation_blocks_mismatch"
  },
  {
    expectedError: "all_activation_gates_accepted must equal whether all gates are accepted",
    expectValid: false,
    manifest: mutate(acceptedManifest, (manifest) => {
      manifest.all_activation_gates_accepted = false;
    }),
    name: "accepted_flag_mismatch"
  }
];
const failures = [];

for (const scenario of scenarios) {
  const errors = validateSprint1LiveDataEvidenceManifest({
    ...baseContext,
    manifest: scenario.manifest
  });

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
  manifest.status = "ready_for_sprint1_1_live_data_decision";
  manifest.all_activation_gates_accepted = true;
  manifest.release_transition_allowed = true;
  manifest.required_gates = manifest.required_gates.map((gate, index) => ({
    ...gate,
    approver_role: gate.required_approver_roles[0],
    evidence_refs: [`sha256:${makeFixtureSha256(index)}`],
    evidence_sha256: `sha256:${makeFixtureSha256(index + 9)}`,
    redaction_status: "redacted_no_secrets",
    signed_at: "2026-06-22",
    status: "accepted"
  }));
  return manifest;
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
