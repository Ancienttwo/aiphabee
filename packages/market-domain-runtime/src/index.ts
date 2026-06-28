export const MARKET_DOMAIN_RUNTIME_VERSION =
  "2026-06-22.phase4.hk-data-domains-cross-market-scaffold.v0";

export const HK_DATA_DOMAINS = [
  "ipo_pipeline",
  "index_constituents",
  "stock_connect_flow",
  "short_selling",
  "ownership_disclosure",
  "warrants_cbbc",
  "sector_industry_classification",
  "corporate_calendar",
  "dividend_calendar"
] as const;
export const CROSS_MARKET_COMPARISON_MARKETS = ["HK", "CN_A", "US", "SG"] as const;
export const CROSS_MARKET_MAPPING_TYPES = [
  "dual_listing",
  "adr_equivalence",
  "stock_connect_eligibility",
  "industry_classification",
  "currency_normalization",
  "trading_calendar_alignment",
  "corporate_action_alignment"
] as const;

export type HkDataDomain = (typeof HK_DATA_DOMAINS)[number];
export type CrossMarketComparisonMarket = (typeof CROSS_MARKET_COMPARISON_MARKETS)[number];
export type CrossMarketMappingType = (typeof CROSS_MARKET_MAPPING_TYPES)[number];
export type HkDataDomainsCrossMarketPlanStatus =
  | "blocked_missing_context"
  | "blocked_rights_matrix_required"
  | "blocked_unsupported_domain"
  | "blocked_unsupported_mapping"
  | "blocked_unsupported_market"
  | "planned_no_write";

export interface HkDataDomainsCrossMarketPlanInput {
  asOf?: string;
  baseMarket?: string;
  comparisonMarkets?: string[];
  mappingTypes?: string[];
  requestId: string;
  requestedDomains?: string[];
  rightsMatrixVersion?: string;
  workspaceId?: string;
}

export interface MarketDomainRuntimeCapabilities {
  auth_required: true;
  cross_market_plan: HkDataDomainsCrossMarketCapabilities;
  default_rights_status: "default_deny";
  frontend: false;
  live_data_access: false;
  package: "@aiphabee/market-domain-runtime";
  persistent_writes: false;
  route: "GET /market-data/domains/runtime";
  runtime_route: "GET /market-data/domains/runtime";
  sql_emitted: false;
  status: "hk_data_domains_cross_market_scaffold";
  version: typeof MARKET_DOMAIN_RUNTIME_VERSION;
}

export interface HkDataDomainsCrossMarketCapabilities {
  allowed_domains: typeof HK_DATA_DOMAINS;
  allowed_mapping_types: typeof CROSS_MARKET_MAPPING_TYPES;
  allowed_markets: typeof CROSS_MARKET_COMPARISON_MARKETS;
  data_gateway_required: true;
  default_rights_status: "default_deny";
  frontend: false;
  live_data_access: false;
  package: "@aiphabee/market-domain-runtime";
  persistent_writes: false;
  point_in_time_required: true;
  rights_matrix_required: true;
  route: "POST /market-data/domains/cross-market/plan";
  runtime_route: "GET /market-data/domains/runtime";
  sql_emitted: false;
  status: "hk_data_domains_cross_market_scaffold";
  tables: readonly [
    "aiphabee_core.hk_data_domain_coverage",
    "aiphabee_core.cross_market_security_mapping",
    "aiphabee_audit.market_domain_coverage_event",
    "aiphabee_governance.hk_data_domain_cross_market_contract"
  ];
  version: typeof MARKET_DOMAIN_RUNTIME_VERSION;
}

export interface HkDataDomainCoverageItem {
  domain: HkDataDomain;
  live_data_loaded: false;
  market: "HK";
  point_in_time_required: true;
  rights_state: "default_deny";
  source_prd_section: "docs/researches/AiphaBee_PRD_v1.0.md#10.2";
  status: "planned_no_write" | "not_requested";
  table: string;
}

export interface CrossMarketMappingItem {
  base_market: "HK";
  comparison_market: Exclude<CrossMarketComparisonMarket, "HK">;
  data_gateway_route: "POST /gateway/exports/plan";
  fx_rate_required: boolean;
  live_mapping_enabled: false;
  mapping_type: CrossMarketMappingType;
  rights_state: "default_deny";
  status: "planned_no_write" | "not_requested";
}

export interface HkDataDomainsCrossMarketPlan {
  as_of: string;
  capability: HkDataDomainsCrossMarketCapabilities;
  coverage_contract: {
    default_deny_until_authorized: true;
    methodology_fields_required: readonly [
      "published_at",
      "effective_at",
      "ingested_at",
      "data_version",
      "methodology_version"
    ];
    phase4_source: "docs/researches/AiphaBee_PRD_v1.0.md#18.5";
    point_in_time_required: true;
    prd_data_domain_source: "docs/researches/AiphaBee_PRD_v1.0.md#10.2";
  };
  cross_market: {
    analytics_comparison_route: "POST /analytics/compare-securities";
    base_market: "HK";
    calendar_alignment_route: "POST /tools/get-market-calendar";
    comparison_markets: Array<Exclude<CrossMarketComparisonMarket, "HK">>;
    mapping_items: CrossMarketMappingItem[];
    mapping_types: CrossMarketMappingType[];
    security_resolution_route: "POST /tools/resolve-security";
  };
  data_domains: HkDataDomainCoverageItem[];
  frontend: false;
  live_data_access: false;
  persistent_writes: false;
  request_id: string;
  rights: {
    default_deny_until_authorized: true;
    external_redistribution_allowed: false;
    export_allowed: false;
    field_authorization_required: true;
    mcp_redistribution_allowed: false;
    rights_matrix_required: true;
    rights_matrix_version?: string;
  };
  sql_emitted: false;
  status: HkDataDomainsCrossMarketPlanStatus;
  tables: HkDataDomainsCrossMarketCapabilities["tables"];
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  validation: {
    allowed_domains: typeof HK_DATA_DOMAINS;
    allowed_mapping_types: typeof CROSS_MARKET_MAPPING_TYPES;
    allowed_markets: typeof CROSS_MARKET_COMPARISON_MARKETS;
    required_context_present: boolean;
    rights_matrix_present: boolean;
    unsupported_domains: string[];
    unsupported_mapping_types: string[];
    unsupported_markets: string[];
  };
  version: typeof MARKET_DOMAIN_RUNTIME_VERSION;
  workspace_id: string;
}

const HK_DATA_DOMAIN_TABLES: Record<HkDataDomain, string> = {
  corporate_calendar: "aiphabee_core.hk_corporate_calendar_event",
  dividend_calendar: "aiphabee_core.hk_dividend_calendar_event",
  index_constituents: "aiphabee_core.hk_index_constituent",
  ipo_pipeline: "aiphabee_core.hk_ipo_pipeline_event",
  ownership_disclosure: "aiphabee_core.hk_ownership_disclosure",
  sector_industry_classification: "aiphabee_core.hk_sector_industry_classification",
  short_selling: "aiphabee_core.hk_short_selling_stat",
  stock_connect_flow: "aiphabee_core.hk_stock_connect_flow",
  warrants_cbbc: "aiphabee_core.hk_warrant_cbbc_profile"
};
const HK_DATA_DOMAIN_TABLES_LIST: HkDataDomainsCrossMarketCapabilities["tables"] = [
  "aiphabee_core.hk_data_domain_coverage",
  "aiphabee_core.cross_market_security_mapping",
  "aiphabee_audit.market_domain_coverage_event",
  "aiphabee_governance.hk_data_domain_cross_market_contract"
];
const DEFAULT_DOMAINS: HkDataDomain[] = [
  "ipo_pipeline",
  "index_constituents",
  "stock_connect_flow",
  "ownership_disclosure"
];
const DEFAULT_COMPARISON_MARKETS: Array<Exclude<CrossMarketComparisonMarket, "HK">> = [
  "CN_A",
  "US"
];
const DEFAULT_MAPPING_TYPES: CrossMarketMappingType[] = [
  "dual_listing",
  "adr_equivalence",
  "currency_normalization",
  "trading_calendar_alignment"
];
const METHODOLOGY_FIELDS = [
  "published_at",
  "effective_at",
  "ingested_at",
  "data_version",
  "methodology_version"
] as const;

export function getMarketDomainRuntimeCapabilities(): MarketDomainRuntimeCapabilities {
  return {
    auth_required: true,
    cross_market_plan: getHkDataDomainsCrossMarketCapabilities(),
    default_rights_status: "default_deny",
    frontend: false,
    live_data_access: false,
    package: "@aiphabee/market-domain-runtime",
    persistent_writes: false,
    route: "GET /market-data/domains/runtime",
    runtime_route: "GET /market-data/domains/runtime",
    sql_emitted: false,
    status: "hk_data_domains_cross_market_scaffold",
    version: MARKET_DOMAIN_RUNTIME_VERSION
  };
}

export function getHkDataDomainsCrossMarketCapabilities(): HkDataDomainsCrossMarketCapabilities {
  return {
    allowed_domains: HK_DATA_DOMAINS,
    allowed_mapping_types: CROSS_MARKET_MAPPING_TYPES,
    allowed_markets: CROSS_MARKET_COMPARISON_MARKETS,
    data_gateway_required: true,
    default_rights_status: "default_deny",
    frontend: false,
    live_data_access: false,
    package: "@aiphabee/market-domain-runtime",
    persistent_writes: false,
    point_in_time_required: true,
    rights_matrix_required: true,
    route: "POST /market-data/domains/cross-market/plan",
    runtime_route: "GET /market-data/domains/runtime",
    sql_emitted: false,
    status: "hk_data_domains_cross_market_scaffold",
    tables: HK_DATA_DOMAIN_TABLES_LIST,
    version: MARKET_DOMAIN_RUNTIME_VERSION
  };
}

export function createHkDataDomainsCrossMarketPlan(
  input: HkDataDomainsCrossMarketPlanInput
): HkDataDomainsCrossMarketPlan {
  const domainCandidates = normalizeStringList(input.requestedDomains);
  const marketCandidates = normalizeStringList(input.comparisonMarkets).map((market) =>
    market.toUpperCase()
  );
  const mappingCandidates = normalizeStringList(input.mappingTypes);
  const baseMarket = normalizeMarket(input.baseMarket) ?? "HK";
  const requestedDomains: HkDataDomain[] =
    domainCandidates.length > 0 ? domainCandidates.filter(isHkDataDomain) : DEFAULT_DOMAINS;
  const comparisonMarkets: Array<Exclude<CrossMarketComparisonMarket, "HK">> =
    marketCandidates.length > 0
      ? marketCandidates.filter(isNonHkComparisonMarket)
      : DEFAULT_COMPARISON_MARKETS;
  const mappingTypes: CrossMarketMappingType[] =
    mappingCandidates.length > 0
      ? mappingCandidates.filter(isCrossMarketMappingType)
      : DEFAULT_MAPPING_TYPES;
  const unsupportedDomains = domainCandidates.filter((domain) => !isHkDataDomain(domain));
  const unsupportedMarkets = [
    ...(baseMarket === "HK" ? [] : [baseMarket]),
    ...marketCandidates.filter((market) => !isNonHkComparisonMarket(market))
  ];
  const unsupportedMappingTypes = mappingCandidates.filter(
    (mappingType) => !isCrossMarketMappingType(mappingType)
  );
  const requiredContextPresent = isNonEmptyString(input.workspaceId);
  const rightsMatrixPresent = isNonEmptyString(input.rightsMatrixVersion);
  const status: HkDataDomainsCrossMarketPlanStatus =
    !requiredContextPresent
      ? "blocked_missing_context"
      : unsupportedMarkets.length > 0
        ? "blocked_unsupported_market"
        : unsupportedDomains.length > 0
          ? "blocked_unsupported_domain"
          : unsupportedMappingTypes.length > 0
            ? "blocked_unsupported_mapping"
            : !rightsMatrixPresent
              ? "blocked_rights_matrix_required"
              : "planned_no_write";
  const planned = status === "planned_no_write";

  return {
    as_of: normalizeIdentifier(input.asOf, "as_of_unresolved"),
    capability: getHkDataDomainsCrossMarketCapabilities(),
    coverage_contract: {
      default_deny_until_authorized: true,
      methodology_fields_required: METHODOLOGY_FIELDS,
      phase4_source: "docs/researches/AiphaBee_PRD_v1.0.md#18.5",
      point_in_time_required: true,
      prd_data_domain_source: "docs/researches/AiphaBee_PRD_v1.0.md#10.2"
    },
    cross_market: {
      analytics_comparison_route: "POST /analytics/compare-securities",
      base_market: "HK",
      calendar_alignment_route: "POST /tools/get-market-calendar",
      comparison_markets: comparisonMarkets,
      mapping_items: createMappingItems(comparisonMarkets, mappingTypes, planned),
      mapping_types: mappingTypes,
      security_resolution_route: "POST /tools/resolve-security"
    },
    data_domains: createDomainCoverageItems(requestedDomains, planned),
    frontend: false,
    live_data_access: false,
    persistent_writes: false,
    request_id: input.requestId,
    rights: {
      default_deny_until_authorized: true,
      external_redistribution_allowed: false,
      export_allowed: false,
      field_authorization_required: true,
      mcp_redistribution_allowed: false,
      rights_matrix_required: true,
      rights_matrix_version: normalizeString(input.rightsMatrixVersion)
    },
    sql_emitted: false,
    status,
    tables: HK_DATA_DOMAIN_TABLES_LIST,
    usage: {
      cached: false,
      credits: 0,
      rows: planned ? requestedDomains.length + comparisonMarkets.length * mappingTypes.length : 0
    },
    validation: {
      allowed_domains: HK_DATA_DOMAINS,
      allowed_mapping_types: CROSS_MARKET_MAPPING_TYPES,
      allowed_markets: CROSS_MARKET_COMPARISON_MARKETS,
      required_context_present: requiredContextPresent,
      rights_matrix_present: rightsMatrixPresent,
      unsupported_domains: unsupportedDomains,
      unsupported_mapping_types: unsupportedMappingTypes,
      unsupported_markets: unsupportedMarkets
    },
    version: MARKET_DOMAIN_RUNTIME_VERSION,
    workspace_id: normalizeIdentifier(input.workspaceId, "workspace_unresolved")
  };
}

function createDomainCoverageItems(
  domains: HkDataDomain[],
  planned: boolean
): HkDataDomainCoverageItem[] {
  return domains.map((domain) => ({
    domain,
    live_data_loaded: false,
    market: "HK",
    point_in_time_required: true,
    rights_state: "default_deny",
    source_prd_section: "docs/researches/AiphaBee_PRD_v1.0.md#10.2",
    status: planned ? "planned_no_write" : "not_requested",
    table: HK_DATA_DOMAIN_TABLES[domain]
  }));
}

function createMappingItems(
  markets: Array<Exclude<CrossMarketComparisonMarket, "HK">>,
  mappingTypes: CrossMarketMappingType[],
  planned: boolean
): CrossMarketMappingItem[] {
  return markets.flatMap((comparisonMarket) =>
    mappingTypes.map((mappingType) => ({
      base_market: "HK",
      comparison_market: comparisonMarket,
      data_gateway_route: "POST /gateway/exports/plan",
      fx_rate_required: mappingType === "currency_normalization",
      live_mapping_enabled: false,
      mapping_type: mappingType,
      rights_state: "default_deny",
      status: planned ? "planned_no_write" : "not_requested"
    }))
  );
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

function normalizeMarket(value: string | undefined): string | undefined {
  return isNonEmptyString(value) ? value.trim().toUpperCase() : undefined;
}

function isNonEmptyString(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function isHkDataDomain(value: string): value is HkDataDomain {
  return HK_DATA_DOMAINS.includes(value as HkDataDomain);
}

function isCrossMarketMappingType(value: string): value is CrossMarketMappingType {
  return CROSS_MARKET_MAPPING_TYPES.includes(value as CrossMarketMappingType);
}

function isNonHkComparisonMarket(
  value: string
): value is Exclude<CrossMarketComparisonMarket, "HK"> {
  return (
    CROSS_MARKET_COMPARISON_MARKETS.includes(value as CrossMarketComparisonMarket) &&
    value !== "HK"
  );
}
