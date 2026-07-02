import { buildChartParsePrompt } from "./prompt";
import { chartParseResultSchema } from "./schema";
import { CHART_PARSE_PROMPT_VERSION, CHART_PARSE_SCHEMA_VERSION } from "./versions";

export { CHART_PARSE_PROMPT_VERSION, CHART_PARSE_SCHEMA_VERSION } from "./versions";
export {
  CHART_PATTERN_DESCRIPTIONS,
  CHART_PATTERN_VALUES,
  type ChartPatternName
} from "./patterns";
export {
  CHART_TYPE_VALUES,
  DRAWN_LINE_KIND_VALUES,
  EXCHANGE_VALUES,
  INDICATOR_NAME_VALUES,
  TIMEFRAME_VALUES,
  chartParseResultSchema,
  safeParseChartParseResult,
  type ChartParseResult
} from "./schema";
export { buildChartParsePrompt } from "./prompt";

/**
 * Single consumable contract for Module 3 (eval runner) and Module 4 (tool):
 * schema, prompt builder, and both frozen versions travel together so that
 * production parses and eval runs can never drift apart silently.
 */
export const CHART_PARSE_CONTRACT = Object.freeze({
  schemaVersion: CHART_PARSE_SCHEMA_VERSION,
  promptVersion: CHART_PARSE_PROMPT_VERSION,
  schema: chartParseResultSchema,
  buildPrompt: buildChartParsePrompt
});
