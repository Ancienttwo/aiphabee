#!/usr/bin/env node
import { deriveLiveSmokeLedgerUpdateReview } from "./check-live-smoke-ledger-update-review-contract.mjs";

const requiredCaptureIds = [
  "cloudflare_resource_inventory",
  "cloudflare_bindings_functional",
  "ai_gateway_model_execution",
  "ai_gateway_observability",
  "observability_otlp_eval_store",
  "provider_secret_store_rotation"
];
const passedPackets = Object.fromEntries(requiredCaptureIds.map((id) => [id, "passed"]));
const missingPackets = {};
const passedSurfaces = Object.fromEntries(requiredCaptureIds.map((id) => [id, "passed"]));
const blockedSurfaces = Object.fromEntries(requiredCaptureIds.map((id) => [id, "readiness_not_run"]));
const scenarios = [
  {
    expected_completion_allowed: 0,
    expected_ready_for_update: 0,
    expected_release_allowed: false,
    name: "no packets and blocked ledger surfaces",
    packet_statuses: missingPackets,
    surface_statuses: blockedSurfaces
  },
  {
    expected_completion_allowed: 0,
    expected_ready_for_update: 6,
    expected_release_allowed: false,
    name: "passed packets make all surfaces ready for ledger update but not release",
    packet_statuses: passedPackets,
    surface_statuses: blockedSurfaces
  },
  {
    expected_completion_allowed: 0,
    expected_ready_for_update: 0,
    expected_release_allowed: false,
    name: "ledger surfaces alone do not unlock release",
    packet_statuses: missingPackets,
    surface_statuses: passedSurfaces
  },
  {
    expected_completion_allowed: 6,
    expected_ready_for_update: 0,
    expected_release_allowed: true,
    name: "passed packets and passed ledger surfaces unlock transition",
    packet_statuses: passedPackets,
    surface_statuses: passedSurfaces
  }
];
const errors = [];

for (const scenario of scenarios) {
  const review = deriveLiveSmokeLedgerUpdateReview({
    capturePacketResult: {
      packet_statuses: scenario.packet_statuses
    },
    ledger: {
      surfaces: requiredCaptureIds.map((id) => ({
        current_status: scenario.surface_statuses[id],
        evidence_refs: scenario.surface_statuses[id] === "passed" ? [`sha256:${"a".repeat(64)}`] : [],
        id,
        missing_evidence: scenario.surface_statuses[id] === "passed" ? [] : [`${id}_evidence_missing`]
      }))
    }
  });

  if (review.ready_for_ledger_update_count !== scenario.expected_ready_for_update) {
    errors.push(`${scenario.name}: ready_for_ledger_update_count mismatch`);
  }
  if (review.completion_allowed_count !== scenario.expected_completion_allowed) {
    errors.push(`${scenario.name}: completion_allowed_count mismatch`);
  }
  if (review.release_transition_allowed !== scenario.expected_release_allowed) {
    errors.push(`${scenario.name}: release_transition_allowed mismatch`);
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_live_smoke_ledger_update_review_fixtures" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      completion_scenarios: 1,
      ready_for_update_scenarios: 1,
      blocked_scenarios: 2,
      scenarios: scenarios.length,
      status: "ok"
    },
    null,
    2
  )
);
