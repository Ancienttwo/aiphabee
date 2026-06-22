#!/usr/bin/env node
import { deriveMcpTargetClientLiveE2eTransitionReview } from "./check-mcp-target-client-live-e2e-transition-review-contract.mjs";

const requiredClientNames = [
  "mcp_inspector",
  "typescript_sdk_client",
  "claude_desktop",
  "cursor",
  "chatgpt_connector"
];

const acceptedStatuses = Object.fromEntries(requiredClientNames.map((clientName) => [clientName, "accepted"]));
const missingStatuses = {};

const scenarios = [
  {
    expected_allowed: 0,
    flags: allFalseFlags(),
    name: "no packets and no live console surfaces",
    packet_statuses: missingStatuses
  },
  {
    expected_allowed: 0,
    flags: allFalseFlags(),
    name: "accepted target-client packet alone does not complete MCP-09",
    packet_statuses: acceptedStatuses
  },
  {
    expected_allowed: 1,
    flags: allTrueFlags(),
    name: "single accepted packet with all live gates unlocks only one client",
    packet_statuses: {
      mcp_inspector: "accepted"
    }
  },
  {
    expected_allowed: 5,
    flags: allTrueFlags(),
    name: "all packets and all linked live gates passed",
    packet_statuses: acceptedStatuses
  }
];

const errors = [];

for (const scenario of scenarios) {
  const review = deriveMcpTargetClientLiveE2eTransitionReview({
    developerConsole: developerConsoleContract(scenario.flags),
    handoff: handoffContract(scenario.flags),
    logStoreSmoke: logStoreSmokeContract(scenario.flags),
    packetResult: {
      packet_statuses: scenario.packet_statuses
    },
    targetGate: targetGateContract(scenario.flags)
  });

  if (review.completion_allowed_count !== scenario.expected_allowed) {
    errors.push(`${scenario.name}: expected ${scenario.expected_allowed} allowed decisions`);
  }

  const expectedReleaseAllowed = scenario.expected_allowed === requiredClientNames.length;
  if (review.release_transition_allowed !== expectedReleaseAllowed) {
    errors.push(`${scenario.name}: release_transition_allowed mismatch`);
  }
}

if (errors.length > 0) {
  console.error(
    JSON.stringify(
      {
        errors,
        status: "invalid_fixtures"
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      allowed_scenarios: 1,
      blocked_scenarios: 2,
      partial_scenarios: 1,
      scenarios: scenarios.length,
      status: "ok"
    },
    null,
    2
  )
);

function allFalseFlags() {
  return {
    developerConsoleLive: false,
    developerConsoleUi: false,
    liveApiKeyGeneration: false,
    liveConsoleLogStore: false,
    liveOauthProvider: false,
    liveTargetClientE2e: false,
    liveUsageLedgerReads: false,
    productionConsoleLogStore: false,
    publicStatusPageDeploy: false
  };
}

function allTrueFlags() {
  return Object.fromEntries(Object.keys(allFalseFlags()).map((key) => [key, true]));
}

function targetGateContract(flags) {
  return {
    developer_console_live: flags.developerConsoleLive,
    frontend_rendering: flags.developerConsoleUi,
    live_console_log_store: flags.liveConsoleLogStore,
    live_usage_ledger_reads: flags.liveUsageLedgerReads,
    target_client_policy: {
      live_e2e_passed: flags.liveTargetClientE2e
    }
  };
}

function developerConsoleContract(flags) {
  return {
    credential_policy: {
      api_key: {
        live_api_key_generation: flags.liveApiKeyGeneration
      },
      oauth: {
        live_oauth_provider: flags.liveOauthProvider
      }
    },
    developer_console_live: flags.developerConsoleLive,
    frontend_rendering: flags.developerConsoleUi,
    live_console_log_store: flags.liveConsoleLogStore,
    live_usage_ledger_reads: flags.liveUsageLedgerReads
  };
}

function logStoreSmokeContract(flags) {
  return {
    production_console_log_store: flags.productionConsoleLogStore
  };
}

function handoffContract(flags) {
  return {
    developer_console_ui: flags.developerConsoleUi,
    live_target_client_e2e: flags.liveTargetClientE2e,
    public_status_page_deploy: flags.publicStatusPageDeploy
  };
}
