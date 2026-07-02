import { describe, expect, it } from "vitest";
import { createInMemoryChartParseResultSink } from "./sink";
import { createParseChartImageTool, parseChartImageInputSchema } from "./tool";
import type { ParseChartImageOutcome } from "./types";
import {
  CLEAR_SAMPLE_IMAGE_REF,
  CLEAR_SAMPLE_RESULT,
  FETCHED_IMAGE,
  makeVisionModelMockFromTexts
} from "./test-util";

const makeToolHarness = () => {
  const sink = createInMemoryChartParseResultSink();
  const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
  const parseChartImage = createParseChartImageTool(
    {
      fetchImage: async () => FETCHED_IMAGE,
      generateId: () => "row-1",
      model,
      modelVersion: "google-ai-studio/gemini-2.5-flash",
      sink
    },
    { analysis_run_id: "run-1", tenant_id: "tenant-a" }
  );
  return { parseChartImage, sink };
};

describe("createParseChartImageTool", () => {
  it("accepts image_ref input and rejects empty or missing refs", () => {
    const { parseChartImage } = makeToolHarness();
    expect(parseChartImage.inputSchema).toBe(parseChartImageInputSchema);
    const schema = parseChartImageInputSchema;
    expect(schema.safeParse({ image_ref: CLEAR_SAMPLE_IMAGE_REF }).success).toBe(true);
    expect(schema.safeParse({ image_ref: "" }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("executes the parse bound to the run context and returns a pixel-free outcome", async () => {
    const { parseChartImage, sink } = makeToolHarness();

    const outcome = (await parseChartImage.execute!(
      { image_ref: CLEAR_SAMPLE_IMAGE_REF },
      { context: undefined as never, messages: [], toolCallId: "call-1" }
    )) as ParseChartImageOutcome;

    expect(outcome.status).toBe("ready");
    expect(outcome.result).toEqual(CLEAR_SAMPLE_RESULT);
    expect(sink.rows).toHaveLength(1);
    expect(sink.rows[0].tenant_id).toBe("tenant-a");
    expect(sink.rows[0].analysis_run_id).toBe("run-1");

    const binaryValues = Object.values(outcome).filter(
      (value) => value instanceof Uint8Array || value instanceof ArrayBuffer
    );
    expect(binaryValues).toHaveLength(0);
  });
});
