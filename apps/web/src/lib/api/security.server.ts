import {
  createErrorEnvelope,
  type ResponseEnvelope,
} from "@aiphabee/data-contracts";
import {
  getAuthenticatedWebIdentitySession,
  resolveWebRequestSubject,
  type AuthenticatedWebIdentityBindings,
} from "../auth.server";
import type { GetSecurityProfileData, ResolveSecurityData } from "./types";

export interface SecurityServerInput {
  market?: string;
  query: string;
}

export type ValidatedSecurityInput =
  | { input: SecurityServerInput; valid: true }
  | { valid: false };

export interface SecurityRpcResult {
  envelope: ResponseEnvelope<ResolveSecurityData>;
  status: number;
}

export interface SecurityRpcBinding {
  resolveSecurity(input: {
    authSubject: string;
    market?: string;
    query: string;
    requestId: string;
  }): Promise<SecurityRpcResult>;
}

export interface ProfileServerInput {
  instrumentId: string;
}

export type ValidatedProfileInput =
  | { input: ProfileServerInput; valid: true }
  | { valid: false };

export interface ProfileRpcResult {
  envelope: ResponseEnvelope<GetSecurityProfileData>;
  status: number;
}

export interface ProfileRpcBinding {
  resolveProfile(input: {
    authSubject: string;
    instrumentId: string;
    requestId: string;
  }): Promise<ProfileRpcResult>;
}

export interface AuthenticatedSecurityBindings extends AuthenticatedWebIdentityBindings {
  AIPHABEE_API?: SecurityRpcBinding & ProfileRpcBinding;
}

export type SecuritySessionReader = typeof getAuthenticatedWebIdentitySession;

export function validateSecurityInput(data: unknown): ValidatedSecurityInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "query" && key !== "market")) {
    return { valid: false };
  }
  const query = typeof record.query === "string" ? record.query.trim() : "";
  if (!query || new TextEncoder().encode(query).byteLength > 512) return { valid: false };
  if (
    record.market !== undefined &&
    (typeof record.market !== "string" ||
      !/^[A-Z0-9._-]{1,24}$/u.test(record.market) ||
      record.market !== record.market.toUpperCase())
  ) {
    return { valid: false };
  }
  return {
    input: {
      market: record.market as string | undefined,
      query,
    },
    valid: true,
  };
}

export function validateProfileInput(data: unknown): ValidatedProfileInput {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false };
  const record = data as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "instrumentId")) return { valid: false };
  const instrumentId = typeof record.instrumentId === "string" ? record.instrumentId.trim() : "";
  if (!/^hkex_security_\d{5}$/u.test(instrumentId)) return { valid: false };
  return { input: { instrumentId }, valid: true };
}

export async function resolveAuthenticatedSecurityRequest(
  bindings: AuthenticatedSecurityBindings,
  request: Request,
  input: SecurityServerInput,
  readSession: SecuritySessionReader = getAuthenticatedWebIdentitySession,
): Promise<SecurityRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<SecuritySessionReader>>;
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
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private security service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveSecurity({
      authSubject,
      market: input.market,
      query: input.query,
      requestId,
    });
    if (!isSecurityRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private security response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private security service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

export async function resolveAuthenticatedProfileRequest(
  bindings: AuthenticatedSecurityBindings,
  request: Request,
  input: ProfileServerInput,
  readSession: SecuritySessionReader = getAuthenticatedWebIdentitySession,
): Promise<ProfileRpcResult> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const asOf = new Date().toISOString();
  let session: Awaited<ReturnType<SecuritySessionReader>>;
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
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private security service is unavailable", {
        asOf,
        requestId,
      }),
      status: 424,
    };
  }

  try {
    const result = await service.resolveProfile({
      authSubject,
      instrumentId: input.instrumentId,
      requestId,
    });
    if (!isProfileRpcResult(result)) {
      return {
        envelope: createErrorEnvelope("INTERNAL_ERROR", "private security response is invalid", {
          asOf,
          requestId,
        }),
        status: 502,
      };
    }
    return result;
  } catch {
    return {
      envelope: createErrorEnvelope("INTERNAL_ERROR", "private security service call failed", {
        asOf,
        requestId,
      }),
      status: 502,
    };
  }
}

function isSecurityRpcResult(value: unknown): value is SecurityRpcResult {
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
  const candidates = data.candidates;
  if (
    data.liveDataAccess !== true ||
    data.toolName !== "resolve_security" ||
    !isNonEmptyString(data.dataVersion) ||
    !isNonEmptyString(data.methodologyVersion) ||
    !isNonEmptyString(data.normalizedQuery) ||
    !isNonEmptyString(data.query) ||
    !isUsageSummary(data.usage) ||
    !Array.isArray(candidates) ||
    candidates.length === 0 ||
    !candidates.every(isSecurityCandidate)
  ) return false;
  if (
    (data.status === "resolved" &&
      (candidates.length !== 1 || !isNonEmptyString(data.selectedInstrumentId))) ||
    (data.status === "ambiguous" && candidates.length < 2) ||
    (data.status !== "resolved" && data.status !== "ambiguous")
  ) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length !== candidates.length ||
    !provenance.every((entry) =>
      isLiveNetquityProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
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
      isLiveNetquityProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveNetquityProvenance(
  value: unknown,
  dataVersion: string,
  methodologyVersion: string,
): boolean {
  if (!value || typeof value !== "object") return false;
  const provenance = value as Record<string, unknown>;
  return (
    provenance.source === "netquity-basicdata" &&
    isNonEmptyString(provenance.source_record_id) &&
    provenance.data_version === dataVersion &&
    provenance.methodology_version === methodologyVersion
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

function isSecurityCandidate(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const name = candidate.name;
  return (
    ["currency", "exchange", "instrumentId", "market", "matchReason", "status", "symbol"].every(
      (field) => typeof candidate[field] === "string",
    ) &&
    (candidate.listingId === undefined || typeof candidate.listingId === "string") &&
    (candidate.validFrom === undefined || typeof candidate.validFrom === "string") &&
    (candidate.validTo === undefined || typeof candidate.validTo === "string") &&
    !!name &&
    typeof name === "object" &&
    ["en", "zhHans", "zhHant"].every(
      (field) => typeof (name as Record<string, unknown>)[field] === "string",
    )
  );
}

// Not-found is filtered into an ErrorEnvelope (code NOT_FOUND) by the worker
// RPC before it reaches here, so a successful (ok: true) envelope always
// carries status "found" with a well-formed profile.
function isProfileRpcResult(value: unknown): value is ProfileRpcResult {
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
    data.toolName !== "get_security_profile" ||
    data.status !== "found" ||
    !isNonEmptyString(data.dataVersion) ||
    !isNonEmptyString(data.methodologyVersion) ||
    !isNonEmptyString(data.instrumentId) ||
    !isUsageSummary(data.usage) ||
    !isLiveProfile(data.profile)
  ) return false;
  const provenance = data.provenance;
  if (
    !Array.isArray(provenance) ||
    provenance.length === 0 ||
    !provenance.every((entry) =>
      isLiveNetquityProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
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
      isLiveNetquityProvenance(entry, data.dataVersion as string, data.methodologyVersion as string)
    )
  );
}

function isLiveProfile(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  const name = profile.name;
  const lifecycle = profile.lifecycle;
  const coverage = profile.coverage;
  return (
    ["currency", "exchange", "instrumentId", "listingStatus", "market", "symbol"].every(
      (field) => typeof profile[field] === "string",
    ) &&
    (profile.listingId === undefined || typeof profile.listingId === "string") &&
    !!name &&
    typeof name === "object" &&
    ["en", "zhHans", "zhHant"].every(
      (field) => typeof (name as Record<string, unknown>)[field] === "string",
    ) &&
    !!lifecycle &&
    typeof lifecycle === "object" &&
    ["delistedAt", "listedAt", "suspendedAt"].every((field) => {
      const fieldValue = (lifecycle as Record<string, unknown>)[field];
      return fieldValue === undefined || typeof fieldValue === "string";
    }) &&
    !!coverage &&
    typeof coverage === "object" &&
    isCoverageItem((coverage as Record<string, unknown>).industry)
  );
}

function isCoverageItem(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    (item.status === "available" || item.status === "planned" || item.status === "unavailable") &&
    (item.reason === undefined || typeof item.reason === "string")
  );
}
