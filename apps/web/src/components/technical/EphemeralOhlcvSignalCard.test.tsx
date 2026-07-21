import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider, type Locale } from "../../i18n/locale";
import { EphemeralOhlcvSignalCard } from "./EphemeralOhlcvSignalCard";

const BARS = [
  {
    close: 448.2,
    high: 450.6,
    low: 444.8,
    open: 446,
    timestamp: "2026-07-07T00:00:00.000Z",
    volume: 28600000,
  },
];

describe("EphemeralOhlcvSignalCard (SSR)", () => {
  it.each([
    ["zh-Hant", "臨時公開資料", "最長 24 小時", "不是授權行情驗證", "不構成投資建議"],
    ["zh-Hans", "临时公开数据", "最长 24 小时", "不是授权行情验证", "不构成投资建议"],
    ["en", "temporary public data", "no longer than 24 hours", "not authorized market-data verification", "investment advice"],
  ] as const)("renders the bounded consent contract in %s", (locale, data, lifetime, authorization, advice) => {
    const html = renderCard(locale);

    expect(html).toContain(data);
    expect(html).toContain(lifetime);
    expect(html).toContain("public_observation_signal");
    expect(html).toContain(authorization);
    expect(html).toContain(advice);
  });

  it("renders trend, momentum, volatility, and volume signal fields in English", () => {
    const html = renderCard("en");

    expect(html).toContain("Trend");
    expect(html).toContain("uptrend");
    expect(html).toContain("Momentum");
    expect(html).toContain("positive");
    expect(html).toContain("Volatility");
    expect(html).toContain("normal");
    expect(html).toContain("Volume");
    expect(html).toContain("confirming");
    expect(html).not.toContain("临时公开行情分析");
  });

  it("renders bounded OHLCV with public observation label and retrieved time", () => {
    const html = renderCard("en");

    expect(html).toContain("OHLCV");
    expect(html).toContain("public_observation");
    expect(html).toContain("Retrieved at 2026-07-07T03:45:00.000Z");
    expect(html).toContain("Bounded");
    expect(html).toContain("2026-07-07T00:00:00.000Z");
    expect(html).toContain("448.2");
  });

  it("does not expose batch export or standing download API affordances", () => {
    const html = renderCard("zh-Hans");

    expect(html).not.toContain("批量导出");
    expect(html).not.toContain("常驻下载 API");
  });
});

function renderCard(locale: Locale): string {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale={locale}>
      <EphemeralOhlcvSignalCard
        bars={BARS}
        delayNotice="Public OHLCV may be delayed or incomplete."
        retrievedAt="2026-07-07T03:45:00.000Z"
        signal={{
          momentum: "positive",
          trend: "uptrend",
          volatility: "normal",
          volume: "confirming",
        }}
      />
    </LocaleProvider>,
  );
}
