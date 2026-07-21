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

function scopedProse(ipo: ReturnType<typeof getIpos>[number]): string[] {
  return [
    ipo.tierLabel,
    ipo.desc,
    ipo.aiNote,
    ipo.terms.sharesOffered,
    ipo.terms.greenshoe,
    ipo.terms.raiseHKD,
    ipo.terms.mcapHKD,
    ipo.terms.nta,
    ipo.terms.pe,
    ipo.terms.pb,
    ipo.profile.overview,
    ...ipo.profile.risks,
    ...ipo.profile.advantages,
    ...ipo.riskSummary.map((risk) => risk.text),
  ];
}

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
    }
  });

  it("resolves scoped English prose without Chinese source-language text", () => {
    for (const ipo of getIpos("en")) {
      expect(scopedProse(ipo).filter((text) => CJK.test(text))).toEqual([]);
    }
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

  it("propagates the requested locale through mock API envelopes", () => {
    const detail = getIpoSnapshotMock("honeycomb", "en");
    const screen = screenIposMock("en", { q: "2769" });

    expect(detail.ok && detail.data.desc).toContain("AI research infrastructure");
    expect(screen.ok && screen.data.rows[0].terms.sharesOffered).toBe(
      "170 million shares",
    );
  });
});
