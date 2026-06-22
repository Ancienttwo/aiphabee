#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateLedger } from "./check-live-smoke-evidence-ledger-contract.mjs";

const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";

const baseContracts = {
  cloudflare: readJson("deploy/cloudflare/resource-smoke-readiness.contract.json"),
  modelProvider: readJson("deploy/model-providers/live-smoke-readiness.contract.json"),
  observability: readJson("deploy/observability/live-smoke-readiness.contract.json"),
  secrets: readJson("deploy/secrets/live-smoke-readiness.contract.json")
};
const baseContext = {
  packageJson: readJson(packagePath),
  todos: readText(todosPath),
  tracker: readText(trackerPath)
};
const baseLedger = readJson(ledgerPath);
const passedContracts = makePassedContracts(baseContracts);

const scenarios = [
  {
    expectValid: true,
    ledger: baseLedger,
    name: "current_pending_ledger"
  },
  {
    contracts: passedContracts,
    expectValid: true,
    ledger: makePassedLedger(baseLedger, passedContracts),
    name: "complete_passed_ledger"
  },
  {
    expectedError: "all_live_smokes_passed must equal whether all surfaces passed",
    expectValid: false,
    ledger: mutate(baseLedger, (ledger) => {
      ledger.status = "ready_for_sprint0_4_live_smoke_decision";
      ledger.all_live_smokes_passed = true;
      ledger.release_transition_allowed = true;
    }),
    name: "partial_surface_release_flags"
  },
  {
    contracts: passedContracts,
    expectedError: "cloudflare_resource_inventory passed surface must have evidence_refs",
    expectValid: false,
    ledger: mutate(makePassedLedger(baseLedger, passedContracts), (ledger) => {
      ledger.surfaces[0].evidence_refs = [];
    }),
    name: "passed_surface_without_evidence_refs"
  },
  {
    contracts: passedContracts,
    expectedError: "cloudflare_resource_inventory passed surface must not keep missing_evidence",
    expectValid: false,
    ledger: mutate(makePassedLedger(baseLedger, passedContracts), (ledger) => {
      ledger.surfaces[0].missing_evidence = ["hyperdrive_select_1_smoke"];
    }),
    name: "passed_surface_retains_missing_evidence"
  },
  {
    expectedError: "evidence_policy.raw_provider_outputs_forbidden_in_repo must be true",
    expectValid: false,
    ledger: mutate(baseLedger, (ledger) => {
      ledger.evidence_policy.raw_provider_outputs_forbidden_in_repo = false;
    }),
    name: "raw_provider_outputs_policy_disabled"
  },
  {
    expectedError: "evidence_policy.destructive_secret_smoke_requires_cleanup_evidence must be true",
    expectValid: false,
    ledger: mutate(baseLedger, (ledger) => {
      ledger.evidence_policy.destructive_secret_smoke_requires_cleanup_evidence = false;
    }),
    name: "secret_cleanup_policy_disabled"
  },
  {
    expectedError: "missing_evidence must include hyperdrive_select_1_smoke",
    expectValid: false,
    ledger: mutate(baseLedger, (ledger) => {
      for (const surface of ledger.surfaces) {
        surface.missing_evidence = surface.missing_evidence.filter((item) => item !== "hyperdrive_select_1_smoke");
      }
    }),
    name: "missing_required_hyperdrive_blocker"
  },
  {
    expectedError: "non_inferable_env must include CLOUDFLARE_API_TOKEN",
    expectValid: false,
    ledger: mutate(baseLedger, (ledger) => {
      ledger.non_inferable_env = ledger.non_inferable_env.filter((item) => item !== "CLOUDFLARE_API_TOKEN");
    }),
    name: "non_inferable_env_defaulted"
  },
  {
    expectedError: "not_claimed must include sprint0_4_live_smoke_checkbox_complete",
    expectValid: false,
    ledger: mutate(baseLedger, (ledger) => {
      ledger.not_claimed = ledger.not_claimed.filter((item) => item !== "sprint0_4_live_smoke_checkbox_complete");
    }),
    name: "sprint_checkbox_claimed_too_early"
  }
];

const failures = [];

for (const scenario of scenarios) {
  const errors = validateLedger({
    ...baseContext,
    contracts: scenario.contracts ?? baseContracts,
    ledger: scenario.ledger
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

function makePassedLedger(value, contracts) {
  const ledger = clone(value);
  const statuses = {
    ai_gateway_model_execution: contracts.modelProvider.status,
    ai_gateway_observability: contracts.modelProvider.latest_observability_probe.status,
    cloudflare_bindings_functional: contracts.cloudflare.functional_smoke.status,
    cloudflare_resource_inventory: contracts.cloudflare.partial_provisioning.status,
    observability_otlp_eval_store: deriveAggregateStatus(contracts.observability.synthetic_surfaces),
    provider_secret_store_rotation: deriveAggregateStatus(contracts.secrets.providers)
  };
  const readinessStatuses = {
    cloudflare_resource_live_readiness: contracts.cloudflare.status,
    live_smoke_defaults: "ok",
    model_provider_live_readiness: contracts.modelProvider.status,
    observability_live_readiness: contracts.observability.status,
    provider_secret_stores_live_readiness: contracts.secrets.status
  };

  ledger.status = "ready_for_sprint0_4_live_smoke_decision";
  ledger.all_live_smokes_passed = true;
  ledger.release_transition_allowed = true;
  ledger.readiness_checks = ledger.readiness_checks.map((entry) => ({
    ...entry,
    current_status: readinessStatuses[entry.id]
  }));
  ledger.live_smoke_commands = ledger.live_smoke_commands.map((entry) => ({
    ...entry,
    current_status: statuses[entry.id]
  }));
  ledger.surfaces = ledger.surfaces.map((surface, index) => ({
    ...surface,
    current_status: statuses[surface.id],
    evidence_refs: [`sha256:${makeFixtureSha256(index)}`],
    missing_evidence: []
  }));

  return ledger;
}

function makePassedContracts(value) {
  const contracts = clone(value);
  contracts.cloudflare.status = "passed";
  contracts.cloudflare.partial_provisioning.status = "passed";
  contracts.cloudflare.functional_smoke.status = "passed";
  contracts.modelProvider.status = "passed";
  contracts.modelProvider.latest_observability_probe.status = "passed";
  contracts.observability.status = "passed";
  contracts.observability.synthetic_surfaces = contracts.observability.synthetic_surfaces.map((surface) => ({
    ...surface,
    status: "passed"
  }));
  contracts.secrets.status = "passed";
  contracts.secrets.providers = contracts.secrets.providers.map((provider) => ({
    ...provider,
    status: "passed"
  }));
  return contracts;
}

function deriveAggregateStatus(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "readiness_not_run";
  }

  if (items.every((item) => item.status === "passed")) {
    return "passed";
  }

  if (items.every((item) => item.status === "readiness_not_run")) {
    return "readiness_not_run";
  }

  return "partial_live_passed";
}

function makeFixtureSha256(index) {
  const digit = ((index % 15) + 1).toString(16);
  return digit.repeat(64);
}

function mutate(value, mutator) {
  const ledger = clone(value);
  mutator(ledger);
  return ledger;
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
