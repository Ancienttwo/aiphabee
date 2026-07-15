// Live SDI (disclosure of interests) resolver
// (netquity-sdi-disclosure-staging). Unlike packages/corporate-actions,
// packages/financial-facts, and packages/market-data, this package carries
// no synthetic scaffold: SDI never had a Phase 1 synthetic tool or
// packages/workbench section, so there is no SYNTHETIC_SDI_DISCLOSURE
// fixture or get_sdi_disclosures tool scaffold to keep alongside the live
// path -- this is the whole package.
//
// SDI is a per-instrument *filing stream*, not a flat per-type array like
// corporate_actions: every nq_sdidata.sdi row is one disclosure filing (its
// own vendor primary key is (formtype, formno)), and a single filing can
// independently report a change to up to three legally distinct position
// categories on the same DI form -- Long Position, Short Position, and
// Lending Pool (the vendor's own l_/s_/p_ column prefixes) -- so each
// `LiveSdiDisclosureRow` nests a `positions` array rather than exposing one
// flat row per position.
//
// No nature-of-change category (increase/decrease/passive) or threshold-
// crossing flag is ever promoted: l_/s_/p_eventcode has no decode table
// anywhere in the mirrored schema (the same undocumented-code risk
// corporate_actions declined for nq_capitalraised.methodcode), and no
// vendor column encodes a threshold crossing at all. `eventCode` is
// promoted verbatim as an opaque string instead.
export const GET_SDI_DISCLOSURE_LIVE_VERSION = "2026-07-15.netquity-sdi-disclosure-live.v1";

export type GetLiveSdiDisclosuresReadbackErrorCode = "MALFORMED_LIVE_ROW" | "MULTIPLE_ROWS_FOR_INSTRUMENT";
export type SdiDisclosureInputErrorCode = "INSTRUMENT_ID_REQUIRED";
export type SdiDisclosureCoverageStatus = "available" | "unavailable";
export type LiveSdiPositionType = "long" | "pool" | "short";
export type LiveSdiFormType = "1" | "2" | "3A";

export interface SdiDisclosureCoverage {
  reason?: string;
  status: SdiDisclosureCoverageStatus;
}

/**
 * One long/short/lending-pool position block reported on a filing.
 * `positionType` is the only required field; every other field is
 * independently optional (present only when the vendor row itself carries
 * a value for that specific block) and stripped at promotion time rather
 * than backfilled. `eventCode` is the vendor's own undecoded code -- never
 * translated into a nature-of-change label.
 */
export interface LiveSdiPosition {
  currency?: string;
  eventCode?: string;
  positionType: LiveSdiPositionType;
  presentBalancePercent?: number;
  presentBalanceShares?: number;
  previousBalancePercent?: number;
  previousBalanceShares?: number;
  shares?: number;
}

export interface LiveSdiHolderName {
  en: string;
  zhHans: string;
  zhHant: string;
}

/**
 * One promoted SDI filing. reportDate/transactionDate/holderName/
 * shareClass/referenceNo are always present (verified 100% populated in
 * the mirrored nq_sdidata.sdi); amendsReferenceNo/supersededByReferenceNo
 * are independently optional (populated only when the vendor's own
 * formno2_a/formno2_s cross-reference another filing). `positions` always
 * carries at least one entry.
 */
export interface LiveSdiDisclosureRow {
  amendsReferenceNo?: string;
  disclosureId: string;
  formType: LiveSdiFormType;
  holderName: LiveSdiHolderName;
  instrumentId: string;
  positions: LiveSdiPosition[];
  referenceNo: string;
  reportDate: string;
  shareClass: string;
  sourceRecordId: string;
  supersededByReferenceNo?: string;
  transactionDate: string;
}

export interface LiveSdiDisclosuresRow {
  data_version: string;
  entity_id: string;
  payload: unknown;
  source_record_id: string;
}

export interface GetLiveSdiDisclosuresInput {
  asOf: string;
  dataVersion: string;
  instrumentId: string;
}

export interface GetLiveSdiDisclosuresResult {
  asOf: string;
  coverage?: SdiDisclosureCoverage;
  dataVersion: string;
  disclosures?: LiveSdiDisclosureRow[];
  instrumentId: string;
  liveDataAccess: true;
  methodologyVersion: typeof GET_SDI_DISCLOSURE_LIVE_VERSION;
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

export class SdiDisclosureInputError extends Error {
  readonly code: SdiDisclosureInputErrorCode;

  constructor(code: SdiDisclosureInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class GetLiveSdiDisclosuresReadbackError extends Error {
  readonly code: GetLiveSdiDisclosuresReadbackErrorCode;

  constructor(code: GetLiveSdiDisclosuresReadbackErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const LIVE_SDI_POSITION_TYPES: readonly LiveSdiPositionType[] = ["long", "short", "pool"];
const LIVE_SDI_FORM_TYPES: readonly LiveSdiFormType[] = ["1", "2", "3A"];

/**
 * Exact entity-id SDI lookup against a released Serving snapshot. `rows` is
 * expected to already be scoped to a single instrument id by the caller's
 * SQL (WHERE entity_id = $2); more than one row is a data integrity
 * failure, not silently narrowed. A legitimate zero-row result is
 * `status: "not_found"`; a row that exists but carries
 * `coverage.status: "unavailable"` (no substantial-shareholder or
 * director/chief-executive filing found for this instrument in the current
 * mirrored snapshot) is still `status: "found"` with an empty
 * `disclosures` array -- the caller can tell "we know this instrument and
 * it currently has no SDI filings" apart from "we have never heard of this
 * instrument".
 */
export function getLiveSdiDisclosures(
  input: GetLiveSdiDisclosuresInput,
  rows: readonly LiveSdiDisclosuresRow[]
): GetLiveSdiDisclosuresResult {
  const instrumentId = input.instrumentId.trim();

  if (instrumentId.length === 0) {
    throw new SdiDisclosureInputError("INSTRUMENT_ID_REQUIRED", "instrument_id is required");
  }

  if (rows.length > 1) {
    throw new GetLiveSdiDisclosuresReadbackError(
      "MULTIPLE_ROWS_FOR_INSTRUMENT",
      "sdi disclosure lookup matched more than one released row for this instrument id"
    );
  }

  const dataVersion = requireNonEmptySdiString(input.dataVersion, "snapshot data version");
  const asOf = requireNonEmptySdiString(input.asOf, "snapshot as-of");
  const row = rows[0];

  if (row === undefined) {
    return {
      asOf,
      dataVersion,
      instrumentId,
      liveDataAccess: true,
      methodologyVersion: GET_SDI_DISCLOSURE_LIVE_VERSION,
      provenance: [],
      status: "not_found",
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    };
  }

  const mapped = mapLiveSdiDisclosuresRow({
    expectedDataVersion: dataVersion,
    expectedInstrumentId: instrumentId,
    row
  });

  return {
    asOf,
    coverage: mapped.coverage,
    dataVersion,
    disclosures: mapped.disclosures,
    instrumentId,
    liveDataAccess: true,
    methodologyVersion: GET_SDI_DISCLOSURE_LIVE_VERSION,
    provenance:
      mapped.disclosures.length > 0
        ? mapped.disclosures.map((disclosure) => ({
            data_version: dataVersion,
            methodology_version: GET_SDI_DISCLOSURE_LIVE_VERSION,
            source: "netquity-sdi-disclosure",
            source_record_id: disclosure.sourceRecordId
          }))
        : [
            {
              data_version: dataVersion,
              methodology_version: GET_SDI_DISCLOSURE_LIVE_VERSION,
              source: "netquity-sdi-disclosure",
              source_record_id: row.source_record_id
            }
          ],
    status: "found",
    usage: {
      cached: false,
      credits: 0,
      rows: mapped.disclosures.length
    }
  };
}

/**
 * Maps one released `serving_record` row to its coverage marker and
 * disclosures array. Kept module-private, matching
 * `mapLiveCorporateActionsRow` in packages/corporate-actions: only the
 * public `getLiveSdiDisclosures` entry point is tested/consumed directly.
 */
function mapLiveSdiDisclosuresRow(input: {
  expectedDataVersion: string;
  expectedInstrumentId: string;
  row: LiveSdiDisclosuresRow;
}): { coverage: SdiDisclosureCoverage; disclosures: LiveSdiDisclosureRow[] } {
  const { row } = input;
  const dataVersion = requireNonEmptySdiString(row.data_version, "row data version");

  if (dataVersion !== input.expectedDataVersion) {
    throw malformedSdiRow("row data version does not match the released snapshot");
  }

  const instrumentId = requireNonEmptySdiString(row.entity_id, "entity id");

  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) {
    throw malformedSdiRow("entity id is not an opaque HKEX security id");
  }

  if (instrumentId !== input.expectedInstrumentId) {
    throw malformedSdiRow("entity id does not match the requested instrument id");
  }

  const code = instrumentId.slice("hkex_security_".length);
  const sourceRecordId = requireNonEmptySdiString(row.source_record_id, "source record id");
  const expectedAvailableSourceRecordId = `netquity:sdi_disclosure.available:${code}`;
  const expectedUnavailableSourceRecordId = `netquity:sdi_disclosure.unavailable:${code}`;

  if (sourceRecordId !== expectedAvailableSourceRecordId && sourceRecordId !== expectedUnavailableSourceRecordId) {
    throw malformedSdiRow("source record id is not a matching Netquity sdi_disclosure record");
  }

  const payload = requireSdiObject(row.payload, "payload");
  const coverage = mapLiveSdiCoverage(payload.coverage);
  const disclosuresValue = payload.disclosures;

  if (!Array.isArray(disclosuresValue)) {
    throw malformedSdiRow("payload disclosures is malformed");
  }

  if (coverage.status === "unavailable") {
    if (disclosuresValue.length > 0) {
      throw malformedSdiRow("unavailable coverage must not carry disclosure rows");
    }

    if (sourceRecordId !== expectedUnavailableSourceRecordId) {
      throw malformedSdiRow("unavailable coverage must use the sdi_disclosure-unavailable source record id");
    }

    return { coverage, disclosures: [] };
  }

  if (sourceRecordId !== expectedAvailableSourceRecordId) {
    throw malformedSdiRow("available coverage must use the sdi_disclosure-available source record id");
  }

  if (disclosuresValue.length === 0) {
    throw malformedSdiRow("available coverage must carry at least one disclosure");
  }

  const disclosures = disclosuresValue.map((entry) => mapLiveSdiDisclosureRow(entry, instrumentId, code));

  return { coverage, disclosures };
}

function mapLiveSdiCoverage(value: unknown): SdiDisclosureCoverage {
  const coverage = requireSdiObject(value, "coverage");
  const status = coverage.status;

  if (status !== "available" && status !== "unavailable") {
    throw malformedSdiRow("coverage status is malformed");
  }

  if (status === "unavailable") {
    const reason = coverage.reason;

    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw malformedSdiRow("unavailable coverage requires a reason");
    }

    return { reason, status };
  }

  return { status };
}

function mapLiveSdiDisclosureRow(
  rawDisclosure: unknown,
  instrumentId: string,
  code: string
): LiveSdiDisclosureRow {
  const disclosure = requireSdiObject(rawDisclosure, "disclosure");
  const formType = disclosure.formType;

  if (typeof formType !== "string" || !(LIVE_SDI_FORM_TYPES as readonly string[]).includes(formType)) {
    throw malformedSdiRow("disclosure formType is malformed or not a promoted live form type");
  }

  const disclosureId = requireSdiPayloadString(disclosure, "disclosureId");

  if (!disclosureId.startsWith(`sdi_disclosure_${code}_${formType.toLowerCase()}_`)) {
    throw malformedSdiRow("disclosure disclosureId does not match its code/formType");
  }

  const referenceNo = requireSdiPayloadString(disclosure, "referenceNo");
  const amendsReferenceNo = requireOptionalSdiPayloadString(disclosure, "amendsReferenceNo");
  const supersededByReferenceNo = requireOptionalSdiPayloadString(disclosure, "supersededByReferenceNo");
  const reportDate = requireSdiDateString(disclosure, "reportDate");
  const transactionDate = requireSdiDateString(disclosure, "transactionDate");
  const holderName = mapLiveSdiHolderName(disclosure.holderName);
  const shareClass = requireSdiPayloadString(disclosure, "shareClass");
  const sourceRecordId = requireSdiPayloadString(disclosure, "sourceRecordId");
  const expectedSourceRecordId = `netquity:sdidata.sdi:${code}:${formType}:`;

  if (!sourceRecordId.startsWith(expectedSourceRecordId)) {
    throw malformedSdiRow("disclosure sourceRecordId is not a matching Netquity sdi_disclosure field pointer");
  }

  const positionsValue = disclosure.positions;

  if (!Array.isArray(positionsValue) || positionsValue.length === 0) {
    throw malformedSdiRow("disclosure positions is malformed or empty");
  }

  const positions = positionsValue.map(mapLiveSdiPosition);

  return {
    amendsReferenceNo,
    disclosureId,
    formType: formType as LiveSdiFormType,
    holderName,
    instrumentId,
    positions,
    referenceNo,
    reportDate,
    shareClass,
    sourceRecordId,
    supersededByReferenceNo,
    transactionDate
  };
}

function mapLiveSdiHolderName(value: unknown): LiveSdiHolderName {
  const holderName = requireSdiObject(value, "holderName");
  const en = requireSdiPayloadString(holderName, "en");
  const zhHant = requireSdiPayloadString(holderName, "zhHant");
  const zhHans = requireSdiPayloadString(holderName, "zhHans");
  return { en, zhHans, zhHant };
}

function mapLiveSdiPosition(rawPosition: unknown): LiveSdiPosition {
  const position = requireSdiObject(rawPosition, "position");
  const positionType = position.positionType;

  if (
    typeof positionType !== "string" ||
    !(LIVE_SDI_POSITION_TYPES as readonly string[]).includes(positionType)
  ) {
    throw malformedSdiRow("position positionType is malformed or not a promoted live position type");
  }

  const eventCode = requireOptionalSdiPayloadString(position, "eventCode");
  const currency = requireOptionalSdiPayloadString(position, "currency");
  const shares = requireOptionalSdiNonNegativeNumber(position, "shares");
  const previousBalanceShares = requireOptionalSdiNonNegativeNumber(position, "previousBalanceShares");
  const previousBalancePercent = requireOptionalSdiNonNegativeNumber(position, "previousBalancePercent");
  const presentBalanceShares = requireOptionalSdiNonNegativeNumber(position, "presentBalanceShares");
  const presentBalancePercent = requireOptionalSdiNonNegativeNumber(position, "presentBalancePercent");

  return {
    currency,
    eventCode,
    positionType: positionType as LiveSdiPositionType,
    presentBalancePercent,
    presentBalanceShares,
    previousBalancePercent,
    previousBalanceShares,
    shares
  };
}

function malformedSdiRow(message: string): GetLiveSdiDisclosuresReadbackError {
  return new GetLiveSdiDisclosuresReadbackError("MALFORMED_LIVE_ROW", message);
}

function requireSdiPayloadString(payload: Record<string, unknown>, field: string): string {
  return requireNonEmptySdiString(payload[field], `payload ${field}`);
}

function requireOptionalSdiPayloadString(
  payload: Record<string, unknown>,
  field: string
): string | undefined {
  const value = payload[field];

  if (value === undefined) return undefined;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw malformedSdiRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireOptionalSdiNonNegativeNumber(
  payload: Record<string, unknown>,
  field: string
): number | undefined {
  const value = payload[field];

  if (value === undefined) return undefined;

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw malformedSdiRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireSdiDateString(payload: Record<string, unknown>, field: string): string {
  const value = payload[field];

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw malformedSdiRow(`disclosure ${field} is malformed`);
  }

  return value;
}

function requireNonEmptySdiString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw malformedSdiRow(`${field} is missing`);
  }

  return value;
}

function requireSdiObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw malformedSdiRow(`${field} is malformed`);
  }

  return value as Record<string, unknown>;
}
