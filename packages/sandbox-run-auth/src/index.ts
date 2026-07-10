const TOKEN_VERSION = 1 as const;
const MAX_TOKEN_TTL_SECONDS = 600;
const MAX_CLOCK_SKEW_SECONDS = 30;
const MIN_SECRET_BYTES = 32;
const MAX_CALLS = 64;
const TOKEN_PART_PATTERN = /^[A-Za-z0-9_-]+$/u;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u;
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]{0,127}$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;

export const SANDBOX_TOOL_GATEWAY_TOKEN_AUDIENCE =
  "aiphabee:sandbox-tool-gateway" as const;

export const SANDBOX_RUN_SCOPES = [
  "sandbox:create",
  "sandbox:destroy",
  "sandbox:exec",
  "sandbox:file",
  "sandbox:status"
] as const;

export type SandboxRunScope = (typeof SANDBOX_RUN_SCOPES)[number];

export interface SandboxRunTokenClaims {
  exp: number;
  iat: number;
  jti: string;
  max_calls: number;
  scopes: readonly SandboxRunScope[];
  tenant_hash: string;
  user_hash: string;
  v: typeof TOKEN_VERSION;
}

export interface IssueSandboxRunTokenInput {
  maxCalls: number;
  nowMs?: number;
  runId: string;
  scopes: readonly SandboxRunScope[];
  secret: string;
  tenantId: string;
  ttlSeconds: number;
  userId: string;
}

export interface IssuedSandboxRunToken {
  claims: SandboxRunTokenClaims;
  sandbox_id: string;
  token: string;
}

export interface SandboxToolGatewayTokenClaims {
  aud: typeof SANDBOX_TOOL_GATEWAY_TOKEN_AUDIENCE;
  exp: number;
  iat: number;
  jti: string;
  lease_id: string;
  run_id: string;
  tenant_id: string;
  tool_name: string;
  user_id: string;
  v: typeof TOKEN_VERSION;
}

export interface IssueSandboxToolGatewayTokenInput {
  leaseId: string;
  nowMs?: number;
  runId: string;
  secret: string;
  tenantId: string;
  tokenId: string;
  toolName: string;
  ttlSeconds: number;
  userId: string;
}

export interface IssuedSandboxToolGatewayToken {
  claims: SandboxToolGatewayTokenClaims;
  token: string;
}

export type SandboxRunTokenErrorCode =
  | "INVALID_CLAIMS"
  | "INVALID_SCOPE"
  | "INVALID_SECRET"
  | "INVALID_SIGNATURE"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "TOKEN_NOT_YET_VALID";

export class SandboxRunTokenError extends Error {
  readonly code: SandboxRunTokenErrorCode;

  constructor(code: SandboxRunTokenErrorCode, message: string) {
    super(message);
    this.name = "SandboxRunTokenError";
    this.code = code;
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/gu, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  if (value.length === 0 || !TOKEN_PART_PATTERN.test(value)) {
    throw new SandboxRunTokenError("INVALID_TOKEN", "token contains invalid base64url data");
  }

  const normalized = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  let binary: string;
  try {
    binary = atob(normalized + "=".repeat(paddingLength));
  } catch {
    throw new SandboxRunTokenError("INVALID_TOKEN", "token contains malformed base64url data");
  }

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function importHmacKey(
  secret: string,
  usages: Array<"sign" | "verify">
): Promise<CryptoKey> {
  const secretBytes = encoder.encode(secret);
  if (secretBytes.byteLength < MIN_SECRET_BYTES) {
    throw new SandboxRunTokenError(
      "INVALID_SECRET",
      `sandbox run token secret must be at least ${MIN_SECRET_BYTES} bytes`
    );
  }
  return crypto.subtle.importKey(
    "raw",
    secretBytes,
    { hash: "SHA-256", name: "HMAC" },
    false,
    usages
  );
}

function normalizeScopes(scopes: readonly SandboxRunScope[]): SandboxRunScope[] {
  const allowed = new Set<string>(SANDBOX_RUN_SCOPES);
  if (scopes.length === 0 || scopes.some((scope) => !allowed.has(scope))) {
    throw new SandboxRunTokenError("INVALID_SCOPE", "token must contain only known scopes");
  }
  return [...new Set(scopes)].sort() as SandboxRunScope[];
}

function canonicalClaims(claims: SandboxRunTokenClaims): SandboxRunTokenClaims {
  return {
    exp: claims.exp,
    iat: claims.iat,
    jti: claims.jti,
    max_calls: claims.max_calls,
    scopes: [...claims.scopes],
    tenant_hash: claims.tenant_hash,
    user_hash: claims.user_hash,
    v: claims.v
  };
}

function validateClaims(
  value: unknown,
  nowSeconds: number,
  requiredScope?: SandboxRunScope
): SandboxRunTokenClaims {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token claims must be an object");
  }

  const claims = value as Record<string, unknown>;
  const exactKeys = [
    "exp",
    "iat",
    "jti",
    "max_calls",
    "scopes",
    "tenant_hash",
    "user_hash",
    "v"
  ];
  if (
    Object.keys(claims).length !== exactKeys.length ||
    exactKeys.some((key) => !Object.hasOwn(claims, key))
  ) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token claims have an unexpected shape");
  }

  if (claims.v !== TOKEN_VERSION) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token version is unsupported");
  }
  if (typeof claims.jti !== "string" || !RUN_ID_PATTERN.test(claims.jti)) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token jti is invalid");
  }
  if (
    typeof claims.tenant_hash !== "string" ||
    !HASH_PATTERN.test(claims.tenant_hash) ||
    typeof claims.user_hash !== "string" ||
    !HASH_PATTERN.test(claims.user_hash)
  ) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token identity hashes are invalid");
  }
  if (
    !Number.isSafeInteger(claims.max_calls) ||
    (claims.max_calls as number) < 1 ||
    (claims.max_calls as number) > MAX_CALLS
  ) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token max_calls is invalid");
  }
  if (!Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp)) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token timestamps are invalid");
  }

  const iat = claims.iat as number;
  const exp = claims.exp as number;
  if (exp <= iat || exp - iat > MAX_TOKEN_TTL_SECONDS) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token TTL exceeds the allowed window");
  }
  if (iat > nowSeconds + MAX_CLOCK_SKEW_SECONDS) {
    throw new SandboxRunTokenError("TOKEN_NOT_YET_VALID", "token is not yet valid");
  }
  if (exp <= nowSeconds) {
    throw new SandboxRunTokenError("TOKEN_EXPIRED", "token has expired");
  }

  if (!Array.isArray(claims.scopes) || claims.scopes.some((scope) => typeof scope !== "string")) {
    throw new SandboxRunTokenError("INVALID_SCOPE", "token scopes are invalid");
  }
  const scopes = normalizeScopes(claims.scopes as SandboxRunScope[]);
  if (JSON.stringify(scopes) !== JSON.stringify(claims.scopes)) {
    throw new SandboxRunTokenError("INVALID_SCOPE", "token scopes must be unique and sorted");
  }
  if (requiredScope !== undefined && !scopes.includes(requiredScope)) {
    throw new SandboxRunTokenError("INVALID_SCOPE", `token lacks required scope ${requiredScope}`);
  }

  return canonicalClaims({
    exp,
    iat,
    jti: claims.jti,
    max_calls: claims.max_calls as number,
    scopes,
    tenant_hash: claims.tenant_hash,
    user_hash: claims.user_hash,
    v: TOKEN_VERSION
  });
}

export async function hashSandboxRunIdentity(kind: "tenant" | "user", value: string): Promise<string> {
  if (value.trim().length === 0) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", `${kind} identity is required`);
  }
  return bytesToHex(await sha256(`aiphabee:sandbox-run:${kind}:${value}`));
}

export async function deriveSandboxId(
  claims: Pick<SandboxRunTokenClaims, "jti" | "tenant_hash" | "user_hash">
): Promise<string> {
  if (
    !RUN_ID_PATTERN.test(claims.jti) ||
    !HASH_PATTERN.test(claims.tenant_hash) ||
    !HASH_PATTERN.test(claims.user_hash)
  ) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "sandbox identity claims are invalid");
  }
  const digest = bytesToHex(
    await sha256(
      `aiphabee:sandbox:${claims.jti}:${claims.tenant_hash}:${claims.user_hash}`
    )
  );
  return `ab-${digest.slice(0, 32)}`;
}

export async function issueSandboxRunToken(
  input: IssueSandboxRunTokenInput
): Promise<IssuedSandboxRunToken> {
  const nowSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);
  if (!Number.isSafeInteger(input.ttlSeconds) || input.ttlSeconds < 1 || input.ttlSeconds > 600) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token ttlSeconds must be between 1 and 600");
  }

  const claims = validateClaims(
    {
      exp: nowSeconds + input.ttlSeconds,
      iat: nowSeconds,
      jti: input.runId,
      max_calls: input.maxCalls,
      scopes: normalizeScopes(input.scopes),
      tenant_hash: await hashSandboxRunIdentity("tenant", input.tenantId),
      user_hash: await hashSandboxRunIdentity("user", input.userId),
      v: TOKEN_VERSION
    },
    nowSeconds
  );
  const payloadBytes = encoder.encode(JSON.stringify(canonicalClaims(claims)));
  const key = await importHmacKey(input.secret, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, payloadBytes));

  return {
    claims,
    sandbox_id: await deriveSandboxId(claims),
    token: `${bytesToBase64Url(payloadBytes)}.${bytesToBase64Url(signature)}`
  };
}

export async function verifySandboxRunToken(
  token: string,
  secret: string,
  options: { nowMs?: number; requiredScope?: SandboxRunScope } = {}
): Promise<SandboxRunTokenClaims> {
  if (token.length > 4096) {
    throw new SandboxRunTokenError("INVALID_TOKEN", "token exceeds maximum length");
  }
  const parts = token.split(".");
  if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) {
    throw new SandboxRunTokenError("INVALID_TOKEN", "token must have payload and signature parts");
  }

  const payloadBytes = base64UrlToBytes(parts[0]);
  const signature = base64UrlToBytes(parts[1]);
  const signatureBytes = new Uint8Array(signature.byteLength);
  signatureBytes.set(signature);
  const verifiedPayloadBytes = new Uint8Array(payloadBytes.byteLength);
  verifiedPayloadBytes.set(payloadBytes);
  const key = await importHmacKey(secret, ["verify"]);
  if (!(await crypto.subtle.verify("HMAC", key, signatureBytes, verifiedPayloadBytes))) {
    throw new SandboxRunTokenError("INVALID_SIGNATURE", "token signature is invalid");
  }

  let parsed: unknown;
  let payloadText: string;
  try {
    payloadText = decoder.decode(payloadBytes);
    parsed = JSON.parse(payloadText);
  } catch {
    throw new SandboxRunTokenError("INVALID_TOKEN", "token payload is not valid UTF-8 JSON");
  }

  const claims = validateClaims(
    parsed,
    Math.floor((options.nowMs ?? Date.now()) / 1000),
    options.requiredScope
  );
  if (JSON.stringify(canonicalClaims(claims)) !== payloadText) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "token payload is not canonical");
  }
  return claims;
}

function canonicalToolGatewayClaims(
  claims: SandboxToolGatewayTokenClaims
): SandboxToolGatewayTokenClaims {
  return {
    aud: claims.aud,
    exp: claims.exp,
    iat: claims.iat,
    jti: claims.jti,
    lease_id: claims.lease_id,
    run_id: claims.run_id,
    tenant_id: claims.tenant_id,
    tool_name: claims.tool_name,
    user_id: claims.user_id,
    v: claims.v
  };
}

function validateToolGatewayId(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 128 ||
    value.trim() !== value ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", `${label} is invalid`);
  }
  return value;
}

function validateToolGatewayClaims(
  value: unknown,
  nowSeconds: number,
  requiredToolName?: string
): SandboxToolGatewayTokenClaims {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "tool gateway claims must be an object");
  }
  const claims = value as Record<string, unknown>;
  const exactKeys = [
    "aud",
    "exp",
    "iat",
    "jti",
    "lease_id",
    "run_id",
    "tenant_id",
    "tool_name",
    "user_id",
    "v"
  ];
  if (
    Object.keys(claims).length !== exactKeys.length ||
    exactKeys.some((key) => !Object.hasOwn(claims, key))
  ) {
    throw new SandboxRunTokenError(
      "INVALID_CLAIMS",
      "tool gateway claims have an unexpected shape"
    );
  }
  if (claims.v !== TOKEN_VERSION || claims.aud !== SANDBOX_TOOL_GATEWAY_TOKEN_AUDIENCE) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "tool gateway token authority is invalid");
  }
  if (!Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp)) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "tool gateway timestamps are invalid");
  }
  const iat = claims.iat as number;
  const exp = claims.exp as number;
  if (exp <= iat || exp - iat > MAX_TOKEN_TTL_SECONDS) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "tool gateway token TTL is invalid");
  }
  if (iat > nowSeconds + MAX_CLOCK_SKEW_SECONDS) {
    throw new SandboxRunTokenError("TOKEN_NOT_YET_VALID", "tool gateway token is not yet valid");
  }
  if (exp <= nowSeconds) {
    throw new SandboxRunTokenError("TOKEN_EXPIRED", "tool gateway token has expired");
  }
  const toolName = claims.tool_name;
  if (typeof toolName !== "string" || !TOOL_NAME_PATTERN.test(toolName)) {
    throw new SandboxRunTokenError("INVALID_SCOPE", "tool gateway tool name is invalid");
  }
  if (requiredToolName !== undefined && toolName !== requiredToolName) {
    throw new SandboxRunTokenError("INVALID_SCOPE", "tool gateway token is scoped to another tool");
  }
  return canonicalToolGatewayClaims({
    aud: SANDBOX_TOOL_GATEWAY_TOKEN_AUDIENCE,
    exp,
    iat,
    jti: validateToolGatewayId(claims.jti, "tool gateway token id"),
    lease_id: validateToolGatewayId(claims.lease_id, "tool gateway lease id"),
    run_id: validateToolGatewayId(claims.run_id, "tool gateway run id"),
    tenant_id: validateToolGatewayId(claims.tenant_id, "tool gateway tenant id"),
    tool_name: toolName,
    user_id: validateToolGatewayId(claims.user_id, "tool gateway user id"),
    v: TOKEN_VERSION
  });
}

export async function issueSandboxToolGatewayToken(
  input: IssueSandboxToolGatewayTokenInput
): Promise<IssuedSandboxToolGatewayToken> {
  const nowSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);
  if (
    !Number.isSafeInteger(input.ttlSeconds) ||
    input.ttlSeconds < 1 ||
    input.ttlSeconds > MAX_TOKEN_TTL_SECONDS
  ) {
    throw new SandboxRunTokenError(
      "INVALID_CLAIMS",
      `tool gateway ttlSeconds must be between 1 and ${MAX_TOKEN_TTL_SECONDS}`
    );
  }
  const claims = validateToolGatewayClaims(
    {
      aud: SANDBOX_TOOL_GATEWAY_TOKEN_AUDIENCE,
      exp: nowSeconds + input.ttlSeconds,
      iat: nowSeconds,
      jti: input.tokenId,
      lease_id: input.leaseId,
      run_id: input.runId,
      tenant_id: input.tenantId,
      tool_name: input.toolName,
      user_id: input.userId,
      v: TOKEN_VERSION
    },
    nowSeconds
  );
  const payloadBytes = encoder.encode(JSON.stringify(canonicalToolGatewayClaims(claims)));
  const key = await importHmacKey(input.secret, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, payloadBytes));
  return {
    claims,
    token: `${bytesToBase64Url(payloadBytes)}.${bytesToBase64Url(signature)}`
  };
}

export async function verifySandboxToolGatewayToken(
  token: string,
  secret: string,
  options: { nowMs?: number; requiredToolName?: string } = {}
): Promise<SandboxToolGatewayTokenClaims> {
  if (token.length > 4096) {
    throw new SandboxRunTokenError("INVALID_TOKEN", "tool gateway token exceeds maximum length");
  }
  const parts = token.split(".");
  if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) {
    throw new SandboxRunTokenError(
      "INVALID_TOKEN",
      "tool gateway token must have payload and signature parts"
    );
  }
  const decodedPayload = base64UrlToBytes(parts[0]);
  const decodedSignature = base64UrlToBytes(parts[1]);
  const payloadBytes = new Uint8Array(decodedPayload.byteLength);
  payloadBytes.set(decodedPayload);
  const signatureBytes = new Uint8Array(decodedSignature.byteLength);
  signatureBytes.set(decodedSignature);
  const key = await importHmacKey(secret, ["verify"]);
  if (!(await crypto.subtle.verify("HMAC", key, signatureBytes, payloadBytes))) {
    throw new SandboxRunTokenError("INVALID_SIGNATURE", "tool gateway token signature is invalid");
  }
  let payloadText: string;
  let parsed: unknown;
  try {
    payloadText = decoder.decode(payloadBytes);
    parsed = JSON.parse(payloadText);
  } catch {
    throw new SandboxRunTokenError(
      "INVALID_TOKEN",
      "tool gateway token payload is not valid UTF-8 JSON"
    );
  }
  const claims = validateToolGatewayClaims(
    parsed,
    Math.floor((options.nowMs ?? Date.now()) / 1000),
    options.requiredToolName
  );
  if (JSON.stringify(canonicalToolGatewayClaims(claims)) !== payloadText) {
    throw new SandboxRunTokenError("INVALID_CLAIMS", "tool gateway token is not canonical");
  }
  return claims;
}
