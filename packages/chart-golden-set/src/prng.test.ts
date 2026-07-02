import { describe, expect, it } from "vitest";
import { createPrng, deriveSeed, nextGaussian, pickOne, shuffle } from "./prng";

describe("createPrng", () => {
  it("reproduces the same stream for the same seed", () => {
    const a = createPrng(20260702);
    const b = createPrng(20260702);
    const streamA = Array.from({ length: 32 }, () => a());
    const streamB = Array.from({ length: 32 }, () => b());
    expect(streamA).toEqual(streamB);
  });

  it("produces values in [0, 1) with different streams per seed", () => {
    const a = createPrng(1);
    const b = createPrng(2);
    const streamA = Array.from({ length: 64 }, () => a());
    const streamB = Array.from({ length: 64 }, () => b());
    expect(streamA).not.toEqual(streamB);
    for (const value of [...streamA, ...streamB]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("deriveSeed", () => {
  it("is stable for the same label path", () => {
    expect(deriveSeed(42, "sample", 7)).toBe(deriveSeed(42, "sample", 7));
  });

  it("separates streams by label and by root seed", () => {
    const bySample = new Set(
      Array.from({ length: 100 }, (_, i) => deriveSeed(42, "sample", i))
    );
    expect(bySample.size).toBe(100);
    expect(deriveSeed(1, "dim", "theme")).not.toBe(deriveSeed(2, "dim", "theme"));
    expect(deriveSeed(1, "dim", "theme")).not.toBe(deriveSeed(1, "dim", "language"));
  });
});

describe("shuffle", () => {
  it("is deterministic and preserves the multiset without mutating input", () => {
    const input = ["a", "b", "c", "d", "e", "f"];
    const frozen = Object.freeze([...input]);
    const first = shuffle(createPrng(9), frozen);
    const second = shuffle(createPrng(9), frozen);
    expect(first).toEqual(second);
    expect([...first].sort()).toEqual([...input].sort());
    expect(frozen).toEqual(input);
  });
});

describe("pickOne", () => {
  it("always returns a member and throws on empty input", () => {
    const prng = createPrng(3);
    for (let i = 0; i < 20; i += 1) {
      expect(["x", "y", "z"]).toContain(pickOne(prng, ["x", "y", "z"]));
    }
    expect(() => pickOne(prng, [])).toThrow();
  });
});

describe("nextGaussian", () => {
  it("is deterministic and roughly centered", () => {
    const prng = createPrng(77);
    const draws = Array.from({ length: 512 }, () => nextGaussian(prng));
    const again = createPrng(77);
    const drawsAgain = Array.from({ length: 512 }, () => nextGaussian(again));
    expect(draws).toEqual(drawsAgain);
    const mean = draws.reduce((sum, v) => sum + v, 0) / draws.length;
    expect(Math.abs(mean)).toBeLessThan(0.2);
  });
});
