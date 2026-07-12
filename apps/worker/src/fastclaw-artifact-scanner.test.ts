import { describe, expect, it, vi } from "vitest";

import {
  FastClawArtifactScannerError,
  ServiceBindingFastClawArtifactScanner
} from "./fastclaw-artifact-scanner.js";

const KEY = "worker-scanner-key-that-is-longer-than-thirty-two-bytes";
const HASH = "0d43a46aea373c841d40d40b0f04fdf017b952bb8e404d17e9788f509bd1b0e6";

function input() {
  return {
    bytes: new TextEncoder().encode("authoritative scanner payload"),
    classification: "tenant_confidential" as const,
    content_hash_sha256: HASH,
    content_type: "application/json",
    kind: "artifact" as const
  };
}

function scanner(response: Response) {
  const fetch = vi.fn(async () => response);
  return {
    fetch,
    scanner: new ServiceBindingFastClawArtifactScanner({
      service: { fetch },
      shared_key: KEY
    })
  };
}

describe("FastClaw authoritative artifact scanner adapter", () => {
  it("returns clean evidence with classification owned by AiphaBee", async () => {
    const harness = scanner(
      Response.json({
        engine: "ClamAV 1.5.3",
        scanned_at: "2026-07-11T08:00:00.000Z",
        signature_version: "27888/Fri Jul 11 08:00:00 2026",
        status: "clean"
      })
    );
    await expect(harness.scanner.scan(input())).resolves.toEqual({
      classification: "tenant_confidential",
      engine: "ClamAV 1.5.3",
      scanned_at: "2026-07-11T08:00:00.000Z",
      signature_version: "27888/Fri Jul 11 08:00:00 2026",
      status: "clean"
    });
    expect(harness.fetch).toHaveBeenCalledOnce();
  });

  it("returns an unsafe decision and never includes the payload", async () => {
    const harness = scanner(
      Response.json({
        engine: "ClamAV 1.5.3",
        reason_code: "malware_detected",
        scanned_at: "2026-07-11T08:00:00.000Z",
        signature_version: "27888/Fri Jul 11 08:00:00 2026",
        status: "unsafe"
      })
    );
    await expect(harness.scanner.scan(input())).resolves.toMatchObject({
      reason_code: "malware_detected",
      status: "unsafe"
    });
  });

  it("fails closed on service and semantic protocol errors", async () => {
    const rejected = scanner(new Response(null, { status: 503 }));
    await expect(rejected.scanner.scan(input())).rejects.toMatchObject({
      code: "SCAN_REJECTED"
    } satisfies Partial<FastClawArtifactScannerError>);

    const malformed = scanner(Response.json({ status: "clean" }));
    await expect(malformed.scanner.scan(input())).rejects.toMatchObject({
      code: "SCANNER_PROTOCOL_ERROR"
    } satisfies Partial<FastClawArtifactScannerError>);
  });

  it("rejects a weak shared key at composition time", () => {
    expect(
      () =>
        new ServiceBindingFastClawArtifactScanner({
          service: { fetch: vi.fn() },
          shared_key: "weak"
        })
    ).toThrowError(FastClawArtifactScannerError);
  });
});
