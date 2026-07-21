import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider, type Locale } from "../i18n/locale";
import { MarketSentimentPanel } from "./MarketSentimentPanel";

function renderPanel(locale: Locale): string {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale={locale}>
      <MarketSentimentPanel />
    </LocaleProvider>,
  );
}

describe("MarketSentimentPanel i18n (SSR)", () => {
  it.each([
    ["zh-Hant", "市場情緒指標", "審慎樂觀", "極度悲觀"],
    ["zh-Hans", "市场情绪指标", "谨慎乐观", "极度悲观"],
    ["en", "Market sentiment", "Cautiously optimistic", "Extremely bearish"],
  ] as const)("renders panel-owned copy for %s", (locale, title, trend, lowLabel) => {
    const html = renderPanel(locale);
    expect(html).toContain(title);
    expect(html).toContain(trend);
    expect(html).toContain(lowLabel);
    expect(html).toContain("50×");
  });

  it("does not leak hardcoded Chinese copy into the English panel", () => {
    const html = renderPanel("en");
    expect(html).toContain("Bee insight");
    expect(html).not.toContain("市场情绪");
    expect(html).not.toContain("工蜂洞察");
  });
});
