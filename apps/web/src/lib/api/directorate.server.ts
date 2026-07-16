import {
  createErrorEnvelope,
  type ResponseEnvelope,
} from "@aiphabee/data-contracts";
import {
  getAuthenticatedWebIdentitySession,
  resolveWebRequestSubject,
  type AuthenticatedWebIdentityBindings,
} from "../auth.server";
import type { GetLiveDirectorateData, LiveDirectorateCapacity } from "./types";

/**
 * Gated live directorate (director / senior-management biography) lookup,
 * parallel to sdi-disclosure.server.ts's server-fn (same session/RPC
 * boundary, same fail-closed pattern, same reuse of the
 * 'netquity-collaboration-staging.v1' rights basis), kept in its own file
 * since directorate is a distinct dataset from financial_facts/
 * security_profile/quote_snapshot/corporate_actions/sdi_disclosure.
 */
export interface DirectorateServerInput {
  instrumentId: string;
}

export type ValidatedDirectorateInput =
  | { input: DirectorateServerInput; valid: true }
  | { valid: false };

export interface DirectorateRpcResult {
  envelope: ResponseEnvelope<GetLiveDirectorateData>;
  status: number;
}

export interface DirectorateRpcBinding {
  resolveDirectorate(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<DirectorateRpcResult>;
}

export interface AuthenticatedDirectorateBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: DirectorateRpcBinding;
}

export type DirectorateSessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateDirectorateInput(data: unknown): ValidatedDirectorateInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedDirectorateRequest(
  bindings: AuthenticatedDirectorateBindings,
  request: Request,
  input: DirectorateServerInput,
  readSession: DirectorateSessionReader = getAuthenticatedWebIdentitySession,
): Promise<DirectorateRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<DirectorateSessionReader>>;
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
  const { authSubject } = resolveWebRequestSubject(session);

  const service = bindings.AIPHABEE_API;
  if (!service) {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private directorate service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveDirectorate({
      authSubject,
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isDirectorateRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private directorate response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private directorate service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

// Not-found is filtered into an ErrorEnvelope (code NOT_FOUND) by the worker
// RPC before it reaches here, so a successful (ok: true) envelope always
// carries status "found" with a well-formed coverage marker (directors may
// still be an empty array when coverage.status is "unavailable").
function isDirectorateRpcResult(value: unknown): value is DirectorateRpcResult {
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
    !Array.isArray(data.directors) ||
    !data.directors.every(isDirectorateProfileRow)
  ) return false;
  if (
    (data.coverage as Record<string, unknown>).status === "unavailable" &&
    (data.directors as unknown[]).length > 0
  ) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length === 0 ||
    !provenance.every((entry) =>
      isLiveDirectorateProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
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
      isLiveDirectorateProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveDirectorateProvenance(
  value: unknown,
  dataVersion: string,
  methodologyVersion: string,
): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    provenance.source === "netquity-directorate" &&
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

const LIVE_DIRECTORATE_CAPACITIES: LiveDirectorateCapacity[] = ["D", "S"];

function isDirectorateProfileRow(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (
    !isNonEmptyString(row.profileId) ||
    !LIVE_DIRECTORATE_CAPACITIES.includes(row.capacity as LiveDirectorateCapacity) ||
    !isNonEmptyString(row.sourceRecordId)
  ) return false;
  if (row.age !== undefined && (typeof row.age !== "number" || !Number.isInteger(row.age) || row.age < 0)) return false;
  if (!isDirectorateName(row.name)) return false;
  if (!isDirectorateTitle(row.title)) return false;
  if (row.biography !== undefined && !isDirectorateBiography(row.biography)) return false;
  if (row.remuneration !== undefined && !isDirectorateRemuneration(row.remuneration)) return false;
  return true;
}

function isDirectorateName(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const name = value as Record<string, unknown>;
  return isNonEmptyString(name.en) && isNonEmptyString(name.zhHans) && isNonEmptyString(name.zhHant);
}

function isDirectorateTitle(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const title = value as Record<string, unknown>;
  if (!isNonEmptyString(title.zhHans) || !isNonEmptyString(title.zhHant)) return false;
  return title.en === undefined || isNonEmptyString(title.en);
}

function isDirectorateBiography(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const biography = value as Record<string, unknown>;
  const isOptionalNonEmptyString = (field: unknown) => field === undefined || isNonEmptyString(field);
  return (
    isOptionalNonEmptyString(biography.en) &&
    isOptionalNonEmptyString(biography.zhHans) &&
    isOptionalNonEmptyString(biography.zhHant)
  );
}

function isDirectorateRemuneration(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const remuneration = value as Record<string, unknown>;
  const isOptionalNonEmptyString = (field: unknown) => field === undefined || isNonEmptyString(field);
  const isOptionalFiniteNonNegative = (field: unknown) =>
    field === undefined || (typeof field === "number" && Number.isFinite(field) && field >= 0);
  const isOptionalDateString = (field: unknown) => field === undefined || isIsoDate(field);
  return (
    isOptionalNonEmptyString(remuneration.currency) &&
    isOptionalFiniteNonNegative(remuneration.currentAmount) &&
    isOptionalDateString(remuneration.currentYearEnd) &&
    isOptionalFiniteNonNegative(remuneration.previousAmount) &&
    isOptionalDateString(remuneration.previousYearEnd)
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
