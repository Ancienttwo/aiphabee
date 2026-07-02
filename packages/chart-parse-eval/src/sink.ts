import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { sha256Hex, stableStringifyPretty } from "@aiphabee/chart-golden-set";
import type { CalibrationRunRecord } from "./calibrate";
import type { EvalRunResult } from "./run";

/**
 * Persistence boundary. The JSON artifact sink is the acceptance surface
 * (deterministic bytes, no timestamps); the pg sink mirrors the same records
 * into eval_runs / eval_sample_results / calibration_runs as a runtime
 * capability gated by env (see cli.ts).
 */

export interface ArtifactReceipt {
  readonly path: string;
  readonly sha256: string;
}

export interface EvalSink {
  persistEvalRun(result: EvalRunResult): Promise<ArtifactReceipt | null>;
  persistCalibrationRun(run: CalibrationRunRecord): Promise<ArtifactReceipt | null>;
}

export class JsonArtifactSink implements EvalSink {
  constructor(private readonly outDir: string) {}

  private async write(path: string, value: unknown): Promise<ArtifactReceipt> {
    const bytes = stableStringifyPretty(value);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes, "utf8");
    return { path, sha256: sha256Hex(bytes) };
  }

  async persistEvalRun(result: EvalRunResult): Promise<ArtifactReceipt> {
    return this.write(join(this.outDir, `${result.run.id}.json`), result);
  }

  async persistCalibrationRun(run: CalibrationRunRecord): Promise<ArtifactReceipt> {
    return this.write(join(this.outDir, `${run.id}.json`), run);
  }
}
