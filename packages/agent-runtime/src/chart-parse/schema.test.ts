import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CHART_PATTERN_VALUES } from "./patterns";
import { CHART_PARSE_CONTRACT } from "./index";
import { buildChartParsePrompt } from "./prompt";
import {
  chartParseResultSchema,
  safeParseChartParseResult,
  type ChartParseResult
} from "./schema";
import { CHART_PARSE_PROMPT_VERSION, CHART_PARSE_SCHEMA_VERSION } from "./versions";

const CHART_PARSE_DIR = dirname(fileURLToPath(import.meta.url));

type ZodInternalDef = {
  type: string;
  shape?: Record<string, unknown>;
  element?: unknown;
  innerType?: unknown;
  options?: unknown[];
  entries?: Record<string, string>;
  catchall?: unknown;
};

type SchemaNode = {
  path: string;
  type: string;
};

const internalDefOf = (schema: unknown): ZodInternalDef =>
  (schema as { _zod: { def: ZodInternalDef } })._zod.def;

const KNOWN_NODE_TYPES = new Set([
  "array",
  "boolean",
  "enum",
  "literal",
  "nullable",
  "number",
  "object",
  "optional",
  "string",
  "union"
]);

const collectSchemaNodes = (schema: unknown, path: string): SchemaNode[] => {
  const def = internalDefOf(schema);
  if (!KNOWN_NODE_TYPES.has(def.type)) {
    throw new Error(
      `Unknown zod node type "${def.type}" at ${path}; extend the discipline walker before using it.`
    );
  }

  const node: SchemaNode = { path, type: def.type };
  if (def.type === "object") {
    // z.object and z.strictObject both report type "object"; only a
    // catchall of type "never" proves unknown keys are rejected.
    const catchallType = def.catchall ? internalDefOf(def.catchall).type : "(open)";
    const objectNode: SchemaNode = {
      path,
      type: catchallType === "never" ? "object" : "object_open"
    };
    const shape = def.shape ?? {};
    return [
      objectNode,
      ...Object.entries(shape).flatMap(([key, child]) =>
        collectSchemaNodes(child, `${path}.${key}`)
      )
    ];
  }
  if (def.type === "array") {
    return [node, ...collectSchemaNodes(def.element, `${path}[]`)];
  }
  if (def.type === "nullable" || def.type === "optional") {
    return [node, ...collectSchemaNodes(def.innerType, `${path}<${def.type}>`)];
  }
  if (def.type === "union") {
    const options = def.options ?? [];
    return [
      node,
      ...options.flatMap((option, index) => collectSchemaNodes(option, `${path}|${index}`))
    ];
  }
  return [node];
};

const schemaNodes = collectSchemaNodes(chartParseResultSchema, "$");

const clearChartSample: ChartParseResult = {
  chart_type: { value: "candlestick", confidence: 0.98 },
  symbol: { value: "0700.HK", confidence: 0.97 },
  exchange: { value: "HKEX", confidence: 0.96 },
  timeframe: { value: "1d", confidence: 0.95 },
  end_time: { value: "2026-06-30 16:00", confidence: 0.9 },
  indicators: [
    { name: "RSI", params: [14], confidence: 0.92 },
    { name: "MACD", params: [12, 26, 9], confidence: 0.91 },
    { name: "VOL", params: [], confidence: 0.9 }
  ],
  drawn_lines: [
    {
      kind: "trendline",
      anchors: [
        { x: 0.12, y: 0.8 },
        { x: 0.88, y: 0.35 }
      ],
      confidence: 0.85
    }
  ],
  patterns: [{ pattern: "ascending_triangle", confidence: 0.6 }]
};

const unlabeledChartSample: ChartParseResult = {
  chart_type: { value: null, confidence: 0.2 },
  symbol: { value: null, confidence: 0.1 },
  exchange: { value: null, confidence: 0.1 },
  timeframe: { value: null, confidence: 0.15 },
  end_time: { value: null, confidence: 0.1 },
  indicators: [],
  drawn_lines: [],
  patterns: []
};

describe("chartParseResultSchema zod discipline", () => {
  it("contains no optional or nullish nodes anywhere in the schema tree", () => {
    expect(schemaNodes.filter((node) => node.type === "optional")).toEqual([]);
  });

  it("contains no union nodes anywhere in the schema tree", () => {
    expect(schemaNodes.filter((node) => node.type === "union")).toEqual([]);
  });

  it("keeps every object node strict so unknown keys are rejected", () => {
    expect(schemaNodes.filter((node) => node.type === "object_open")).toEqual([]);
    expect(schemaNodes.filter((node) => node.type === "object").length).toBeGreaterThanOrEqual(
      6
    );
  });

  it("keeps every maybe-missing field nullable", () => {
    const nullablePaths = schemaNodes
      .filter((node) => node.type === "nullable")
      .map((node) => node.path);

    expect(nullablePaths).toEqual(
      expect.arrayContaining([
        "$.chart_type.value",
        "$.symbol.value",
        "$.exchange.value",
        "$.timeframe.value",
        "$.end_time.value",
        "$.indicators[].params"
      ])
    );
  });

  it("never uses optional/nullish/union in chart-parse source files", () => {
    const sourceFiles = readdirSync(CHART_PARSE_DIR).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts")
    );

    expect(sourceFiles.length).toBeGreaterThanOrEqual(5);
    for (const file of sourceFiles) {
      const source = readFileSync(join(CHART_PARSE_DIR, file), "utf8");
      expect(source, `${file} must not use .optional(`).not.toMatch(/\.optional\(/u);
      expect(source, `${file} must not use .nullish(`).not.toMatch(/\.nullish\(/u);
      expect(source, `${file} must not use union(`).not.toMatch(/\bunion\(/u);
      expect(source, `${file} must use z.strictObject, never z.object(`).not.toMatch(
        /z\.object\(/u
      );
    }
  });

  it("keeps production source files free of node-only APIs (Workers runtime)", () => {
    // The package tsconfig carries "node" types for these tests, so nothing
    // stops a node import from type-checking; scan the whole package source
    // to keep the Workers runtime boundary honest.
    const packageSrcDir = join(CHART_PARSE_DIR, "..");
    const sourceFiles = readdirSync(packageSrcDir, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"));

    expect(sourceFiles.length).toBeGreaterThanOrEqual(6);
    for (const file of sourceFiles) {
      const source = readFileSync(join(packageSrcDir, file), "utf8");
      expect(source, `${file} must not import node builtins`).not.toMatch(/from "node:/u);
      expect(source, `${file} must not touch process`).not.toMatch(/\bprocess\./u);
      expect(source, `${file} must not touch Buffer`).not.toMatch(/\bBuffer\./u);
    }
  });
});

describe("chart pattern vocabulary", () => {
  it("keeps at least 16 classic pattern entries", () => {
    expect(CHART_PATTERN_VALUES.length).toBeGreaterThanOrEqual(16);
    expect(new Set(CHART_PATTERN_VALUES).size).toBe(CHART_PATTERN_VALUES.length);
  });

  it("keeps the schema pattern enum in sync with the exported vocabulary", () => {
    const patternsArrayDef = internalDefOf(internalDefOf(chartParseResultSchema).shape?.patterns);
    const patternEnumDef = internalDefOf(
      internalDefOf(patternsArrayDef.element).shape?.pattern
    );

    expect(Object.keys(patternEnumDef.entries ?? {})).toEqual([...CHART_PATTERN_VALUES]);
  });
});

describe("normalized coordinate contract", () => {
  const anchorSchemaOf = () => {
    const drawnLinesDef = internalDefOf(internalDefOf(chartParseResultSchema).shape?.drawn_lines);
    const anchorsDef = internalDefOf(internalDefOf(drawnLinesDef.element).shape?.anchors);
    return anchorsDef.element as {
      shape: {
        x: { description?: string };
        y: { description?: string };
      };
    };
  };

  it("declares 0-1 normalization and the origin on both coordinate axes", () => {
    const anchorSchema = anchorSchemaOf();

    for (const axis of ["x", "y"] as const) {
      const description = anchorSchema.shape[axis].description ?? "";
      expect(description).toMatch(/normalized to \[0, 1\]/iu);
      expect(description).toMatch(/top-left/iu);
    }
  });

  it("rejects coordinates outside the [0, 1] range at the code layer", () => {
    const outOfRange = {
      ...clearChartSample,
      drawn_lines: [
        {
          kind: "trendline" as const,
          anchors: [{ x: 1.01, y: 0.5 }],
          confidence: 0.8
        }
      ]
    };
    const negative = {
      ...clearChartSample,
      drawn_lines: [
        {
          kind: "trendline" as const,
          anchors: [{ x: 0.4, y: -0.01 }],
          confidence: 0.8
        }
      ]
    };

    expect(safeParseChartParseResult(outOfRange).success).toBe(false);
    expect(safeParseChartParseResult(negative).success).toBe(false);
  });

  it("accepts the inclusive [0, 1] boundary coordinates", () => {
    const boundary = {
      ...clearChartSample,
      drawn_lines: [
        {
          kind: "horizontal_line" as const,
          anchors: [
            { x: 0, y: 1 },
            { x: 1, y: 0 }
          ],
          confidence: 0.8
        }
      ]
    };

    expect(safeParseChartParseResult(boundary).success).toBe(true);
  });
});

describe("provider JSON schema boundary", () => {
  const providerJsonSchema = z.toJSONSchema(chartParseResultSchema);

  const collectObjects = (node: unknown): Record<string, unknown>[] => {
    if (Array.isArray(node)) {
      return node.flatMap(collectObjects);
    }
    if (node && typeof node === "object") {
      const record = node as Record<string, unknown>;
      return [record, ...Object.values(record).flatMap(collectObjects)];
    }
    return [];
  };

  const jsonSchemaNodes = collectObjects(providerJsonSchema);

  it("emits anyOf only as the two-armed nullable form, never a polymorphic union", () => {
    const anyOfNodes = jsonSchemaNodes.filter((node) => Array.isArray(node.anyOf));

    expect(anyOfNodes.length).toBeGreaterThanOrEqual(6);
    for (const node of anyOfNodes) {
      const options = node.anyOf as Record<string, unknown>[];
      expect(options).toHaveLength(2);
      expect(options.filter((option) => option.type === "null")).toHaveLength(1);
    }
    expect(jsonSchemaNodes.filter((node) => Array.isArray(node.oneOf))).toEqual([]);
    expect(jsonSchemaNodes.filter((node) => Array.isArray(node.allOf))).toEqual([]);
  });

  it("closes every object with additionalProperties false and requires all keys", () => {
    const objectNodes = jsonSchemaNodes.filter((node) => node.type === "object");

    expect(objectNodes.length).toBeGreaterThanOrEqual(6);
    for (const node of objectNodes) {
      expect(node.additionalProperties).toBe(false);
      expect(Object.keys(node.properties as Record<string, unknown>).sort()).toEqual(
        [...(node.required as string[])].sort()
      );
    }
  });
});

describe("contract versioning", () => {
  it("freezes date-versioned schema and prompt identifiers", () => {
    expect(CHART_PARSE_SCHEMA_VERSION).toMatch(
      /^\d{4}-\d{2}-\d{2}\.chart-parse-schema\.v\d+$/u
    );
    expect(CHART_PARSE_PROMPT_VERSION).toMatch(
      /^\d{4}-\d{2}-\d{2}\.chart-parse-prompt\.v\d+$/u
    );
  });

  it("binds schema, prompt, and both versions into one contract object", () => {
    expect(CHART_PARSE_CONTRACT).toMatchObject({
      promptVersion: CHART_PARSE_PROMPT_VERSION,
      schemaVersion: CHART_PARSE_SCHEMA_VERSION
    });
    expect(CHART_PARSE_CONTRACT.schema).toBe(chartParseResultSchema);
    expect(CHART_PARSE_CONTRACT.buildPrompt).toBe(buildChartParsePrompt);
    expect(Object.isFrozen(CHART_PARSE_CONTRACT)).toBe(true);
  });
});

describe("chartParseResultSchema behavior", () => {
  it("accepts a fully-populated clear-chart sample", () => {
    const parsed = safeParseChartParseResult(clearChartSample);

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual(clearChartSample);
  });

  it("accepts an all-null unlabeled sample (null-over-guess baseline)", () => {
    const parsed = safeParseChartParseResult(unlabeledChartSample);

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual(unlabeledChartSample);
  });

  it("rejects confidence values outside [0, 1]", () => {
    const tooHigh = {
      ...unlabeledChartSample,
      symbol: { value: null, confidence: 1.2 }
    };
    const negative = {
      ...unlabeledChartSample,
      symbol: { value: null, confidence: -0.1 }
    };

    expect(safeParseChartParseResult(tooHigh).success).toBe(false);
    expect(safeParseChartParseResult(negative).success).toBe(false);
  });

  it("rejects free-text symbols that escape the closed format", () => {
    const withWhitespace = {
      ...clearChartSample,
      symbol: { value: "0700 HK", confidence: 0.9 }
    };
    const tooLong = {
      ...clearChartSample,
      symbol: { value: "A".repeat(17), confidence: 0.9 }
    };
    const lowercaseInjection = {
      ...clearChartSample,
      symbol: { value: "ignore previous", confidence: 0.9 }
    };

    expect(safeParseChartParseResult(withWhitespace).success).toBe(false);
    expect(safeParseChartParseResult(tooLong).success).toBe(false);
    expect(safeParseChartParseResult(lowercaseInjection).success).toBe(false);
  });

  it("rejects values outside the closed enums", () => {
    const unknownTimeframe = {
      ...clearChartSample,
      timeframe: { value: "3h", confidence: 0.9 }
    };
    const unknownPattern = {
      ...clearChartSample,
      patterns: [{ pattern: "mystery_pattern", confidence: 0.5 }]
    };

    expect(safeParseChartParseResult(unknownTimeframe).success).toBe(false);
    expect(safeParseChartParseResult(unknownPattern).success).toBe(false);
  });

  it("rejects non-timestamp end_time strings", () => {
    const vague = {
      ...clearChartSample,
      end_time: { value: "yesterday", confidence: 0.9 }
    };

    expect(safeParseChartParseResult(vague).success).toBe(false);
  });

  it("rejects payloads with missing fields or unknown keys (closed schema)", () => {
    const { patterns: _patterns, ...missingPatterns } = clearChartSample;
    const extraKey = { ...clearChartSample, free_form_notes: "injected" };
    const extraNestedKey = {
      ...clearChartSample,
      symbol: { value: "0700.HK", confidence: 0.9, note: "injected" }
    };

    expect(safeParseChartParseResult(missingPatterns).success).toBe(false);
    expect(safeParseChartParseResult(extraKey).success).toBe(false);
    expect(safeParseChartParseResult(extraNestedKey).success).toBe(false);
  });
});
