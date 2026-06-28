export const PARTNER_RUNTIME_VERSION =
  "2026-06-22.phase4.partner-white-label-embed-scaffold.v0";

export const PARTNER_TYPES = [
  "brokerage",
  "media",
  "wealth_platform",
  "data_company"
] as const;
export const PARTNER_DISTRIBUTION_SURFACES = [
  "research_widget",
  "report_viewer",
  "watchlist_widget",
  "mcp_api",
  "data_api"
] as const;
export const PARTNER_COMMERCIAL_MODELS = [
  "fixed_annual_license",
  "minimum_guarantee_overage",
  "subscription_revenue_share",
  "mcp_api_revenue_share",
  "premium_data_package",
  "sla_quality_credit"
] as const;
export const PARTNER_BRAND_MODES = ["co_branded", "white_label"] as const;
export const PARTNER_DATA_SCOPES = [
  "research_outputs",
  "market_data",
  "announcement_summaries",
  "analytics_results"
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];
export type PartnerDistributionSurface = (typeof PARTNER_DISTRIBUTION_SURFACES)[number];
export type PartnerCommercialModel = (typeof PARTNER_COMMERCIAL_MODELS)[number];
export type PartnerBrandMode = (typeof PARTNER_BRAND_MODES)[number];
export type PartnerDataScope = (typeof PARTNER_DATA_SCOPES)[number];
export type WhiteLabelEmbedPlanStatus =
  | "blocked_invalid_origin"
  | "blocked_missing_context"
  | "blocked_unsupported_commercial_model"
  | "blocked_unsupported_partner_type"
  | "blocked_unsupported_surface"
  | "planned_no_write";

export interface WhiteLabelEmbedPlanInput {
  allowedOrigins?: string[];
  brandMode?: string;
  commercialModel?: string;
  dataScopes?: string[];
  partnerId?: string;
  partnerName?: string;
  partnerType?: string;
  requestedSurfaces?: string[];
  requestId: string;
  revenueShareBps?: number;
  workspaceId?: string;
}

export interface PartnerRuntimeCapabilities {
  auth_required: true;
  frontend: false;
  live_api_execution: false;
  live_embed_rendering: false;
  package: "@aiphabee/partner-runtime";
  persistent_writes: false;
  route: "GET /partner/runtime";
  runtime_route: "GET /partner/runtime";
  sql_emitted: false;
  status: "partner_runtime_scaffold";
  white_label_embeds: WhiteLabelEmbedCapabilities;
  version: typeof PARTNER_RUNTIME_VERSION;
}

export interface WhiteLabelEmbedCapabilities {
  allowed_brand_modes: typeof PARTNER_BRAND_MODES;
  allowed_commercial_models: typeof PARTNER_COMMERCIAL_MODELS;
  allowed_partner_types: typeof PARTNER_TYPES;
  allowed_surfaces: typeof PARTNER_DISTRIBUTION_SURFACES;
  data_gateway_required: true;
  embed_script_generated: false;
  frontend: false;
  live_api_execution: false;
  live_embed_rendering: false;
  package: "@aiphabee/partner-runtime";
  partner_rights_matrix_required: true;
  persistent_writes: false;
  route: "POST /partner/white-label-embeds/plan";
  runtime_route: "GET /partner/runtime";
  settlement_route: "POST /usage/partner-reconciliation/plan";
  sql_emitted: false;
  status: "white_label_embed_scaffold";
  tables: readonly [
    "aiphabee_core.partner_program",
    "aiphabee_core.partner_embed_surface",
    "aiphabee_audit.partner_distribution_event",
    "aiphabee_governance.partner_white_label_contract"
  ];
  version: typeof PARTNER_RUNTIME_VERSION;
}

export interface WhiteLabelEmbedPlan {
  brand_policy: {
    brand_mode: PartnerBrandMode;
    conflict_disclosure_required: true;
    partner_branding_allowed: boolean;
    white_label_allowed: boolean;
  };
  capability: WhiteLabelEmbedCapabilities;
  commercial_model: {
    model: PartnerCommercialModel;
    revenue_share_bps: number;
    settlement_route: "POST /usage/partner-reconciliation/plan";
    settlement_status: "planned_no_write" | "not_requested";
  };
  data_governance: {
    allowed_data_scopes: PartnerDataScope[];
    data_gateway_route: "POST /gateway/exports/plan";
    default_deny_until_signed: true;
    external_redistribution_allowed: false;
    field_authorization_required: true;
    partner_rights_matrix_required: true;
  };
  embed: {
    allowed_origins: string[];
    component_manifest_status: "planned_no_write" | "not_requested";
    csp_required: true;
    iframe_embed_status: "planned_no_write" | "not_requested";
    public_indexing: false;
    script_bundle_generated: false;
    surfaces: PartnerDistributionSurface[];
  };
  frontend: false;
  live_api_execution: false;
  live_embed_rendering: false;
  mcp_api: {
    api_key_route: "POST /mcp/api-keys/create/plan";
    live_execution: false;
    mcp_route: "POST /mcp";
    oauth_route: "POST /mcp/oauth/authorize/plan";
    usage_envelope_required: true;
  };
  partner: {
    partner_id: string;
    partner_name: string;
    partner_type: PartnerType;
    program_table: "aiphabee_core.partner_program";
    workspace_id: string;
  };
  persistent_writes: false;
  request_id: string;
  requested_surfaces: PartnerDistributionSurface[];
  security: {
    credential_material_stored: false;
    raw_personal_contact_included: false;
    raw_prompt_included: false;
    signed_contract_required: true;
    tenant_isolation_required: true;
  };
  sql_emitted: false;
  status: WhiteLabelEmbedPlanStatus;
  tables: WhiteLabelEmbedCapabilities["tables"];
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  validation: {
    allowed_brand_modes: typeof PARTNER_BRAND_MODES;
    allowed_commercial_models: typeof PARTNER_COMMERCIAL_MODELS;
    allowed_partner_types: typeof PARTNER_TYPES;
    allowed_surfaces: typeof PARTNER_DISTRIBUTION_SURFACES;
    origin_allowlist_required_for_embeds: true;
    required_context_present: boolean;
    unsupported_commercial_models: string[];
    unsupported_partner_types: string[];
    unsupported_surfaces: string[];
    valid_allowed_origins: boolean;
  };
  version: typeof PARTNER_RUNTIME_VERSION;
}

const WHITE_LABEL_EMBED_TABLES: WhiteLabelEmbedCapabilities["tables"] = [
  "aiphabee_core.partner_program",
  "aiphabee_core.partner_embed_surface",
  "aiphabee_audit.partner_distribution_event",
  "aiphabee_governance.partner_white_label_contract"
];

export function getPartnerRuntimeCapabilities(): PartnerRuntimeCapabilities {
  return {
    auth_required: true,
    frontend: false,
    live_api_execution: false,
    live_embed_rendering: false,
    package: "@aiphabee/partner-runtime",
    persistent_writes: false,
    route: "GET /partner/runtime",
    runtime_route: "GET /partner/runtime",
    sql_emitted: false,
    status: "partner_runtime_scaffold",
    white_label_embeds: getWhiteLabelEmbedCapabilities(),
    version: PARTNER_RUNTIME_VERSION
  };
}

export function getWhiteLabelEmbedCapabilities(): WhiteLabelEmbedCapabilities {
  return {
    allowed_brand_modes: PARTNER_BRAND_MODES,
    allowed_commercial_models: PARTNER_COMMERCIAL_MODELS,
    allowed_partner_types: PARTNER_TYPES,
    allowed_surfaces: PARTNER_DISTRIBUTION_SURFACES,
    data_gateway_required: true,
    embed_script_generated: false,
    frontend: false,
    live_api_execution: false,
    live_embed_rendering: false,
    package: "@aiphabee/partner-runtime",
    partner_rights_matrix_required: true,
    persistent_writes: false,
    route: "POST /partner/white-label-embeds/plan",
    runtime_route: "GET /partner/runtime",
    settlement_route: "POST /usage/partner-reconciliation/plan",
    sql_emitted: false,
    status: "white_label_embed_scaffold",
    tables: WHITE_LABEL_EMBED_TABLES,
    version: PARTNER_RUNTIME_VERSION
  };
}

export function createWhiteLabelEmbedPlan(
  input: WhiteLabelEmbedPlanInput
): WhiteLabelEmbedPlan {
  const partnerTypeCandidates = normalizeStringList(
    input.partnerType === undefined ? [] : [input.partnerType]
  );
  const commercialModelCandidates = normalizeStringList(
    input.commercialModel === undefined ? [] : [input.commercialModel]
  );
  const requestedSurfaceCandidates = normalizeStringList(input.requestedSurfaces);
  const dataScopeCandidates = normalizeStringList(input.dataScopes);
  const requestedSurfaces: PartnerDistributionSurface[] = requestedSurfaceCandidates.filter(
    isPartnerDistributionSurface
  );
  const unsupportedSurfaces = requestedSurfaceCandidates.filter(
    (surface) => !isPartnerDistributionSurface(surface)
  );
  const dataScopes: PartnerDataScope[] = dataScopeCandidates.filter(isPartnerDataScope);
  const allowedOrigins = normalizeAllowedOrigins(input.allowedOrigins);
  const partnerType = isPartnerType(input.partnerType) ? input.partnerType : "brokerage";
  const commercialModel = isPartnerCommercialModel(input.commercialModel)
    ? input.commercialModel
    : "fixed_annual_license";
  const brandMode = isPartnerBrandMode(input.brandMode) ? input.brandMode : "co_branded";
  const surfaces: PartnerDistributionSurface[] =
    requestedSurfaces.length > 0 ? requestedSurfaces : ["research_widget", "mcp_api"];
  const requiredContextPresent =
    isNonEmptyString(input.partnerId) &&
    isNonEmptyString(input.workspaceId) &&
    isNonEmptyString(input.partnerType) &&
    isNonEmptyString(input.commercialModel);
  const unsupportedPartnerTypes = partnerTypeCandidates.filter((value) => !isPartnerType(value));
  const unsupportedCommercialModels = commercialModelCandidates.filter(
    (value) => !isPartnerCommercialModel(value)
  );
  const embedSurfaceRequested = surfaces.some(isEmbedSurface);
  const validAllowedOrigins = !embedSurfaceRequested || allowedOrigins.length > 0;
  const status: WhiteLabelEmbedPlanStatus =
    !requiredContextPresent
      ? "blocked_missing_context"
      : unsupportedPartnerTypes.length > 0
        ? "blocked_unsupported_partner_type"
        : unsupportedCommercialModels.length > 0
          ? "blocked_unsupported_commercial_model"
          : unsupportedSurfaces.length > 0
            ? "blocked_unsupported_surface"
            : !validAllowedOrigins
              ? "blocked_invalid_origin"
              : "planned_no_write";
  const planned = status === "planned_no_write";

  return {
    brand_policy: {
      brand_mode: brandMode,
      conflict_disclosure_required: true,
      partner_branding_allowed: brandMode === "co_branded",
      white_label_allowed: brandMode === "white_label"
    },
    capability: getWhiteLabelEmbedCapabilities(),
    commercial_model: {
      model: commercialModel,
      revenue_share_bps: normalizeRevenueShareBps(input.revenueShareBps),
      settlement_route: "POST /usage/partner-reconciliation/plan",
      settlement_status: planned ? "planned_no_write" : "not_requested"
    },
    data_governance: {
      allowed_data_scopes: dataScopes.length > 0 ? dataScopes : [...PARTNER_DATA_SCOPES],
      data_gateway_route: "POST /gateway/exports/plan",
      default_deny_until_signed: true,
      external_redistribution_allowed: false,
      field_authorization_required: true,
      partner_rights_matrix_required: true
    },
    embed: {
      allowed_origins: allowedOrigins,
      component_manifest_status: embedSurfaceRequested && planned ? "planned_no_write" : "not_requested",
      csp_required: true,
      iframe_embed_status: embedSurfaceRequested && planned ? "planned_no_write" : "not_requested",
      public_indexing: false,
      script_bundle_generated: false,
      surfaces
    },
    frontend: false,
    live_api_execution: false,
    live_embed_rendering: false,
    mcp_api: {
      api_key_route: "POST /mcp/api-keys/create/plan",
      live_execution: false,
      mcp_route: "POST /mcp",
      oauth_route: "POST /mcp/oauth/authorize/plan",
      usage_envelope_required: true
    },
    partner: {
      partner_id: normalizeIdentifier(input.partnerId, "partner_unresolved"),
      partner_name: normalizeIdentifier(input.partnerName, "partner_name_unresolved"),
      partner_type: partnerType,
      program_table: "aiphabee_core.partner_program",
      workspace_id: normalizeIdentifier(input.workspaceId, "workspace_unresolved")
    },
    persistent_writes: false,
    request_id: input.requestId,
    requested_surfaces: surfaces,
    security: {
      credential_material_stored: false,
      raw_personal_contact_included: false,
      raw_prompt_included: false,
      signed_contract_required: true,
      tenant_isolation_required: true
    },
    sql_emitted: false,
    status,
    tables: WHITE_LABEL_EMBED_TABLES,
    usage: {
      cached: false,
      credits: 0,
      rows: planned ? surfaces.length : 0
    },
    validation: {
      allowed_brand_modes: PARTNER_BRAND_MODES,
      allowed_commercial_models: PARTNER_COMMERCIAL_MODELS,
      allowed_partner_types: PARTNER_TYPES,
      allowed_surfaces: PARTNER_DISTRIBUTION_SURFACES,
      origin_allowlist_required_for_embeds: true,
      required_context_present: requiredContextPresent,
      unsupported_commercial_models: unsupportedCommercialModels,
      unsupported_partner_types: unsupportedPartnerTypes,
      unsupported_surfaces: unsupportedSurfaces,
      valid_allowed_origins: validAllowedOrigins
    },
    version: PARTNER_RUNTIME_VERSION
  };
}

function normalizeStringList(value: string[] | undefined): string[] {
  const items = (value ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
  return [...new Set(items)];
}

function normalizeAllowedOrigins(value: string[] | undefined): string[] {
  return normalizeStringList(value).filter((origin) => /^https:\/\/[a-z0-9.-]+(?::\d+)?$/iu.test(origin));
}

function normalizeRevenueShareBps(value: number | undefined): number {
  if (value === undefined || !Number.isInteger(value) || value < 0) {
    return 0;
  }

  return Math.min(value, 10000);
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  return isNonEmptyString(value) ? value : fallback;
}

function isNonEmptyString(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function isPartnerType(value: string | undefined): value is PartnerType {
  return PARTNER_TYPES.includes(value as PartnerType);
}

function isPartnerDistributionSurface(value: string): value is PartnerDistributionSurface {
  return PARTNER_DISTRIBUTION_SURFACES.includes(value as PartnerDistributionSurface);
}

function isPartnerCommercialModel(value: string | undefined): value is PartnerCommercialModel {
  return PARTNER_COMMERCIAL_MODELS.includes(value as PartnerCommercialModel);
}

function isPartnerBrandMode(value: string | undefined): value is PartnerBrandMode {
  return PARTNER_BRAND_MODES.includes(value as PartnerBrandMode);
}

function isPartnerDataScope(value: string): value is PartnerDataScope {
  return PARTNER_DATA_SCOPES.includes(value as PartnerDataScope);
}

function isEmbedSurface(value: PartnerDistributionSurface): boolean {
  return value === "research_widget" || value === "report_viewer" || value === "watchlist_widget";
}
