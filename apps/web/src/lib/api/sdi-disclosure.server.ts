import {
  createErrorEnvelope,
  type ResponseEnvelope,
} from "@aiphabee/data-contracts";
import {
  AuthConfigurationError,
  getAuthenticatedWebIdentitySession,
  resolveWebRequestSubject,
  type AuthenticatedWebIdentityBindings,
} from "../auth.server";
import type { GetLiveSdiDisclosuresData, LiveSdiPositionType } from "./types";

/**
 * Gated live SDI (disclosure of interests) lookup, parallel to
 * corporate-actions.server.ts's server-fn (same session/RPC boundary, same
 * fail-closed pattern, same reuse of the 'netquity-collaboration-staging.v1'
 * rights basis), kept in its own file since sdi_disclosure is a distinct
 * dataset from financial_facts/security_profile/quote_snapshot/
 * corporate_actions.
 */
export interface SdiDisclosureServerInput {
  instrumentId: string;
}

export type ValidatedSdiDisclosureInput =
  | { input: SdiDisclosureServerInput; valid: true }
  | { valid: false };

export interface SdiDisclosureRpcResult {
  envelope: ResponseEnvelope<GetLiveSdiDisclosuresData>;
  status: number;
}

export interface SdiDisclosureRpcBinding {
  resolveSdiDisclosure(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<SdiDisclosureRpcResult>;
}

export interface AuthenticatedSdiDisclosureBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: SdiDisclosureRpcBinding;
}

export type SdiDisclosureSessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateSdiDisclosureInput(data: unknown): ValidatedSdiDisclosureInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedSdiDisclosureRequest(
  bindings: AuthenticatedSdiDisclosureBindings,
  request: Request,
  input: SdiDisclosureServerInput,
  readSession: SdiDisclosureSessionReader = getAuthenticatedWebIdentitySession,
): Promise<SdiDisclosureRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<SdiDisclosureSessionReader>>;
  try {
    session = await readSession(bindings, request.headers);
  } catch (error) {
    if (error instanceof AuthConfigurationError && error.code === "AUTH_OAUTH_CONFIG_MISSING") {
      session = null;
    } else {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "session authority is unavailable", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
  }
  const { authSubject } = resolveWebRequestSubject(session);

  const service = bindings.AIPHABEE_API;
  if (!service) {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private sdi disclosure service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveSdiDisclosure({
      authSubject,
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isSdiDisclosureRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private sdi disclosure response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private sdi disclosure service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

// Not-found is filtered into an ErrorEnvelope (code NOT_FOUND) by the worker
// RPC before it reaches here, so a successful (ok: true) envelope always
// carries status "found" with a well-formed coverage marker (disclosures
// may still be an empty array when coverage.status is "unavailable").
function isSdiDisclosureRpcResult(value: unknown): value is SdiDisclosureRpcResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  if (
    ![200, 400, 403, 404, 409, 424, 500].includes(result.status as number) ||
    !result.envelope ||
    typeof result.envelope !== "object"
  ) return false;
  const envelope = result.envelope as Record<string, unknown>;
  if (envelope.ok === false) {
    const error = envelope.error;
    return !!error && typeof error === "object" && typeof (error as Record<string, unknown>).code === "string";
  }
  if (envelope.ok !== true || !envelope.data || typeof envelope.data !== "object") return false;
  const data = envelope.data as Record<string, unknown>;
  if (
    data.liveDataAccess !== true ||
    data.status !== "found" ||
    !isNonEmptyString(data.dataVersion) ||
    !isNonEmptyString(data.methodologyVersion) ||
    !isNonEmptyString(data.instrumentId) ||
    !isUsageSummary(data.usage) ||
    !isCoverage(data.coverage) ||
    !Array.isArray(data.disclosures) ||
    !data.disclosures.every(isSdiDisclosureRow)
  ) return false;
  if (
    (data.coverage as Record<string, unknown>).status === "unavailable" &&
    (data.disclosures as unknown[]).length > 0
  ) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length === 0 ||
    !provenance.every((entry) =>
      isLiveSdiDisclosureProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  ) return false;
  const envelopeProvenance = envelope.provenance;
  return (
    envelope.data_version === data.dataVersion &&
    envelope.methodology_version === data.methodologyVersion &&
    isUsageSummary(envelope.usage) &&
    Array.isArray(envelopeProvenance) &&
    envelopeProvenance.length === provenance.length &&
    envelopeProvenance.every((entry) =>
      isLiveSdiDisclosureProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveSdiDisclosureProvenance(
  value: unknown,
  dataVersion: string,
  methodologyVersion: string,
): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    provenance.source === "netquity-sdi-disclosure" &&
    isNonEmptyString(provenance.source_record_id) &&
    provenance.data_version === dataVersion &&
    provenance.methodology_version === methodologyVersion
  );
}

function isCoverage(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const coverage = value as Record<string, unknown>;
  return (
    (coverage.status === "available" || coverage.status === "unavailable") &&
    (coverage.reason === undefined || typeof coverage.reason === "string")
  );
}

const LIVE_SDI_FORM_TYPES = ["1", "2", "3A"];
const LIVE_SDI_POSITION_TYPES: LiveSdiPositionType[] = ["long", "short", "pool"];

function isSdiDisclosureRow(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (
    !isNonEmptyString(row.disclosureId) ||
    !LIVE_SDI_FORM_TYPES.includes(row.formType as string) ||
    !isNonEmptyString(row.referenceNo) ||
    !isNonEmptyString(row.shareClass) ||
    !isNonEmptyString(row.sourceRecordId) ||
    !isIsoDate(row.reportDate) ||
    !isIsoDate(row.transactionDate)
  ) return false;
  if (row.amendsReferenceNo !== undefined && !isNonEmptyString(row.amendsReferenceNo)) return false;
  if (row.supersededByReferenceNo !== undefined && !isNonEmptyString(row.supersededByReferenceNo)) return false;
  if (!isHolderName(row.holderName)) return false;
  return Array.isArray(row.positions) && row.positions.length > 0 && row.positions.every(isSdiPosition);
}

function isHolderName(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const holderName = value as Record<string, unknown>;
  return (
    isNonEmptyString(holderName.en) &&
    isNonEmptyString(holderName.zhHans) &&
    isNonEmptyString(holderName.zhHant)
  );
}

function isSdiPosition(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const position = value as Record<string, unknown>;
  if (!LIVE_SDI_POSITION_TYPES.includes(position.positionType as LiveSdiPositionType)) return false;
  const isOptionalFiniteNonNegative = (field: unknown) =>
    field === undefined || (typeof field === "number" && Number.isFinite(field) && field >= 0);
  return (
    (position.currency === undefined || isNonEmptyString(position.currency)) &&
    (position.eventCode === undefined || isNonEmptyString(position.eventCode)) &&
    isOptionalFiniteNonNegative(position.shares) &&
    isOptionalFiniteNonNegative(position.previousBalanceShares) &&
    isOptionalFiniteNonNegative(position.previousBalancePercent) &&
    isOptionalFiniteNonNegative(position.presentBalanceShares) &&
    isOptionalFiniteNonNegative(position.presentBalancePercent)
  );
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value);
}

function isUsageSummary(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const usage = value as Record<string, unknown>;
  return (
    typeof usage.cached === "boolean" &&
    typeof usage.credits === "number" &&
    Number.isFinite(usage.credits) &&
    usage.credits >= 0 &&
    typeof usage.rows === "number" &&
    Number.isInteger(usage.rows) &&
    usage.rows >= 0
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
