import { jsonrepair } from "jsonrepair";
import { safeParseChartParseResult } from "../chart-parse";
import type { ChartParseResult } from "../chart-parse";

/**
 * Cheap local recovery for malformed vision output: repair the JSON text,
 * then re-validate against the frozen contract. Never yields a partial
 * result; anything that fails the contract collapses to null so the caller
 * can decide whether to spend its single model retry.
 */
export const repairAndValidate = (rawText: string | undefined): ChartParseResult | null => {
  if (!rawText) {
    return null;
  }

  try {
    const repaired = jsonrepair(rawText);
    const candidate: unknown = JSON.parse(repaired);
    const checked = safeParseChartParseResult(candidate);
    return checked.success ? checked.data : null;
  } catch {
    return null;
  }
};
