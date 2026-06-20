import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export const RESOLVE_SECURITY_VERSION =
  "2026-06-21.phase1.resolve-security-tool-scaffold.v0";
export const RESOLVE_SECURITY_DATA_VERSION = "security-tools-synthetic-v0";
export const GET_SECURITY_PROFILE_VERSION =
  "2026-06-21.phase1.get-security-profile-tool-scaffold.v0";
export const GET_SECURITY_PROFILE_DATA_VERSION = "security-profile-synthetic-v0";

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
export type GetSecurityProfileStatus = "found" | "not_found";
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
