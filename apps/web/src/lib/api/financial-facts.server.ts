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
import type { GetLiveFinancialFactsData } from "./types";

/**
 * Gated live financial-facts lookup, parallel to security.server.ts's
 * profile server-fn (same session/RPC boundary, same fail-closed pattern),
 * kept in its own file since financial_facts is a distinct dataset from
 * security_profile/security_master.
 */
export interface FinancialFactsServerInput {
  instrumentId: string;
}

export type ValidatedFinancialFactsInput =
  | { input: FinancialFactsServerInput; valid: true }
  | { valid: false };

export interface FinancialFactsRpcResult {
  envelope: ResponseEnvelope<GetLiveFinancialFactsData>;
  status: number;
}

export interface FinancialFactsRpcBinding {
  resolveFinancialFacts(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<FinancialFactsRpcResult>;
}

export interface AuthenticatedFinancialFactsBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: FinancialFactsRpcBinding;
}

export type FinancialFactsSessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateFinancialFactsInput(data: unknown): ValidatedFinancialFactsInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedFinancialFactsRequest(
  bindings: AuthenticatedFinancialFactsBindings,
  request: Request,
  input: FinancialFactsServerInput,
  readSession: FinancialFactsSessionReader = getAuthenticatedWebIdentitySession,
): Promise<FinancialFactsRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<FinancialFactsSessionReader>>;
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
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private financial facts service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveFinancialFacts({
      authSubject,
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isFinancialFactsRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private financial facts response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private financial facts service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

// Not-found is filtered into an ErrorEnvelope (code NOT_FOUND) by the worker
// RPC before it reaches here, so a successful (ok: true) envelope always
// carries status "found" with a well-formed coverage marker (facts may
// still be an empty array when coverage.status is "unavailable").
function isFinancialFactsRpcResult(value: unknown): value is FinancialFactsRpcResult {
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
    data.toolName !== "get_financial_facts" ||
    data.status !== "found" ||
    !isNonEmptyString(data.dataVersion) ||
    !isNonEmptyString(data.methodologyVersion) ||
    !isNonEmptyString(data.instrumentId) ||
    !isUsageSummary(data.usage) ||
    !isCoverage(data.coverage) ||
    !Array.isArray(data.facts) ||
    !data.facts.every(isFinancialFactRow)
  ) return false;
  if (
    (data.coverage as Record<string, unknown>).status === "unavailable" &&
    (data.facts as unknown[]).length > 0
  ) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length === 0 ||
    !provenance.every((entry) =>
      isLiveFinancialFactsProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
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
      isLiveFinancialFactsProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveFinancialFactsProvenance(
  value: unknown,
  dataVersion: string,
  methodologyVersion: string,
): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    provenance.source === "netquity-finreport-nb" &&
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

function isFinancialFactRow(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    ["currency", "instrumentId", "metricId", "periodEnd", "publishedAt", "qualityState", "sourceRecordId", "statementId", "statementType", "unit"].every(
      (field) => typeof row[field] === "string",
    ) &&
    (row.periodType === "FY" || row.periodType === "H1") &&
    typeof row.scale === "number" &&
    typeof row.value === "number"
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
