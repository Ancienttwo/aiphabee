import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
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
  it("renders consent copy with temporary public data, 24h, and non-authorized notice", () => {
    const html = renderCard();

    expect(html).toContain("临时公开数据");
    expect(html).toContain("24 小时");
    expect(html).toContain("public_observation_signal");
    expect(html).toContain("不是授权行情验证");
    expect(html).toContain("不构成投资建议");
  });

  it("renders trend, momentum, volatility, and volume signal fields", () => {
    const html = renderCard();

    expect(html).toContain("趋势");
    expect(html).toContain("uptrend");
    expect(html).toContain("动量");
    expect(html).toContain("positive");
    expect(html).toContain("波动");
    expect(html).toContain("normal");
    expect(html).toContain("成交量");
    expect(html).toContain("confirming");
  });

  it("renders bounded OHLCV with public observation label and retrieved time", () => {
    const html = renderCard();

    expect(html).toContain("OHLCV");
    expect(html).toContain("public_observation");
    expect(html).toContain("获取时间 2026-07-07T03:45:00.000Z");
    expect(html).toContain("2026-07-07T00:00:00.000Z");
    expect(html).toContain("448.2");
  });

  it("does not expose batch export or standing download API affordances", () => {
    const html = renderCard();

    expect(html).not.toContain("批量导出");
    expect(html).not.toContain("常驻下载 API");
  });
});

function renderCard(): string {
  return renderToStaticMarkup(
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
    />,
  );
}
