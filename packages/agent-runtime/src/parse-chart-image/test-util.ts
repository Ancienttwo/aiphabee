import { MockLanguageModelV4 } from "ai/test";
import type { ChartParseResult } from "../chart-parse";

export const CLEAR_SAMPLE_IMAGE_REF = "charts/tenant-a/img-0001";

/**
 * A clear-sample vision output: every P0/P1 field labeled, RSI(14) and
 * MACD(12,26,9) visible, one drawn trendline. Must satisfy
 * safeParseChartParseResult (asserted in tests) so it can stand in for a
 * well-behaved model response.
 */
export const CLEAR_SAMPLE_RESULT: ChartParseResult = {
  chart_type: { value: "candlestick", confidence: 0.98 },
  symbol: { value: "0700.HK", confidence: 0.97 },
  exchange: { value: "HKEX", confidence: 0.96 },
  timeframe: { value: "1d", confidence: 0.95 },
  end_time: { value: "2026-06-30", confidence: 0.9 },
  indicators: [
    { name: "RSI", params: [14], confidence: 0.9 },
    { name: "MACD", params: [12, 26, 9], confidence: 0.88 }
  ],
  drawn_lines: [
    {
      kind: "trendline",
      anchors: [
        { x: 0.12, y: 0.82 },
        { x: 0.91, y: 0.23 }
      ],
      confidence: 0.8
    }
  ],
  patterns: []
};

export const IMAGE_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const FETCHED_IMAGE = {
  bytes: IMAGE_BYTES,
  mediaType: "image/png"
};

export interface MockUsageTotals {
  input: number | undefined;
  output: number | undefined;
}

const makeV4Usage = ({ input, output }: MockUsageTotals) => ({
  inputTokens: { total: input, noCache: input, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: output, text: output, reasoning: 0 }
});

export const makeTextGeneration = (
  text: string,
  usage: MockUsageTotals = { input: 100, output: 50 }
) => ({
  content: [{ type: "text" as const, text }],
  finishReason: { raw: "stop", unified: "stop" as const },
  usage: makeV4Usage(usage),
  warnings: []
});

export const makeVisionModelMock = (
  generations: ReadonlyArray<ReturnType<typeof makeTextGeneration>>
) =>
  new MockLanguageModelV4({
    modelId: "google-ai-studio/gemini-2.5-flash",
    doGenerate: [...generations]
  });

export const makeVisionModelMockFromTexts = (texts: readonly string[]) =>
  makeVisionModelMock(texts.map((text) => makeTextGeneration(text)));
