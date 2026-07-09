const TOKEN_VERSION = 1 as const;
const MAX_TOKEN_TTL_SECONDS = 600;
const MAX_CLOCK_SKEW_SECONDS = 30;
const MIN_SECRET_BYTES = 32;
const MAX_CALLS = 64;
const TOKEN_PART_PATTERN = /^[A-Za-z0-9_-]+$/u;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u;
const HASH_PATTERN = /^[a-f0-9]{64}$/u;

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
const decoder = new TextDecoder("utf-8", { fatal: true });

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
