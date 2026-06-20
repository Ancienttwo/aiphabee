import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export const RESOLVE_SECURITY_VERSION =
  "2026-06-21.phase1.resolve-security-tool-scaffold.v0";
export const RESOLVE_SECURITY_DATA_VERSION = "security-tools-synthetic-v0";

export type ResolveSecurityStatus = "ambiguous" | "not_found" | "resolved";
export type ResolveSecurityMatchReason =
  | "canonical_symbol"
  | "code"
  | "historical_identifier"
  | "historical_name"
  | "name"
  | "symbol";
export type ResolveSecurityInputErrorCode = "QUERY_REQUIRED";

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
  status: "delisted" | "listed" | "suspended";
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

interface SyntheticSecurityRecord {
  aliases: Array<{
    reason: ResolveSecurityMatchReason;
    value: string;
  }>;
  candidate: Omit<ResolveSecurityCandidate, "matchReason">;
}

export class ResolveSecurityInputError extends Error {
  readonly code: ResolveSecurityInputErrorCode;

  constructor(code: ResolveSecurityInputErrorCode, message: string) {
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
