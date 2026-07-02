import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { stableStringify, type GoldenSetManifest } from "@aiphabee/chart-golden-set";
import { safeParseChartParseResult, CHART_PARSE_CONTRACT } from "@aiphabee/agent-runtime/chart-parse";
import { buildFixtureFromManifest } from "./fixture-builder";
import { checkFixtureCoverage, validateFixture } from "./fixture";

const MANIFEST_PATH = resolve(__dirname, "../../..", "tests/golden/chart-parse/manifest.json");
const MANIFEST = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as GoldenSetManifest;

describe("buildFixtureFromManifest (against the committed golden set)", () => {
  const fixture = buildFixtureFromManifest(MANIFEST);

  it("is structurally valid, contract-aligned, and covers every sample id", () => {
    expect(validateFixture(fixture)).toEqual([]);
    expect(fixture.schema_version).toBe(CHART_PARSE_CONTRACT.schemaVersion);
    expect(fixture.prompt_version).toBe(CHART_PARSE_CONTRACT.promptVersion);
    expect(
      checkFixtureCoverage(
        fixture,
        MANIFEST.samples.map((sample) => sample.id)
      )
    ).toEqual([]);
  });

  it("is deterministic across builds", () => {
    const again = buildFixtureFromManifest(MANIFEST);
    expect(stableStringify(again)).toBe(stableStringify(fixture));
  });

  it("plants schema-invalid, error, and low-confidence-miss outputs at fixed indices", () => {
    const ids = MANIFEST.samples.map((sample) => sample.id);
    const invalidId = ids[49]!;
    const errorId = ids[24]!;
    const invalid = fixture.outputs[invalidId]!;
    expect("raw" in invalid && !safeParseChartParseResult(invalid.raw).success).toBe(true);
    const errored = fixture.outputs[errorId]!;
    expect("error_code" in errored && errored.error_code).toBe("vision_timeout");
    // most outputs replay truth and stay schema-valid
    const validCount = ids.filter((id) => {
      const output = fixture.outputs[id]!;
      return "raw" in output && safeParseChartParseResult(output.raw).success;
    }).length;
    expect(validCount).toBeGreaterThanOrEqual(90);
  });
});
