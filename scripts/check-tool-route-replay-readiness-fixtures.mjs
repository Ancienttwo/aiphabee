#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateReadiness } from "./check-tool-route-replay-readiness-contract.mjs";

const contractPath = "deploy/governance/sprint1-tool-route-replay-readiness.contract.json";
const packagePath = "package.json";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const todosPath = "tasks/todos.md";

const baseReadiness = readJson(contractPath);
const baseContext = {
  packageJson: readJson(packagePath),
  todos: readText(todosPath),
  tracker: readText(trackerPath)
};
const baseContracts = {
  agentToolEnforcement: readJson("deploy/agent/tool-enforcement.contract.json"),
  evidenceLineageService: readJson("deploy/evidence/service.contract.json"),
  evidenceLineageTools: readJson("deploy/tools/evidence-lineage.contract.json"),
  goldenManifest: readJson("tests/golden/tools/manifest.json"),
  mcpPaginationLimits: readJson("deploy/mcp/pagination-limits.contract.json"),
  mcpProtocolReleaseGate: readJson("deploy/mcp/protocol-release-gate.contract.json"),
  mcpSchemaValidation: readJson("deploy/mcp/tool-schema-validation.contract.json"),
  mcpUsageEnvelope: readJson("deploy/mcp/usage-envelope.contract.json"),
  mcpVersioning: readJson("deploy/mcp/tool-versioning.contract.json"),
  p0ToolCatalog: readJson("deploy/tools/p0-tool-catalog.contract.json"),
  toolRegistry: readJson("deploy/tools/registry.contract.json"),
  toolSchemas: readJson("deploy/tools/tool-schemas.contract.json")
};

const scenarios = [
  {
    expectValid: true,
    name: "current_blocked_readiness",
    readiness: baseReadiness
  },
  {
    expectedError: "route_replay_policy.release_transition_allowed must be false until live blockers clear",
    expectValid: false,
    name: "early_release_transition",
    readiness: mutate(baseReadiness, (readiness) => {
      readiness.route_replay_policy.release_transition_allowed = true;
    })
  },
  {
    expectedError: "route_replay_policy.live_route_replay must be false until server orchestration exists",
    expectValid: false,
    name: "live_route_replay_claimed",
    readiness: mutate(baseReadiness, (readiness) => {
      readiness.route_replay_policy.live_route_replay = true;
    })
  },
  {
    expectedError: "not_claimed must include runtime_schema_serving",
    expectValid: false,
    name: "missing_runtime_schema_blocker_not_claimed",
    readiness: mutate(baseReadiness, (readiness) => {
      readiness.not_claimed = readiness.not_claimed.filter((item) => item !== "runtime_schema_serving");
    })
  },
  {
    expectedError: "p0 tool catalog p0_tool_count must be 16",
    expectValid: false,
    name: "p0_catalog_count_drift",
    contracts: mutate(baseContracts, (contracts) => {
      contracts.p0ToolCatalog.p0_tool_count = 15;
    }),
    readiness: baseReadiness
  },
  {
    expectedError: "golden manifest must contain exactly 16 samples",
    expectValid: false,
    name: "golden_manifest_missing_tool",
    contracts: mutate(baseContracts, (contracts) => {
      contracts.goldenManifest.samples = contracts.goldenManifest.samples.slice(0, 15);
    }),
    readiness: baseReadiness
  },
  {
    expectedError: "tracker must keep Sprint 1.2 exit DoD unchecked",
    expectValid: false,
    name: "tracker_dod_checked_too_early",
    readiness: baseReadiness,
    tracker: baseContext.tracker.replace(
      "**退出门槛 DoD：** ☐ 6–8 工具黄金样本一致",
      "**退出门槛 DoD：** ☑ 6–8 工具黄金样本一致"
    )
  },
  {
    expectedError: "root check must include check:tool-route-replay-readiness-fixtures",
    expectValid: false,
    name: "fixture_checker_not_in_root_check",
    packageJson: mutate(baseContext.packageJson, (packageJson) => {
      packageJson.scripts.check = packageJson.scripts.check.replace(
        " && npm run check:tool-route-replay-readiness-fixtures",
        ""
      );
    }),
    readiness: baseReadiness
  }
];

const failures = [];

for (const scenario of scenarios) {
  const errors = validateReadiness({
    contracts: scenario.contracts ?? baseContracts,
    packageJson: scenario.packageJson ?? baseContext.packageJson,
    readiness: scenario.readiness,
    todos: scenario.todos ?? baseContext.todos,
    tracker: scenario.tracker ?? baseContext.tracker
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

function mutate(value, mutator) {
  const cloned = clone(value);
  mutator(cloned);
  return cloned;
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
