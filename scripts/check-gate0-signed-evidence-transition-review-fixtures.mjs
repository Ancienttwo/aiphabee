#!/usr/bin/env node
import { deriveGate0SignedEvidenceTransitionReview } from "./check-gate0-signed-evidence-transition-review-contract.mjs";

const requiredPacketIds = [
  "field_rights_matrix",
  "hkex_vendor_licensing_memo",
  "type4_product_boundary_opinion",
  "pcpd_privacy_path_assessment",
  "commercial_settlement_schedule",
  "gate0_signature_register"
];
const acceptedStatuses = Object.fromEntries(requiredPacketIds.map((packetId) => [packetId, "accepted"]));
const scenarios = [
  {
    expected_allowed: 0,
    flags: allFalseFlags(),
    name: "no packets and no external approvals",
    packet_statuses: {}
  },
  {
    expected_allowed: 0,
    flags: allFalseFlags(),
    name: "accepted packet alone does not complete Gate 0",
    packet_statuses: acceptedStatuses
  },
  {
    expected_allowed: 1,
    flags: allTrueFlags(),
    name: "single accepted packet with manifest and intake approvals unlocks one packet only",
    packet_statuses: {
      field_rights_matrix: "accepted"
    }
  },
  {
    expected_allowed: 6,
    flags: allTrueFlags(),
    name: "all packets with manifest and intake approvals unlock Gate 0 transition",
    packet_statuses: acceptedStatuses
  }
];
const errors = [];

for (const scenario of scenarios) {
  const review = deriveGate0SignedEvidenceTransitionReview({
    intake: intakeContract(scenario.flags),
    manifest: manifestContract(scenario.flags),
    packetResult: {
      packet_statuses: scenario.packet_statuses
    }
  });

  if (review.completion_allowed_count !== scenario.expected_allowed) {
    errors.push(`${scenario.name}: expected ${scenario.expected_allowed} allowed decisions`);
  }

  const expectedReleaseAllowed = scenario.expected_allowed === requiredPacketIds.length;
  if (review.release_transition_allowed !== expectedReleaseAllowed) {
    errors.push(`${scenario.name}: release_transition_allowed mismatch`);
  }

  if (review.external_approvals_complete !== expectedReleaseAllowed) {
    errors.push(`${scenario.name}: external_approvals_complete mismatch`);
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
    commercialTermsSigned: false,
    externalApprovalsComplete: false,
    gate0SignatureComplete: false,
    legalOpinionReceived: false,
    manifestExternalApprovalsComplete: false,
    manifestReleaseTransitionAllowed: false,
    partnerSignedMatrixLoaded: false,
    pcpdPathApproved: false
  };
}

function allTrueFlags() {
  return Object.fromEntries(Object.keys(allFalseFlags()).map((key) => [key, true]));
}

function manifestContract(flags) {
  return {
    external_approvals_complete: flags.manifestExternalApprovalsComplete,
    release_transition_allowed: flags.manifestReleaseTransitionAllowed,
    required_packets: requiredPacketIds.map((packetId) => ({
      id: packetId,
      status: flags.manifestExternalApprovalsComplete ? "accepted" : "missing"
    }))
  };
}

function intakeContract(flags) {
  return {
    commercial_terms_signed: flags.commercialTermsSigned,
    external_approvals_complete: flags.externalApprovalsComplete,
    gate0_signature_complete: flags.gate0SignatureComplete,
    legal_opinion_received: flags.legalOpinionReceived,
    partner_signed_matrix_loaded: flags.partnerSignedMatrixLoaded,
    pcpd_path_approved: flags.pcpdPathApproved,
    required_evidence_packets: requiredPacketIds.map((packetId) => ({
      id: packetId,
      status: flags.externalApprovalsComplete ? "accepted" : "pending_external"
    }))
  };
}
