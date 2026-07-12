import { describe, expect, it, vi } from "vitest";

import {
  ARTIFACT_SCANNER_CONTRACT_VERSION,
  handleArtifactScannerRequest,
  type ArtifactScannerEnv
} from "./artifact-scanner.js";

const KEY = "scanner-test-key-that-is-longer-than-thirty-two-bytes";
const BODY = new TextEncoder().encode("authoritative scanner payload").buffer as ArrayBuffer;
const HASH = "0d43a46aea373c841d40d40b0f04fdf017b952bb8e404d17e9788f509bd1b0e6";

function request(overrides: {
  body?: ArrayBuffer;
  hash?: string;
  key?: string;
} = {}): Request {
  return new Request("https://scanner.internal/internal/artifact-scan", {
    body: overrides.body ?? BODY,
    headers: {
      "content-type": "application/octet-stream",
      "x-aiphabee-classification": "tenant_confidential",
      "x-aiphabee-content-sha256": overrides.hash ?? HASH,
      "x-aiphabee-content-type": "application/json",
      "x-aiphabee-kind": "artifact",
      "x-aiphabee-scanner-contract": ARTIFACT_SCANNER_CONTRACT_VERSION,
      "x-aiphabee-scanner-key": overrides.key ?? KEY
    },
    method: "POST"
  });
}

function environment(response?: Response) {
  const fetch = vi.fn(async (_input?: RequestInfo | URL, _init?: RequestInit) =>
    response ??
      Response.json({
        engine: "ClamAV 1.5.3",
        scanned_at: "2026-07-11T08:00:00.000Z",
        signature_version: "27888/Fri Jul 11 08:00:00 2026",
        status: "clean"
      })
  );
  const getByName = vi.fn(() => ({ fetch }));
  const env = {
    ARTIFACT_SCANNER: { getByName },
    ARTIFACT_SCANNER_SHARED_KEY: KEY
  } satisfies ArtifactScannerEnv;
  return { env, fetch, getByName };
}

describe("authoritative artifact scanner bridge", () => {
  it("hash-binds metadata and returns an exact clean scanner result", async () => {
    const { env, fetch, getByName } = environment();
    const response = await handleArtifactScannerRequest(request(), env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      engine: "ClamAV 1.5.3",
      status: "clean"
    });
    expect(getByName).toHaveBeenCalledWith("aiphabee-authoritative-clamav-v0");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("rejects wrong authorization before starting the scanner", async () => {
    const { env, fetch } = environment();
    const response = await handleArtifactScannerRequest(request({ key: "wrong" }), env);
    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a payload whose bytes do not match the authority hash", async () => {
    const { env, fetch } = environment();
    const response = await handleArtifactScannerRequest(
      request({ body: new TextEncoder().encode("changed").buffer as ArrayBuffer }),
      env
    );
    expect(response.status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("passes an unsafe result without exposing the vendor signature name", async () => {
    const { env } = environment(
      Response.json({
        engine: "ClamAV 1.5.3",
        reason_code: "malware_detected",
        scanned_at: "2026-07-11T08:00:00.000Z",
        signature_version: "27888/Fri Jul 11 08:00:00 2026",
        status: "unsafe"
      })
    );
    const response = await handleArtifactScannerRequest(request(), env);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reason_code: "malware_detected",
      status: "unsafe"
    });
  });

  it("fails closed on malformed or unavailable scanner responses", async () => {
    const malformed = environment(Response.json({ status: "clean" }));
    expect((await handleArtifactScannerRequest(request(), malformed.env)).status).toBe(502);

    const unavailable = environment();
    unavailable.fetch.mockImplementation(async (input?: RequestInfo | URL) =>
      new URL(String(input)).pathname === "/health"
        ? Response.json({ status: "clean" })
        : new Response(null, { status: 503 })
    );
    expect((await handleArtifactScannerRequest(request(), unavailable.env)).status).toBe(503);
  });
});
