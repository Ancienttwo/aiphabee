import type { CalibrationRunRecord } from "./calibrate";
import type { EvalRunResult } from "./run";
import type { ArtifactReceipt, EvalSink } from "./sink";

/**
 * Postgres sink for aiphabee_core.eval_runs / eval_sample_results /
 * calibration_runs (migration 20260703001000_chart_parse_eval_foundation).
 *
 * The queryable is injected (the bin layer owns the pg client, mirroring
 * data-ingest) so SQL shape is unit-testable offline. Idempotency comes from
 * deterministic record ids plus `on conflict (id) do nothing`.
 */

export interface Queryable {
  query(text: string, values?: readonly unknown[]): Promise<unknown>;
}

const INSERT_EVAL_RUN = `
  insert into aiphabee_core.eval_runs
    (id, golden_set_version, schema_version, prompt_version, model_version, metrics, status)
  values ($1, $2, $3, $4, $5, $6::jsonb, $7)
  on conflict (id) do nothing
`;

const INSERT_SAMPLE_RESULT = `
  insert into aiphabee_core.eval_sample_results
    (id, eval_run_id, sample_id, parse_json, field_accuracy, null_negative_pass,
     error_code, token_cost, latency_ms)
  values ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9)
  on conflict (id) do nothing
`;

const SUPERSEDE_READY_TRIPLE = `
  update aiphabee_core.calibration_runs
  set status = 'superseded'
  where schema_version = $1
    and prompt_version = $2
    and model_version = $3
    and status = 'ready'
    and id <> $4
`;

const INSERT_CALIBRATION_RUN = `
  insert into aiphabee_core.calibration_runs
    (id, source_eval_run_id, golden_set_version, schema_version, prompt_version,
     model_version, sample_count, mapping_fn_version, thresholds, reliability, status)
  values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
  on conflict (id) do nothing
`;

function asJson(value: unknown): string | null {
  return value === null || value === undefined ? null : JSON.stringify(value);
}

export class PgEvalSink implements EvalSink {
  constructor(private readonly queryable: Queryable) {}

  private async inTransaction(work: () => Promise<void>): Promise<void> {
    await this.queryable.query("begin");
    try {
      await work();
      await this.queryable.query("commit");
    } catch (error) {
      try {
        await this.queryable.query("rollback");
      } catch {
        // surface the original failure, not the rollback's
      }
      throw error;
    }
  }

  async persistEvalRun(result: EvalRunResult): Promise<ArtifactReceipt | null> {
    await this.inTransaction(async () => {
      const { run } = result;
      await this.queryable.query(INSERT_EVAL_RUN, [
        run.id,
        run.golden_set_version,
        run.schema_version,
        run.prompt_version,
        run.model_version,
        JSON.stringify(run.metrics),
        run.status
      ]);
      for (const sample of result.samples) {
        await this.queryable.query(INSERT_SAMPLE_RESULT, [
          sample.id,
          sample.eval_run_id,
          sample.sample_id,
          asJson(sample.parse_json),
          asJson(sample.field_accuracy),
          sample.null_negative_pass,
          sample.error_code,
          sample.token_cost,
          sample.latency_ms
        ]);
      }
    });
    return null;
  }

  async persistCalibrationRun(run: CalibrationRunRecord): Promise<ArtifactReceipt | null> {
    await this.inTransaction(async () => {
      if (run.status === "ready") {
        await this.queryable.query(SUPERSEDE_READY_TRIPLE, [
          run.schema_version,
          run.prompt_version,
          run.model_version,
          run.id
        ]);
      }
      await this.queryable.query(INSERT_CALIBRATION_RUN, [
        run.id,
        run.source_eval_run_id,
        run.golden_set_version,
        run.schema_version,
        run.prompt_version,
        run.model_version,
        run.sample_count,
        run.mapping_fn_version,
        asJson(run.thresholds),
        JSON.stringify(run.reliability),
        run.status
      ]);
    });
    return null;
  }
}
