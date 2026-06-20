import { describe, expect, it } from "vitest";
import {
  DEFAULT_DATA_ACCESS_POLICY,
  createSyntheticApprovedPolicy,
  evaluateDataAccessRequest
} from "./index";

describe("data access gateway", () => {
  it("denies fields by default before rights approval", () => {
    const decision = evaluateDataAccessRequest({
      channel: "mcp",
      dataset: "hk_equity_quote",
      plan: "free",
      qualityState: "PASS",
      requestedFields: ["quote.close"],
      requestedRows: 1
    });

    expect(decision.status).toBe("deny");
    expect(decision.error?.code).toBe("DATA_NOT_LICENSED");
    expect(decision.allowedFields).toEqual([]);
    expect(decision.deniedFields).toEqual([
      {
        field: "quote.close",
        reason: "channel_blocked"
      }
    ]);
    expect(decision.usage.rows).toBe(0);
  });

  it("redacts unapproved fields when a synthetic channel is approved", () => {
    const decision = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "internal",
        qualityState: "PASS",
        requestedFields: [
          "synthetic_quote.close",
          "synthetic_profile.company_name"
        ],
        requestedRows: 5,
        timeRange: {
          from: "2024-01-01",
          to: "2024-01-31"
        }
      },
      createSyntheticApprovedPolicy()
    );

    expect(decision.status).toBe("allow_with_redactions");
    expect(decision.allowedFields).toEqual(["synthetic_profile.company_name"]);
    expect(decision.deniedFields).toEqual([
      {
        field: "synthetic_quote.close",
        reason: "field_default_deny"
      }
    ]);
    expect(decision.cacheKey).toContain("rights=synthetic-policy-v0");
    expect(decision.cacheKey).toContain(
      "fields=synthetic_profile.company_name"
    );
    expect(decision.limits.timeWindowDays).toBe(31);
    expect(decision.usage.rows).toBe(5);
  });

  it("returns DATA_QUALITY_HOLD before serving held records", () => {
    const decision = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "internal",
        qualityState: "HOLD",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1
      },
      createSyntheticApprovedPolicy()
    );

    expect(decision.status).toBe("quality_hold");
    expect(decision.error?.code).toBe("DATA_QUALITY_HOLD");
    expect(decision.allowedFields).toEqual([]);
    expect(decision.usage.credits).toBe(0);
  });

  it("enforces row and date limits", () => {
    const tooManyRows = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "internal",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: DEFAULT_DATA_ACCESS_POLICY.maxRows + 1
      },
      createSyntheticApprovedPolicy()
    );
    const outOfRange = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "internal",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1,
        timeRange: {
          from: "2023-01-01",
          to: "2025-01-01"
        }
      },
      createSyntheticApprovedPolicy()
    );

    expect(tooManyRows.error?.code).toBe("TOO_MANY_ROWS");
    expect(outOfRange.error?.code).toBe("OUT_OF_RANGE");
  });
});
