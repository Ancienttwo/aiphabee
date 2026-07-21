import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider, type Locale } from "../../i18n/locale";
import { IPOS } from "../../data/ipos.fixtures";
import { EntitlementProvider } from "../../lib/context/EntitlementContext";
import { EvidenceChip } from "./EvidenceChip";
import { FilterBar } from "./FilterBar";
import { IpoRow } from "./IpoRow";
import { LockedValue } from "./LockedValue";
import { StageRail } from "./StageRail";
import { getIpoMessage } from "./i18n";
import {
  Allotment,
  Cornerstones,
  Lockup,
  PoolClawback,
  TermsGrid,
} from "./panels";

describe("IPO pipeline i18n", () => {
  it.each([
    ["zh-Hant", "IPO 研究工作台", "招股中", "全部里程碑"],
    ["zh-Hans", "IPO 研究工作台", "招股中", "全部里程碑"],
    ["en", "IPO research workbench", "Subscribing", "All milestones"],
  ] as const)(
    "provides route and lifecycle copy for %s",
    (locale, title, stage, milestone) => {
      expect(getIpoMessage(locale, "pipelineTitle")).toBe(title);
      expect(getIpoMessage(locale, "stageSubscribing")).toBe(stage);
      expect(getIpoMessage(locale, "allMilestones")).toBe(milestone);
    },
  );

  it("renders pipeline controls and rows in English", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="en">
        <StageRail active="all" setActive={() => {}} />
        <FilterBar
          sector="all"
          setSector={() => {}}
          sort="sub"
          setSort={() => {}}
          q=""
          setQ={() => {}}
        />
        <IpoRow
          ipo={IPOS[0]}
          onOpen={() => {}}
          inCompare={false}
          toggleCompare={() => {}}
        />
      </LocaleProvider>,
    );

    expect(html).toContain("All pipeline");
    expect(html).toContain("Search company or ticker");
    expect(html).toContain("Offer · Entry fee");
    expect(html).toContain("Technology");
    expect(html).toContain("Bullish");
    expect(html).not.toContain("按认购倍数");
    expect(html).not.toContain("加入对比");
  });

  it.each(["zh-Hant", "zh-Hans", "en"] as Locale[])(
    "keeps every comparison label available for %s",
    (locale) => {
      expect(getIpoMessage(locale, "metricScore")).toBeTruthy();
      expect(getIpoMessage(locale, "metricClawback")).toBeTruthy();
      expect(getIpoMessage(locale, "verdictDisclaimer")).toBeTruthy();
    },
  );

  it("renders IPO detail controls and panels in English", () => {
    const subscribing = IPOS.find((ipo) => ipo.id === "honeycomb")!;
    const allotted = IPOS.find((ipo) => ipo.id === "lotus")!;
    const introduction = IPOS.find((ipo) => ipo.id === "meridian")!;
    const withdrawn = IPOS.find((ipo) => ipo.id === "greenfield")!;
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="en">
        <EntitlementProvider>
          <EvidenceChip ev={subscribing.evidence} />
          <LockedValue>restricted</LockedValue>
          <TermsGrid ipo={subscribing} />
          <Allotment ipo={allotted} />
          <Cornerstones ipo={subscribing} />
          <Cornerstones ipo={withdrawn} />
          <PoolClawback ipo={introduction} />
          <Lockup ipo={withdrawn} />
        </EntitlementProvider>
      </LocaleProvider>,
    );

    expect(html).toContain("As of");
    expect(html).toContain("Premium Unlock");
    expect(html).toContain("Price range");
    expect(html).toContain("Allotment by tier");
    expect(html).toContain("Maximum subscription");
    expect(html).toContain("This IPO has no cornerstone investors");
    expect(html).toContain("This listing is by introduction");
    expect(html).toContain("No applicable lock-up information");
    expect(html).not.toContain("招股价区间");
    expect(html).not.toContain("分配结果尚未公布");
  });
});
