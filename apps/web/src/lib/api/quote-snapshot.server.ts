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
import type { GetLiveQuoteSnapshotData } from "./types";

/**
 * Gated live quote-snapshot lookup, parallel to financial-facts.server.ts's
 * server-fn (same session/RPC boundary, same fail-closed pattern), kept in
 * its own file since quote_snapshot is a distinct dataset with its own
 * rights_policy_version. This is end-of-day (EOD) data, never real-time.
 */
export interface QuoteSnapshotServerInput {
  instrumentId: string;
}

export type ValidatedQuoteSnapshotInput =
  | { input: QuoteSnapshotServerInput; valid: true }
  | { valid: false };

export interface QuoteSnapshotRpcResult {
  envelope: ResponseEnvelope<GetLiveQuoteSnapshotData>;
  status: number;
}

export interface QuoteSnapshotRpcBinding {
  resolveQuoteSnapshot(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<QuoteSnapshotRpcResult>;
}

export interface AuthenticatedQuoteSnapshotBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: QuoteSnapshotRpcBinding;
}

export type QuoteSnapshotSessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateQuoteSnapshotInput(data: unknown): ValidatedQuoteSnapshotInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedQuoteSnapshotRequest(
  bindings: AuthenticatedQuoteSnapshotBindings,
  request: Request,
  input: QuoteSnapshotServerInput,
  readSession: QuoteSnapshotSessionReader = getAuthenticatedWebIdentitySession,
): Promise<QuoteSnapshotRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<QuoteSnapshotSessionReader>>;
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
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private quote snapshot service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveQuoteSnapshot({
      authSubject,
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isQuoteSnapshotRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private quote snapshot response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private quote snapshot service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

// Not-found is filtered into an ErrorEnvelope (code NOT_FOUND) by the worker
// RPC before it reaches here, so a successful (ok: true) envelope always
// carries status "found" with a well-formed coverage marker (quote may still
// be absent when coverage.status is "unavailable").
function isQuoteSnapshotRpcResult(value: unknown): value is QuoteSnapshotRpcResult {
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
    data.toolName !== "get_quote_snapshot" ||
    data.status !== "found" ||
    !isNonEmptyString(data.dataVersion) ||
    !isNonEmptyString(data.methodologyVersion) ||
    !isNonEmptyString(data.instrumentId) ||
    !isUsageSummary(data.usage) ||
    !isCoverage(data.coverage) ||
    (data.quote !== undefined && !isQuoteRow(data.quote))
  ) return false;
  if (
    (data.coverage as Record<string, unknown>).status === "unavailable" &&
    data.quote !== undefined
  ) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length === 0 ||
    !provenance.every((entry) =>
      isLiveQuoteSnapshotProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
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
      isLiveQuoteSnapshotProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveQuoteSnapshotProvenance(
  value: unknown,
  dataVersion: string,
  methodologyVersion: string,
): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    provenance.source === "netquity-unadjprice2-daily" &&
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

function isQuoteRow(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (typeof row.currency !== "string" || typeof row.instrumentId !== "string") return false;
  if (typeof row.tradeDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(row.tradeDate)) return false;
  return ["open", "high", "low", "close", "volume", "turnover", "sharesOutstanding"].every(
    (field) => row[field] === undefined || (typeof row[field] === "number" && Number.isFinite(row[field] as number)),
  );
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
