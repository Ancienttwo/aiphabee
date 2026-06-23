import { afterEach, describe, expect, it, vi } from "vitest";
import { apiCall } from "./client";
import { isAmbiguity, presentError } from "./errors";
import type { AiphaBeeErrorCode, ErrorEnvelope } from "./types";

function errorEnvelope(code: AiphaBeeErrorCode): ErrorEnvelope {
  return {
    ok: false,
    error: { code, message: "" },
    as_of: "2026-06-23T00:00:00.000Z",
    request_id: "req-test",
    market_status: "not_applicable",
    provenance: [],
    usage: { cached: false, credits: 0, rows: 0 },
  };
}

describe("apiCall", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the worker's success envelope untouched", async () => {
    const envelope = {
      ok: true,
      data: { hello: "world" },
      as_of: "2026-06-23T00:00:00.000Z",
      request_id: "r1",
      market_status: "not_applicable",
      provenance: [],
      usage: { cached: false, credits: 0, rows: 1 },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(envelope), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    const res = await apiCall<{ hello: string }>("/tools/resolve-security", {
      method: "POST",
      body: { query: "x" },
    });

    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toEqual({ hello: "world" });
  });

  it("normalizes a network failure into an INTERNAL_ERROR envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );

    const res = await apiCall("/anything");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INTERNAL_ERROR");
  });

  it("normalizes a non-envelope JSON body into an INTERNAL_ERROR envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ unexpected: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    const res = await apiCall("/anything");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("error presentation", () => {
  it("flags only the ambiguity codes", () => {
    expect(isAmbiguity(errorEnvelope("AMBIGUOUS_SECURITY"))).toBe(true);
    expect(isAmbiguity(errorEnvelope("SYMBOL_AMBIGUOUS"))).toBe(true);
    expect(isAmbiguity(errorEnvelope("NOT_FOUND"))).toBe(false);
  });

  it("maps every error code to copy with a UI action hint", () => {
    expect(presentError(errorEnvelope("BUDGET_EXCEEDED")).action).toBe("budget");
    expect(presentError(errorEnvelope("AUTH_REQUIRED")).action).toBe("auth");
    expect(presentError(errorEnvelope("RATE_LIMITED")).action).toBe("retry");
  });
});
