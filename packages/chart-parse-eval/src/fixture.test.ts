import { describe, expect, it } from "vitest";
import { CHART_PARSE_CONTRACT } from "@aiphabee/agent-runtime/chart-parse";
import {
  FIXTURE_VERSION,
  checkFixtureContract,
  checkFixtureCoverage,
  validateFixture
} from "./fixture";
import { makeFixture, perfectParse, FULL_TRUTH } from "./test-util";

const OUTPUT = { raw: perfectParse(FULL_TRUTH), token_cost: 1548, latency_ms: 1200 };

describe("validateFixture", () => {
  it("accepts a structurally valid fixture", () => {
    expect(validateFixture(makeFixture({ "cgs-000": OUTPUT }))).toEqual([]);
  });

  it("rejects non-object, wrong version marker, and malformed outputs", () => {
    expect(validateFixture(null)).not.toEqual([]);
    expect(
      validateFixture(makeFixture({ "cgs-000": OUTPUT }, { fixture_version: "other.v1" }))
    ).not.toEqual([]);
    expect(
      validateFixture({
        fixture_version: FIXTURE_VERSION,
        schema_version: "s",
        prompt_version: "p",
        model_version: "m",
        outputs: { "cgs-000": { token_cost: 1 } }
      })
    ).not.toEqual([]);
  });
});

describe("checkFixtureContract", () => {
  it("returns null when fixture versions match the live contract", () => {
    expect(checkFixtureContract(makeFixture({ "cgs-000": OUTPUT }))).toBeNull();
  });

  it("names the drift when schema or prompt version differs", () => {
    const drifted = makeFixture({ "cgs-000": OUTPUT }, { schema_version: "stale.v0" });
    const reason = checkFixtureContract(drifted);
    expect(reason).toContain("stale.v0");
    expect(reason).toContain(CHART_PARSE_CONTRACT.schemaVersion);
  });
});

describe("checkFixtureCoverage", () => {
  it("returns no violations when fixture keys equal manifest sample ids", () => {
    const fixture = makeFixture({ "cgs-000": OUTPUT, "cgs-001": OUTPUT });
    expect(checkFixtureCoverage(fixture, ["cgs-000", "cgs-001"])).toEqual([]);
  });

  it("reports missing and extra sample ids", () => {
    const fixture = makeFixture({ "cgs-000": OUTPUT, "cgs-zzz": OUTPUT });
    const violations = checkFixtureCoverage(fixture, ["cgs-000", "cgs-001"]);
    expect(violations.join("\n")).toContain("cgs-001");
    expect(violations.join("\n")).toContain("cgs-zzz");
  });
});
