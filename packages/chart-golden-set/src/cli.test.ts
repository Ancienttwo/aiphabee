import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { EXIT_CODES, runCli } from "./cli";

/**
 * CLI contract tests: flag parsing, exit-code mapping, and the single-JSON-
 * document stdout shape. Uses a captured io sink instead of process stdout.
 */

interface CapturedRun {
  readonly exitCode: number;
  readonly document: Record<string, unknown>;
}

async function run(argv: readonly string[]): Promise<CapturedRun> {
  const lines: string[] = [];
  const exitCode = await runCli(argv, { log: (line) => lines.push(line) });
  expect(lines, "stdout must be exactly one JSON document").toHaveLength(1);
  return { exitCode, document: JSON.parse(lines[0] as string) as Record<string, unknown> };
}

const tempRoots: string[] = [];

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "cgs-cli-test-"));
  tempRoots.push(dir);
  return dir;
}

afterAll(async () => {
  await Promise.all(tempRoots.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("runCli configuration failures (exit 40)", () => {
  it("rejects unknown commands", async () => {
    const { exitCode, document } = await run(["frobnicate"]);
    expect(exitCode).toBe(EXIT_CODES.configurationFailure);
    expect(document.status).toBe("configuration_failure");
  });

  it("rejects unknown flags", async () => {
    const { exitCode } = await run(["generate", "--frobnicate", "1"]);
    expect(exitCode).toBe(EXIT_CODES.configurationFailure);
  });

  it("rejects non-integer and too-small counts", async () => {
    expect((await run(["generate", "--count", "abc"])).exitCode).toBe(
      EXIT_CODES.configurationFailure
    );
    expect((await run(["generate", "--count", "5"])).exitCode).toBe(
      EXIT_CODES.configurationFailure
    );
  });
});

describe("runCli generate + validate round trip", () => {
  it("generates a set, validates it, and detects tampering", async () => {
    const dir = await tempDir();
    const manifestPath = join(dir, "manifest.json");
    const imagesDir = join(dir, "images");

    const generated = await run([
      "generate",
      "--count",
      "20",
      "--out",
      imagesDir,
      "--manifest",
      manifestPath
    ]);
    expect(generated.exitCode).toBe(EXIT_CODES.completed);
    expect(generated.document.status).toBe("completed");
    expect(generated.document.sample_count).toBe(20);

    const validated = await run(["validate", "--manifest", manifestPath]);
    expect(validated.exitCode).toBe(EXIT_CODES.completed);
    expect(validated.document.image_hash_checked).toBe(true);

    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      samples: Array<{ truth: { symbol: string | null } }>;
      [key: string]: unknown;
    };
    const tampered = {
      ...manifest,
      samples: manifest.samples.map((sample, index) =>
        index === 0 ? { ...sample, truth: { ...sample.truth, symbol: null } } : sample
      )
    };
    await writeFile(manifestPath, JSON.stringify(tampered), "utf8");
    const rejected = await run(["validate", "--manifest", manifestPath, "--skip-image-hash"]);
    expect(rejected.exitCode).toBe(EXIT_CODES.invariantViolation);
    expect(rejected.document.status).toBe("invariant_violation");
  }, 60000);

  it("maps a missing manifest to storage failure (exit 50)", async () => {
    const dir = await tempDir();
    const { exitCode, document } = await run([
      "validate",
      "--manifest",
      join(dir, "does-not-exist.json")
    ]);
    expect(exitCode).toBe(EXIT_CODES.storageFailure);
    expect(document.status).toBe("storage_failure");
  });
});
