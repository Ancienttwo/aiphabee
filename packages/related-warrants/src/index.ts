// Live related-warrants (per-underlying-instrument list of associated
// derivative warrant / CBBC codes) resolver (netquity-related-warrants-
// staging). Like packages/sdi-disclosure, packages/directorate, and
// packages/ownership, this package carries no synthetic scaffold:
// related_warrants never had a Phase 1 synthetic tool or packages/workbench
// section, so there is no SYNTHETIC_RELATED_WARRANTS fixture or
// get_related_warrants tool scaffold to keep alongside the live path -- this
// is the whole package.
//
// One bucket per underlying instrument: warrants[] (nq_basicdata.relatedcode
// joined to nq_basicdata.stock), an array of every derivative warrant / CBBC
// code the underlying is linked to across relatedcode's 5 warrant-category
// columns (comp_warrant/dp_warrant/dc_warrant/cc_warrant/ce_warrant). Every
// entry shares the identical shape regardless of which category column it
// came from -- category is promoted as a per-entry raw attribute, never
// decoded into a call/put/bull/bear label: no fact table anywhere in the
// mirrored schema links nq_codetable.warrantissuer/warranttype2/
// underlyingcode to a warrant's own terms (see
// deploy/ingest/netquity-related-warrants-staging.contract.json's
// excluded_from_this_cut.warrant_terms_no_fact_table), the same "no decode
// table -> promote raw" choice sdi_disclosure made for formType/eventCode,
// directorate for capacity, and ownership for holderType/groupType/
// sourceType.
export const GET_RELATED_WARRANTS_LIVE_VERSION = "2026-07-16.netquity-related-warrants-live.v1";

export type GetLiveRelatedWarrantsReadbackErrorCode = "MALFORMED_LIVE_ROW" | "MULTIPLE_ROWS_FOR_INSTRUMENT";
export type RelatedWarrantsInputErrorCode = "INSTRUMENT_ID_REQUIRED";
export type RelatedWarrantsCoverageStatus = "available" | "unavailable";

/**
 * The raw nq_basicdata.relatedcode column a warrant code was read from.
 * Promoted verbatim -- never translated into an interpreted call/put/
 * bull-bear label (see this module's header comment).
 */
export type LiveRelatedWarrantCategory = "cc_warrant" | "ce_warrant" | "comp_warrant" | "dc_warrant" | "dp_warrant";

const LIVE_RELATED_WARRANT_CATEGORIES: readonly string[] = [
  "cc_warrant",
  "ce_warrant",
  "comp_warrant",
  "dc_warrant",
  "dp_warrant"
];

export interface RelatedWarrantsCoverage {
  reason?: string;
  status: RelatedWarrantsCoverageStatus;
}

export interface LiveRelatedWarrantName {
  en: string;
  zhHans: string;
  zhHant: string;
}

/**
 * One promoted nq_basicdata.relatedcode link (one warrant code under one
 * underlying's one category column), resolved against nq_basicdata.stock
 * for its own display name. instrumentId is the same opaque
 * hkex_security_<code> shape used throughout the Serving Store -- it
 * identifies the related warrant's own instrument, not the underlying this
 * record is keyed by.
 */
export interface LiveRelatedWarrant {
  category: LiveRelatedWarrantCategory;
  instrumentId: string;
  name: LiveRelatedWarrantName;
  sourceRecordId: string;
}

export interface LiveRelatedWarrantsRow {
  data_version: string;
  entity_id: string;
  payload: unknown;
  source_record_id: string;
}

export interface GetLiveRelatedWarrantsInput {
  asOf: string;
  dataVersion: string;
  instrumentId: string;
}

export interface GetLiveRelatedWarrantsResult {
  asOf: string;
  coverage?: RelatedWarrantsCoverage;
  dataVersion: string;
  instrumentId: string;
  liveDataAccess: true;
  methodologyVersion: typeof GET_RELATED_WARRANTS_LIVE_VERSION;
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  status: "found" | "not_found";
  usage: {
    cached: boolean;
    credits: number;
    rows: number;
  };
  warrants?: LiveRelatedWarrant[];
}

export class RelatedWarrantsInputError extends Error {
  readonly code: RelatedWarrantsInputErrorCode;

  constructor(code: RelatedWarrantsInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class GetLiveRelatedWarrantsReadbackError extends Error {
  readonly code: GetLiveRelatedWarrantsReadbackErrorCode;

  constructor(code: GetLiveRelatedWarrantsReadbackErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Exact entity-id related-warrants lookup against a released Serving
 * snapshot. `rows` is expected to already be scoped to a single instrument
 * id by the caller's SQL (WHERE entity_id = $2); more than one row is a data
 * integrity failure, not silently narrowed. A legitimate zero-row result is
 * `status: "not_found"`; a row that exists but carries
 * `coverage.status: "unavailable"` (no related warrant found for this
 * instrument in the current mirrored snapshot) is still `status: "found"`
 * with warrants absent -- the caller can tell "we know this instrument and
 * it currently has no related warrants" apart from "we have never heard of
 * this instrument".
 */
export function getLiveRelatedWarrants(
  input: GetLiveRelatedWarrantsInput,
  rows: readonly LiveRelatedWarrantsRow[]
): GetLiveRelatedWarrantsResult {
  const instrumentId = input.instrumentId.trim();

  if (instrumentId.length === 0) {
    throw new RelatedWarrantsInputError("INSTRUMENT_ID_REQUIRED", "instrument_id is required");
  }

  if (rows.length > 1) {
    throw new GetLiveRelatedWarrantsReadbackError(
      "MULTIPLE_ROWS_FOR_INSTRUMENT",
      "related-warrants lookup matched more than one released row for this instrument id"
    );
  }

  const dataVersion = requireNonEmptyRelatedWarrantsString(input.dataVersion, "snapshot data version");
  const asOf = requireNonEmptyRelatedWarrantsString(input.asOf, "snapshot as-of");
  const row = rows[0];

  if (row === undefined) {
    return {
      asOf,
      dataVersion,
      instrumentId,
      liveDataAccess: true,
      methodologyVersion: GET_RELATED_WARRANTS_LIVE_VERSION,
      provenance: [],
      status: "not_found",
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    };
  }

  const mapped = mapLiveRelatedWarrantsRow({
    expectedDataVersion: dataVersion,
    expectedInstrumentId: instrumentId,
    row
  });
  const warrants = mapped.warrants ?? [];

  return {
    asOf,
    coverage: mapped.coverage,
    dataVersion,
    instrumentId,
    liveDataAccess: true,
    methodologyVersion: GET_RELATED_WARRANTS_LIVE_VERSION,
    provenance:
      warrants.length > 0
        ? warrants.map((warrant) => ({
            data_version: dataVersion,
            methodology_version: GET_RELATED_WARRANTS_LIVE_VERSION,
            source: "netquity-related-warrants",
            source_record_id: warrant.sourceRecordId
          }))
        : [
            {
              data_version: dataVersion,
              methodology_version: GET_RELATED_WARRANTS_LIVE_VERSION,
              source: "netquity-related-warrants",
              source_record_id: row.source_record_id
            }
          ],
    status: "found",
    usage: {
      cached: false,
      credits: 0,
      rows: warrants.length
    },
    warrants: mapped.warrants
  };
}

/**
 * Maps one released `serving_record` row to its coverage marker and single
 * `warrants` bucket. Kept module-private, matching `mapLiveOwnershipRow` in
 * packages/ownership: only the public `getLiveRelatedWarrants` entry point
 * is tested/consumed directly.
 */
function mapLiveRelatedWarrantsRow(input: {
  expectedDataVersion: string;
  expectedInstrumentId: string;
  row: LiveRelatedWarrantsRow;
}): {
  coverage: RelatedWarrantsCoverage;
  warrants?: LiveRelatedWarrant[];
} {
  const { row } = input;
  const dataVersion = requireNonEmptyRelatedWarrantsString(row.data_version, "row data version");

  if (dataVersion !== input.expectedDataVersion) {
    throw malformedRelatedWarrantsRow("row data version does not match the released snapshot");
  }

  const instrumentId = requireNonEmptyRelatedWarrantsString(row.entity_id, "entity id");

  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) {
    throw malformedRelatedWarrantsRow("entity id is not an opaque HKEX security id");
  }

  if (instrumentId !== input.expectedInstrumentId) {
    throw malformedRelatedWarrantsRow("entity id does not match the requested instrument id");
  }

  const code = instrumentId.slice("hkex_security_".length);
  const sourceRecordId = requireNonEmptyRelatedWarrantsString(row.source_record_id, "source record id");
  const expectedAvailableSourceRecordId = `netquity:related_warrants.available:${code}`;
  const expectedUnavailableSourceRecordId = `netquity:related_warrants.unavailable:${code}`;

  if (sourceRecordId !== expectedAvailableSourceRecordId && sourceRecordId !== expectedUnavailableSourceRecordId) {
    throw malformedRelatedWarrantsRow("source record id is not a matching Netquity related-warrants record");
  }

  const payload = requireRelatedWarrantsObject(row.payload, "payload");
  const coverage = mapLiveRelatedWarrantsCoverage(payload.coverage);
  const warrantsValue = payload.warrants;

  if (warrantsValue !== undefined && !Array.isArray(warrantsValue)) {
    throw malformedRelatedWarrantsRow("payload warrants is malformed");
  }

  if (coverage.status === "unavailable") {
    if (warrantsValue !== undefined) {
      throw malformedRelatedWarrantsRow("unavailable coverage must not carry a warrants array");
    }

    if (sourceRecordId !== expectedUnavailableSourceRecordId) {
      throw malformedRelatedWarrantsRow("unavailable coverage must use the related-warrants-unavailable source record id");
    }

    return { coverage };
  }

  if (sourceRecordId !== expectedAvailableSourceRecordId) {
    throw malformedRelatedWarrantsRow("available coverage must use the related-warrants-available source record id");
  }

  if (warrantsValue === undefined || warrantsValue.length === 0) {
    throw malformedRelatedWarrantsRow("available coverage must carry a non-empty warrants array");
  }

  const warrants = warrantsValue.map((entry) => mapLiveRelatedWarrant(entry, code));

  return { coverage, warrants };
}

function mapLiveRelatedWarrantsCoverage(value: unknown): RelatedWarrantsCoverage {
  const coverage = requireRelatedWarrantsObject(value, "coverage");
  const status = coverage.status;

  if (status !== "available" && status !== "unavailable") {
    throw malformedRelatedWarrantsRow("coverage status is malformed");
  }

  if (status === "unavailable") {
    const reason = coverage.reason;

    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw malformedRelatedWarrantsRow("unavailable coverage requires a reason");
    }

    return { reason, status };
  }

  return { status };
}

/**
 * `underlyingCode` is the 5-digit code of the requested/row instrument (the
 * underlying this warrants[] entry is linked from), used only to verify
 * sourceRecordId -- it is deliberately not embedded on the returned object,
 * since instrumentId already identifies the related warrant's own
 * instrument (mirroring ownership's crossHolding, which carries only the
 * referenced instrument's own id).
 */
function mapLiveRelatedWarrant(rawWarrant: unknown, underlyingCode: string): LiveRelatedWarrant {
  const warrant = requireRelatedWarrantsObject(rawWarrant, "warrant");
  const instrumentId = requireRelatedWarrantsPayloadString(warrant, "instrumentId");

  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) {
    throw malformedRelatedWarrantsRow("warrant instrumentId is not an opaque HKEX security id");
  }

  const category = requireRelatedWarrantsPayloadString(warrant, "category");

  if (!LIVE_RELATED_WARRANT_CATEGORIES.includes(category)) {
    throw malformedRelatedWarrantsRow("warrant category is not a recognized relatedcode bucket");
  }

  const name = mapLiveRelatedWarrantName(warrant.name);
  const sourceRecordId = requireRelatedWarrantsPayloadString(warrant, "sourceRecordId");
  const warrantCode = instrumentId.slice("hkex_security_".length);
  const expectedSourceRecordId = `netquity:relatedcode.${category}:${underlyingCode}:${warrantCode}`;

  if (sourceRecordId !== expectedSourceRecordId) {
    throw malformedRelatedWarrantsRow("warrant sourceRecordId does not match its category, underlying code, and warrant code");
  }

  return {
    category: category as LiveRelatedWarrantCategory,
    instrumentId,
    name,
    sourceRecordId
  };
}

function mapLiveRelatedWarrantName(value: unknown): LiveRelatedWarrantName {
  const name = requireRelatedWarrantsObject(value, "name");
  const en = requireRelatedWarrantsPayloadString(name, "en");
  const zhHant = requireRelatedWarrantsPayloadString(name, "zhHant");
  const zhHans = requireRelatedWarrantsPayloadString(name, "zhHans");
  return { en, zhHans, zhHant };
}

function malformedRelatedWarrantsRow(message: string): GetLiveRelatedWarrantsReadbackError {
  return new GetLiveRelatedWarrantsReadbackError("MALFORMED_LIVE_ROW", message);
}

function requireRelatedWarrantsPayloadString(payload: Record<string, unknown>, field: string): string {
  return requireNonEmptyRelatedWarrantsString(payload[field], `payload ${field}`);
}

function requireNonEmptyRelatedWarrantsString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw malformedRelatedWarrantsRow(`${field} is missing`);
  }

  return value;
}

function requireRelatedWarrantsObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw malformedRelatedWarrantsRow(`${field} is malformed`);
  }

  return value as Record<string, unknown>;
}
