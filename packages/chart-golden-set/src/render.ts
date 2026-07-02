import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Resvg } from "@resvg/resvg-js";
import * as echarts from "echarts";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { macd, rsi, sma } from "./indicators";
import { LOCALE_TEXT, type ChartLanguage } from "./locale-text";
import type { TruthAnchor } from "./manifest";
import type { OhlcvBar, SyntheticSeries } from "./synthetic-ohlcv";
import type { SampleSpec } from "./variant-matrix";

/**
 * ECharts SSR -> SVG -> resvg PNG -> optional degradation.
 *
 * Determinism contract: rendering is a pure function of (spec, series) plus
 * the pinned engine/font versions. Fonts are loaded exclusively from
 * assets/fonts (loadSystemFonts: false) so machines cannot disagree on text.
 * Truth-visibility contract: every non-null truth field must be readable in
 * the image — exchange rides with the symbol in the title, the last axis
 * label is forced visible so end_time stays readable.
 */

const BASE_WIDTH = 1200;
const BASE_HEIGHT = 800;
const DOWNSCALE_FACTOR = 0.6;
const JPEG_QUALITY = 45;

const FONT_DIR = fileURLToPath(new URL("../assets/fonts/", import.meta.url));
const FONT_FILE_NAMES = ["NotoSans-Regular.ttf", "NotoSansSC-Subset.ttf"] as const;
const FONT_FAMILY = "Noto Sans, Noto Sans SC, sans-serif";

interface StylePreset {
  readonly backgroundColor: { light: string; dark: string };
  readonly textColor: { light: string; dark: string };
  readonly gridLineColor: { light: string; dark: string };
  readonly upColor: string;
  readonly downColor: string;
  readonly yAxisPosition: "left" | "right";
  readonly annotationColor: string;
}

const STYLE_PRESETS: Readonly<Record<string, StylePreset>> = {
  tradingview_like: {
    backgroundColor: { light: "#ffffff", dark: "#131722" },
    textColor: { light: "#131722", dark: "#d1d4dc" },
    gridLineColor: { light: "#e0e3eb", dark: "#2a2e39" },
    upColor: "#26a69a",
    downColor: "#ef5350",
    yAxisPosition: "right",
    annotationColor: "#2962ff"
  },
  exchange_terminal: {
    backgroundColor: { light: "#fdfdfd", dark: "#101014" },
    textColor: { light: "#1f1f1f", dark: "#cfd3dc" },
    gridLineColor: { light: "#d8d8d8", dark: "#33363f" },
    upColor: "#e5484d",
    downColor: "#1ea97c",
    yAxisPosition: "left",
    annotationColor: "#ff9f0a"
  },
  minimal_web: {
    backgroundColor: { light: "#ffffff", dark: "#181818" },
    textColor: { light: "#444444", dark: "#bbbbbb" },
    gridLineColor: { light: "#f0f0f0", dark: "#2c2c2c" },
    upColor: "#4caf50",
    downColor: "#607d8b",
    yAxisPosition: "right",
    annotationColor: "#d81b60"
  }
};

export interface RenderedSample {
  readonly png: Buffer;
  readonly anchors: ReadonlyArray<readonly TruthAnchor[]>;
  readonly width: number;
  readonly height: number;
}

export function fontFilePaths(): string[] {
  return FONT_FILE_NAMES.map((name) => join(FONT_DIR, name));
}

export async function renderSample(
  spec: SampleSpec,
  series: SyntheticSeries
): Promise<RenderedSample> {
  const fontFiles = fontFilePaths();
  for (const fontFile of fontFiles) {
    if (!existsSync(fontFile)) {
      throw new Error(`pinned font missing: ${fontFile} (run scripts/make-font-subset.mjs)`);
    }
  }
  const chart = echarts.init(null, null, {
    ssr: true,
    renderer: "svg",
    width: BASE_WIDTH,
    height: BASE_HEIGHT
  });
  try {
    const annotation = planAnnotation(spec, series);
    chart.setOption(buildChartOption(spec, series, annotation));
    const anchors = annotationAnchors(chart, annotation);
    const svg = chart.renderToSVGString();
    const basePng = new Resvg(svg, {
      font: {
        fontFiles,
        loadSystemFonts: false,
        defaultFontFamily: "Noto Sans"
      }
    })
      .render()
      .asPng();
    return degrade(Buffer.from(basePng), spec.dims.degradation, anchors);
  } finally {
    chart.dispose();
  }
}

interface AnnotationPlan {
  readonly kind: "none" | "trendline" | "horizontal_line" | "rectangle";
  readonly dataPoints: ReadonlyArray<readonly [number, number]>;
}

/** Choose annotation geometry in DATA coordinates (bar index, price). */
function planAnnotation(spec: SampleSpec, series: SyntheticSeries): AnnotationPlan {
  const kind = spec.dims.annotations;
  const bars = series.bars;
  const lastIndex = bars.length - 1;
  const [rangeStart, rangeEnd] = series.patternRange ?? [
    Math.floor(bars.length * 0.35),
    lastIndex - Math.floor(bars.length * 0.05)
  ];
  if (kind === "trendline") {
    const i1 = rangeStart;
    const i2 = Math.max(i1 + 5, rangeEnd - 2);
    return {
      kind,
      dataPoints: [
        [i1, (bars[i1] as OhlcvBar).low],
        [i2, (bars[i2] as OhlcvBar).low]
      ]
    };
  }
  if (kind === "horizontal_line") {
    const level = quantile(
      bars.slice(rangeStart, rangeEnd + 1).map((bar) => bar.high),
      0.9
    );
    return {
      kind,
      dataPoints: [
        [0, level],
        [lastIndex, level]
      ]
    };
  }
  if (kind === "rectangle") {
    const windowBars = bars.slice(rangeStart, rangeEnd + 1);
    const top = Math.max(...windowBars.map((bar) => bar.high));
    const bottom = Math.min(...windowBars.map((bar) => bar.low));
    return {
      kind,
      dataPoints: [
        [rangeStart, bottom],
        [rangeEnd, top]
      ]
    };
  }
  return { kind: "none", dataPoints: [] };
}

function quantile(values: readonly number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[index] as number;
}

/** Convert the annotation's data coordinates to normalized image coordinates. */
function annotationAnchors(
  chart: echarts.ECharts,
  annotation: AnnotationPlan
): ReadonlyArray<readonly TruthAnchor[]> {
  if (annotation.kind === "none") {
    return [];
  }
  const anchors = annotation.dataPoints.map((point) => {
    const pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
      point[0],
      point[1]
    ]) as unknown as [number, number];
    return {
      x: clamp01(pixel[0] / BASE_WIDTH),
      y: clamp01(pixel[1] / BASE_HEIGHT)
    };
  });
  return [anchors];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Math.round(value * 10_000) / 10_000));
}

interface PaneLayout {
  readonly gridIndex: number;
  readonly top: number;
  readonly height: number;
  readonly label: string | null;
}

function buildChartOption(
  spec: SampleSpec,
  series: SyntheticSeries,
  annotation: AnnotationPlan
): echarts.EChartsCoreOption {
  const style = STYLE_PRESETS[spec.dims.platform_style] as StylePreset;
  const theme = spec.dims.theme;
  const language = spec.dims.language as ChartLanguage;
  const text = LOCALE_TEXT[language];
  const showAxes = spec.dims.info_missing !== "no_axes";
  const bars = series.bars;
  const closes = bars.map((bar) => bar.close);
  const times = bars.map((bar) => bar.time);

  const hasVol = spec.indicators.some((indicator) => indicator.name === "VOL");
  const hasRsi = spec.indicators.some((indicator) => indicator.name === "RSI");
  const hasMacd = spec.indicators.some((indicator) => indicator.name === "MACD");
  const maSpec = spec.indicators.find((indicator) => indicator.name === "MA");

  const panes = layoutPanes(spec, text, { hasVol, hasRsi, hasMacd });
  const mainPane = panes[0] as PaneLayout;

  const grids = panes.map((pane) => ({
    left: style.yAxisPosition === "left" ? 90 : 40,
    right: style.yAxisPosition === "right" ? 90 : 40,
    top: pane.top,
    height: pane.height
  }));

  const xAxes = panes.map((pane, order) => ({
    type: "category" as const,
    gridIndex: pane.gridIndex,
    data: times,
    boundaryGap: true,
    axisLine: { lineStyle: { color: style.gridLineColor[theme] } },
    axisTick: { show: false },
    axisLabel: {
      show: showAxes && order === panes.length - 1,
      color: style.textColor[theme],
      fontFamily: FONT_FAMILY,
      fontSize: 11,
      showMaxLabel: true,
      hideOverlap: true
    },
    splitLine: { show: false }
  }));

  const yAxes = panes.map((pane) => ({
    type: "value" as const,
    gridIndex: pane.gridIndex,
    position: style.yAxisPosition,
    scale: true,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      show: showAxes,
      color: style.textColor[theme],
      fontFamily: FONT_FAMILY,
      fontSize: 11
    },
    splitLine: {
      show: pane.gridIndex === 0,
      lineStyle: { color: style.gridLineColor[theme] }
    }
  }));

  const seriesList: Record<string, unknown>[] = [
    {
      type: "candlestick",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: bars.map((bar) => [bar.open, bar.close, bar.low, bar.high]),
      itemStyle: {
        color: style.upColor,
        color0: style.downColor,
        borderColor: style.upColor,
        borderColor0: style.downColor
      }
    }
  ];

  if (maSpec) {
    for (const period of maSpec.params) {
      seriesList.push({
        type: "line",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: sma(closes, period),
        showSymbol: false,
        smooth: false,
        lineStyle: { width: 1.2 },
        emphasis: { disabled: true }
      });
    }
  }

  let paneCursor = 1;
  if (hasVol) {
    const volPane = panes[paneCursor] as PaneLayout;
    paneCursor += 1;
    seriesList.push({
      type: "bar",
      xAxisIndex: volPane.gridIndex,
      yAxisIndex: volPane.gridIndex,
      data: bars.map((bar) => ({
        value: bar.volume,
        itemStyle: { color: bar.close >= bar.open ? style.upColor : style.downColor }
      })),
      barWidth: "60%"
    });
  }
  if (hasRsi) {
    const rsiPane = panes[paneCursor] as PaneLayout;
    paneCursor += 1;
    const rsiSpec = spec.indicators.find((indicator) => indicator.name === "RSI");
    const period = rsiSpec?.params[0] ?? 14;
    seriesList.push({
      type: "line",
      xAxisIndex: rsiPane.gridIndex,
      yAxisIndex: rsiPane.gridIndex,
      data: rsi(closes, period),
      showSymbol: false,
      lineStyle: { width: 1.4, color: "#a875ff" }
    });
  }
  if (hasMacd) {
    const macdPane = panes[paneCursor] as PaneLayout;
    paneCursor += 1;
    const macdSpecEntry = spec.indicators.find((indicator) => indicator.name === "MACD");
    const [fast, slow, signalPeriod] = [
      macdSpecEntry?.params[0] ?? 12,
      macdSpecEntry?.params[1] ?? 26,
      macdSpecEntry?.params[2] ?? 9
    ];
    const macdData = macd(closes, fast, slow, signalPeriod);
    seriesList.push(
      {
        type: "bar",
        xAxisIndex: macdPane.gridIndex,
        yAxisIndex: macdPane.gridIndex,
        data: macdData.histogram.map((value) => ({
          value,
          itemStyle: { color: value !== null && value >= 0 ? style.upColor : style.downColor }
        })),
        barWidth: "50%"
      },
      {
        type: "line",
        xAxisIndex: macdPane.gridIndex,
        yAxisIndex: macdPane.gridIndex,
        data: macdData.macd,
        showSymbol: false,
        lineStyle: { width: 1.2, color: "#f2a33c" }
      },
      {
        type: "line",
        xAxisIndex: macdPane.gridIndex,
        yAxisIndex: macdPane.gridIndex,
        data: macdData.signal,
        showSymbol: false,
        lineStyle: { width: 1.2, color: "#5aa9e6" }
      }
    );
  }

  appendAnnotationSeries(seriesList, annotation, style, bars.length);

  return {
    animation: false,
    backgroundColor: style.backgroundColor[theme],
    textStyle: { fontFamily: FONT_FAMILY },
    title: buildTitles(spec, text, style, theme, panes),
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    series: seriesList
  };
}

function layoutPanes(
  spec: SampleSpec,
  text: (typeof LOCALE_TEXT)["zh"],
  flags: { hasVol: boolean; hasRsi: boolean; hasMacd: boolean }
): PaneLayout[] {
  const labels: Array<string | null> = [null];
  if (flags.hasVol) {
    labels.push(text.volumeLabel);
  }
  if (flags.hasRsi) {
    const rsiSpec = spec.indicators.find((indicator) => indicator.name === "RSI");
    labels.push(`RSI(${(rsiSpec?.params ?? [14]).join(",")})`);
  }
  if (flags.hasMacd) {
    const macdSpecEntry = spec.indicators.find((indicator) => indicator.name === "MACD");
    labels.push(`MACD(${(macdSpecEntry?.params ?? [12, 26, 9]).join(",")})`);
  }
  const subPaneCount = labels.length - 1;
  const topMargin = 64;
  const bottomMargin = 56;
  const usable = BASE_HEIGHT - topMargin - bottomMargin;
  const subHeight = subPaneCount === 0 ? 0 : Math.floor(usable * 0.16);
  const gap = 28;
  const mainHeight = usable - subPaneCount * (subHeight + gap);
  const panes: PaneLayout[] = [
    { gridIndex: 0, top: topMargin, height: mainHeight, label: null }
  ];
  for (let i = 0; i < subPaneCount; i += 1) {
    panes.push({
      gridIndex: i + 1,
      top: topMargin + mainHeight + gap + i * (subHeight + gap),
      height: subHeight,
      label: labels[i + 1] ?? null
    });
  }
  return panes;
}

function buildTitles(
  spec: SampleSpec,
  text: (typeof LOCALE_TEXT)["zh"],
  style: StylePreset,
  theme: "light" | "dark",
  panes: readonly PaneLayout[]
): Record<string, unknown>[] {
  const headline: string[] = [];
  if (spec.dims.info_missing !== "no_symbol") {
    headline.push(`${spec.symbol} (${spec.exchange})`);
  }
  if (spec.dims.info_missing !== "no_timeframe") {
    headline.push(text.timeframeLabel[spec.timeframe] ?? spec.timeframe);
  }
  headline.push(text.titleSuffix);

  const titles: Record<string, unknown>[] = [
    {
      left: 40,
      top: 12,
      text: headline.join(" · "),
      textStyle: {
        color: style.textColor[theme],
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        fontWeight: "bold"
      }
    }
  ];
  const maSpec = spec.indicators.find((indicator) => indicator.name === "MA");
  if (maSpec) {
    titles.push({
      left: 40,
      top: 40,
      text: `MA(${maSpec.params.join(",")})`,
      textStyle: {
        color: style.textColor[theme],
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        fontWeight: "normal"
      }
    });
  }
  for (const pane of panes) {
    if (pane.label) {
      titles.push({
        left: 40,
        top: pane.top - 22,
        text: pane.label,
        textStyle: {
          color: style.textColor[theme],
          fontFamily: FONT_FAMILY,
          fontSize: 12,
          fontWeight: "normal"
        }
      });
    }
  }
  return titles;
}

function appendAnnotationSeries(
  seriesList: Record<string, unknown>[],
  annotation: AnnotationPlan,
  style: StylePreset,
  barCount: number
): void {
  if (annotation.kind === "none") {
    return;
  }
  if (annotation.kind === "trendline" || annotation.kind === "horizontal_line") {
    const sparse: Array<number | null> = new Array(barCount).fill(null);
    for (const [index, price] of annotation.dataPoints) {
      sparse[index] = price;
    }
    seriesList.push({
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: sparse,
      connectNulls: true,
      showSymbol: false,
      z: 10,
      lineStyle: { width: 2, color: style.annotationColor, type: "solid" },
      emphasis: { disabled: true }
    });
    return;
  }
  // rectangle: markArea on an empty helper series
  const [bottomLeft, topRight] = annotation.dataPoints;
  seriesList.push({
    type: "line",
    xAxisIndex: 0,
    yAxisIndex: 0,
    data: [],
    markArea: {
      silent: true,
      itemStyle: {
        color: "rgba(41, 98, 255, 0.12)",
        borderColor: style.annotationColor,
        borderWidth: 2
      },
      data: [
        [
          { coord: [bottomLeft?.[0] ?? 0, bottomLeft?.[1] ?? 0] },
          { coord: [topRight?.[0] ?? 0, topRight?.[1] ?? 0] }
        ]
      ]
    }
  });
}

type Degradation = "none" | "downscale" | "jpeg_artifact";

async function degrade(
  png: Buffer,
  degradation: Degradation,
  anchors: ReadonlyArray<readonly TruthAnchor[]>
): Promise<RenderedSample> {
  if (degradation === "none") {
    return { png, anchors, width: BASE_WIDTH, height: BASE_HEIGHT };
  }
  const image = await loadImage(png);
  if (degradation === "downscale") {
    const width = Math.round(BASE_WIDTH * DOWNSCALE_FACTOR);
    const height = Math.round(BASE_HEIGHT * DOWNSCALE_FACTOR);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    return { png: await canvas.encode("png"), anchors, width, height };
  }
  const canvas = createCanvas(BASE_WIDTH, BASE_HEIGHT);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const jpeg = await canvas.encode("jpeg", JPEG_QUALITY);
  const jpegImage = await loadImage(jpeg);
  const finalCanvas = createCanvas(BASE_WIDTH, BASE_HEIGHT);
  const finalContext = finalCanvas.getContext("2d");
  finalContext.drawImage(jpegImage, 0, 0);
  return {
    png: await finalCanvas.encode("png"),
    anchors,
    width: BASE_WIDTH,
    height: BASE_HEIGHT
  };
}
