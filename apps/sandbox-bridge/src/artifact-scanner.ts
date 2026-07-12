import { ARTIFACT_SCANNER_CONTRACT_VERSION } from "@aiphabee/agent-runtime/durable-memory-artifact-handoff";

export { ARTIFACT_SCANNER_CONTRACT_VERSION };
export const ARTIFACT_SCANNER_MAX_BYTES = 10 * 1024 * 1024;

const CLASSIFICATIONS = new Set([
  "public_derived",
  "tenant_confidential",
  "user_private"
]);
const KINDS = new Set(["artifact", "memory"]);
const SHA256_HEX = /^[0-9a-f]{64}$/u;

export interface ArtifactScannerContainerStub {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface ArtifactScannerEnv {
  ARTIFACT_SCANNER: {
    getByName(name: string): ArtifactScannerContainerStub;
  };
  ARTIFACT_SCANNER_SHARED_KEY: string;
}

interface ScannerResponse {
  engine: string;
  reason_code?: string;
  scanned_at: string;
  signature_version: string;
  status: "clean" | "unsafe";
}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json(
    { error: { code, message } },
    { headers: { "cache-control": "no-store" }, status }
  );
}

function opaqueText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function authenticated(provided: string | null, expected: string): Promise<boolean> {
  if (expected.length < 32 || provided === null || provided.length === 0) return false;
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected))
  ]);
  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index]! ^ right[index]!;
  }
  return difference === 0;
}

function parseScannerResponse(value: unknown): ScannerResponse | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    (candidate.status !== "clean" && candidate.status !== "unsafe") ||
    !opaqueText(candidate.engine, 128) ||
    !opaqueText(candidate.signature_version, 256) ||
    typeof candidate.scanned_at !== "string" ||
    !Number.isFinite(Date.parse(candidate.scanned_at))
  ) {
    return null;
  }
  if (
    candidate.status === "unsafe" &&
    candidate.reason_code !== "malware_detected"
  ) {
    return null;
  }
  if (candidate.status === "clean" && candidate.reason_code !== undefined) return null;
  return candidate as unknown as ScannerResponse;
}

export async function handleArtifactScannerRequest(
  request: Request,
  env: ArtifactScannerEnv
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/internal/artifact-scan") {
    return jsonError(404, "NOT_FOUND", "route not found");
  }
  if (request.method !== "POST") {
    return jsonError(405, "METHOD_NOT_ALLOWED", "POST is required");
  }
  if (
    !(await authenticated(
      request.headers.get("x-aiphabee-scanner-key"),
      env.ARTIFACT_SCANNER_SHARED_KEY
    ))
  ) {
    return jsonError(401, "SCANNER_AUTH_REJECTED", "scanner authorization rejected");
  }
  if (
    request.headers.get("x-aiphabee-scanner-contract") !==
    ARTIFACT_SCANNER_CONTRACT_VERSION
  ) {
    return jsonError(400, "SCANNER_CONTRACT_MISMATCH", "scanner contract is invalid");
  }

  const classification = request.headers.get("x-aiphabee-classification") ?? "";
  const kind = request.headers.get("x-aiphabee-kind") ?? "";
  const claimedHash = request.headers.get("x-aiphabee-content-sha256") ?? "";
  const originalContentType = request.headers.get("x-aiphabee-content-type") ?? "";
  if (!CLASSIFICATIONS.has(classification) || !KINDS.has(kind)) {
    return jsonError(400, "INVALID_SCAN_METADATA", "scanner metadata is invalid");
  }
  if (!SHA256_HEX.test(claimedHash) || !opaqueText(originalContentType, 255)) {
    return jsonError(400, "INVALID_SCAN_METADATA", "scanner metadata is invalid");
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > ARTIFACT_SCANNER_MAX_BYTES) {
    return jsonError(413, "SCAN_PAYLOAD_TOO_LARGE", "scan payload exceeds maximum size");
  }
  const body = await request.arrayBuffer();
  const bytes = new Uint8Array(body);
  if (bytes.byteLength === 0 || bytes.byteLength > ARTIFACT_SCANNER_MAX_BYTES) {
    return jsonError(
      bytes.byteLength === 0 ? 400 : 413,
      bytes.byteLength === 0 ? "EMPTY_SCAN_PAYLOAD" : "SCAN_PAYLOAD_TOO_LARGE",
      bytes.byteLength === 0 ? "scan payload is empty" : "scan payload exceeds maximum size"
    );
  }
  if ((await sha256(body)) !== claimedHash) {
    return jsonError(409, "SCAN_HASH_MISMATCH", "scan payload hash does not match authority");
  }

  let upstream: Response;
  try {
    const scanner = env.ARTIFACT_SCANNER.getByName("aiphabee-authoritative-clamav-v0");
    upstream = await scanner.fetch("http://scanner/scan", {
      body,
      headers: { "content-type": "application/octet-stream" },
      method: "POST"
    });
    if (upstream.status === 503) {
      await upstream.body?.cancel().catch(() => undefined);
      let ready = false;
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const health = await scanner.fetch("http://scanner/health", { method: "GET" });
        await health.body?.cancel().catch(() => undefined);
        if (health.ok) {
          ready = true;
          break;
        }
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
      }
      if (!ready) {
        return jsonError(503, "SCANNER_UNAVAILABLE", "authoritative scanner is unavailable");
      }
      upstream = await scanner.fetch("http://scanner/scan", {
        body,
        headers: { "content-type": "application/octet-stream" },
        method: "POST"
      });
    }
  } catch (error) {
    console.error("authoritative artifact scanner unavailable", error);
    return jsonError(503, "SCANNER_UNAVAILABLE", "authoritative scanner is unavailable");
  }
  if (!upstream.ok || !upstream.headers.get("content-type")?.startsWith("application/json")) {
    return jsonError(503, "SCANNER_UNAVAILABLE", "authoritative scanner is unavailable");
  }

  const result = parseScannerResponse(await upstream.json().catch(() => null));
  if (result === null) {
    return jsonError(502, "SCANNER_PROTOCOL_ERROR", "authoritative scanner response is invalid");
  }
  return Response.json(result, {
    headers: { "cache-control": "no-store" },
    status: 200
  });
}
