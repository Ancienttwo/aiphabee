export const LICENSED_ADVICE_RUNTIME_VERSION =
  "2026-06-22.phase4.licensed-advice-exploration-scaffold.v0";

export const LICENSED_ADVICE_SURFACES = [
  "personalized_buy_sell_hold",
  "portfolio_rebalance",
  "position_sizing",
  "suitability_based_recommendation",
  "licensed_partner_referral"
] as const;
export const LICENSED_ADVICE_REQUIREMENTS = [
  "type4_written_opinion",
  "licensed_entity_or_partner",
  "responsible_officer_supervision",
  "suitability_profile_controls",
  "advice_record_retention",
  "human_review_escalation",
  "kill_switch_policy",
  "complaint_handling_path"
] as const;
export const FORBIDDEN_UNLICENSED_ADVICE_OUTPUTS = [
  "buy_sell_hold_recommendation",
  "target_position_size",
  "personalized_suitability_conclusion",
  "order_routing",
  "copy_trading_instruction"
] as const;
export const REGULATORY_SOURCE_URLS = [
  "https://www.sfc.hk/en/Regulatory-functions/Intermediaries/Licensing/Do-you-need-a-licence-or-registration",
  "https://www.sfc.hk/en/Rules-and-standards/Suitability-requirement"
] as const;

export type LicensedAdviceSurface = (typeof LICENSED_ADVICE_SURFACES)[number];
export type LicensedAdviceRequirement = (typeof LICENSED_ADVICE_REQUIREMENTS)[number];
export type ForbiddenUnlicensedAdviceOutput =
  (typeof FORBIDDEN_UNLICENSED_ADVICE_OUTPUTS)[number];
export type LegalReviewStatus = "approved" | "pending" | "rejected";
export type LicensedAdviceExplorationPlanStatus =
  | "blocked_missing_context"
  | "blocked_supervision_controls_missing"
  | "blocked_suitability_controls_missing"
  | "blocked_unlicensed_path"
  | "blocked_unsupported_surface"
  | "planned_no_write";

export interface LicensedAdviceExplorationPlanInput {
  adviceRecordRetentionPolicyId?: string;
  complaintHandlingPolicyId?: string;
  humanReviewQueueId?: string;
  killSwitchPolicyId?: string;
  legalReviewStatus?: string;
  licensedEntityId?: string;
  proposedSurface?: string;
  requestId: string;
  responsibleOfficerId?: string;
  suitabilityProfileSchemaId?: string;
  type4WrittenOpinionId?: string;
  workspaceId?: string;
}

export interface LicensedAdviceRuntimeCapabilities {
  advice_generation_enabled: false;
  auth_required: true;
  default_status: "blocked_until_licensed_path_confirmed";
  exploration_plan: LicensedAdviceExplorationCapabilities;
  frontend: false;
  live_model_execution: false;
  order_execution: false;
  package: "@aiphabee/licensed-advice-runtime";
  persistent_writes: false;
  route: "GET /compliance/licensed-advice/runtime";
  runtime_route: "GET /compliance/licensed-advice/runtime";
  sql_emitted: false;
  status: "licensed_advice_exploration_scaffold";
  version: typeof LICENSED_ADVICE_RUNTIME_VERSION;
}

export interface LicensedAdviceExplorationCapabilities {
  advice_generation_enabled: false;
  allowed_surfaces: typeof LICENSED_ADVICE_SURFACES;
  forbidden_unlicensed_outputs: typeof FORBIDDEN_UNLICENSED_ADVICE_OUTPUTS;
  frontend: false;
  live_model_execution: false;
  order_execution: false;
  package: "@aiphabee/licensed-advice-runtime";
  persistent_writes: false;
  regulatory_source_urls: typeof REGULATORY_SOURCE_URLS;
  required_controls: typeof LICENSED_ADVICE_REQUIREMENTS;
  route: "POST /compliance/licensed-advice/exploration/plan";
  runtime_route: "GET /compliance/licensed-advice/runtime";
  sql_emitted: false;
  status: "licensed_advice_exploration_scaffold";
  tables: readonly [
    "core.licensed_advice_exploration",
    "core.suitability_control_profile",
    "audit.licensed_advice_review_event",
    "governance.licensed_advice_exploration_contract"
  ];
  version: typeof LICENSED_ADVICE_RUNTIME_VERSION;
}

export interface LicensedAdviceExplorationPlan {
  advice_output_policy: Record<ForbiddenUnlicensedAdviceOutput, false> & {
    evidence_only_fallback: true;
    research_tool_boundary_preserved_until_licensed: true;
  };
  capability: LicensedAdviceExplorationCapabilities;
  compliance_controls: {
    answer_evidence_route: "POST /agent/runs/validate-answer";
    compliance_release_gate_route: "POST /public/release-gates/compliance-ops/plan";
    kill_switch_policy_id?: string;
    kill_switch_route: "POST /agent/kill-switch/plan";
    mvp_boundary_contract: "deploy/public-ops/mvp-product-boundary-copy.contract.json";
  };
  frontend: false;
  legal_review: {
    external_legal_opinion_required: true;
    legal_review_status: LegalReviewStatus;
    regulatory_source_urls: typeof REGULATORY_SOURCE_URLS;
    type4_written_opinion_id?: string;
  };
  licensed_path: {
    licensed_entity_id?: string;
    proposed_surface: LicensedAdviceSurface;
    responsible_officer_id?: string;
    route2_source: "docs/researches/AiphaBee_PRD_v1.0.md#14.2";
    supervision_required: true;
  };
  live_model_execution: false;
  order_execution: false;
  persistent_writes: false;
  request_id: string;
  sql_emitted: false;
  status: LicensedAdviceExplorationPlanStatus;
  suitability_controls: {
    advice_record_retention_policy_id?: string;
    complaint_handling_policy_id?: string;
    human_review_queue_id?: string;
    suitability_profile_schema_id?: string;
    suitability_required: true;
  };
  tables: LicensedAdviceExplorationCapabilities["tables"];
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  validation: {
    allowed_surfaces: typeof LICENSED_ADVICE_SURFACES;
    legal_review_approved: boolean;
    licensed_path_present: boolean;
    required_context_present: boolean;
    supervision_controls_present: boolean;
    suitability_controls_present: boolean;
    unsupported_surfaces: string[];
  };
  version: typeof LICENSED_ADVICE_RUNTIME_VERSION;
  workspace_id: string;
}

const LICENSED_ADVICE_TABLES: LicensedAdviceExplorationCapabilities["tables"] = [
  "core.licensed_advice_exploration",
  "core.suitability_control_profile",
  "audit.licensed_advice_review_event",
  "governance.licensed_advice_exploration_contract"
];

export function getLicensedAdviceRuntimeCapabilities(): LicensedAdviceRuntimeCapabilities {
  return {
    advice_generation_enabled: false,
    auth_required: true,
    default_status: "blocked_until_licensed_path_confirmed",
    exploration_plan: getLicensedAdviceExplorationCapabilities(),
    frontend: false,
    live_model_execution: false,
    order_execution: false,
    package: "@aiphabee/licensed-advice-runtime",
    persistent_writes: false,
    route: "GET /compliance/licensed-advice/runtime",
    runtime_route: "GET /compliance/licensed-advice/runtime",
    sql_emitted: false,
    status: "licensed_advice_exploration_scaffold",
    version: LICENSED_ADVICE_RUNTIME_VERSION
  };
}

export function getLicensedAdviceExplorationCapabilities(): LicensedAdviceExplorationCapabilities {
  return {
    advice_generation_enabled: false,
    allowed_surfaces: LICENSED_ADVICE_SURFACES,
    forbidden_unlicensed_outputs: FORBIDDEN_UNLICENSED_ADVICE_OUTPUTS,
    frontend: false,
    live_model_execution: false,
    order_execution: false,
    package: "@aiphabee/licensed-advice-runtime",
    persistent_writes: false,
    regulatory_source_urls: REGULATORY_SOURCE_URLS,
    required_controls: LICENSED_ADVICE_REQUIREMENTS,
    route: "POST /compliance/licensed-advice/exploration/plan",
    runtime_route: "GET /compliance/licensed-advice/runtime",
    sql_emitted: false,
    status: "licensed_advice_exploration_scaffold",
    tables: LICENSED_ADVICE_TABLES,
    version: LICENSED_ADVICE_RUNTIME_VERSION
  };
}

export function createLicensedAdviceExplorationPlan(
  input: LicensedAdviceExplorationPlanInput
): LicensedAdviceExplorationPlan {
  const proposedSurfaceCandidates = normalizeStringList(
    input.proposedSurface === undefined ? [] : [input.proposedSurface]
  );
  const unsupportedSurfaces = proposedSurfaceCandidates.filter(
    (surface) => !isLicensedAdviceSurface(surface)
  );
  const proposedSurface = isLicensedAdviceSurface(input.proposedSurface)
    ? input.proposedSurface
    : "licensed_partner_referral";
  const legalReviewStatus = normalizeLegalReviewStatus(input.legalReviewStatus);
  const requiredContextPresent =
    isNonEmptyString(input.workspaceId) && isNonEmptyString(input.proposedSurface);
  const licensedPathPresent =
    isNonEmptyString(input.licensedEntityId) &&
    isNonEmptyString(input.type4WrittenOpinionId) &&
    legalReviewStatus === "approved";
  const supervisionControlsPresent =
    isNonEmptyString(input.responsibleOfficerId) &&
    isNonEmptyString(input.killSwitchPolicyId) &&
    isNonEmptyString(input.complaintHandlingPolicyId);
  const suitabilityControlsPresent =
    isNonEmptyString(input.suitabilityProfileSchemaId) &&
    isNonEmptyString(input.adviceRecordRetentionPolicyId) &&
    isNonEmptyString(input.humanReviewQueueId);
  const status: LicensedAdviceExplorationPlanStatus =
    !requiredContextPresent
      ? "blocked_missing_context"
      : unsupportedSurfaces.length > 0
        ? "blocked_unsupported_surface"
        : !licensedPathPresent
          ? "blocked_unlicensed_path"
          : !suitabilityControlsPresent
            ? "blocked_suitability_controls_missing"
            : !supervisionControlsPresent
              ? "blocked_supervision_controls_missing"
              : "planned_no_write";
  const planned = status === "planned_no_write";

  return {
    advice_output_policy: {
      buy_sell_hold_recommendation: false,
      copy_trading_instruction: false,
      evidence_only_fallback: true,
      order_routing: false,
      personalized_suitability_conclusion: false,
      research_tool_boundary_preserved_until_licensed: true,
      target_position_size: false
    },
    capability: getLicensedAdviceExplorationCapabilities(),
    compliance_controls: {
      answer_evidence_route: "POST /agent/runs/validate-answer",
      compliance_release_gate_route: "POST /public/release-gates/compliance-ops/plan",
      kill_switch_policy_id: normalizeString(input.killSwitchPolicyId),
      kill_switch_route: "POST /agent/kill-switch/plan",
      mvp_boundary_contract: "deploy/public-ops/mvp-product-boundary-copy.contract.json"
    },
    frontend: false,
    legal_review: {
      external_legal_opinion_required: true,
      legal_review_status: legalReviewStatus,
      regulatory_source_urls: REGULATORY_SOURCE_URLS,
      type4_written_opinion_id: normalizeString(input.type4WrittenOpinionId)
    },
    licensed_path: {
      licensed_entity_id: normalizeString(input.licensedEntityId),
      proposed_surface: proposedSurface,
      responsible_officer_id: normalizeString(input.responsibleOfficerId),
      route2_source: "docs/researches/AiphaBee_PRD_v1.0.md#14.2",
      supervision_required: true
    },
    live_model_execution: false,
    order_execution: false,
    persistent_writes: false,
    request_id: input.requestId,
    sql_emitted: false,
    status,
    suitability_controls: {
      advice_record_retention_policy_id: normalizeString(input.adviceRecordRetentionPolicyId),
      complaint_handling_policy_id: normalizeString(input.complaintHandlingPolicyId),
      human_review_queue_id: normalizeString(input.humanReviewQueueId),
      suitability_profile_schema_id: normalizeString(input.suitabilityProfileSchemaId),
      suitability_required: true
    },
    tables: LICENSED_ADVICE_TABLES,
    usage: {
      cached: false,
      credits: 0,
      rows: planned ? LICENSED_ADVICE_REQUIREMENTS.length : 0
    },
    validation: {
      allowed_surfaces: LICENSED_ADVICE_SURFACES,
      legal_review_approved: legalReviewStatus === "approved",
      licensed_path_present: licensedPathPresent,
      required_context_present: requiredContextPresent,
      supervision_controls_present: supervisionControlsPresent,
      suitability_controls_present: suitabilityControlsPresent,
      unsupported_surfaces: unsupportedSurfaces
    },
    version: LICENSED_ADVICE_RUNTIME_VERSION,
    workspace_id: normalizeIdentifier(input.workspaceId, "workspace_unresolved")
  };
}

function normalizeStringList(value: string[] | undefined): string[] {
  const items = (value ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
  return [...new Set(items)];
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  return isNonEmptyString(value) ? value : fallback;
}

function normalizeString(value: string | undefined): string | undefined {
  return isNonEmptyString(value) ? value : undefined;
}

function normalizeLegalReviewStatus(value: string | undefined): LegalReviewStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

function isNonEmptyString(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function isLicensedAdviceSurface(value: string | undefined): value is LicensedAdviceSurface {
  return LICENSED_ADVICE_SURFACES.includes(value as LicensedAdviceSurface);
}
