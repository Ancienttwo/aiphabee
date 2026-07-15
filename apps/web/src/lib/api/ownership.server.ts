import {
  createErrorEnvelope,
  type ResponseEnvelope,
} from "@aiphabee/data-contracts";
import {
  canonicalAuthSubject,
  getAuthenticatedWebIdentitySession,
  type AuthenticatedWebIdentityBindings,
} from "../auth.server";
import type { GetLiveOwnershipData } from "./types";

/**
 * Gated live ownership (share capital / free float / substantial-shareholder
 * and cross-holding structure) lookup, parallel to directorate.server.ts's
 * server-fn (same session/RPC boundary, same fail-closed pattern, same reuse
 * of the 'netquity-collaboration-staging.v1' rights basis), kept in its own
 * file since ownership is a distinct dataset from financial_facts/
 * security_profile/quote_snapshot/corporate_actions/sdi_disclosure/
 * directorate.
 */
export interface OwnershipServerInput {
  instrumentId: string;
}

export type ValidatedOwnershipInput =
  | { input: OwnershipServerInput; valid: true }
  | { valid: false };

export interface OwnershipRpcResult {
  envelope: ResponseEnvelope<GetLiveOwnershipData>;
  status: number;
}

export interface OwnershipRpcBinding {
  resolveOwnership(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<OwnershipRpcResult>;
}

export interface AuthenticatedOwnershipBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: OwnershipRpcBinding;
}

export type OwnershipSessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateOwnershipInput(data: unknown): ValidatedOwnershipInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedOwnershipRequest(
  bindings: AuthenticatedOwnershipBindings,
  request: Request,
  input: OwnershipServerInput,
  readSession: OwnershipSessionReader = getAuthenticatedWebIdentitySession,
): Promise<OwnershipRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<OwnershipSessionReader>>;
  try {
    session = await readSession(bindings, request.headers);
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "session authority is unavailable", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
  if (!session?.user?.id) {
    return {
      envelope: createErrorEnvelope("AUTH_REQUIRED", "authenticated session is required", {
        asOf,
        requestId,
      }),
      status: 401,
    };
  }

  const service = bindings.AIPHABEE_API;
  if (!service) {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private ownership service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveOwnership({
      authSubject: canonicalAuthSubject(session.user.id),
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isOwnershipRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private ownership response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private ownership service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

// Not-found is filtered into an ErrorEnvelope (code NOT_FOUND) by the worker
// RPC before it reaches here, so a successful (ok: true) envelope always
// carries status "found" with a well-formed coverage marker (each of
// shareCapital/freeFloat/holders may still be absent when coverage.status is
// "unavailable", or independently absent/present when "available").
function isOwnershipRpcResult(value: unknown): value is OwnershipRpcResult {
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
    !isCoverage(data.coverage)
  ) return false;
  if (data.shareCapital !== undefined && !isShareCapital(data.shareCapital)) return false;
  if (data.freeFloat !== undefined && !isFreeFloat(data.freeFloat)) return false;
  if (data.holders !== undefined) {
    if (!Array.isArray(data.holders) || data.holders.length === 0 || !data.holders.every(isOwnershipHolder)) return false;
  }
  const anyBucketPresent = data.shareCapital !== undefined || data.freeFloat !== undefined || data.holders !== undefined;
  if ((data.coverage as Record<string, unknown>).status === "unavailable" && anyBucketPresent) return false;
  if ((data.coverage as Record<string, unknown>).status === "available" && !anyBucketPresent) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length === 0 ||
    !provenance.every((entry) =>
      isLiveOwnershipProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
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
      isLiveOwnershipProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveOwnershipProvenance(
  value: unknown,
  dataVersion: string,
  methodologyVersion: string,
): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    provenance.source === "netquity-ownership" &&
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

const LIVE_OWNERSHIP_YN = ["N", "Y"];

function isShareCapital(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const shareCapital = value as Record<string, unknown>;
  const isOptionalNonNegativeNumber = (field: unknown) =>
    field === undefined || (typeof field === "number" && Number.isFinite(field) && field >= 0);
  const isOptionalNonEmptyString = (field: unknown) => field === undefined || isNonEmptyString(field);
  return (
    typeof shareCapital.issuedShares === "number" &&
    Number.isFinite(shareCapital.issuedShares) &&
    shareCapital.issuedShares >= 0 &&
    typeof shareCapital.issuedSharesChange === "number" &&
    Number.isFinite(shareCapital.issuedSharesChange) &&
    isNonEmptyString(shareCapital.hkShareClass) &&
    isOptionalNonNegativeNumber(shareCapital.hkShares) &&
    isOptionalNonEmptyString(shareCapital.nonHkShareClass) &&
    isOptionalNonNegativeNumber(shareCapital.nonHkShares) &&
    isOptionalNonNegativeNumber(shareCapital.weightedVotingRightsRatio) &&
    LIVE_OWNERSHIP_YN.includes(shareCapital.isHShare as string) &&
    LIVE_OWNERSHIP_YN.includes(shareCapital.hasSecondaryListing as string) &&
    isOptionalNonNegativeNumber(shareCapital.sharesInCcass) &&
    isOptionalNonNegativeNumber(shareCapital.sharesOutsideCcass) &&
    isOptionalNonNegativeNumber(shareCapital.preferenceShares) &&
    isIsoDate(shareCapital.asOf)
  );
}

function isFreeFloat(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const freeFloat = value as Record<string, unknown>;
  const isRequiredNonNegativeNumber = (field: unknown) =>
    typeof field === "number" && Number.isFinite(field) && field >= 0;
  return (
    isRequiredNonNegativeNumber(freeFloat.issuedShares) &&
    isRequiredNonNegativeNumber(freeFloat.nonFreeFloatShares) &&
    isRequiredNonNegativeNumber(freeFloat.freeFloatShares) &&
    isRequiredNonNegativeNumber(freeFloat.freeFloatPercent) &&
    isIsoDate(freeFloat.asOf)
  );
}

function isOwnershipHolder(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const holder = value as Record<string, unknown>;
  if (
    !isNonEmptyString(holder.holderId) ||
    !isNonEmptyString(holder.holderType) ||
    !isNonEmptyString(holder.groupType) ||
    !isNonEmptyString(holder.sourceType) ||
    !isNonEmptyString(holder.sourceRecordId)
  ) return false;
  if (typeof holder.heldShares !== "number" || !Number.isFinite(holder.heldShares) || holder.heldShares < 0) return false;
  if (typeof holder.heldPercent !== "number" || !Number.isFinite(holder.heldPercent) || holder.heldPercent < 0) return false;
  if (!isIsoDate(holder.asOf)) return false;
  if (!isOwnershipHolderName(holder.name)) return false;
  if (holder.crossHolding !== undefined && !isOwnershipCrossHolding(holder.crossHolding)) return false;
  return true;
}

function isOwnershipHolderName(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const name = value as Record<string, unknown>;
  return isNonEmptyString(name.en) && isNonEmptyString(name.zhHans) && isNonEmptyString(name.zhHant);
}

function isOwnershipCrossHolding(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const crossHolding = value as Record<string, unknown>;
  return isNonEmptyString(crossHolding.instrumentId);
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
