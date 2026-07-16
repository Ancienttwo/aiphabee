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
import type { GetLiveCorporateActionsData } from "./types";

/**
 * Gated live corporate-actions lookup, parallel to financial-facts.server.ts's
 * server-fn (same session/RPC boundary, same fail-closed pattern, same reuse
 * of the 'netquity-collaboration-staging.v1' rights basis -- unlike
 * quote_snapshot.server.ts, corporate_actions has no separate market-data
 * policy version), kept in its own file since corporate_actions is a
 * distinct dataset from financial_facts/security_profile/quote_snapshot.
 */
export interface CorporateActionsServerInput {
  instrumentId: string;
}

export type ValidatedCorporateActionsInput =
  | { input: CorporateActionsServerInput; valid: true }
  | { valid: false };

export interface CorporateActionsRpcResult {
  envelope: ResponseEnvelope<GetLiveCorporateActionsData>;
  status: number;
}

export interface CorporateActionsRpcBinding {
  resolveCorporateActions(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<CorporateActionsRpcResult>;
}

export interface AuthenticatedCorporateActionsBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: CorporateActionsRpcBinding;
}

export type CorporateActionsSessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateCorporateActionsInput(data: unknown): ValidatedCorporateActionsInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedCorporateActionsRequest(
  bindings: AuthenticatedCorporateActionsBindings,
  request: Request,
  input: CorporateActionsServerInput,
  readSession: CorporateActionsSessionReader = getAuthenticatedWebIdentitySession,
): Promise<CorporateActionsRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<CorporateActionsSessionReader>>;
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
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private corporate actions service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveCorporateActions({
      authSubject,
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isCorporateActionsRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private corporate actions response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private corporate actions service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

// Not-found is filtered into an ErrorEnvelope (code NOT_FOUND) by the worker
// RPC before it reaches here, so a successful (ok: true) envelope always
// carries status "found" with a well-formed coverage marker (actions may
// still be an empty array when coverage.status is "unavailable").
function isCorporateActionsRpcResult(value: unknown): value is CorporateActionsRpcResult {
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
    data.toolName !== "get_corporate_actions" ||
    data.status !== "found" ||
    !isNonEmptyString(data.dataVersion) ||
    !isNonEmptyString(data.methodologyVersion) ||
    !isNonEmptyString(data.instrumentId) ||
    !isUsageSummary(data.usage) ||
    !isCoverage(data.coverage) ||
    !Array.isArray(data.actions) ||
    !data.actions.every(isCorporateActionRow)
  ) return false;
  if (
    (data.coverage as Record<string, unknown>).status === "unavailable" &&
    (data.actions as unknown[]).length > 0
  ) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length === 0 ||
    !provenance.every((entry) =>
      isLiveCorporateActionsProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
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
      isLiveCorporateActionsProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveCorporateActionsProvenance(
  value: unknown,
  dataVersion: string,
  methodologyVersion: string,
): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    provenance.source === "netquity-corporate-actions" &&
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

const LIVE_CORPORATE_ACTION_TYPES = ["dividend", "buyback", "split", "consolidation"];

function isCorporateActionRow(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (
    typeof row.actionId !== "string" ||
    !LIVE_CORPORATE_ACTION_TYPES.includes(row.actionType as string) ||
    typeof row.instrumentId !== "string" ||
    typeof row.sourceRecordId !== "string"
  ) return false;
  if (!isIsoDate(row.announcementDate) || !isIsoDate(row.effectiveDate)) return false;
  if (row.exDate !== undefined && !isIsoDate(row.exDate)) return false;
  if (row.paymentDate !== undefined && !isIsoDate(row.paymentDate)) return false;
  if (row.summary !== undefined && (typeof row.summary !== "string" || row.summary.trim().length === 0)) return false;
  return isCorporateActionTermsAndSummaryShaped(row);
}

/**
 * `terms`/`summary` are shaped per actionType, not a loose "if present,
 * well-typed" union (mirrors packages/corporate-actions's
 * mapLiveCorporateActionTypeFields): dividend requires terms.cashAmount+
 * currency and a summary; buyback requires terms.buybackValue+shares+
 * currency and no summary (no vendor text field exists for it); split/
 * consolidation require a summary and no terms at all. A row with the wrong
 * shape for its actionType (e.g. a dividend missing terms.cashAmount) fails
 * closed rather than rendering a misleading/blank amount.
 */
function isCorporateActionTermsAndSummaryShaped(row: Record<string, unknown>): boolean {
  const actionType = row.actionType;

  if (actionType === "split" || actionType === "consolidation") {
    return row.terms === undefined && typeof row.summary === "string";
  }

  if (typeof row.terms !== "object" || row.terms === null) return false;
  const terms = row.terms as Record<string, unknown>;
  const isFiniteNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value);

  if (actionType === "dividend") {
    return (
      typeof row.summary === "string" &&
      isFiniteNumber(terms.cashAmount) &&
      typeof terms.currency === "string" &&
      terms.buybackValue === undefined &&
      terms.shares === undefined
    );
  }

  // buyback
  return (
    row.summary === undefined &&
    isFiniteNumber(terms.buybackValue) &&
    isFiniteNumber(terms.shares) &&
    typeof terms.currency === "string" &&
    terms.cashAmount === undefined
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
