import { describe, expect, it } from "vitest";
import { repairAndValidate } from "./repair";
import { CLEAR_SAMPLE_RESULT } from "./test-util";

describe("repairAndValidate", () => {
  it("repairs a trailing-comma payload into a contract-valid result", () => {
    const raw = `${JSON.stringify(CLEAR_SAMPLE_RESULT).slice(0, -1)},}`;
    expect(repairAndValidate(raw)).toEqual(CLEAR_SAMPLE_RESULT);
  });

  it("returns null when the repaired JSON still violates the schema", () => {
    expect(repairAndValidate('{"chart_type": {')).toBeNull();
  });

  it("returns null for valid JSON that fails the contract", () => {
    expect(repairAndValidate('{"foo": 1}')).toBeNull();
  });

  it("returns null for empty or missing text", () => {
    expect(repairAndValidate("")).toBeNull();
    expect(repairAndValidate(undefined)).toBeNull();
  });
});
