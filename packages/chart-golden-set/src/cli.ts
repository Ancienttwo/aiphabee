import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import {
  buildManifest,
  buildTruth,
  collectInvariantViolations,
  sha256Hex,
  stableStringifyPretty,
  type GoldenSample,
  type GoldenSetManifest
} from "./manifest";
import { renderSample } from "./render";
import { generateSeries } from "./synthetic-ohlcv";
import { DEFAULT_SAMPLE_COUNT, DEFAULT_SEED, buildSampleSpecs } from "./variant-matrix";

/**
 * CLI core. Governance semantics mirror packages/data-ingest: subcommand
 * dispatch, a single JSON document on stdout, and the shared exit-code table.
 * `runCli` returns the exit code instead of exiting so tests can call it.
 */

export const EXIT_CODES = {
  completed: 0,
  configurationFailure: 40,
  storageFailure: 50,
  invariantViolation: 60
} as const;

const DEFAULT_MANIFEST_PATH = "tests/golden/chart-parse/manifest.json";
const DEFAULT_IMAGE_DIR = "runtime/chart-golden-set";

interface CliIo {
  readonly log: (line: string) => void;
}

export async function runCli(argv: readonly string[], io: CliIo = console): Promise<number> {
  const [command, ...rest] = argv;
  if (command === "generate") {
    return generate(rest, io);
  }
  if (command === "validate") {
    return validate(rest, io);
  }
  return emit(
    io,
    {
      status: "configuration_failure",
      reason: `unknown command: ${command ?? "(none)"}; expected generate|validate`
    },
    EXIT_CODES.configurationFailure
  );
}

function emit(io: CliIo, payload: Record<string, unknown>, exitCode: number): number {
  io.log(JSON.stringify(payload, null, 2));
  return exitCode;
}

interface ParsedFlags {
  readonly values: Readonly<Record<string, string>>;
  readonly booleans: ReadonlySet<string>;
}

function parseFlags(
  args: readonly string[],
  valueFlags: readonly string[],
  booleanFlags: readonly string[]
): ParsedFlags | string {
  const values: Record<string, string> = {};
  const booleans = new Set<string>();
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] as string;
    if (booleanFlags.includes(arg)) {
      booleans.add(arg);
      continue;
    }
    if (valueFlags.includes(arg)) {
      const value = args[i + 1];
      if (value === undefined || value.startsWith("--")) {
        return `flag ${arg} requires a value`;
      }
      values[arg] = value;
      i += 1;
      continue;
    }
    return `unknown flag: ${arg}`;
  }
  return { values, booleans };
}

function parsePositiveInt(raw: string | undefined, fallback: number, label: string): number | string {
  if (raw === undefined) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    return `${label} must be a positive integer, got ${raw}`;
  }
  return value;
}

async function generate(args: readonly string[], io: CliIo): Promise<number> {
  const parsed = parseFlags(args, ["--seed", "--count", "--out", "--manifest"], []);
  if (typeof parsed === "string") {
    return emit(io, { status: "configuration_failure", reason: parsed }, EXIT_CODES.configurationFailure);
  }
  const seed = parsePositiveInt(parsed.values["--seed"], DEFAULT_SEED, "--seed");
  const count = parsePositiveInt(parsed.values["--count"], DEFAULT_SAMPLE_COUNT, "--count");
  if (typeof seed === "string") {
    return emit(io, { status: "configuration_failure", reason: seed }, EXIT_CODES.configurationFailure);
  }
  if (typeof count === "string") {
    return emit(io, { status: "configuration_failure", reason: count }, EXIT_CODES.configurationFailure);
  }
  if (count < 20) {
    return emit(
      io,
      {
        status: "configuration_failure",
        reason: `--count must be >= 20 to cover the variant matrix, got ${count}`
      },
      EXIT_CODES.configurationFailure
    );
  }
  const repoRoot = process.cwd();
  const imageDir = resolve(repoRoot, parsed.values["--out"] ?? DEFAULT_IMAGE_DIR);
  const manifestPath = resolve(repoRoot, parsed.values["--manifest"] ?? DEFAULT_MANIFEST_PATH);

  try {
    await mkdir(imageDir, { recursive: true });
    await mkdir(dirname(manifestPath), { recursive: true });
    const specs = buildSampleSpecs(seed, count);
    const samples: GoldenSample[] = [];
    for (const spec of specs) {
      const series = generateSeries({
        seed: spec.seed,
        barCount: spec.barCount,
        timeframe: spec.timeframe,
        endTime: spec.endTime,
        basePrice: spec.basePrice,
        pattern: spec.pattern
      });
      const rendered = await renderSample(spec, series);
      const imageFile = join(imageDir, `${spec.id}.png`);
      await writeFile(imageFile, rendered.png);
      samples.push({
        id: spec.id,
        image_path: toPosixPath(relative(repoRoot, imageFile)),
        image_sha256: sha256Hex(rendered.png),
        variant_dims: spec.dims,
        truth: buildTruth(spec, rendered.anchors)
      });
    }
    const manifest = buildManifest({ seed, samples });
    const violations = collectInvariantViolations(manifest);
    if (violations.length > 0) {
      return emit(
        io,
        { status: "invariant_violation", command: "generate", violations },
        EXIT_CODES.invariantViolation
      );
    }
    const manifestBytes = stableStringifyPretty(manifest);
    await writeFile(manifestPath, manifestBytes, "utf8");
    return emit(
      io,
      {
        status: "completed",
        command: "generate",
        seed,
        sample_count: samples.length,
        image_dir: toPosixPath(relative(repoRoot, imageDir)),
        manifest_path: toPosixPath(relative(repoRoot, manifestPath)),
        manifest_sha256: sha256Hex(manifestBytes)
      },
      EXIT_CODES.completed
    );
  } catch (error) {
    return emitError(io, "generate", error);
  }
}

async function validate(args: readonly string[], io: CliIo): Promise<number> {
  const parsed = parseFlags(args, ["--manifest"], ["--skip-image-hash"]);
  if (typeof parsed === "string") {
    return emit(io, { status: "configuration_failure", reason: parsed }, EXIT_CODES.configurationFailure);
  }
  const repoRoot = process.cwd();
  const manifestPath = resolve(repoRoot, parsed.values["--manifest"] ?? DEFAULT_MANIFEST_PATH);
  const skipImageHash = parsed.booleans.has("--skip-image-hash");

  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath, "utf8");
  } catch (error) {
    return emitError(io, "validate", error);
  }
  let manifest: GoldenSetManifest;
  try {
    manifest = JSON.parse(manifestRaw) as GoldenSetManifest;
  } catch {
    return emit(
      io,
      {
        status: "invariant_violation",
        command: "validate",
        violations: [`manifest is not valid JSON: ${manifestPath}`]
      },
      EXIT_CODES.invariantViolation
    );
  }

  const violations = [...collectInvariantViolations(manifest)];
  if (!skipImageHash) {
    for (const sample of manifest.samples) {
      const imagePath = resolve(repoRoot, sample.image_path);
      try {
        const bytes = await readFile(imagePath);
        const digest = sha256Hex(bytes);
        if (digest !== sample.image_sha256) {
          violations.push(
            `${sample.id}: image sha256 mismatch (manifest ${sample.image_sha256}, disk ${digest})`
          );
        }
      } catch {
        violations.push(`${sample.id}: image missing on disk: ${sample.image_path}`);
      }
    }
  }
  if (violations.length > 0) {
    return emit(
      io,
      { status: "invariant_violation", command: "validate", violations },
      EXIT_CODES.invariantViolation
    );
  }
  return emit(
    io,
    {
      status: "completed",
      command: "validate",
      sample_count: manifest.samples.length,
      image_hash_checked: !skipImageHash,
      manifest_sha256: sha256Hex(manifestRaw)
    },
    EXIT_CODES.completed
  );
}

function emitError(io: CliIo, command: string, error: unknown): number {
  const code = (error as NodeJS.ErrnoException)?.code;
  const message = error instanceof Error ? error.message : String(error);
  if (code === "ENOENT" || code === "EACCES" || code === "EPERM" || code === "ENOSPC") {
    return emit(
      io,
      { status: "storage_failure", command, reason: message },
      EXIT_CODES.storageFailure
    );
  }
  return emit(
    io,
    { status: "invariant_violation", command, violations: [message] },
    EXIT_CODES.invariantViolation
  );
}

function toPosixPath(value: string): string {
  return value.split("\\").join("/");
}
