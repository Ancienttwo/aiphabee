// Live directorate (director / senior-management biography) resolver
// (netquity-directorate-staging). Like packages/sdi-disclosure, this
// package carries no synthetic scaffold: directorate never had a Phase 1
// synthetic tool or packages/workbench section, so there is no
// SYNTHETIC_DIRECTORATE fixture or get_directorate tool scaffold to keep
// alongside the live path -- this is the whole package.
//
// Each promoted row is one nq_biography.biography entry (one person at one
// company): capacity ('D' director | 'S' senior management, the only two
// vendor values) is promoted verbatim, never translated into an
// executive/independent-non-executive/non-executive classification -- that
// finer distinction exists only as free-text prose inside title.en/
// chititle (e.g. "Independent Non-Executive Director"), and the same free
// text can describe a person's *other* directorships rather than this
// company's own board classification, so no derived boolean/enum field is
// emitted; title is exposed raw instead, the same "no decode table ->
// promote raw" choice sdi_disclosure made for formType/eventCode.
//
// No appointment/departure date, committee membership, or cross-company
// person id is ever promoted: none of the three exists as a vendor column
// in nq_biography.biography (see
// deploy/ingest/netquity-directorate-staging.contract.json's
// excluded_from_this_cut for the verified absence of each).
export const GET_DIRECTORATE_LIVE_VERSION = "2026-07-16.netquity-directorate-live.v1";

export type GetLiveDirectorateReadbackErrorCode = "MALFORMED_LIVE_ROW" | "MULTIPLE_ROWS_FOR_INSTRUMENT";
export type DirectorateInputErrorCode = "INSTRUMENT_ID_REQUIRED";
export type DirectorateCoverageStatus = "available" | "unavailable";
export type LiveDirectorateCapacity = "D" | "S";

export interface DirectorateCoverage {
  reason?: string;
  status: DirectorateCoverageStatus;
}

export interface LiveDirectorateName {
  en: string;
  zhHans: string;
  zhHant: string;
}

/**
 * zhHant/zhHans (chititle/simtitle) are 100% populated in the mirrored
 * table; en (engtitle) has exactly one verified gap (code 610, capacity
 * 'S') and is therefore independently optional, unlike name below.
 */
export interface LiveDirectorateTitle {
  en?: string;
  zhHans: string;
  zhHant: string;
}

/**
 * Independently optional per sub-language: verified engbiography/
 * chibiography/simbiography are not always jointly populated together
 * (e.g. 27469/32213 vs 27336/32213), so this group is present only when at
 * least one sub-language is, and each sub-language within it is
 * independently optional rather than backfilled.
 */
export interface LiveDirectorateBiography {
  en?: string;
  zhHans?: string;
  zhHant?: string;
}

/**
 * Present only when at least one of the five underlying vendor columns is
 * populated (14493/32213 rows); every field within it is independently
 * optional (verified 14 rows carry currentAmount with no currency).
 * currentAmount/previousAmount are promoted verbatim from
 * currremuneration/prevremuneration with no unit conversion -- see the
 * promotion SQL's header comment for a documented, verified magnitude
 * anomaly isolated to a small number of companies, not corrected here.
 */
export interface LiveDirectorateRemuneration {
  currency?: string;
  currentAmount?: number;
  currentYearEnd?: string;
  previousAmount?: number;
  previousYearEnd?: string;
}

/**
 * One promoted nq_biography.biography row (one person at one company).
 * profileId/sourceRecordId/capacity/name/title are always present
 * (name/title.zhHant/title.zhHans verified 100% populated); age/biography/
 * remuneration/title.en are independently optional per their own verified
 * population gaps.
 */
export interface LiveDirectorateProfileRow {
  age?: number;
  biography?: LiveDirectorateBiography;
  capacity: LiveDirectorateCapacity;
  instrumentId: string;
  name: LiveDirectorateName;
  profileId: string;
  remuneration?: LiveDirectorateRemuneration;
  sourceRecordId: string;
  title: LiveDirectorateTitle;
}

export interface LiveDirectorateRow {
  data_version: string;
  entity_id: string;
  payload: unknown;
  source_record_id: string;
}

export interface GetLiveDirectorateInput {
  asOf: string;
  dataVersion: string;
  instrumentId: string;
}

export interface GetLiveDirectorateResult {
  asOf: string;
  coverage?: DirectorateCoverage;
  dataVersion: string;
  directors?: LiveDirectorateProfileRow[];
  instrumentId: string;
  liveDataAccess: true;
  methodologyVersion: typeof GET_DIRECTORATE_LIVE_VERSION;
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
}

export class DirectorateInputError extends Error {
  readonly code: DirectorateInputErrorCode;

  constructor(code: DirectorateInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class GetLiveDirectorateReadbackError extends Error {
  readonly code: GetLiveDirectorateReadbackErrorCode;

  constructor(code: GetLiveDirectorateReadbackErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const LIVE_DIRECTORATE_CAPACITIES: readonly LiveDirectorateCapacity[] = ["D", "S"];

/**
 * Exact entity-id directorate lookup against a released Serving snapshot.
 * `rows` is expected to already be scoped to a single instrument id by the
 * caller's SQL (WHERE entity_id = $2); more than one row is a data
 * integrity failure, not silently narrowed. A legitimate zero-row result is
 * `status: "not_found"`; a row that exists but carries
 * `coverage.status: "unavailable"` (no director/senior-management biography
 * record found for this instrument in the current mirrored snapshot) is
 * still `status: "found"` with an empty `directors` array -- the caller can
 * tell "we know this instrument and it currently has no biography records"
 * apart from "we have never heard of this instrument".
 */
export function getLiveDirectorate(
  input: GetLiveDirectorateInput,
  rows: readonly LiveDirectorateRow[]
): GetLiveDirectorateResult {
  const instrumentId = input.instrumentId.trim();

  if (instrumentId.length === 0) {
    throw new DirectorateInputError("INSTRUMENT_ID_REQUIRED", "instrument_id is required");
  }

  if (rows.length > 1) {
    throw new GetLiveDirectorateReadbackError(
      "MULTIPLE_ROWS_FOR_INSTRUMENT",
      "directorate lookup matched more than one released row for this instrument id"
    );
  }

  const dataVersion = requireNonEmptyDirectorateString(input.dataVersion, "snapshot data version");
  const asOf = requireNonEmptyDirectorateString(input.asOf, "snapshot as-of");
  const row = rows[0];

  if (row === undefined) {
    return {
      asOf,
      dataVersion,
      instrumentId,
      liveDataAccess: true,
      methodologyVersion: GET_DIRECTORATE_LIVE_VERSION,
      provenance: [],
      status: "not_found",
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    };
  }

  const mapped = mapLiveDirectorateRow({
    expectedDataVersion: dataVersion,
    expectedInstrumentId: instrumentId,
    row
  });

  return {
    asOf,
    coverage: mapped.coverage,
    dataVersion,
    directors: mapped.directors,
    instrumentId,
    liveDataAccess: true,
    methodologyVersion: GET_DIRECTORATE_LIVE_VERSION,
    provenance:
      mapped.directors.length > 0
        ? mapped.directors.map((director) => ({
            data_version: dataVersion,
            methodology_version: GET_DIRECTORATE_LIVE_VERSION,
            source: "netquity-directorate",
            source_record_id: director.sourceRecordId
          }))
        : [
            {
              data_version: dataVersion,
              methodology_version: GET_DIRECTORATE_LIVE_VERSION,
              source: "netquity-directorate",
              source_record_id: row.source_record_id
            }
          ],
    status: "found",
    usage: {
      cached: false,
      credits: 0,
      rows: mapped.directors.length
    }
  };
}

/**
 * Maps one released `serving_record` row to its coverage marker and
 * directors array. Kept module-private, matching
 * `mapLiveSdiDisclosuresRow` in packages/sdi-disclosure: only the public
 * `getLiveDirectorate` entry point is tested/consumed directly.
 */
function mapLiveDirectorateRow(input: {
  expectedDataVersion: string;
  expectedInstrumentId: string;
  row: LiveDirectorateRow;
}): { coverage: DirectorateCoverage; directors: LiveDirectorateProfileRow[] } {
  const { row } = input;
  const dataVersion = requireNonEmptyDirectorateString(row.data_version, "row data version");

  if (dataVersion !== input.expectedDataVersion) {
    throw malformedDirectorateRow("row data version does not match the released snapshot");
  }

  const instrumentId = requireNonEmptyDirectorateString(row.entity_id, "entity id");

  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) {
    throw malformedDirectorateRow("entity id is not an opaque HKEX security id");
  }

  if (instrumentId !== input.expectedInstrumentId) {
    throw malformedDirectorateRow("entity id does not match the requested instrument id");
  }

  const code = instrumentId.slice("hkex_security_".length);
  const sourceRecordId = requireNonEmptyDirectorateString(row.source_record_id, "source record id");
  const expectedAvailableSourceRecordId = `netquity:directorate.available:${code}`;
  const expectedUnavailableSourceRecordId = `netquity:directorate.unavailable:${code}`;

  if (sourceRecordId !== expectedAvailableSourceRecordId && sourceRecordId !== expectedUnavailableSourceRecordId) {
    throw malformedDirectorateRow("source record id is not a matching Netquity directorate record");
  }

  const payload = requireDirectorateObject(row.payload, "payload");
  const coverage = mapLiveDirectorateCoverage(payload.coverage);
  const directorsValue = payload.directors;

  if (!Array.isArray(directorsValue)) {
    throw malformedDirectorateRow("payload directors is malformed");
  }

  if (coverage.status === "unavailable") {
    if (directorsValue.length > 0) {
      throw malformedDirectorateRow("unavailable coverage must not carry director rows");
    }

    if (sourceRecordId !== expectedUnavailableSourceRecordId) {
      throw malformedDirectorateRow("unavailable coverage must use the directorate-unavailable source record id");
    }

    return { coverage, directors: [] };
  }

  if (sourceRecordId !== expectedAvailableSourceRecordId) {
    throw malformedDirectorateRow("available coverage must use the directorate-available source record id");
  }

  if (directorsValue.length === 0) {
    throw malformedDirectorateRow("available coverage must carry at least one director");
  }

  const directors = directorsValue.map((entry) => mapLiveDirectorateProfileRow(entry, instrumentId, code));

  return { coverage, directors };
}

function mapLiveDirectorateCoverage(value: unknown): DirectorateCoverage {
  const coverage = requireDirectorateObject(value, "coverage");
  const status = coverage.status;

  if (status !== "available" && status !== "unavailable") {
    throw malformedDirectorateRow("coverage status is malformed");
  }

  if (status === "unavailable") {
    const reason = coverage.reason;

    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw malformedDirectorateRow("unavailable coverage requires a reason");
    }

    return { reason, status };
  }

  return { status };
}

function mapLiveDirectorateProfileRow(
  rawDirector: unknown,
  instrumentId: string,
  code: string
): LiveDirectorateProfileRow {
  const director = requireDirectorateObject(rawDirector, "director");
  const profileId = requireDirectoratePayloadString(director, "profileId");

  if (!profileId.startsWith(`directorate_${code}_`)) {
    throw malformedDirectorateRow("director profileId does not match its code");
  }

  const capacity = director.capacity;

  if (typeof capacity !== "string" || !(LIVE_DIRECTORATE_CAPACITIES as readonly string[]).includes(capacity)) {
    throw malformedDirectorateRow("director capacity is malformed or not a promoted live capacity");
  }

  const name = mapLiveDirectorateName(director.name);
  const title = mapLiveDirectorateTitle(director.title);
  const age = requireOptionalDirectorateNonNegativeInteger(director, "age");
  const biography = director.biography === undefined ? undefined : mapLiveDirectorateBiography(director.biography);
  const remuneration =
    director.remuneration === undefined ? undefined : mapLiveDirectorateRemuneration(director.remuneration);
  const sourceRecordId = requireDirectoratePayloadString(director, "sourceRecordId");
  const expectedSourceRecordId = `netquity:biography.biography:${code}:`;

  if (!sourceRecordId.startsWith(expectedSourceRecordId)) {
    throw malformedDirectorateRow("director sourceRecordId is not a matching Netquity directorate field pointer");
  }

  return {
    age,
    biography,
    capacity: capacity as LiveDirectorateCapacity,
    instrumentId,
    name,
    profileId,
    remuneration,
    sourceRecordId,
    title
  };
}

function mapLiveDirectorateName(value: unknown): LiveDirectorateName {
  const name = requireDirectorateObject(value, "name");
  const en = requireDirectoratePayloadString(name, "en");
  const zhHant = requireDirectoratePayloadString(name, "zhHant");
  const zhHans = requireDirectoratePayloadString(name, "zhHans");
  return { en, zhHans, zhHant };
}

function mapLiveDirectorateTitle(value: unknown): LiveDirectorateTitle {
  const title = requireDirectorateObject(value, "title");
  const zhHant = requireDirectoratePayloadString(title, "zhHant");
  const zhHans = requireDirectoratePayloadString(title, "zhHans");
  const en = requireOptionalDirectoratePayloadString(title, "en");
  return { en, zhHans, zhHant };
}

function mapLiveDirectorateBiography(value: unknown): LiveDirectorateBiography {
  const biography = requireDirectorateObject(value, "biography");
  const en = requireOptionalDirectoratePayloadString(biography, "en");
  const zhHant = requireOptionalDirectoratePayloadString(biography, "zhHant");
  const zhHans = requireOptionalDirectoratePayloadString(biography, "zhHans");
  return { en, zhHans, zhHant };
}

function mapLiveDirectorateRemuneration(value: unknown): LiveDirectorateRemuneration {
  const remuneration = requireDirectorateObject(value, "remuneration");
  const currency = requireOptionalDirectoratePayloadString(remuneration, "currency");
  const currentAmount = requireOptionalDirectorateNonNegativeNumber(remuneration, "currentAmount");
  const currentYearEnd = requireOptionalDirectorateDateString(remuneration, "currentYearEnd");
  const previousAmount = requireOptionalDirectorateNonNegativeNumber(remuneration, "previousAmount");
  const previousYearEnd = requireOptionalDirectorateDateString(remuneration, "previousYearEnd");
  return { currency, currentAmount, currentYearEnd, previousAmount, previousYearEnd };
}

function malformedDirectorateRow(message: string): GetLiveDirectorateReadbackError {
  return new GetLiveDirectorateReadbackError("MALFORMED_LIVE_ROW", message);
}

function requireDirectoratePayloadString(payload: Record<string, unknown>, field: string): string {
  return requireNonEmptyDirectorateString(payload[field], `payload ${field}`);
}

function requireOptionalDirectoratePayloadString(
  payload: Record<string, unknown>,
  field: string
): string | undefined {
  const value = payload[field];

  if (value === undefined) return undefined;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw malformedDirectorateRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireOptionalDirectorateNonNegativeNumber(
  payload: Record<string, unknown>,
  field: string
): number | undefined {
  const value = payload[field];

  if (value === undefined) return undefined;

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw malformedDirectorateRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireOptionalDirectorateNonNegativeInteger(
  payload: Record<string, unknown>,
  field: string
): number | undefined {
  const value = payload[field];

  if (value === undefined) return undefined;

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw malformedDirectorateRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireOptionalDirectorateDateString(payload: Record<string, unknown>, field: string): string | undefined {
  const value = payload[field];

  if (value === undefined) return undefined;

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw malformedDirectorateRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireNonEmptyDirectorateString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw malformedDirectorateRow(`${field} is missing`);
  }

  return value;
}

function requireDirectorateObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw malformedDirectorateRow(`${field} is malformed`);
  }

  return value as Record<string, unknown>;
}
