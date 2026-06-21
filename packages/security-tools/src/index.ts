import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export const RESOLVE_SECURITY_VERSION =
  "2026-06-21.phase1.resolve-security-tool-scaffold.v0";
export const RESOLVE_SECURITY_DATA_VERSION = "security-tools-synthetic-v0";
export const GET_SECURITY_PROFILE_VERSION =
  "2026-06-21.phase1.get-security-profile-tool-scaffold.v0";
export const GET_SECURITY_PROFILE_DATA_VERSION = "security-profile-synthetic-v0";
export const GET_SECURITY_HISTORY_VERSION =
  "2026-06-21.phase3.security-history-scaffold.v0";
export const GET_SECURITY_HISTORY_DATA_VERSION = "security-history-synthetic-v0";

export type ResolveSecurityStatus = "ambiguous" | "not_found" | "resolved";
export type ResolveSecurityMatchReason =
  | "canonical_symbol"
  | "code"
  | "historical_identifier"
  | "historical_name"
  | "name"
  | "symbol";
export type ResolveSecurityInputErrorCode = "QUERY_REQUIRED";
export type GetSecurityProfileInputErrorCode = "INSTRUMENT_ID_REQUIRED";
export type GetSecurityHistoryInputErrorCode =
  | "AS_OF_REQUIRED"
  | "INSTRUMENT_ID_REQUIRED";
export type GetSecurityProfileStatus = "found" | "not_found";
export type GetSecurityHistoryStatus = "found" | "not_found";
export type SecurityListingStatus = "delisted" | "listed" | "suspended";
export type SecurityCoverageState = "available" | "planned" | "unavailable";

export interface ResolveSecurityInput {
  asOf?: string;
  market?: string;
  query: string;
}

export interface ResolveSecurityCandidate {
  currency: string;
  exchange: string;
  instrumentId: string;
  listingId: string;
  market: string;
  matchReason: ResolveSecurityMatchReason;
  name: {
    en: string;
    zhHans: string;
    zhHant: string;
  };
  status: SecurityListingStatus;
  symbol: string;
  validFrom: string;
  validTo?: string;
}

export interface ResolveSecurityResult {
  asOf: string;
  candidates: ResolveSecurityCandidate[];
  dataVersion: typeof RESOLVE_SECURITY_DATA_VERSION;
  liveDataAccess: false;
  market?: string;
  methodologyVersion: typeof RESOLVE_SECURITY_VERSION;
  normalizedQuery: string;
  provenance: ProvenanceRef[];
  query: string;
  selectedInstrumentId?: string;
  status: ResolveSecurityStatus;
  toolName: "resolve_security";
  usage: UsageSummary;
}

export interface GetSecurityProfileInput {
  asOf?: string;
  instrumentId: string;
}

export interface GetSecurityHistoryInput {
  asOf?: string;
  instrumentId: string;
}

export interface SecurityCoverageItem {
  reason?: string;
  status: SecurityCoverageState;
}

export interface SecurityProfile {
  company: {
    companyId: string;
    country: string;
    name: {
      en: string;
      zhHans: string;
      zhHant: string;
    };
  };
  coverage: {
    corporateActions: SecurityCoverageItem;
    entitlements: SecurityCoverageItem;
    financialFacts: SecurityCoverageItem;
    lineage: SecurityCoverageItem;
    priceHistory: SecurityCoverageItem;
    profile: SecurityCoverageItem;
    quoteSnapshot: SecurityCoverageItem;
  };
  currency: string;
  exchange: string;
  industry: {
    classificationSystem: string;
    industry: string;
    sector: string;
  };
  instrumentId: string;
  lifecycle: {
    delistedAt?: string;
    listedAt: string;
    suspendedAt?: string;
  };
  listingId: string;
  listingStatus: SecurityListingStatus;
  market: string;
  symbol: string;
}

export interface GetSecurityProfileResult {
  asOf: string;
  dataVersion: typeof GET_SECURITY_PROFILE_DATA_VERSION;
  instrumentId: string;
  liveDataAccess: false;
  methodologyVersion: typeof GET_SECURITY_PROFILE_VERSION;
  profile?: SecurityProfile;
  provenance: ProvenanceRef[];
  status: GetSecurityProfileStatus;
  toolName: "get_security_profile";
  usage: UsageSummary;
}

export interface SecurityHistoricalName {
  name: {
    en: string;
    zhHans: string;
    zhHant: string;
  };
  sourceRecordId: string;
  validFrom: string;
  validTo?: string;
}

export interface SecurityHistoricalIndustry {
  classificationSystem: string;
  industry: string;
  sector: string;
  sourceRecordId: string;
  validFrom: string;
  validTo?: string;
}

export interface SecurityHistoricalConstituentMembership {
  benchmarkId: string;
  benchmarkName: string;
  benchmarkSymbol: string;
  membershipSourceRecordId: string;
  validFrom: string;
  validTo?: string;
  weightAvailable: false;
}

export interface SecurityHistory {
  activeConstituentMemberships: SecurityHistoricalConstituentMembership[];
  activeIndustry?: SecurityHistoricalIndustry;
  activeName?: SecurityHistoricalName;
  coverage: {
    historicalConstituents: SecurityCoverageItem;
    historicalIndustries: SecurityCoverageItem;
    historicalNames: SecurityCoverageItem;
  };
  pointInTimePolicy: {
    asOfRequired: true;
    usesLatestClassification: false;
    usesLatestConstituents: false;
    usesLatestName: false;
  };
}

export interface GetSecurityHistoryResult {
  asOf: string;
  dataVersion: typeof GET_SECURITY_HISTORY_DATA_VERSION;
  history?: SecurityHistory;
  instrumentId: string;
  liveDataAccess: false;
  methodologyVersion: typeof GET_SECURITY_HISTORY_VERSION;
  provenance: ProvenanceRef[];
  status: GetSecurityHistoryStatus;
  toolName: "get_security_history";
  usage: UsageSummary;
}

interface SyntheticSecurityRecord {
  aliases: Array<{
    reason: ResolveSecurityMatchReason;
    value: string;
  }>;
  candidate: Omit<ResolveSecurityCandidate, "matchReason">;
}

interface SyntheticSecurityProfileRecord {
  instrumentId: string;
  profile: SecurityProfile;
}

interface SyntheticSecurityHistoryRecord {
  constituentMemberships: SecurityHistoricalConstituentMembership[];
  industries: SecurityHistoricalIndustry[];
  instrumentId: string;
  names: SecurityHistoricalName[];
}

export class ResolveSecurityInputError extends Error {
  readonly code: ResolveSecurityInputErrorCode;

  constructor(code: ResolveSecurityInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class GetSecurityProfileInputError extends Error {
  readonly code: GetSecurityProfileInputErrorCode;

  constructor(code: GetSecurityProfileInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class GetSecurityHistoryInputError extends Error {
  readonly code: GetSecurityHistoryInputErrorCode;

  constructor(code: GetSecurityHistoryInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const SYNTHETIC_SECURITY_MASTER: readonly SyntheticSecurityRecord[] = [
  {
    aliases: [
      { reason: "symbol", value: "700" },
      { reason: "symbol", value: "0700" },
      { reason: "canonical_symbol", value: "00700.HK" },
      { reason: "symbol", value: "00700" },
      { reason: "symbol", value: "HK:00700" },
      { reason: "name", value: "Tencent" },
      { reason: "name", value: "Tencent Holdings" },
      { reason: "name", value: "Tencent Holdings Ltd" },
      { reason: "name", value: "腾讯" },
      { reason: "name", value: "腾讯控股" },
      { reason: "name", value: "騰訊" },
      { reason: "name", value: "騰訊控股" },
      { reason: "historical_name", value: "Tencent Holdings Limited" }
    ],
    candidate: {
      currency: "HKD",
      exchange: "HKEX",
      instrumentId: "eq_hk_00700",
      listingId: "listing_hk_00700",
      market: "HK",
      name: {
        en: "Tencent Holdings Ltd.",
        zhHans: "腾讯控股有限公司",
        zhHant: "騰訊控股有限公司"
      },
      status: "listed",
      symbol: "00700.HK",
      validFrom: "2004-06-16"
    }
  },
  {
    aliases: [
      { reason: "symbol", value: "ABC" },
      { reason: "canonical_symbol", value: "00001.HK" },
      { reason: "name", value: "ABC Holdings" }
    ],
    candidate: {
      currency: "HKD",
      exchange: "HKEX",
      instrumentId: "eq_hk_00001",
      listingId: "listing_hk_00001",
      market: "HK",
      name: {
        en: "ABC Holdings Ltd.",
        zhHans: "ABC控股有限公司",
        zhHant: "ABC控股有限公司"
      },
      status: "listed",
      symbol: "00001.HK",
      validFrom: "2000-01-01"
    }
  },
  {
    aliases: [
      { reason: "symbol", value: "ABC" },
      { reason: "canonical_symbol", value: "08001.HK" },
      { reason: "historical_identifier", value: "ABC" },
      { reason: "name", value: "ABC Technology" }
    ],
    candidate: {
      currency: "HKD",
      exchange: "HKEX",
      instrumentId: "eq_hk_08001",
      listingId: "listing_hk_08001",
      market: "HK",
      name: {
        en: "ABC Technology Ltd.",
        zhHans: "ABC科技有限公司",
        zhHant: "ABC科技有限公司"
      },
      status: "suspended",
      symbol: "08001.HK",
      validFrom: "2010-01-01"
    }
  },
  {
    aliases: [
      { reason: "symbol", value: "OLDCO" },
      { reason: "canonical_symbol", value: "09999.HK" },
      { reason: "name", value: "OldCo Holdings" },
      { reason: "historical_name", value: "Old Company Holdings" }
    ],
    candidate: {
      currency: "HKD",
      exchange: "HKEX",
      instrumentId: "eq_hk_09999",
      listingId: "listing_hk_09999",
      market: "HK",
      name: {
        en: "OldCo Holdings Ltd.",
        zhHans: "旧企控股有限公司",
        zhHant: "舊企控股有限公司"
      },
      status: "delisted",
      symbol: "09999.HK",
      validFrom: "1999-01-01",
      validTo: "2022-12-30"
    }
  }
] as const;

const SYNTHETIC_SECURITY_PROFILES: readonly SyntheticSecurityProfileRecord[] = [
  {
    instrumentId: "eq_hk_00700",
    profile: {
      company: {
        companyId: "co_tencent",
        country: "CN",
        name: {
          en: "Tencent Holdings Ltd.",
          zhHans: "腾讯控股有限公司",
          zhHant: "騰訊控股有限公司"
        }
      },
      coverage: createSyntheticCoverage(),
      currency: "HKD",
      exchange: "HKEX",
      industry: {
        classificationSystem: "synthetic-gics-like-v0",
        industry: "Interactive Media & Services",
        sector: "Communication Services"
      },
      instrumentId: "eq_hk_00700",
      lifecycle: {
        listedAt: "2004-06-16"
      },
      listingId: "listing_hk_00700",
      listingStatus: "listed",
      market: "HK",
      symbol: "00700.HK"
    }
  },
  {
    instrumentId: "eq_hk_00001",
    profile: {
      company: {
        companyId: "co_abc_holdings",
        country: "HK",
        name: {
          en: "ABC Holdings Ltd.",
          zhHans: "ABC控股有限公司",
          zhHant: "ABC控股有限公司"
        }
      },
      coverage: createSyntheticCoverage(),
      currency: "HKD",
      exchange: "HKEX",
      industry: {
        classificationSystem: "synthetic-gics-like-v0",
        industry: "Diversified Holdings",
        sector: "Industrials"
      },
      instrumentId: "eq_hk_00001",
      lifecycle: {
        listedAt: "2000-01-01"
      },
      listingId: "listing_hk_00001",
      listingStatus: "listed",
      market: "HK",
      symbol: "00001.HK"
    }
  },
  {
    instrumentId: "eq_hk_08001",
    profile: {
      company: {
        companyId: "co_abc_technology",
        country: "HK",
        name: {
          en: "ABC Technology Ltd.",
          zhHans: "ABC科技有限公司",
          zhHant: "ABC科技有限公司"
        }
      },
      coverage: createSyntheticCoverage({
        quoteSnapshot: {
          reason: "synthetic suspended listing keeps quotes unavailable",
          status: "unavailable"
        }
      }),
      currency: "HKD",
      exchange: "HKEX",
      industry: {
        classificationSystem: "synthetic-gics-like-v0",
        industry: "Application Software",
        sector: "Information Technology"
      },
      instrumentId: "eq_hk_08001",
      lifecycle: {
        listedAt: "2010-01-01",
        suspendedAt: "2025-01-15"
      },
      listingId: "listing_hk_08001",
      listingStatus: "suspended",
      market: "HK",
      symbol: "08001.HK"
    }
  },
  {
    instrumentId: "eq_hk_09999",
    profile: {
      company: {
        companyId: "co_oldco",
        country: "HK",
        name: {
          en: "OldCo Holdings Ltd.",
          zhHans: "旧企控股有限公司",
          zhHant: "舊企控股有限公司"
        }
      },
      coverage: createSyntheticCoverage({
        financialFacts: {
          reason: "synthetic delisted listing has no current financial fact feed",
          status: "unavailable"
        },
        quoteSnapshot: {
          reason: "synthetic delisted listing has no current quote feed",
          status: "unavailable"
        }
      }),
      currency: "HKD",
      exchange: "HKEX",
      industry: {
        classificationSystem: "synthetic-gics-like-v0",
        industry: "Legacy Holding Companies",
        sector: "Financials"
      },
      instrumentId: "eq_hk_09999",
      lifecycle: {
        delistedAt: "2022-12-30",
        listedAt: "1999-01-01"
      },
      listingId: "listing_hk_09999",
      listingStatus: "delisted",
      market: "HK",
      symbol: "09999.HK"
    }
  }
] as const;

const SYNTHETIC_SECURITY_HISTORY: readonly SyntheticSecurityHistoryRecord[] = [
  {
    constituentMemberships: [
      {
        benchmarkId: "idx_hk_hsi",
        benchmarkName: "Hang Seng Index",
        benchmarkSymbol: "HSI",
        membershipSourceRecordId: "security-history-eq-hk-00700-hsi-v0",
        validFrom: "2008-06-10",
        weightAvailable: false
      },
      {
        benchmarkId: "idx_hk_hstech",
        benchmarkName: "Hang Seng TECH Index",
        benchmarkSymbol: "HSTECH",
        membershipSourceRecordId: "security-history-eq-hk-00700-hstech-v0",
        validFrom: "2020-07-27",
        weightAvailable: false
      }
    ],
    industries: [
      {
        classificationSystem: "synthetic-gics-like-v0",
        industry: "Internet Software & Services",
        sector: "Information Technology",
        sourceRecordId: "security-history-eq-hk-00700-industry-2004-v0",
        validFrom: "2004-06-16",
        validTo: "2018-09-27"
      },
      {
        classificationSystem: "synthetic-gics-like-v0",
        industry: "Interactive Media & Services",
        sector: "Communication Services",
        sourceRecordId: "security-history-eq-hk-00700-industry-2018-v0",
        validFrom: "2018-09-28"
      }
    ],
    instrumentId: "eq_hk_00700",
    names: [
      {
        name: {
          en: "Tencent Holdings Limited",
          zhHans: "腾讯控股有限公司",
          zhHant: "騰訊控股有限公司"
        },
        sourceRecordId: "security-history-eq-hk-00700-name-2004-v0",
        validFrom: "2004-06-16",
        validTo: "2016-01-01"
      },
      {
        name: {
          en: "Tencent Holdings Ltd.",
          zhHans: "腾讯控股有限公司",
          zhHant: "騰訊控股有限公司"
        },
        sourceRecordId: "security-history-eq-hk-00700-name-2016-v0",
        validFrom: "2016-01-02"
      }
    ]
  },
  {
    constituentMemberships: [
      {
        benchmarkId: "idx_hk_synthetic_smallcap",
        benchmarkName: "Synthetic HK Small Cap Index",
        benchmarkSymbol: "SHKSC",
        membershipSourceRecordId: "security-history-eq-hk-09999-smallcap-v0",
        validFrom: "2001-01-01",
        validTo: "2018-12-31",
        weightAvailable: false
      }
    ],
    industries: [
      {
        classificationSystem: "synthetic-gics-like-v0",
        industry: "Conglomerates",
        sector: "Industrials",
        sourceRecordId: "security-history-eq-hk-09999-industry-1999-v0",
        validFrom: "1999-01-01",
        validTo: "2014-12-31"
      },
      {
        classificationSystem: "synthetic-gics-like-v0",
        industry: "Legacy Holding Companies",
        sector: "Financials",
        sourceRecordId: "security-history-eq-hk-09999-industry-2015-v0",
        validFrom: "2015-01-01",
        validTo: "2022-12-30"
      }
    ],
    instrumentId: "eq_hk_09999",
    names: [
      {
        name: {
          en: "Old Company Holdings",
          zhHans: "旧公司控股",
          zhHant: "舊公司控股"
        },
        sourceRecordId: "security-history-eq-hk-09999-name-1999-v0",
        validFrom: "1999-01-01",
        validTo: "2020-12-31"
      },
      {
        name: {
          en: "OldCo Holdings Ltd.",
          zhHans: "旧企控股有限公司",
          zhHant: "舊企控股有限公司"
        },
        sourceRecordId: "security-history-eq-hk-09999-name-2021-v0",
        validFrom: "2021-01-01",
        validTo: "2022-12-30"
      }
    ]
  }
] as const;

export function resolveSecurity(input: ResolveSecurityInput): ResolveSecurityResult {
  const query = input.query.trim();

  if (query.length === 0) {
    throw new ResolveSecurityInputError("QUERY_REQUIRED", "query is required");
  }

  const asOf = input.asOf ?? "1970-01-01";
  const normalizedQuery = normalizeLookupValue(query);
  const matches = findMatches(normalizedQuery, input.market);
  const candidates = matches.map(({ record, reason }) => ({
    ...record.candidate,
    matchReason: reason
  }));
  const status: ResolveSecurityStatus =
    candidates.length === 0 ? "not_found" : candidates.length === 1 ? "resolved" : "ambiguous";

  return {
    asOf,
    candidates,
    dataVersion: RESOLVE_SECURITY_DATA_VERSION,
    liveDataAccess: false,
    market: input.market,
    methodologyVersion: RESOLVE_SECURITY_VERSION,
    normalizedQuery,
    provenance: createProvenance(),
    query,
    selectedInstrumentId:
      status === "resolved" ? candidates[0]?.instrumentId : undefined,
    status,
    toolName: "resolve_security",
    usage: {
      cached: false,
      credits: 0,
      rows: candidates.length
    }
  };
}

export function getResolveSecurityCapabilities() {
  return {
    ambiguity_candidates: true,
    data_version: RESOLVE_SECURITY_DATA_VERSION,
    handler_ready: true,
    input_schema: "tool.resolve_security.input.v0",
    live_data_access: false,
    no_silent_guessing: true,
    output_schema: "tool.resolve_security.output.v0",
    status: "resolve_security_scaffold" as const,
    supported_lookup_forms: ["code", "symbol", "name", "historical_name"] as const,
    synthetic_fixture_rows: SYNTHETIC_SECURITY_MASTER.length,
    version: RESOLVE_SECURITY_VERSION
  };
}

export function getSecurityProfile(
  input: GetSecurityProfileInput
): GetSecurityProfileResult {
  const instrumentId = input.instrumentId.trim();

  if (instrumentId.length === 0) {
    throw new GetSecurityProfileInputError(
      "INSTRUMENT_ID_REQUIRED",
      "instrument_id is required"
    );
  }

  const asOf = input.asOf ?? "1970-01-01";
  const profileRecord = SYNTHETIC_SECURITY_PROFILES.find(
    (record) => normalizeInstrumentId(record.instrumentId) === normalizeInstrumentId(instrumentId)
  );
  const profile = profileRecord?.profile;

  return {
    asOf,
    dataVersion: GET_SECURITY_PROFILE_DATA_VERSION,
    instrumentId,
    liveDataAccess: false,
    methodologyVersion: GET_SECURITY_PROFILE_VERSION,
    profile,
    provenance: createProfileProvenance(),
    status: profile === undefined ? "not_found" : "found",
    toolName: "get_security_profile",
    usage: {
      cached: false,
      credits: 0,
      rows: profile === undefined ? 0 : 1
    }
  };
}

export function getSecurityProfileCapabilities() {
  return {
    coverage_metadata: true,
    data_version: GET_SECURITY_PROFILE_DATA_VERSION,
    handler_ready: true,
    input_schema: "tool.get_security_profile.input.v0",
    live_data_access: false,
    output_schema: "tool.get_security_profile.output.v0",
    status: "get_security_profile_scaffold" as const,
    supported_listing_statuses: ["listed", "suspended", "delisted"] as const,
    synthetic_profile_rows: SYNTHETIC_SECURITY_PROFILES.length,
    version: GET_SECURITY_PROFILE_VERSION
  };
}

export function getSecurityHistory(
  input: GetSecurityHistoryInput
): GetSecurityHistoryResult {
  const instrumentId = input.instrumentId.trim();

  if (instrumentId.length === 0) {
    throw new GetSecurityHistoryInputError(
      "INSTRUMENT_ID_REQUIRED",
      "instrument_id is required"
    );
  }

  const asOf = input.asOf?.trim() ?? "";

  if (asOf.length === 0) {
    throw new GetSecurityHistoryInputError("AS_OF_REQUIRED", "as_of is required");
  }

  const historyRecord = SYNTHETIC_SECURITY_HISTORY.find(
    (record) => normalizeInstrumentId(record.instrumentId) === normalizeInstrumentId(instrumentId)
  );

  if (historyRecord === undefined) {
    return {
      asOf,
      dataVersion: GET_SECURITY_HISTORY_DATA_VERSION,
      instrumentId,
      liveDataAccess: false,
      methodologyVersion: GET_SECURITY_HISTORY_VERSION,
      provenance: createHistoryProvenance(),
      status: "not_found",
      toolName: "get_security_history",
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    };
  }

  const activeName = findEffectiveRecord(historyRecord.names, asOf);
  const activeIndustry = findEffectiveRecord(historyRecord.industries, asOf);
  const activeConstituentMemberships = historyRecord.constituentMemberships.filter((membership) =>
    isEffectiveOn(membership, asOf)
  );

  return {
    asOf,
    dataVersion: GET_SECURITY_HISTORY_DATA_VERSION,
    history: {
      activeConstituentMemberships,
      activeIndustry,
      activeName,
      coverage: {
        historicalConstituents: {
          status: "available"
        },
        historicalIndustries: {
          status: "available"
        },
        historicalNames: {
          status: "available"
        }
      },
      pointInTimePolicy: {
        asOfRequired: true,
        usesLatestClassification: false,
        usesLatestConstituents: false,
        usesLatestName: false
      }
    },
    instrumentId,
    liveDataAccess: false,
    methodologyVersion: GET_SECURITY_HISTORY_VERSION,
    provenance: createHistoryProvenance(),
    status: "found",
    toolName: "get_security_history",
    usage: {
      cached: false,
      credits: 0,
      rows:
        (activeName === undefined ? 0 : 1) +
        (activeIndustry === undefined ? 0 : 1) +
        activeConstituentMemberships.length
    }
  };
}

export function getSecurityHistoryCapabilities() {
  return {
    as_of_required: true,
    data_version: GET_SECURITY_HISTORY_DATA_VERSION,
    handler_ready: true,
    input_schema: "tool.get_security_history.input.v0",
    live_data_access: false,
    output_schema: "tool.get_security_history.output.v0",
    point_in_time_policy: {
      uses_latest_classification: false,
      uses_latest_constituents: false,
      uses_latest_name: false
    },
    status: "security_history_scaffold" as const,
    supported_history_types: [
      "historical_names",
      "historical_industries",
      "historical_constituents"
    ] as const,
    synthetic_history_rows: SYNTHETIC_SECURITY_HISTORY.length,
    version: GET_SECURITY_HISTORY_VERSION
  };
}

function findMatches(
  normalizedQuery: string,
  market: string | undefined
): Array<{ reason: ResolveSecurityMatchReason; record: SyntheticSecurityRecord }> {
  return SYNTHETIC_SECURITY_MASTER.flatMap((record) => {
    if (market !== undefined && record.candidate.market !== market) {
      return [];
    }

    const alias = record.aliases.find(
      (aliasEntry) => normalizeLookupValue(aliasEntry.value) === normalizedQuery
    );

    if (alias === undefined) {
      return [];
    }

    return [
      {
        reason: alias.reason,
        record
      }
    ];
  });
}

function normalizeLookupValue(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ")
    .replace(/^hk:/u, "")
    .replace(/\.hk$/u, ".hk");
}

function normalizeInstrumentId(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function createProvenance(): ProvenanceRef[] {
  return [
    {
      data_version: RESOLVE_SECURITY_DATA_VERSION,
      methodology_version: RESOLVE_SECURITY_VERSION,
      source: "synthetic-security-master",
      source_record_id: "resolve-security-fixture-v0"
    }
  ];
}

function createProfileProvenance(): ProvenanceRef[] {
  return [
    {
      data_version: GET_SECURITY_PROFILE_DATA_VERSION,
      methodology_version: GET_SECURITY_PROFILE_VERSION,
      source: "synthetic-security-profile",
      source_record_id: "get-security-profile-fixture-v0"
    }
  ];
}

function createHistoryProvenance(): ProvenanceRef[] {
  return [
    {
      data_version: GET_SECURITY_HISTORY_DATA_VERSION,
      methodology_version: GET_SECURITY_HISTORY_VERSION,
      source: "synthetic-security-history",
      source_record_id: "security-history-fixture-v0"
    }
  ];
}

function createSyntheticCoverage(
  overrides: Partial<SecurityProfile["coverage"]> = {}
): SecurityProfile["coverage"] {
  return {
    corporateActions: {
      status: "planned"
    },
    entitlements: {
      status: "planned"
    },
    financialFacts: {
      status: "planned"
    },
    lineage: {
      status: "planned"
    },
    priceHistory: {
      status: "planned"
    },
    profile: {
      status: "available"
    },
    quoteSnapshot: {
      status: "planned"
    },
    ...overrides
  };
}

function findEffectiveRecord<TRecord extends { validFrom: string; validTo?: string }>(
  records: readonly TRecord[],
  asOf: string
): TRecord | undefined {
  return records.find((record) => isEffectiveOn(record, asOf));
}

function isEffectiveOn(record: { validFrom: string; validTo?: string }, asOf: string): boolean {
  return record.validFrom <= asOf && (record.validTo === undefined || asOf <= record.validTo);
}
