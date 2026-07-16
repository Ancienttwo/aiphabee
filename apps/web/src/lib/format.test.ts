import { describe, expect, it } from "vitest";
import { formatHkCode, formatHkSymbol } from "./format";

describe("formatHkCode", () => {
  it("drops the leading zero to the market's minimum-4-digit main-board convention", () => {
    expect(formatHkCode("00700")).toBe("0700");
    expect(formatHkCode("00001")).toBe("0001");
    expect(formatHkCode(700)).toBe("0700");
  });

  it("leaves a code at or above 10000 unchanged (warrant/CBBC codes stay 5-digit)", () => {
    expect(formatHkCode("14662")).toBe("14662");
    expect(formatHkCode(14662)).toBe("14662");
  });

  it("leaves an already-4-digit code unchanged", () => {
    expect(formatHkCode("9999")).toBe("9999");
  });

  it("passes non-numeric input through unchanged instead of producing 0NaN", () => {
    expect(formatHkCode("abc")).toBe("abc");
    expect(formatHkCode("")).toBe("");
  });
});

describe("formatHkSymbol", () => {
  it("formats the code segment and preserves the .HK suffix", () => {
    expect(formatHkSymbol("00700.HK")).toBe("0700.HK");
    expect(formatHkSymbol("00001.HK")).toBe("0001.HK");
  });

  it("leaves a warrant/CBBC symbol at or above 10000 unchanged", () => {
    expect(formatHkSymbol("14662.HK")).toBe("14662.HK");
  });

  it("formats a bare code with no suffix", () => {
    expect(formatHkSymbol("00700")).toBe("0700");
  });
});
