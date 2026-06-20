import { describe, expect, it } from "vitest";
import {
  ERROR_CODES,
  createErrorEnvelope,
  createSuccessEnvelope
} from "./index";

describe("data contracts", () => {
  it("keeps Gate 0 default-deny errors in the shared code list", () => {
    expect(ERROR_CODES).toContain("AUTH_REQUIRED");
    expect(ERROR_CODES).toContain("DATA_NOT_LICENSED");
    expect(ERROR_CODES).toContain("SCOPE_DENIED");
    expect(ERROR_CODES).toContain("DATA_QUALITY_HOLD");
    expect(ERROR_CODES).toContain("OUT_OF_RANGE");
    expect(ERROR_CODES).toContain("UPSTREAM_STALE");
  });

  it("creates a provenance-bound success envelope", () => {
    const envelope = createSuccessEnvelope(
      { service: "contract-test" },
      {
        asOf: "2026-06-20T00:00:00.000Z",
        marketStatus: "not_applicable",
        provenance: [
          {
            data_version: "fixture-v0",
            methodology_version: "scaffold-v0",
            source: "unit-test",
            source_record_id: "record-1"
          }
        ],
        requestId: "req-1",
        usage: {
          cached: false,
          credits: 0,
          rows: 0
        }
      }
    );

    expect(envelope.ok).toBe(true);
    expect(envelope.provenance[0]?.source_record_id).toBe("record-1");
    expect(envelope.usage.credits).toBe(0);
  });

  it("creates a typed error envelope", () => {
    const envelope = createErrorEnvelope("DATA_NOT_LICENSED", "field blocked", {
      asOf: "2026-06-20T00:00:00.000Z",
      requestId: "req-2"
    });

    expect(envelope.ok).toBe(false);
    expect(envelope.error.code).toBe("DATA_NOT_LICENSED");
    expect(envelope.market_status).toBe("not_applicable");
  });
});
