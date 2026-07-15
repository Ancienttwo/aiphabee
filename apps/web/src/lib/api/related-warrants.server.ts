import {
  createErrorEnvelope,
  type ResponseEnvelope,
} from "@aiphabee/data-contracts";
import {
  canonicalAuthSubject,
  getAuthenticatedWebIdentitySession,
  type AuthenticatedWebIdentityBindings,
} from "../auth.server";
import type { GetLiveRelatedWarrantsData } from "./types";

/**
 * Gated live related-warrants (per-underlying-instrument list of associated
 * derivative warrant / CBBC codes) lookup, parallel to ownership.server.ts's
 * server-fn (same session/RPC boundary, same fail-closed pattern, same reuse
 * of the 'netquity-collaboration-staging.v1' rights basis), kept in its own
 * file since related_warrants is a distinct dataset from financial_facts/
 * security_profile/quote_snapshot/corporate_actions/sdi_disclosure/
 * directorate/ownership.
 */
export interface RelatedWarrantsServerInput {
  instrumentId: string;
}

export type ValidatedRelatedWarrantsInput =
  | { input: RelatedWarrantsServerInput; valid: true }
  | { valid: false };

export interface RelatedWarrantsRpcResult {
  envelope: ResponseEnvelope<GetLiveRelatedWarrantsData>;
  status: number;
}

export interface RelatedWarrantsRpcBinding {
  resolveRelatedWarrants(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<RelatedWarrantsRpcResult>;
}

export interface AuthenticatedRelatedWarrantsBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: RelatedWarrantsRpcBinding;
}

export type RelatedWarrantsSessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateRelatedWarrantsInput(data: unknown): ValidatedRelatedWarrantsInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedRelatedWarrantsRequest(
  bindings: AuthenticatedRelatedWarrantsBindings,
  request: Request,
  input: RelatedWarrantsServerInput,
  readSession: RelatedWarrantsSessionReader = getAuthenticatedWebIdentitySession,
): Promise<RelatedWarrantsRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<RelatedWarrantsSessionReader>>;
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
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private related-warrants service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveRelatedWarrants({
      authSubject: canonicalAuthSubject(session.user.id),
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isRelatedWarrantsRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private related-warrants response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private related-warrants service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

// Not-found is filtered into an ErrorEnvelope (code NOT_FOUND) by the worker
// RPC before it reaches here, so a successful (ok: true) envelope always
// carries status "found" with a well-formed coverage marker (warrants is
// present only when coverage.status is "available").
function isRelatedWarrantsRpcResult(value: unknown): value is RelatedWarrantsRpcResult {
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
  if (data.warrants !== undefined) {
    if (!Array.isArray(data.warrants) || data.warrants.length === 0 || !data.warrants.every(isRelatedWarrant)) return false;
  }
  const anyBucketPresent = data.warrants !== undefined;
  if ((data.coverage as Record<string, unknown>).status === "unavailable" && anyBucketPresent) return false;
  if ((data.coverage as Record<string, unknown>).status === "available" && !anyBucketPresent) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length === 0 ||
    !provenance.every((entry) =>
      isLiveRelatedWarrantsProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
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
      isLiveRelatedWarrantsProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveRelatedWarrantsProvenance(
  value: unknown,
  dataVersion: string,
  methodologyVersion: string,
): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    provenance.source === "netquity-related-warrants" &&
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

const LIVE_RELATED_WARRANT_CATEGORIES = ["cc_warrant", "ce_warrant", "comp_warrant", "dc_warrant", "dp_warrant"];

function isRelatedWarrant(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const warrant = value as Record<string, unknown>;
  if (
    !isNonEmptyString(warrant.instrumentId) ||
    !LIVE_RELATED_WARRANT_CATEGORIES.includes(warrant.category as string) ||
    !isNonEmptyString(warrant.sourceRecordId)
  ) return false;
  return isRelatedWarrantName(warrant.name);
}

function isRelatedWarrantName(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const name = value as Record<string, unknown>;
  return isNonEmptyString(name.en) && isNonEmptyString(name.zhHans) && isNonEmptyString(name.zhHant);
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
