import { generateObject, NoObjectGeneratedError } from "ai";
import type { LanguageModelUsage } from "ai";
import { CHART_PARSE_CONTRACT, safeParseChartParseResult } from "../chart-parse";
import type { ChartParseResult } from "../chart-parse";
import { repairAndValidate } from "./repair";
import { routeChartParseResult } from "./routing";
import type {
  ChartParseResultRecord,
  ChartParseStatus,
  ChartParseUsageTotals,
  FetchedChartImage,
  ParseChartImageDeps,
  ParseChartImageExecutor,
  ParseChartImageRequest
} from "./types";

/** Initial vision call plus at most one retry (PRD Module 4 hard constraint). */
export const PARSE_CHART_IMAGE_MAX_MODEL_CALLS = 2;

export const PARSE_CHART_IMAGE_MAX_OUTPUT_TOKENS = 4096;

const EMPTY_USAGE: ChartParseUsageTotals = {
  input_tokens: 0,
  output_tokens: 0,
  total_tokens: 0
};

const addUsage = (
  totals: ChartParseUsageTotals,
  usage: LanguageModelUsage | undefined
): ChartParseUsageTotals => {
  if (!usage) {
    return totals;
  }

  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;

  return {
    input_tokens: totals.input_tokens + input,
    output_tokens: totals.output_tokens + output,
    total_tokens: totals.total_tokens + (usage.totalTokens ?? input + output)
  };
};

interface VisionAttemptsResult {
  errorCode: string | null;
  modelCallCount: number;
  repairApplied: boolean;
  result: ChartParseResult | null;
  usage: ChartParseUsageTotals;
}

const runVisionAttempts = async (
  deps: ParseChartImageDeps,
  image: FetchedChartImage
): Promise<VisionAttemptsResult> => {
  const promptText = CHART_PARSE_CONTRACT.buildPrompt();
  let usage = EMPTY_USAGE;
  let modelCallCount = 0;
  let errorCode: string | null = null;

  while (modelCallCount < PARSE_CHART_IMAGE_MAX_MODEL_CALLS) {
    modelCallCount += 1;

    try {
      const generated = await generateObject({
        // This loop owns the retry budget; provider-level retries would
        // multiply real vision calls beyond the PRD limit.
        maxRetries: 0,
        maxOutputTokens: PARSE_CHART_IMAGE_MAX_OUTPUT_TOKENS,
        messages: [
          {
            content: [
              { data: image.bytes, mediaType: image.mediaType, type: "file" },
              { text: promptText, type: "text" }
            ],
            role: "user"
          }
        ],
        model: deps.model,
        schema: CHART_PARSE_CONTRACT.schema,
        temperature: 0
      });
      usage = addUsage(usage, generated.usage);

      const checked = safeParseChartParseResult(generated.object);
      if (checked.success) {
        return {
          errorCode: null,
          modelCallCount,
          repairApplied: false,
          result: checked.data,
          usage
        };
      }
      errorCode = "schema_validation_failed";
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        usage = addUsage(usage, error.usage);
        errorCode = "invalid_json_output";

        const repaired = repairAndValidate(error.text);
        if (repaired !== null) {
          return {
            errorCode: null,
            modelCallCount,
            repairApplied: true,
            result: repaired,
            usage
          };
        }
      } else {
        errorCode = "vision_call_failed";
      }
    }
  }

  return {
    errorCode: errorCode ?? "parse_failed",
    modelCallCount,
    repairApplied: false,
    result: null,
    usage
  };
};

/**
 * Real execution path for the parse_chart_image tool: fetch bytes by
 * imageRef, run the vision model against the frozen chart-parse contract,
 * repair locally before spending the single retry, and never return a
 * partial structure. Every invocation records exactly one
 * chart_parse_results row through the injected sink.
 */
export const createParseChartImageExecutor = (
  deps: ParseChartImageDeps
): ParseChartImageExecutor => {
  return async (request: ParseChartImageRequest) => {
    const now = deps.now ?? Date.now;
    const startedAt = now();

    let image: FetchedChartImage | null = null;
    let fetchErrorCode: string | null = null;
    try {
      image = await deps.fetchImage(request.image_ref, { tenant_id: request.tenant_id });
    } catch {
      fetchErrorCode = "image_fetch_failed";
    }

    const attempts =
      image === null
        ? {
            errorCode: fetchErrorCode ?? "image_not_found",
            modelCallCount: 0,
            repairApplied: false,
            result: null,
            usage: EMPTY_USAGE
          }
        : await runVisionAttempts(deps, image);

    const status: ChartParseStatus = attempts.result === null ? "parse_failed" : "ready";
    const errorCode = status === "ready" ? null : attempts.errorCode;
    const latencyMs = Math.max(0, now() - startedAt);
    const routeDecision =
      attempts.result === null
        ? null
        : await routeChartParseResult({
            calibrationLookup: deps.calibrationLookup,
            minCalibrationSamples: deps.minCalibrationSamples,
            modelVersion: deps.modelVersion,
            result: attempts.result
          });

    const record: ChartParseResultRecord = {
      analysis_run_id: request.analysis_run_id ?? null,
      calibration_run_id: routeDecision?.calibration_run_id ?? null,
      error_code: errorCode,
      id: deps.generateId(),
      image_ref: request.image_ref,
      latency_ms: latencyMs,
      model_version: deps.modelVersion,
      prompt_version: CHART_PARSE_CONTRACT.promptVersion,
      result_json: attempts.result,
      schema_version: CHART_PARSE_CONTRACT.schemaVersion,
      status,
      tenant_id: request.tenant_id,
      token_cost: attempts.usage.total_tokens
    };
    await deps.sink.record(record);

    return {
      calibration_run_id: record.calibration_run_id,
      error_code: errorCode,
      latency_ms: latencyMs,
      model_call_count: attempts.modelCallCount,
      record_id: record.id,
      repair_applied: attempts.repairApplied,
      result: attempts.result,
      route_decision: routeDecision?.decision ?? null,
      status,
      usage: attempts.usage
    };
  };
};
