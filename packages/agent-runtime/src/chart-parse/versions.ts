/**
 * Frozen contract identifiers for the chart-parse boundary layer.
 *
 * These values are the single source of truth written into
 * `chart_parse_results.schema_version` / `.prompt_version` and matched
 * against `calibration_runs` before auto-match routing may activate.
 * Any semantic change to the schema or prompt requires a version bump
 * plus an eval regression run.
 */
export const CHART_PARSE_SCHEMA_VERSION = "2026-07-02.chart-parse-schema.v1";

export const CHART_PARSE_PROMPT_VERSION = "2026-07-02.chart-parse-prompt.v1";
