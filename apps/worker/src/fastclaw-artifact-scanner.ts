import type {
  DurableHandoffSafetyScanner,
  DurableHandoffScanResult
} from "@aiphabee/agent-runtime/durable-memory-artifact-handoff";
import { ARTIFACT_SCANNER_CONTRACT_VERSION } from "@aiphabee/agent-runtime/durable-memory-artifact-handoff";

const SHA256_HEX = /^[0-9a-f]{64}$/u;

export interface ArtifactScannerServiceBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface ServiceBindingArtifactScannerInput {
  service: ArtifactScannerServiceBinding;
  shared_key: string;
}

export class FastClawArtifactScannerError extends Error {
  constructor(
    readonly code: "INVALID_CONFIG" | "SCAN_REJECTED" | "SCANNER_PROTOCOL_ERROR",
    detail?: string
  ) {
    super(detail ?? code);
    this.name = "FastClawArtifactScannerError";
  }
}

function opaqueText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

function validScanTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export class ServiceBindingFastClawArtifactScanner implements DurableHandoffSafetyScanner {
  private readonly service: ArtifactScannerServiceBinding;
  private readonly sharedKey: string;

  constructor(input: ServiceBindingArtifactScannerInput) {
    if (input.shared_key.length < 32) {
      throw new FastClawArtifactScannerError("INVALID_CONFIG");
    }
    this.service = input.service;
    this.sharedKey = input.shared_key;
  }

  async scan(
    input: Parameters<DurableHandoffSafetyScanner["scan"]>[0]
  ): Promise<DurableHandoffScanResult> {
    if (!SHA256_HEX.test(input.content_hash_sha256)) {
      throw new FastClawArtifactScannerError("SCANNER_PROTOCOL_ERROR");
    }
    const body = new Uint8Array(input.bytes).buffer as ArrayBuffer;
    const response = await this.service.fetch("https://sandbox-bridge/internal/artifact-scan", {
      body,
      headers: {
        "content-type": "application/octet-stream",
        "x-aiphabee-classification": input.classification,
        "x-aiphabee-content-sha256": input.content_hash_sha256,
        "x-aiphabee-content-type": input.content_type,
        "x-aiphabee-kind": input.kind,
        "x-aiphabee-scanner-contract": ARTIFACT_SCANNER_CONTRACT_VERSION,
        "x-aiphabee-scanner-key": this.sharedKey
      },
      method: "POST"
    });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("application/json")) {
      const rejected = (await response.json().catch(() => null)) as {
        error?: { code?: unknown };
      } | null;
      const providerCode = rejected?.error?.code;
      const safeProviderCode =
        typeof providerCode === "string" && /^[A-Z0-9_]{1,120}$/u.test(providerCode)
          ? providerCode
          : "UNCLASSIFIED";
      throw new FastClawArtifactScannerError(
        "SCAN_REJECTED",
        `SCAN_REJECTED_${response.status}_${safeProviderCode}`
      );
    }

    const value = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (
      value === null ||
      (value.status !== "clean" && value.status !== "unsafe") ||
      !opaqueText(value.engine, 128) ||
      !opaqueText(value.signature_version, 256) ||
      !validScanTimestamp(value.scanned_at)
    ) {
      throw new FastClawArtifactScannerError("SCANNER_PROTOCOL_ERROR");
    }
    if (value.status === "unsafe") {
      if (value.reason_code !== "malware_detected") {
        throw new FastClawArtifactScannerError("SCANNER_PROTOCOL_ERROR");
      }
      return {
        engine: value.engine,
        reason_code: value.reason_code,
        scanned_at: value.scanned_at,
        signature_version: value.signature_version,
        status: "unsafe"
      };
    }
    if (value.reason_code !== undefined) {
      throw new FastClawArtifactScannerError("SCANNER_PROTOCOL_ERROR");
    }
    return {
      classification: input.classification,
      engine: value.engine,
      scanned_at: value.scanned_at,
      signature_version: value.signature_version,
      status: "clean"
    };
  }
}
