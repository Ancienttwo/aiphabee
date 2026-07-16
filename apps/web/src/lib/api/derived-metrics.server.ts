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
import type { GetLiveDerivedMetricsData } from "./types";

/**
 * Gated live derived-metrics lookup, parallel to quote-snapshot.server.ts's
 * server-fn (same session/RPC boundary, same fail-closed pattern), kept in
 * its own file since resolveDerivedMetrics conjuncts two datasets
 * (financial_facts + quote_snapshot) rather than gating on one. There is no
 * separate "derived metrics" dataset or entitlement row -- the worker RPC
 * enforces both existing field-authority gates and denies the whole request
 * if either is missing.
 */
export interface DerivedMetricsServerInput {
  instrumentId: string;
}

export type ValidatedDerivedMetricsInput =
  | { input: DerivedMetricsServerInput; valid: true }
  | { valid: false };

export interface DerivedMetricsRpcResult {
  envelope: ResponseEnvelope<GetLiveDerivedMetricsData>;
  status: number;
}

export interface DerivedMetricsRpcBinding {
  resolveDerivedMetrics(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<DerivedMetricsRpcResult>;
}

export interface AuthenticatedDerivedMetricsBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: DerivedMetricsRpcBinding;
}

export type DerivedMetricsSessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateDerivedMetricsInput(data: unknown): ValidatedDerivedMetricsInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedDerivedMetricsRequest(
  bindings: AuthenticatedDerivedMetricsBindings,
  request: Request,
  input: DerivedMetricsServerInput,
  readSession: DerivedMetricsSessionReader = getAuthenticatedWebIdentitySession,
): Promise<DerivedMetricsRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<DerivedMetricsSessionReader>>;
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
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private derived metrics service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveDerivedMetrics({
      authSubject,
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isDerivedMetricsRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private derived metrics response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private derived metrics service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

// Unlike the single-dataset resolvers, a successful (ok: true) envelope here
// can legitimately carry an empty provenance array (both financial_facts and
// quote_snapshot returned 404 for this instrument -- every metric then
// blocks on financial_facts_not_found) since resolveDerivedMetrics never
// itself returns NOT_FOUND. Each provenance entry's own source is pinned to
// whichever single dataset produced it, not to this composite result.
function isDerivedMetricsRpcResult(value: unknown): value is DerivedMetricsRpcResult {
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
    data.live_data_access !== true ||
    typeof data.data_version !== "string" ||
    !isNonEmptyString(data.methodology_version) ||
    !isUsageSummary(data.usage) ||
    (data.status !== "blocked" && data.status !== "computed" && data.status !== "partial") ||
    !Array.isArray(data.definitions) ||
    !data.definitions.every(isDerivedMetricDefinition) ||
    !Array.isArray(data.metrics) ||
    !data.metrics.every(isDerivedMetricValue)
  ) return false;
  if (data.financial_facts_as_of !== undefined && typeof data.financial_facts_as_of !== "string") return false;
  if (data.financial_period_end !== undefined && typeof data.financial_period_end !== "string") return false;
  if (data.quote_as_of !== undefined && typeof data.quote_as_of !== "string") return false;
  const provenance = data.provenance;
  if (!Array.isArray(provenance) || !provenance.every(isLiveDerivedMetricsProvenance)) return false;
  const envelopeProvenance = envelope.provenance;
  return (
    envelope.data_version === data.data_version &&
    envelope.methodology_version === data.methodology_version &&
    isUsageSummary(envelope.usage) &&
    Array.isArray(envelopeProvenance) &&
    envelopeProvenance.length === provenance.length &&
    envelopeProvenance.every(isLiveDerivedMetricsProvenance)
  );
}

// Not pinned to the composite result's own data_version/methodology_version
// (unlike the single-dataset provenance guards): each entry describes only
// its own source dataset's live promotion, which the composite never
// rewrites.
function isLiveDerivedMetricsProvenance(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    (provenance.source === "netquity-finreport-nb" || provenance.source === "netquity-unadjprice2-daily") &&
    isNonEmptyString(provenance.source_record_id) &&
    isNonEmptyString(provenance.data_version) &&
    isNonEmptyString(provenance.methodology_version)
  );
}

function isDerivedMetricDefinition(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const definition = value as Record<string, unknown>;
  return (
    isNonEmptyString(definition.metric_id) &&
    isNonEmptyString(definition.formula) &&
    isNonEmptyString(definition.label) &&
    (definition.category === "profitability" || definition.category === "valuation") &&
    (definition.unit === "multiple" || definition.unit === "ratio")
  );
}

function isDerivedMetricValue(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const metric = value as Record<string, unknown>;
  if (
    (metric.category !== "profitability" && metric.category !== "valuation") ||
    (metric.status !== "blocked" && metric.status !== "computed") ||
    (metric.unit !== "multiple" && metric.unit !== "ratio") ||
    !isNonEmptyString(metric.metric_id) ||
    !Array.isArray(metric.anomaly_flags) ||
    !metric.anomaly_flags.every((flag) => typeof flag === "string") ||
    !Array.isArray(metric.source_record_ids) ||
    !metric.source_record_ids.every((id) => typeof id === "string") ||
    !metric.inputs ||
    typeof metric.inputs !== "object"
  ) return false;
  if (metric.status === "blocked" && !isNonEmptyString(metric.blocked_reason)) return false;
  if (metric.status === "computed" && typeof metric.value !== "number") return false;
  if (metric.period_end !== undefined && typeof metric.period_end !== "string") return false;
  return true;
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
