import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { stableStringifyPretty, type GoldenSetManifest } from "@aiphabee/chart-golden-set";
import { EXIT_CODES, runCli } from "./cli";
import { buildFixtureFromManifest } from "./fixture-builder";
import {
  CLEAR_DIMS,
  FULL_TRUTH,
  NEGATIVE_DIMS,
  NEGATIVE_TRUTH,
  makeFixture,
  makeManifest,
  makeSample,
  perfectParse
} from "./test-util";

const REAL_MANIFEST_PATH = resolve(
  __dirname,
  "../../..",
  "tests/golden/chart-parse/manifest.json"
);

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function captureIo() {
  const lines: string[] = [];
  return {
    io: { log: (line: string) => lines.push(line) },
    doc: () => JSON.parse(lines.join("\n")) as Record<string, never>
  };
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, stableStringifyPretty(value), "utf8");
}

const MANIFEST = makeManifest([
  makeSample("cgs-000", CLEAR_DIMS, FULL_TRUTH),
  makeSample("cgs-001", NEGATIVE_DIMS, NEGATIVE_TRUTH)
]);

const FIXTURE = makeFixture({
  "cgs-000": { raw: perfectParse(FULL_TRUTH), token_cost: 1500, latency_ms: 900 },
  "cgs-001": { raw: perfectParse(NEGATIVE_TRUTH), token_cost: 1400, latency_ms: 800 }
});

interface RunSetup {
  readonly manifestPath: string;
  readonly fixturePath: string;
  readonly outDir: string;
}

function setup(overrides: { fixture?: unknown; manifest?: unknown } = {}): RunSetup {
  const dir = tempDir("cpe-cli-");
  const manifestPath = join(dir, "manifest.json");
  const fixturePath = join(dir, "fixture.json");
  writeJson(manifestPath, overrides.manifest ?? MANIFEST);
  writeJson(fixturePath, overrides.fixture ?? FIXTURE);
  return { manifestPath, fixturePath, outDir: join(dir, "out") };
}

async function runEval(paths: RunSetup): Promise<Record<string, never>> {
  const { io, doc } = captureIo();
  const code = await runCli(
    [
      "run",
      "--manifest",
      paths.manifestPath,
      "--fixture",
      paths.fixturePath,
      "--out-dir",
      paths.outDir
    ],
    io
  );
  expect(code).toBe(EXIT_CODES.completed);
  return doc();
}

const ENV_KEYS = ["CHART_PARSE_EVAL_ENABLE_DB_WRITE", "CHART_PARSE_EVAL_DATABASE_URL"] as const;
const savedEnv = ENV_KEYS.map((key) => [key, process.env[key]] as const);

afterEach(() => {
  for (const [key, value] of savedEnv) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("runCli run", () => {
  it("emits a completed summary with the three metric keys and artifact hashes", async () => {
    const paths = setup();
    const doc = await runEval(paths);
    expect(doc).toMatchObject({ status: "completed", command: "run", persistence: "artifacts" });
    expect(Object.keys(doc["metrics"] as object).sort()).toEqual([
      "field_matrix",
      "null_negative",
      "schema_compliance"
    ]);
    const artifacts = doc["artifacts"] as { run_artifact_path: string; run_artifact_sha256: string };
    expect(artifacts.run_artifact_sha256).toMatch(/^[0-9a-f]{64}$/u);
    const artifact = JSON.parse(readFileSync(resolve(artifacts.run_artifact_path), "utf8")) as {
      run: { id: string };
      samples: Array<{ sample_id: string }>;
      observations: unknown[];
    };
    expect(artifact.run.id).toBe(doc["run_id"]);
    expect(artifact.samples.map((row) => row.sample_id)).toEqual(["cgs-000", "cgs-001"]);
  });

  it("is byte-deterministic across runs into different directories", async () => {
    const first = await runEval(setup());
    const second = await runEval(setup());
    const firstArtifacts = first["artifacts"] as { run_artifact_sha256: string };
    const secondArtifacts = second["artifacts"] as { run_artifact_sha256: string };
    expect(secondArtifacts.run_artifact_sha256).toBe(firstArtifacts.run_artifact_sha256);
    expect(second["run_id"]).toBe(first["run_id"]);
  });

  it("exits 40 when fixture schema/prompt versions drift from the live contract", async () => {
    const paths = setup({
      fixture: { ...FIXTURE, schema_version: "stale.v0" }
    });
    const { io, doc } = captureIo();
    const code = await runCli(
      ["run", "--manifest", paths.manifestPath, "--fixture", paths.fixturePath, "--out-dir", paths.outDir],
      io
    );
    expect(code).toBe(EXIT_CODES.configurationFailure);
    expect(doc()["status"]).toBe("configuration_failure");
  });

  it("exits 60 when fixture coverage does not match manifest sample ids", async () => {
    const paths = setup({
      fixture: makeFixture({
        "cgs-000": { raw: perfectParse(FULL_TRUTH) }
      })
    });
    const { io, doc } = captureIo();
    const code = await runCli(
      ["run", "--manifest", paths.manifestPath, "--fixture", paths.fixturePath, "--out-dir", paths.outDir],
      io
    );
    expect(code).toBe(EXIT_CODES.invariantViolation);
    expect(doc()["status"]).toBe("invariant_violation");
  });

  it("exits 40 when DB write is enabled without a connection string", async () => {
    process.env.CHART_PARSE_EVAL_ENABLE_DB_WRITE = "1";
    delete process.env.CHART_PARSE_EVAL_DATABASE_URL;
    delete process.env.DATABASE_URL;
    const paths = setup();
    const { io, doc } = captureIo();
    const code = await runCli(
      ["run", "--manifest", paths.manifestPath, "--fixture", paths.fixturePath, "--out-dir", paths.outDir],
      io
    );
    expect(code).toBe(EXIT_CODES.configurationFailure);
    expect(doc()["reason"]).toContain("CHART_PARSE_EVAL_DATABASE_URL");
  });

  it("exits 50 when the enabled database write fails to connect", async () => {
    process.env.CHART_PARSE_EVAL_ENABLE_DB_WRITE = "1";
    process.env.CHART_PARSE_EVAL_DATABASE_URL = "postgres://127.0.0.1:1/unreachable";
    const paths = setup();
    const { io, doc } = captureIo();
    const code = await runCli(
      ["run", "--manifest", paths.manifestPath, "--fixture", paths.fixturePath, "--out-dir", paths.outDir],
      io
    );
    expect(code).toBe(EXIT_CODES.storageFailure);
    expect(doc()["status"]).toBe("storage_failure");
  });

  it("replays the committed 100-sample manifest with a derived fixture", async () => {
    const manifest = JSON.parse(readFileSync(REAL_MANIFEST_PATH, "utf8")) as GoldenSetManifest;
    const paths = setup({ manifest, fixture: buildFixtureFromManifest(manifest) });
    const doc = await runEval(paths);
    const metrics = doc["metrics"] as {
      schema_compliance: { total: number; passed: number };
      null_negative: { total: number };
    };
    expect(metrics.schema_compliance.total).toBe(100);
    expect(metrics.schema_compliance.passed).toBeLessThan(100);
    expect(metrics.null_negative.total).toBeGreaterThan(0);
  });
});

describe("runCli calibrate", () => {
  async function runArtifactPath(): Promise<string> {
    const paths = setup();
    const doc = await runEval(paths);
    return (doc["artifacts"] as { run_artifact_path: string }).run_artifact_path;
  }

  it("emits insufficient without thresholds when the sample gate fails, exit 0", async () => {
    const artifact = await runArtifactPath();
    const { io, doc } = captureIo();
    const code = await runCli(
      ["calibrate", "--run-artifact", artifact, "--out-dir", tempDir("cpe-cal-"), "--min-samples", "101"],
      io
    );
    expect(code).toBe(EXIT_CODES.completed);
    const output = doc();
    expect(output["status"]).toBe("insufficient");
    expect(Object.keys(output)).not.toContain("thresholds");
    expect(Object.keys(output)).not.toContain("calibration");
  });

  it("emits a calibration run carrying the three versions and sample_count", async () => {
    const manifest = JSON.parse(readFileSync(REAL_MANIFEST_PATH, "utf8")) as GoldenSetManifest;
    const paths = setup({ manifest, fixture: buildFixtureFromManifest(manifest) });
    const runDoc = await runEval(paths);
    const artifact = (runDoc["artifacts"] as { run_artifact_path: string }).run_artifact_path;
    const { io, doc } = captureIo();
    const code = await runCli(
      [
        "calibrate",
        "--run-artifact",
        artifact,
        "--out-dir",
        tempDir("cpe-cal-"),
        "--min-samples",
        "20",
        "--min-tier-observations",
        "10"
      ],
      io
    );
    expect(code).toBe(EXIT_CODES.completed);
    const output = doc();
    expect(output["status"]).toBe("completed");
    const calibration = output["calibration"] as Record<string, unknown>;
    expect(calibration["schema_version"]).toBe(runDoc["schema_version"]);
    expect(calibration["prompt_version"]).toBe(runDoc["prompt_version"]);
    expect(calibration["model_version"]).toBe(runDoc["model_version"]);
    expect(typeof calibration["sample_count"]).toBe("number");
    expect(calibration["mapping_fn_version"]).toBe("isotonic-pav.v1");
  });

  it("exits 40 on an unknown flag or missing run artifact", async () => {
    const { io } = captureIo();
    expect(await runCli(["calibrate", "--nope"], io)).toBe(EXIT_CODES.configurationFailure);
    const missing = captureIo();
    expect(
      await runCli(
        ["calibrate", "--run-artifact", "/nonexistent/artifact.json"],
        missing.io
      )
    ).toBe(EXIT_CODES.storageFailure);
  });
});

describe("runCli dispatch", () => {
  it("exits 40 on unknown commands", async () => {
    const { io, doc } = captureIo();
    expect(await runCli(["nope"], io)).toBe(EXIT_CODES.configurationFailure);
    expect(doc()["status"]).toBe("configuration_failure");
  });
});
