import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sha256Hex } from "@aiphabee/chart-golden-set";
import type { GoldenSetManifest } from "@aiphabee/chart-golden-set";
import {
  DEFAULT_TARGETS,
  calibrate,
  type CalibrationThresholdTargets
} from "./calibrate";
import {
  checkFixtureContract,
  checkFixtureCoverage,
  validateFixture,
  type EvalFixture
} from "./fixture";
import { executeEvalRun, type EvalRunResult } from "./run";
import { JsonArtifactSink } from "./sink";
import type { EvalSink } from "./sink";
import type { ConfidenceObservation } from "./metrics";

/**
 * CLI core. Governance semantics mirror packages/chart-golden-set (and
 * data-ingest before it): subcommand dispatch, a single JSON document on
 * stdout, the shared exit-code table, and `runCli` returning the exit code
 * so tests can call it in-process.
 *
 * Database writes are a runtime capability, never an acceptance dependency:
 * they activate only when CHART_PARSE_EVAL_ENABLE_DB_WRITE=1 and a connection
 * string env is present (CHART_PARSE_EVAL_DATABASE_URL, fallback
 * DATABASE_URL), mirroring the data-ingest env gate.
 */

export const EXIT_CODES = {
  completed: 0,
  configurationFailure: 40,
  storageFailure: 50,
  invariantViolation: 60
} as const;

const DEFAULT_MANIFEST_PATH = "tests/golden/chart-parse/manifest.json";
const DEFAULT_OUT_DIR = "runtime/chart-parse-eval";
const DEFAULT_ANCHOR_TOLERANCE = 0.05;
const DEFAULT_MIN_SAMPLES = 50;
const DEFAULT_MIN_TIER_OBSERVATIONS = 30;
const ENABLE_DB_ENV = "CHART_PARSE_EVAL_ENABLE_DB_WRITE";
const DB_URL_ENV = "CHART_PARSE_EVAL_DATABASE_URL";
const DB_URL_FALLBACK_ENV = "DATABASE_URL";

interface CliIo {
  readonly log: (line: string) => void;
}

export async function runCli(argv: readonly string[], io: CliIo = console): Promise<number> {
  const [command, ...rest] = argv;
  if (command === "run") {
    return runEval(rest, io);
  }
  if (command === "calibrate") {
    return runCalibrate(rest, io);
  }
  return emit(
    io,
    {
      status: "configuration_failure",
      reason: `unknown command: ${command ?? "(none)"}; expected run|calibrate`
    },
    EXIT_CODES.configurationFailure
  );
}

function emit(io: CliIo, payload: Record<string, unknown>, exitCode: number): number {
  io.log(JSON.stringify(payload, null, 2));
  return exitCode;
}

function configurationFailure(io: CliIo, reason: string): number {
  return emit(io, { status: "configuration_failure", reason }, EXIT_CODES.configurationFailure);
}

function invariantViolation(io: CliIo, command: string, violations: readonly string[]): number {
  return emit(
    io,
    { status: "invariant_violation", command, violations },
    EXIT_CODES.invariantViolation
  );
}

function databaseFailure(io: CliIo, command: string, error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  return emit(
    io,
    {
      status: "storage_failure",
      command,
      reason: `database write failed after artifacts were written (idempotent rerun is safe): ${message}`
    },
    EXIT_CODES.storageFailure
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
  return invariantViolation(io, command, [message]);
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

function parseUnitFraction(raw: string | undefined, fallback: number, label: string): number | string {
  if (raw === undefined) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    return `${label} must be a number in (0, 1], got ${raw}`;
  }
  return value;
}

function parseTargetTriple(
  raw: string | undefined,
  fallback: Readonly<Record<"p0" | "p1" | "p2", number>>,
  label: string
): Readonly<Record<"p0" | "p1" | "p2", number>> | string {
  if (raw === undefined) {
    return fallback;
  }
  const parts = raw.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part) || part <= 0 || part > 1)) {
    return `${label} must be three numbers in (0, 1] as p0,p1,p2 — got ${raw}`;
  }
  return { p0: parts[0] as number, p1: parts[1] as number, p2: parts[2] as number };
}

interface DbGate {
  readonly enabled: boolean;
  readonly connectionString: string | null;
}

function resolveDbGate(): DbGate | string {
  const enabled = process.env[ENABLE_DB_ENV] === "1";
  const connectionString = process.env[DB_URL_ENV] ?? process.env[DB_URL_FALLBACK_ENV] ?? null;
  if (enabled && connectionString === null) {
    return `${ENABLE_DB_ENV}=1 requires ${DB_URL_ENV} (or ${DB_URL_FALLBACK_ENV}) to be set`;
  }
  return { enabled, connectionString };
}

async function withPgSink(
  connectionString: string,
  work: (sink: EvalSink) => Promise<void>
): Promise<void> {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("set application_name = 'aiphabee-chart-parse-eval'");
    const { PgEvalSink } = await import("./pg-sink");
    await work(new PgEvalSink(client));
  } finally {
    await client.end();
  }
}

async function readJsonFile(
  path: string
): Promise<{ ok: true; value: unknown; bytes: string } | { ok: false; error: unknown } | { ok: false; parse: string }> {
  let bytes: string;
  try {
    bytes = await readFile(path, "utf8");
  } catch (error) {
    return { ok: false, error };
  }
  try {
    return { ok: true, value: JSON.parse(bytes), bytes };
  } catch {
    return { ok: false, parse: `not valid JSON: ${path}` };
  }
}

async function runEval(args: readonly string[], io: CliIo): Promise<number> {
  const parsed = parseFlags(args, ["--manifest", "--fixture", "--out-dir", "--anchor-tolerance"], []);
  if (typeof parsed === "string") {
    return configurationFailure(io, parsed);
  }
  const fixtureFlag = parsed.values["--fixture"];
  if (fixtureFlag === undefined) {
    return configurationFailure(io, "--fixture <path> is required (fixture replay is the only parse source)");
  }
  const anchorTolerance = parseUnitFraction(
    parsed.values["--anchor-tolerance"],
    DEFAULT_ANCHOR_TOLERANCE,
    "--anchor-tolerance"
  );
  if (typeof anchorTolerance === "string") {
    return configurationFailure(io, anchorTolerance);
  }
  const gate = resolveDbGate();
  if (typeof gate === "string") {
    return configurationFailure(io, gate);
  }
  const repoRoot = process.cwd();
  const manifestPath = resolve(repoRoot, parsed.values["--manifest"] ?? DEFAULT_MANIFEST_PATH);
  const fixturePath = resolve(repoRoot, fixtureFlag);
  const outDir = resolve(repoRoot, parsed.values["--out-dir"] ?? DEFAULT_OUT_DIR);

  const fixtureFile = await readJsonFile(fixturePath);
  if (!fixtureFile.ok) {
    return "error" in fixtureFile
      ? emitError(io, "run", fixtureFile.error)
      : invariantViolation(io, "run", [fixtureFile.parse]);
  }
  const fixtureViolations = validateFixture(fixtureFile.value);
  if (fixtureViolations.length > 0) {
    return invariantViolation(io, "run", fixtureViolations);
  }
  const fixture = fixtureFile.value as EvalFixture;
  const drift = checkFixtureContract(fixture);
  if (drift !== null) {
    return configurationFailure(io, drift);
  }

  const manifestFile = await readJsonFile(manifestPath);
  if (!manifestFile.ok) {
    return "error" in manifestFile
      ? emitError(io, "run", manifestFile.error)
      : invariantViolation(io, "run", [manifestFile.parse]);
  }
  const manifest = manifestFile.value as GoldenSetManifest;
  if (!Array.isArray(manifest.samples) || manifest.samples.length === 0) {
    return invariantViolation(io, "run", [`manifest has no samples: ${manifestPath}`]);
  }
  const coverage = checkFixtureCoverage(
    fixture,
    manifest.samples.map((sample) => sample.id)
  );
  if (coverage.length > 0) {
    return invariantViolation(io, "run", coverage);
  }

  try {
    const result = executeEvalRun({
      manifest,
      fixture,
      anchorTolerance,
      fixtureSha256: sha256Hex(fixtureFile.bytes)
    });
    const artifactSink = new JsonArtifactSink(outDir);
    const receipt = await artifactSink.persistEvalRun(result);
    let persistence = "artifacts";
    if (gate.enabled && gate.connectionString !== null) {
      try {
        await withPgSink(gate.connectionString, async (sink) => {
          await sink.persistEvalRun(result);
        });
      } catch (error) {
        return databaseFailure(io, "run", error);
      }
      persistence = "artifacts+database";
    }
    return emit(
      io,
      {
        status: "completed",
        command: "run",
        run_id: result.run.id,
        golden_set_version: result.run.golden_set_version,
        schema_version: result.run.schema_version,
        prompt_version: result.run.prompt_version,
        model_version: result.run.model_version,
        sample_count: result.samples.length,
        metrics: result.run.metrics,
        artifacts: {
          run_artifact_path: receipt?.path ?? null,
          run_artifact_sha256: receipt?.sha256 ?? null
        },
        persistence
      },
      EXIT_CODES.completed
    );
  } catch (error) {
    return emitError(io, "run", error);
  }
}

interface RunArtifactShape {
  readonly run: EvalRunResult["run"];
  readonly observations: readonly ConfidenceObservation[];
}

function isRunArtifact(value: unknown): value is RunArtifactShape {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { run?: unknown; observations?: unknown };
  return (
    typeof candidate.run === "object" &&
    candidate.run !== null &&
    Array.isArray(candidate.observations)
  );
}

async function runCalibrate(args: readonly string[], io: CliIo): Promise<number> {
  const parsed = parseFlags(
    args,
    [
      "--run-artifact",
      "--out-dir",
      "--min-samples",
      "--min-tier-observations",
      "--auto-targets",
      "--confirm-targets"
    ],
    []
  );
  if (typeof parsed === "string") {
    return configurationFailure(io, parsed);
  }
  const artifactFlag = parsed.values["--run-artifact"];
  if (artifactFlag === undefined) {
    return configurationFailure(io, "--run-artifact <path> is required (offline calibration consumes a run artifact)");
  }
  const minSamples = parsePositiveInt(parsed.values["--min-samples"], DEFAULT_MIN_SAMPLES, "--min-samples");
  if (typeof minSamples === "string") {
    return configurationFailure(io, minSamples);
  }
  const minTierObservations = parsePositiveInt(
    parsed.values["--min-tier-observations"],
    DEFAULT_MIN_TIER_OBSERVATIONS,
    "--min-tier-observations"
  );
  if (typeof minTierObservations === "string") {
    return configurationFailure(io, minTierObservations);
  }
  const autoTargets = parseTargetTriple(parsed.values["--auto-targets"], DEFAULT_TARGETS.auto, "--auto-targets");
  if (typeof autoTargets === "string") {
    return configurationFailure(io, autoTargets);
  }
  const confirmTargets = parseTargetTriple(
    parsed.values["--confirm-targets"],
    DEFAULT_TARGETS.confirm,
    "--confirm-targets"
  );
  if (typeof confirmTargets === "string") {
    return configurationFailure(io, confirmTargets);
  }
  const targets: CalibrationThresholdTargets = { auto: autoTargets, confirm: confirmTargets };
  const gate = resolveDbGate();
  if (typeof gate === "string") {
    return configurationFailure(io, gate);
  }
  const repoRoot = process.cwd();
  const artifactPath = resolve(repoRoot, artifactFlag);
  const outDir = resolve(repoRoot, parsed.values["--out-dir"] ?? DEFAULT_OUT_DIR);

  const artifactFile = await readJsonFile(artifactPath);
  if (!artifactFile.ok) {
    return "error" in artifactFile
      ? emitError(io, "calibrate", artifactFile.error)
      : invariantViolation(io, "calibrate", [artifactFile.parse]);
  }
  if (!isRunArtifact(artifactFile.value)) {
    return invariantViolation(io, "calibrate", [
      `run artifact must carry run + observations: ${artifactPath}`
    ]);
  }
  const artifact = artifactFile.value;

  try {
    const outcome = calibrate({
      run: artifact.run,
      observations: artifact.observations,
      minSamples,
      minTierObservations,
      targets
    });
    if (outcome.status === "insufficient") {
      return emit(
        io,
        {
          status: "insufficient",
          command: "calibrate",
          source_eval_run_id: artifact.run.id,
          sample_count: outcome.sample_count,
          reasons: outcome.reasons
        },
        EXIT_CODES.completed
      );
    }
    const artifactSink = new JsonArtifactSink(outDir);
    const receipt = await artifactSink.persistCalibrationRun(outcome.run);
    let persistence = "artifacts";
    if (gate.enabled && gate.connectionString !== null) {
      try {
        await withPgSink(gate.connectionString, async (sink) => {
          await sink.persistCalibrationRun(outcome.run);
        });
      } catch (error) {
        return databaseFailure(io, "calibrate", error);
      }
      persistence = "artifacts+database";
    }
    return emit(
      io,
      {
        status: "completed",
        command: "calibrate",
        calibration: outcome.run,
        artifacts: {
          calibration_artifact_path: receipt?.path ?? null,
          calibration_artifact_sha256: receipt?.sha256 ?? null
        },
        persistence
      },
      EXIT_CODES.completed
    );
  } catch (error) {
    return emitError(io, "calibrate", error);
  }
}
