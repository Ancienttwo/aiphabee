#!/usr/bin/env node
import { deriveP0OpenRequirementTransitionReview } from "./check-p0-open-requirement-transition-review-contract.mjs";

const scenarios = [
  {
    expected_all_completion_allowed: false,
    expected_completion_allowed: {
      "AGT-01": false,
      "AGT-07": false,
      "MCP-09": false
    },
    name: "missing packets and blocked gates",
    packetStatuses: {},
    gatesReady: []
  },
  {
    expected_all_completion_allowed: false,
    expected_completion_allowed: {
      "AGT-01": false,
      "AGT-07": false,
      "MCP-09": false
    },
    name: "accepted packet alone is insufficient",
    packetStatuses: acceptedPackets(),
    gatesReady: []
  },
  {
    expected_all_completion_allowed: false,
    expected_completion_allowed: {
      "AGT-01": true,
      "AGT-07": false,
      "MCP-09": false
    },
    name: "partial gates only unlock the matching requirement",
    packetStatuses: acceptedPackets(),
    gatesReady: ["AGT-01"]
  },
  {
    expected_all_completion_allowed: true,
    expected_completion_allowed: {
      "AGT-01": true,
      "AGT-07": true,
      "MCP-09": true
    },
    name: "all accepted packets and all linked gates unlock transition",
    packetStatuses: acceptedPackets(),
    gatesReady: ["AGT-01", "AGT-07", "MCP-09"]
  }
];

const errors = [];

for (const scenario of scenarios) {
  const transitionReview = deriveP0OpenRequirementTransitionReview({
    linkedContracts: buildLinkedContracts(scenario.gatesReady),
    packetResult: {
      all_required_accepted: Object.keys(scenario.packetStatuses).length === 3,
      errors: [],
      packet_files: [],
      packet_statuses: scenario.packetStatuses,
      status: "fixture"
    }
  });

  if (transitionReview.all_completion_allowed !== scenario.expected_all_completion_allowed) {
    errors.push(
      `${scenario.name}: all_completion_allowed expected ${scenario.expected_all_completion_allowed} but received ${transitionReview.all_completion_allowed}`
    );
  }

  for (const decision of transitionReview.decisions) {
    const expected = scenario.expected_completion_allowed[decision.requirement_code];

    if (decision.completion_allowed !== expected) {
      errors.push(
        `${scenario.name}: ${decision.requirement_code} completion_allowed expected ${expected} but received ${decision.completion_allowed}`
      );
    }
    if (decision.completion_allowed === true && decision.packet_accepted !== true) {
      errors.push(`${scenario.name}: ${decision.requirement_code} unlocked without accepted packet`);
    }
    if (decision.completion_allowed === true && decision.linked_release_gates_ready !== true) {
      errors.push(`${scenario.name}: ${decision.requirement_code} unlocked without linked release gates`);
    }
  }
}

if (errors.length > 0) {
  emit(
    {
      errors,
      scenarios: scenarios.length,
      status: "invalid_p0_open_requirement_transition_review_fixtures"
    },
    1
  );
}

emit(
  {
    allowed_scenarios: 1,
    blocked_scenarios: 2,
    partial_scenarios: 1,
    scenarios: scenarios.length,
    status: "ok"
  },
  0
);

function acceptedPackets() {
  return {
    "AGT-01": "accepted",
    "AGT-07": "accepted",
    "MCP-09": "accepted"
  };
}

function buildLinkedContracts(gatesReady) {
  const ready = new Set(gatesReady);

  return {
    developerConsole: {
      developer_console_live: ready.has("MCP-09"),
      frontend_rendering: ready.has("MCP-09"),
      live_console_log_store: ready.has("MCP-09"),
      live_usage_ledger_reads: ready.has("MCP-09")
    },
    generatedEvidence: {
      frontend: ready.has("AGT-07"),
      live_evidence_writes: ready.has("AGT-07")
    },
    liveModelStreaming: {
      release_transition_allowed: ready.has("AGT-01")
    },
    modelCorpus: {
      release_transition_allowed: ready.has("AGT-07")
    },
    postGeneration: {
      not_claimed: ready.has("AGT-07") ? [] : ["frontend_evidence_card_rendering"]
    },
    targetClientHandoff: {
      all_target_client_packets_accepted: ready.has("MCP-09")
    },
    targetClientsConsoleGate: {
      frontend_rendering: ready.has("MCP-09"),
      live_client_e2e_passed: ready.has("MCP-09"),
      live_console_log_store: ready.has("MCP-09"),
      live_usage_ledger_reads: ready.has("MCP-09")
    },
    userToolLoop: {
      release_transition_allowed: ready.has("AGT-01")
    }
  };
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;

  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
