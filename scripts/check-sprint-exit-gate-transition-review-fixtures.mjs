#!/usr/bin/env node
import { deriveSprintExitGateTransitionReview } from "./check-sprint-exit-gate-transition-review-contract.mjs";

const sprintId = "1.2";
const phaseId = "1";
const blockerId = "sprint1_live_data_evidence";

const scenarios = [
  {
    expected_phase_allowed: false,
    expected_sprint_allowed: false,
    name: "incomplete backlog blocks even when blocker manifest is clear",
    phase_reviews: [phaseReview()],
    sprint_reviews: [sprintReview()],
    blocker_manifest_states: readyBlockers(),
    sprint_rows: sprintRows("12 / 13")
  },
  {
    expected_phase_allowed: false,
    expected_sprint_allowed: false,
    expected_condition: `blocker_manifest:${blockerId}`,
    name: "backlog count alone never completes sprint when blocker manifest is still blocked",
    phase_reviews: [phaseReview()],
    sprint_reviews: [sprintReview()],
    blocker_manifest_states: blockedBlockers(),
    sprint_rows: sprintRows("13 / 13")
  },
  {
    expected_phase_allowed: false,
    expected_sprint_allowed: false,
    expected_condition: "frontend_release_evidence_missing",
    name: "manual blocking condition blocks a full backlog row",
    phase_reviews: [phaseReview({ manual_blocking_conditions: ["frontend_release_evidence_missing"] })],
    sprint_reviews: [
      sprintReview({ manual_blocking_conditions: ["frontend_release_evidence_missing"] })
    ],
    blocker_manifest_states: readyBlockers(),
    sprint_rows: sprintRows("13 / 13")
  },
  {
    expected_phase_allowed: true,
    expected_sprint_allowed: true,
    name: "full backlog plus clear blockers allows sprint and phase transition",
    phase_reviews: [phaseReview()],
    sprint_reviews: [sprintReview()],
    blocker_manifest_states: readyBlockers(),
    sprint_rows: sprintRows("13 / 13")
  },
  {
    expected_phase_allowed: false,
    expected_sprint_allowed: true,
    expected_phase_condition: "child_sprint:1.3",
    name: "phase transition requires every child sprint to be allowed",
    phase_reviews: [phaseReview({ child_sprint_ids: [sprintId, "1.3"] })],
    sprint_reviews: [sprintReview()],
    blocker_manifest_states: readyBlockers(),
    sprint_rows: sprintRows("13 / 13")
  }
];

const errors = [];

for (const scenario of scenarios) {
  const review = deriveSprintExitGateTransitionReview({
    blockerManifestStates: scenario.blocker_manifest_states,
    phaseReviews: scenario.phase_reviews,
    phaseRows: phaseRows(),
    sprintReviews: scenario.sprint_reviews,
    sprintRows: scenario.sprint_rows
  });
  const sprintReviewResult = review.sprint_exit_gate_reviews[0];
  const phaseReviewResult = review.phase_exit_gate_reviews[0];

  if (sprintReviewResult.completion_allowed !== scenario.expected_sprint_allowed) {
    errors.push(`${scenario.name}: sprint completion_allowed mismatch`);
  }
  if (phaseReviewResult.completion_allowed !== scenario.expected_phase_allowed) {
    errors.push(`${scenario.name}: phase completion_allowed mismatch`);
  }
  if (
    scenario.expected_condition &&
    !sprintReviewResult.blocking_conditions.includes(scenario.expected_condition)
  ) {
    errors.push(`${scenario.name}: expected sprint condition ${scenario.expected_condition}`);
  }
  if (
    scenario.expected_phase_condition &&
    !phaseReviewResult.blocking_conditions.includes(scenario.expected_phase_condition)
  ) {
    errors.push(`${scenario.name}: expected phase condition ${scenario.expected_phase_condition}`);
  }
  if (
    review.release_transition_allowed !==
    (scenario.expected_sprint_allowed && scenario.expected_phase_allowed)
  ) {
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
      blocked_scenarios: 4,
      scenarios: scenarios.length,
      status: "ok"
    },
    null,
    2
  )
);

function sprintReview(overrides = {}) {
  return {
    blocker_manifest_ids: [blockerId],
    manual_blocking_conditions: [],
    sprint_id: sprintId,
    tracker_exit_gate: "☐",
    ...overrides
  };
}

function phaseReview(overrides = {}) {
  return {
    blocker_manifest_ids: [blockerId],
    child_sprint_ids: [sprintId],
    manual_blocking_conditions: [],
    phase_id: phaseId,
    tracker_exit_gate: "☐",
    ...overrides
  };
}

function readyBlockers() {
  return {
    [blockerId]: {
      release_transition_allowed: true
    }
  };
}

function blockedBlockers() {
  return {
    [blockerId]: {
      release_transition_allowed: false
    }
  };
}

function sprintRows(backlog) {
  return new Map([
    [
      sprintId,
      {
        backlog,
        exitGate: "☐"
      }
    ]
  ]);
}

function phaseRows() {
  return new Map([
    [
      phaseId,
      {
        exitGate: "☐"
      }
    ]
  ]);
}
