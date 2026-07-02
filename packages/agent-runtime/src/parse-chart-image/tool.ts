import { tool } from "ai";
import { z } from "zod";
import { createParseChartImageExecutor } from "./executor";
import type { ParseChartImageDeps } from "./types";

/**
 * Server-side run context. tenant_id and analysis_run_id come from the
 * authenticated run, never from model-controlled tool input, so a prompt
 * injection cannot redirect the parse to another tenant's image space.
 */
export interface ParseChartImageToolContext {
  analysis_run_id?: string | null;
  tenant_id: string;
}

export const parseChartImageInputSchema = z.object({
  image_ref: z
    .string()
    .min(1)
    .describe(
      "Opaque reference to an uploaded chart screenshot; never raw image bytes."
    )
});

export const createParseChartImageTool = (
  deps: ParseChartImageDeps,
  context: ParseChartImageToolContext
) => {
  const execute = createParseChartImageExecutor(deps);

  return tool({
    description:
      "Parse an uploaded chart screenshot referenced by image_ref into a structured ChartParseResult with per-field confidence. Returns null fields instead of guesses and never exposes raw pixels.",
    execute: async ({ image_ref }) =>
      execute({
        analysis_run_id: context.analysis_run_id ?? null,
        image_ref,
        tenant_id: context.tenant_id
      }),
    inputSchema: parseChartImageInputSchema
  });
};
