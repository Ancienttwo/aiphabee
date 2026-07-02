/**
 * Public library surface for @aiphabee/chart-golden-set.
 *
 * Module 3 (eval runner) consumes manifest types, invariant checks, and the
 * spec builders from here; the CLI is a thin shell over runCli.
 */

export { EXIT_CODES, runCli } from "./cli";
export { ema, macd, rsi, sma } from "./indicators";
export { LOCALE_TEXT, collectChineseCharacters, type ChartLanguage } from "./locale-text";
export {
  GENERATOR_VERSION,
  RENDER_ENGINE,
  SET_VERSION,
  buildManifest,
  buildTruth,
  collectInvariantViolations,
  isRegressionSample,
  sha256Hex,
  stableStringify,
  stableStringifyPretty,
  truthAsChartParseResult,
  type GoldenSample,
  type GoldenSetManifest,
  type SampleTruth,
  type TruthAnchor,
  type TruthDrawnLine,
  type TruthIndicator
} from "./manifest";
export { createPrng, deriveSeed, nextGaussian, pickOne, shuffle, type Prng } from "./prng";
export { fontFilePaths, renderSample, type RenderedSample } from "./render";
export {
  INJECTABLE_PATTERNS,
  generateSeries,
  type InjectablePattern,
  type OhlcvBar,
  type SeriesSpec,
  type SyntheticSeries
} from "./synthetic-ohlcv";
export {
  DEFAULT_SAMPLE_COUNT,
  DEFAULT_SEED,
  VARIANT_DIMENSIONS,
  buildSampleSpecs,
  type IndicatorSpec,
  type SampleSpec,
  type VariantDimensionKey,
  type VariantDims
} from "./variant-matrix";
