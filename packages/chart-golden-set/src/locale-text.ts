/**
 * All human-visible chart text lives here, per language.
 *
 * Single source of truth for two consumers:
 * - render.ts reads labels when assembling ECharts options;
 * - scripts/make-font-subset.mjs unions every zh character below to build the
 *   pinned Noto Sans SC subset, so adding new Chinese copy REQUIRES re-running
 *   the subset script (see assets/fonts/README note in that script).
 */

export type ChartLanguage = "zh" | "en";

export interface LocaleText {
  readonly priceAxis: string;
  readonly volumeLabel: string;
  readonly openLabel: string;
  readonly closeLabel: string;
  readonly highLabel: string;
  readonly lowLabel: string;
  readonly titleSuffix: string;
  readonly timeframeLabel: Readonly<Record<string, string>>;
}

export const LOCALE_TEXT: Readonly<Record<ChartLanguage, LocaleText>> = Object.freeze({
  zh: {
    priceAxis: "价格",
    volumeLabel: "成交量",
    openLabel: "开",
    closeLabel: "收",
    highLabel: "高",
    lowLabel: "低",
    titleSuffix: "行情走势",
    timeframeLabel: {
      "1m": "1分钟",
      "5m": "5分钟",
      "15m": "15分钟",
      "30m": "30分钟",
      "1h": "1小时",
      "2h": "2小时",
      "4h": "4小时",
      "1d": "日线",
      "1w": "周线",
      "1M": "月线"
    }
  },
  en: {
    priceAxis: "Price",
    volumeLabel: "Volume",
    openLabel: "O",
    closeLabel: "C",
    highLabel: "H",
    lowLabel: "L",
    titleSuffix: "Price Chart",
    timeframeLabel: {
      "1m": "1m",
      "5m": "5m",
      "15m": "15m",
      "30m": "30m",
      "1h": "1H",
      "2h": "2H",
      "4h": "4H",
      "1d": "1D",
      "1w": "1W",
      "1M": "1M"
    }
  }
});

/** Every distinct non-ASCII character used by zh copy (font subset source). */
export function collectChineseCharacters(): string[] {
  const seen = new Set<string>();
  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      for (const ch of value) {
        if (ch.charCodeAt(0) > 0x7f) {
          seen.add(ch);
        }
      }
      return;
    }
    if (value && typeof value === "object") {
      for (const child of Object.values(value)) {
        walk(child);
      }
    }
  };
  walk(LOCALE_TEXT);
  return [...seen].sort();
}
