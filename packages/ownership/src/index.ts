// Live ownership (share capital / free float / substantial-shareholder and
// cross-holding structure) resolver (netquity-ownership-staging). Like
// packages/sdi-disclosure and packages/directorate, this package carries no
// synthetic scaffold: ownership never had a Phase 1 synthetic tool or
// packages/workbench section, so there is no SYNTHETIC_OWNERSHIP fixture or
// get_ownership tool scaffold to keep alongside the live path -- this is the
// whole package.
//
// Three independently optional buckets per instrument: shareCapital
// (nq_issueshare.issueshare, a current-state object, not an array),
// freeFloat (nq_freefloatshare2.freefloatshare, also a current-state
// object), and holders (nq_listcompheld.data, an array of one entry per
// substantial-shareholder-or-director holding row). Every listcompheld row
// is one holding record; a "cross-holding" is simply the subset where the
// holder is itself a listed company (holderType 'L') and carries a
// resolvable listcode -- there is no separate crossHoldings row set in the
// vendor schema, so each holders[] entry independently optionally carries a
// crossHolding sub-object instead of a second, duplicate array (see
// deploy/ingest/netquity-ownership-staging.contract.json's
// payload_shape_choice).
//
// holderType/groupType/sourceType are promoted verbatim, never decoded: no
// reference table for these vendor codes exists anywhere in the mirrored
// nq_codetable schema, the same "no decode table -> promote raw" choice
// sdi_disclosure made for formType/eventCode and directorate made for
// capacity.
export const GET_OWNERSHIP_LIVE_VERSION = "2026-07-16.netquity-ownership-live.v1";

export type GetLiveOwnershipReadbackErrorCode = "MALFORMED_LIVE_ROW" | "MULTIPLE_ROWS_FOR_INSTRUMENT";
export type OwnershipInputErrorCode = "INSTRUMENT_ID_REQUIRED";
export type OwnershipCoverageStatus = "available" | "unavailable";

export interface OwnershipCoverage {
  reason?: string;
  status: OwnershipCoverageStatus;
}

/**
 * Current-state share capital, from the latest nq_issueshare.issueshare row
 * per instrument (by announcedate). issuedShares/issuedSharesChange/
 * hkShareClass/isHShare/hasSecondaryListing/asOf are always present
 * (verified 2786/2786 populated on the promoted rows); the remaining fields
 * are each independently optional per their own verified vendor population
 * gaps (e.g. weightedVotingRightsRatio only for the rare WVR-listed
 * instruments, 32/2786).
 */
export interface LiveShareCapital {
  asOf: string;
  hasSecondaryListing: "N" | "Y";
  hkShareClass: string;
  hkShares?: number;
  isHShare: "N" | "Y";
  issuedShares: number;
  issuedSharesChange: number;
  nonHkShareClass?: string;
  nonHkShares?: number;
  preferenceShares?: number;
  sharesInCcass?: number;
  sharesOutsideCcass?: number;
  weightedVotingRightsRatio?: number;
}

/**
 * Current-state free float, from the latest nq_freefloatshare2.freefloatshare
 * row per instrument (by date). All 5 fields are always present (verified
 * 2783/2783 populated on the promoted rows) and internally self-consistent
 * (issuedShares = nonFreeFloatShares + freeFloatShares, freeFloatPercent ~=
 * freeFloatShares/issuedShares*100 -- both asserted by the promotion SQL's
 * preflight, not re-derived here).
 */
export interface LiveFreeFloat {
  asOf: string;
  freeFloatPercent: number;
  freeFloatShares: number;
  issuedShares: number;
  nonFreeFloatShares: number;
}

export interface LiveOwnershipHolderName {
  en: string;
  zhHans: string;
  zhHant: string;
}

/**
 * Present only when the holder is itself an HKEX-listed instrument
 * (holderType 'L') and its listcode resolves to a promoted instrument --
 * verified 644/9349 valid nq_listcompheld.data rows qualify, and every one
 * resolves. instrumentId is the same opaque hkex_security_<code> shape used
 * throughout the Serving Store, not a raw vendor listcode.
 */
export interface LiveOwnershipCrossHolding {
  instrumentId: string;
}

/**
 * One promoted nq_listcompheld.data row (one holder at one company).
 * holderId/sourceRecordId/name/holderType/groupType/sourceType/heldShares/
 * heldPercent/asOf are always present (verified 9349/9349 populated);
 * crossHolding is independently optional per row.
 */
export interface LiveOwnershipHolder {
  asOf: string;
  crossHolding?: LiveOwnershipCrossHolding;
  groupType: string;
  heldPercent: number;
  heldShares: number;
  holderId: string;
  holderType: string;
  instrumentId: string;
  name: LiveOwnershipHolderName;
  sourceRecordId: string;
  sourceType: string;
}

export interface LiveOwnershipRow {
  data_version: string;
  entity_id: string;
  payload: unknown;
  source_record_id: string;
}

export interface GetLiveOwnershipInput {
  asOf: string;
  dataVersion: string;
  instrumentId: string;
}

export interface GetLiveOwnershipResult {
  asOf: string;
  coverage?: OwnershipCoverage;
  dataVersion: string;
  freeFloat?: LiveFreeFloat;
  holders?: LiveOwnershipHolder[];
  instrumentId: string;
  liveDataAccess: true;
  methodologyVersion: typeof GET_OWNERSHIP_LIVE_VERSION;
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  shareCapital?: LiveShareCapital;
  status: "found" | "not_found";
  usage: {
    cached: boolean;
    credits: number;
    rows: number;
  };
}

export class OwnershipInputError extends Error {
  readonly code: OwnershipInputErrorCode;

  constructor(code: OwnershipInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class GetLiveOwnershipReadbackError extends Error {
  readonly code: GetLiveOwnershipReadbackErrorCode;

  constructor(code: GetLiveOwnershipReadbackErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const LIVE_OWNERSHIP_YN: readonly string[] = ["N", "Y"];

/**
 * Exact entity-id ownership lookup against a released Serving snapshot.
 * `rows` is expected to already be scoped to a single instrument id by the
 * caller's SQL (WHERE entity_id = $2); more than one row is a data
 * integrity failure, not silently narrowed. A legitimate zero-row result is
 * `status: "not_found"`; a row that exists but carries
 * `coverage.status: "unavailable"` (no share capital, free float, or holder
 * record found for this instrument in the current mirrored snapshot) is
 * still `status: "found"` with all 3 buckets absent -- the caller can tell
 * "we know this instrument and it currently has no ownership data" apart
 * from "we have never heard of this instrument".
 */
export function getLiveOwnership(
  input: GetLiveOwnershipInput,
  rows: readonly LiveOwnershipRow[]
): GetLiveOwnershipResult {
  const instrumentId = input.instrumentId.trim();

  if (instrumentId.length === 0) {
    throw new OwnershipInputError("INSTRUMENT_ID_REQUIRED", "instrument_id is required");
  }

  if (rows.length > 1) {
    throw new GetLiveOwnershipReadbackError(
      "MULTIPLE_ROWS_FOR_INSTRUMENT",
      "ownership lookup matched more than one released row for this instrument id"
    );
  }

  const dataVersion = requireNonEmptyOwnershipString(input.dataVersion, "snapshot data version");
  const asOf = requireNonEmptyOwnershipString(input.asOf, "snapshot as-of");
  const row = rows[0];

  if (row === undefined) {
    return {
      asOf,
      dataVersion,
      instrumentId,
      liveDataAccess: true,
      methodologyVersion: GET_OWNERSHIP_LIVE_VERSION,
      provenance: [],
      status: "not_found",
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    };
  }

  const mapped = mapLiveOwnershipRow({
    expectedDataVersion: dataVersion,
    expectedInstrumentId: instrumentId,
    row
  });
  const holders = mapped.holders ?? [];

  return {
    asOf,
    coverage: mapped.coverage,
    dataVersion,
    freeFloat: mapped.freeFloat,
    holders: mapped.holders,
    instrumentId,
    liveDataAccess: true,
    methodologyVersion: GET_OWNERSHIP_LIVE_VERSION,
    provenance:
      holders.length > 0
        ? holders.map((holder) => ({
            data_version: dataVersion,
            methodology_version: GET_OWNERSHIP_LIVE_VERSION,
            source: "netquity-ownership",
            source_record_id: holder.sourceRecordId
          }))
        : [
            {
              data_version: dataVersion,
              methodology_version: GET_OWNERSHIP_LIVE_VERSION,
              source: "netquity-ownership",
              source_record_id: row.source_record_id
            }
          ],
    shareCapital: mapped.shareCapital,
    status: "found",
    usage: {
      cached: false,
      credits: 0,
      rows: holders.length
    }
  };
}

/**
 * Maps one released `serving_record` row to its coverage marker and 3
 * independently optional buckets. Kept module-private, matching
 * `mapLiveDirectorateRow` in packages/directorate: only the public
 * `getLiveOwnership` entry point is tested/consumed directly.
 */
function mapLiveOwnershipRow(input: {
  expectedDataVersion: string;
  expectedInstrumentId: string;
  row: LiveOwnershipRow;
}): {
  coverage: OwnershipCoverage;
  freeFloat?: LiveFreeFloat;
  holders?: LiveOwnershipHolder[];
  shareCapital?: LiveShareCapital;
} {
  const { row } = input;
  const dataVersion = requireNonEmptyOwnershipString(row.data_version, "row data version");

  if (dataVersion !== input.expectedDataVersion) {
    throw malformedOwnershipRow("row data version does not match the released snapshot");
  }

  const instrumentId = requireNonEmptyOwnershipString(row.entity_id, "entity id");

  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) {
    throw malformedOwnershipRow("entity id is not an opaque HKEX security id");
  }

  if (instrumentId !== input.expectedInstrumentId) {
    throw malformedOwnershipRow("entity id does not match the requested instrument id");
  }

  const code = instrumentId.slice("hkex_security_".length);
  const sourceRecordId = requireNonEmptyOwnershipString(row.source_record_id, "source record id");
  const expectedAvailableSourceRecordId = `netquity:ownership.available:${code}`;
  const expectedUnavailableSourceRecordId = `netquity:ownership.unavailable:${code}`;

  if (sourceRecordId !== expectedAvailableSourceRecordId && sourceRecordId !== expectedUnavailableSourceRecordId) {
    throw malformedOwnershipRow("source record id is not a matching Netquity ownership record");
  }

  const payload = requireOwnershipObject(row.payload, "payload");
  const coverage = mapLiveOwnershipCoverage(payload.coverage);
  const shareCapital = payload.shareCapital === undefined ? undefined : mapLiveShareCapital(payload.shareCapital);
  const freeFloat = payload.freeFloat === undefined ? undefined : mapLiveFreeFloat(payload.freeFloat);
  const holdersValue = payload.holders;

  if (holdersValue !== undefined && !Array.isArray(holdersValue)) {
    throw malformedOwnershipRow("payload holders is malformed");
  }

  const anyBucketPresent = shareCapital !== undefined || freeFloat !== undefined || holdersValue !== undefined;

  if (coverage.status === "unavailable") {
    if (anyBucketPresent) {
      throw malformedOwnershipRow("unavailable coverage must not carry share capital, free float, or holder data");
    }

    if (sourceRecordId !== expectedUnavailableSourceRecordId) {
      throw malformedOwnershipRow("unavailable coverage must use the ownership-unavailable source record id");
    }

    return { coverage };
  }

  if (sourceRecordId !== expectedAvailableSourceRecordId) {
    throw malformedOwnershipRow("available coverage must use the ownership-available source record id");
  }

  if (!anyBucketPresent) {
    throw malformedOwnershipRow("available coverage must carry at least one of share capital, free float, or holders");
  }

  if (holdersValue !== undefined && holdersValue.length === 0) {
    throw malformedOwnershipRow("holders, when present, must not be an empty array");
  }

  const holders = holdersValue?.map((entry) => mapLiveOwnershipHolder(entry, instrumentId, code));

  return { coverage, freeFloat, holders, shareCapital };
}

function mapLiveOwnershipCoverage(value: unknown): OwnershipCoverage {
  const coverage = requireOwnershipObject(value, "coverage");
  const status = coverage.status;

  if (status !== "available" && status !== "unavailable") {
    throw malformedOwnershipRow("coverage status is malformed");
  }

  if (status === "unavailable") {
    const reason = coverage.reason;

    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw malformedOwnershipRow("unavailable coverage requires a reason");
    }

    return { reason, status };
  }

  return { status };
}

function mapLiveShareCapital(value: unknown): LiveShareCapital {
  const shareCapital = requireOwnershipObject(value, "shareCapital");
  const issuedShares = requireOwnershipNonNegativeNumber(shareCapital, "issuedShares");
  const issuedSharesChange = requireOwnershipFiniteNumber(shareCapital, "issuedSharesChange");
  const hkShareClass = requireOwnershipPayloadString(shareCapital, "hkShareClass");
  const hkShares = requireOptionalOwnershipNonNegativeNumber(shareCapital, "hkShares");
  const nonHkShareClass = requireOptionalOwnershipPayloadString(shareCapital, "nonHkShareClass");
  const nonHkShares = requireOptionalOwnershipNonNegativeNumber(shareCapital, "nonHkShares");
  const weightedVotingRightsRatio = requireOptionalOwnershipNonNegativeNumber(shareCapital, "weightedVotingRightsRatio");
  const isHShare = requireOwnershipYesNo(shareCapital, "isHShare");
  const hasSecondaryListing = requireOwnershipYesNo(shareCapital, "hasSecondaryListing");
  const sharesInCcass = requireOptionalOwnershipNonNegativeNumber(shareCapital, "sharesInCcass");
  const sharesOutsideCcass = requireOptionalOwnershipNonNegativeNumber(shareCapital, "sharesOutsideCcass");
  const preferenceShares = requireOptionalOwnershipNonNegativeNumber(shareCapital, "preferenceShares");
  const asOf = requireOwnershipDateString(shareCapital, "shareCapital.asOf");
  return {
    asOf,
    hasSecondaryListing,
    hkShareClass,
    hkShares,
    isHShare,
    issuedShares,
    issuedSharesChange,
    nonHkShareClass,
    nonHkShares,
    preferenceShares,
    sharesInCcass,
    sharesOutsideCcass,
    weightedVotingRightsRatio
  };
}

function mapLiveFreeFloat(value: unknown): LiveFreeFloat {
  const freeFloat = requireOwnershipObject(value, "freeFloat");
  const issuedShares = requireOwnershipNonNegativeNumber(freeFloat, "issuedShares");
  const nonFreeFloatShares = requireOwnershipNonNegativeNumber(freeFloat, "nonFreeFloatShares");
  const freeFloatShares = requireOwnershipNonNegativeNumber(freeFloat, "freeFloatShares");
  const freeFloatPercent = requireOwnershipNonNegativeNumber(freeFloat, "freeFloatPercent");
  const asOf = requireOwnershipDateString(freeFloat, "freeFloat.asOf");
  return { asOf, freeFloatPercent, freeFloatShares, issuedShares, nonFreeFloatShares };
}

function mapLiveOwnershipHolder(rawHolder: unknown, instrumentId: string, code: string): LiveOwnershipHolder {
  const holder = requireOwnershipObject(rawHolder, "holder");
  const holderId = requireOwnershipPayloadString(holder, "holderId");

  if (!holderId.startsWith(`ownership_${code}_`)) {
    throw malformedOwnershipRow("holder holderId does not match its code");
  }

  const name = mapLiveOwnershipHolderName(holder.name);
  const holderType = requireOwnershipPayloadString(holder, "holderType");
  const groupType = requireOwnershipPayloadString(holder, "groupType");
  const sourceType = requireOwnershipPayloadString(holder, "sourceType");
  const heldShares = requireOwnershipNonNegativeNumber(holder, "heldShares");
  const heldPercent = requireOwnershipNonNegativeNumber(holder, "heldPercent");
  const asOf = requireOwnershipDateString(holder, "holder.asOf");
  const crossHolding = holder.crossHolding === undefined ? undefined : mapLiveOwnershipCrossHolding(holder.crossHolding);
  const sourceRecordId = requireOwnershipPayloadString(holder, "sourceRecordId");
  const expectedSourceRecordId = `netquity:listcompheld.data:${code}:`;

  if (!sourceRecordId.startsWith(expectedSourceRecordId)) {
    throw malformedOwnershipRow("holder sourceRecordId is not a matching Netquity ownership field pointer");
  }

  if (crossHolding !== undefined && holderType !== "L") {
    throw malformedOwnershipRow("crossHolding is only valid for holderType 'L'");
  }

  return {
    asOf,
    crossHolding,
    groupType,
    heldPercent,
    heldShares,
    holderId,
    holderType,
    instrumentId,
    name,
    sourceRecordId,
    sourceType
  };
}

function mapLiveOwnershipHolderName(value: unknown): LiveOwnershipHolderName {
  const name = requireOwnershipObject(value, "name");
  const en = requireOwnershipPayloadString(name, "en");
  const zhHant = requireOwnershipPayloadString(name, "zhHant");
  const zhHans = requireOwnershipPayloadString(name, "zhHans");
  return { en, zhHans, zhHant };
}

function mapLiveOwnershipCrossHolding(value: unknown): LiveOwnershipCrossHolding {
  const crossHolding = requireOwnershipObject(value, "crossHolding");
  const instrumentId = requireOwnershipPayloadString(crossHolding, "instrumentId");

  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) {
    throw malformedOwnershipRow("crossHolding instrumentId is not an opaque HKEX security id");
  }

  return { instrumentId };
}

function malformedOwnershipRow(message: string): GetLiveOwnershipReadbackError {
  return new GetLiveOwnershipReadbackError("MALFORMED_LIVE_ROW", message);
}

function requireOwnershipPayloadString(payload: Record<string, unknown>, field: string): string {
  return requireNonEmptyOwnershipString(payload[field], `payload ${field}`);
}

function requireOptionalOwnershipPayloadString(payload: Record<string, unknown>, field: string): string | undefined {
  const value = payload[field];

  if (value === undefined) return undefined;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw malformedOwnershipRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireOwnershipYesNo(payload: Record<string, unknown>, field: string): "N" | "Y" {
  const value = payload[field];

  if (typeof value !== "string" || !(LIVE_OWNERSHIP_YN as readonly string[]).includes(value)) {
    throw malformedOwnershipRow(`payload ${field} is malformed`);
  }

  return value as "N" | "Y";
}

function requireOwnershipNonNegativeNumber(payload: Record<string, unknown>, field: string): number {
  const value = payload[field];

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw malformedOwnershipRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireOwnershipFiniteNumber(payload: Record<string, unknown>, field: string): number {
  const value = payload[field];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw malformedOwnershipRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireOptionalOwnershipNonNegativeNumber(payload: Record<string, unknown>, field: string): number | undefined {
  const value = payload[field];

  if (value === undefined) return undefined;

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw malformedOwnershipRow(`payload ${field} is malformed`);
  }

  return value;
}

function requireOwnershipDateString(payload: Record<string, unknown>, field: string): string {
  const value = payload.asOf;

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw malformedOwnershipRow(`${field} is malformed`);
  }

  return value;
}

function requireNonEmptyOwnershipString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw malformedOwnershipRow(`${field} is missing`);
  }

  return value;
}

function requireOwnershipObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw malformedOwnershipRow(`${field} is malformed`);
  }

  return value as Record<string, unknown>;
}
