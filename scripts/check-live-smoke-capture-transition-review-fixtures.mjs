#!/usr/bin/env node
import { deriveLiveSmokeCaptureTransitionReview } from "./check-live-smoke-capture-transition-review-contract.mjs";

const requiredCaptureIds = [
  "cloudflare_resource_inventory",
  "cloudflare_bindings_functional",
  "ai_gateway_model_execution",
  "ai_gateway_observability",
  "observability_otlp_eval_store",
  "provider_secret_store_rotation"
];

const scenarios = [
  {
    expected_allowed: 0,
    name: "no packets and blocked ledger surfaces",
    packet_statuses: {},
    surface_statuses: Object.fromEntries(requiredCaptureIds.map((id) => [id, "readiness_not_run"]))
  },
  {
    expected_allowed: 0,
    name: "passed capture packet alone does not unlock review",
    packet_statuses: Object.fromEntries(requiredCaptureIds.map((id) => [id, "passed"])),
    surface_statuses: Object.fromEntries(requiredCaptureIds.map((id) => [id, "readiness_not_run"]))
  },
  {
    expected_allowed: 1,
    name: "single passed ledger surface unlocks only its own review",
    packet_statuses: Object.fromEntries(requiredCaptureIds.map((id) => [id, "passed"])),
    surface_statuses: {
      ...Object.fromEntries(requiredCaptureIds.map((id) => [id, "readiness_not_run"])),
      cloudflare_resource_inventory: "passed"
    }
  },
  {
    expected_allowed: 6,
    name: "all packets and all ledger surfaces passed",
    packet_statuses: Object.fromEntries(requiredCaptureIds.map((id) => [id, "passed"])),
    surface_statuses: Object.fromEntries(requiredCaptureIds.map((id) => [id, "passed"]))
  }
];

const errors = [];

for (const scenario of scenarios) {
  const transitionReview = deriveLiveSmokeCaptureTransitionReview({
    capturePacketResult: {
      packet_statuses: scenario.packet_statuses
    },
    ledger: {
      surfaces: requiredCaptureIds.map((id) => ({
        current_status: scenario.surface_statuses[id],
        id,
        missing_evidence: scenario.surface_statuses[id] === "passed" ? [] : [`${id}_evidence_missing`]
      }))
    }
  });

  if (transitionReview.completion_allowed_count !== scenario.expected_allowed) {
    errors.push(`${scenario.name}: expected ${scenario.expected_allowed} allowed reviews`);
  }

  const expectedReleaseAllowed = scenario.expected_allowed === requiredCaptureIds.length;
  if (transitionReview.release_transition_allowed !== expectedReleaseAllowed) {
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
