import { describe, expect, it } from "vitest";
import { getIpoSnapshotMock, screenIposMock } from "../lib/api/ipo-mock";
import type { IpoLocalizedText } from "../lib/api/ipo-types";
import { getIpos, IPO_FIXTURES } from "./ipos.fixtures";

const CJK = /[\u3400-\u9fff]/u;

function collectLocalizedText(value: unknown, out: IpoLocalizedText[]): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectLocalizedText(item, out));
    return;
  }
  if (!value || typeof value !== "object") return;
  if ("kind" in value && value.kind === "ipo_localized_text") {
    out.push(value as IpoLocalizedText);
    return;
  }
  Object.values(value).forEach((item) => collectLocalizedText(item, out));
}

function collectRawStringPaths(
  value: unknown,
  path: string,
  out: Array<{ path: string; value: string }>,
): void {
  if (typeof value === "string") {
    out.push({ path, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectRawStringPaths(item, `${path}[${index}]`, out),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  if ("kind" in value && value.kind === "ipo_localized_text") return;
  Object.entries(value).forEach(([key, item]) =>
    collectRawStringPaths(item, path ? `${path}.${key}` : key, out),
  );
}

const RAW_STRING_PATH_ALLOWLIST = [
  /^\[\d+\]\.(id|name|cn|ticker|exchange|sector|listingType|stage|sentiment|demandSignal)$/,
  /^\[\d+\]\.terms\.ccy$/,
  /^\[\d+\]\.timetable\[\d+\]\.type$/,
  /^\[\d+\]\.pools\[\d+\]\.name$/,
  /^\[\d+\]\.cornerstones\[\d+\]\.name$/,
  /^\[\d+\]\.sponsors\[\d+\]\.name$/,
  /^\[\d+\]\.riskSummary\[\d+\]\.level$/,
  /^\[\d+\]\.evidence\.(asOf|dataVersion|methodology)$/,
] as const;

describe("IPO locale-keyed fixture contract", () => {
  it("requires a non-empty authoritative value for every supported locale", () => {
    const localized: IpoLocalizedText[] = [];
    collectLocalizedText(IPO_FIXTURES, localized);

    expect(localized.length).toBeGreaterThan(0);
    for (const text of localized) {
      expect(Object.keys(text.values).sort()).toEqual(["en", "zh-Hans", "zh-Hant"]);
      expect(text.values.en.trim()).not.toBe("");
      expect(text.values["zh-Hans"].trim()).not.toBe("");
      expect(text.values["zh-Hant"].trim()).not.toBe("");
      expect(CJK.test(text.values.en)).toBe(false);
    }
  });

  it("allows raw display strings only for explicit locale-neutral identities", () => {
    const raw: Array<{ path: string; value: string }> = [];
    collectRawStringPaths(IPO_FIXTURES, "", raw);

    expect(raw.length).toBeGreaterThan(0);
    for (const item of raw) {
      expect(item.value.trim(), item.path).not.toBe("");
      expect(
        RAW_STRING_PATH_ALLOWLIST.some((pattern) => pattern.test(item.path)),
        item.path,
      ).toBe(true);
    }
  });

  it("fully resolves locale leaves before returning a display payload", () => {
    const unresolved: IpoLocalizedText[] = [];
    collectLocalizedText(getIpos("en"), unresolved);
    expect(unresolved).toEqual([]);
  });

  it("selects locale content without changing structural facts", () => {
    const zhHant = getIpos("zh-Hant");
    const zhHans = getIpos("zh-Hans");
    const en = getIpos("en");

    expect(zhHant.map((ipo) => [ipo.id, ipo.score, ipo.terms.priceHigh])).toEqual(
      en.map((ipo) => [ipo.id, ipo.score, ipo.terms.priceHigh]),
    );
    expect(zhHans.map((ipo) => [ipo.id, ipo.score, ipo.terms.priceHigh])).toEqual(
      en.map((ipo) => [ipo.id, ipo.score, ipo.terms.priceHigh]),
    );
    expect(en[0].profile.overview).toContain("Honeycomb Intelligence");
    expect(zhHant[0].profile.overview).toContain("蜂巢智能");
    expect(zhHans[0].profile.overview).toContain("蜂巢智能");
  });

  it("selects structured English vendor text across every detail surface", () => {
    const honeycomb = getIpos("en").find((ipo) => ipo.id === "honeycomb")!;
    const lotus = getIpos("en").find((ipo) => ipo.id === "lotus")!;

    expect(honeycomb.board).toBe("Main Board");
    expect(honeycomb.timetable[0].title).toBe("Public offer opens");
    expect(honeycomb.pools?.[0]).toMatchObject({
      desc: "Applications ≤ HK$5M",
      lots: "7,500 lots",
    });
    expect(honeycomb.lockup[0]).toMatchObject({
      type: "Controlling shareholder",
      shares: "890 million shares",
    });
    expect(honeycomb.sponsors[0].role).toBe("Joint sponsor");
    expect(honeycomb.profile.useOfProceeds[0].label).toBe(
      "R&D and model training",
    );
    expect(honeycomb.profile.company[1]).toEqual({
      k: "Headquarters",
      v: "Hong Kong · Singapore",
    });
    expect(honeycomb.evidence.source).toBe("HKEX prospectus · HKEXnews");
    expect(lotus.allotment?.validApps).toBe("186,420 applicants");
  });

  it("propagates the requested locale through mock API envelopes", () => {
    const detail = getIpoSnapshotMock("honeycomb", "en");
    const screen = screenIposMock("en", { q: "2769" });

    expect(detail.ok && detail.data.desc).toContain("AI research infrastructure");
    expect(screen.ok && screen.data.rows[0].terms.sharesOffered).toBe(
      "170 million shares",
    );
  });
});
