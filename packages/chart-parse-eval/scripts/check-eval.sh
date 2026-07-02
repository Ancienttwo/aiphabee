#!/usr/bin/env bash
# Acceptance gate for chart-parse-eval (sprint backlog row 3):
#   1. derive the deterministic fixture from the committed manifest
#   2. run twice -> run artifact sha256 must match, exit codes 0
#   3. jq: runner metrics carries schema_compliance / field_matrix / null_negative
#   4. jq: per-sample rows are replayable from the run artifact (100 rows)
#   5. calibrate with an unreachable sample gate -> insufficient, no thresholds
#   6. calibrate with defaults -> calibration run carries the three versions
#      + sample_count, byte-deterministic across runs
set -euo pipefail
export LC_ALL=C

cd "$(dirname "$0")/../../.."
CLI="packages/chart-parse-eval/bin/chart-parse-eval.mjs"
MANIFEST="tests/golden/chart-parse/manifest.json"
WORK="$(mktemp -d -t cpe-check-XXXXXX)"
trap 'rm -rf "$WORK"' EXIT
FIXTURE="$WORK/fixture.json"

echo "[check:chart-parse-eval] derive fixture from $MANIFEST"
node packages/chart-parse-eval/scripts/make-eval-fixture.mjs \
  --manifest "$MANIFEST" --out "$FIXTURE" > /dev/null

echo "[check:chart-parse-eval] run 1/2"
node "$CLI" run --manifest "$MANIFEST" --fixture "$FIXTURE" --out-dir "$WORK/out1" > "$WORK/run1.json"
echo "[check:chart-parse-eval] run 2/2"
node "$CLI" run --manifest "$MANIFEST" --fixture "$FIXTURE" --out-dir "$WORK/out2" > "$WORK/run2.json"

HASH_1="$(jq -r '.artifacts.run_artifact_sha256' "$WORK/run1.json")"
HASH_2="$(jq -r '.artifacts.run_artifact_sha256' "$WORK/run2.json")"
if [ -z "$HASH_1" ] || [ "$HASH_1" = "null" ] || [ "$HASH_1" != "$HASH_2" ]; then
  echo "FAIL: run artifact hashes differ across consecutive runs" >&2
  echo "  run1: $HASH_1" >&2
  echo "  run2: $HASH_2" >&2
  exit 1
fi
echo "[check:chart-parse-eval] deterministic: run artifact sha256 $HASH_1"

jq -e '.status == "completed"
        and (.metrics | has("schema_compliance") and has("field_matrix") and has("null_negative"))' \
  "$WORK/run1.json" > /dev/null \
  || { echo "FAIL: runner output missing the three metric keys" >&2; exit 1; }
echo "[check:chart-parse-eval] metrics carries the three acceptance keys"

ARTIFACT="$(jq -r '.artifacts.run_artifact_path' "$WORK/run1.json")"
jq -e '(.samples | length) == 100
        and ([.samples[].sample_id] | index("cgs-000")) != null
        and ([.samples[] | select(.eval_run_id == null)] | length) == 0
        and (.observations | length) > 0' \
  "$ARTIFACT" > /dev/null \
  || { echo "FAIL: per-sample rows are not replayable from the run artifact" >&2; exit 1; }
echo "[check:chart-parse-eval] per-sample rows replayable (100 rows + observations)"

echo "[check:chart-parse-eval] calibrate: insufficient gate"
node "$CLI" calibrate --run-artifact "$ARTIFACT" --out-dir "$WORK/cal-insufficient" \
  --min-samples 101 > "$WORK/insufficient.json"
jq -e '.status == "insufficient"
        and (has("thresholds") | not)
        and (has("calibration") | not)
        and (.sample_count | type == "number")' \
  "$WORK/insufficient.json" > /dev/null \
  || { echo "FAIL: insufficient calibration must not produce thresholds" >&2; exit 1; }
echo "[check:chart-parse-eval] insufficient outputs no thresholds"

echo "[check:chart-parse-eval] calibrate 1/2"
node "$CLI" calibrate --run-artifact "$ARTIFACT" --out-dir "$WORK/cal1" > "$WORK/cal1.json"
echo "[check:chart-parse-eval] calibrate 2/2"
node "$CLI" calibrate --run-artifact "$ARTIFACT" --out-dir "$WORK/cal2" > "$WORK/cal2.json"
CAL_HASH_1="$(jq -r '.artifacts.calibration_artifact_sha256' "$WORK/cal1.json")"
CAL_HASH_2="$(jq -r '.artifacts.calibration_artifact_sha256' "$WORK/cal2.json")"
if [ -z "$CAL_HASH_1" ] || [ "$CAL_HASH_1" = "null" ] || [ "$CAL_HASH_1" != "$CAL_HASH_2" ]; then
  echo "FAIL: calibration artifact hashes differ across consecutive runs" >&2
  exit 1
fi
jq -e '.status == "completed"
        and (.calibration.schema_version | type == "string")
        and (.calibration.prompt_version | type == "string")
        and (.calibration.model_version | type == "string")
        and (.calibration.sample_count | type == "number")
        and .calibration.mapping_fn_version == "isotonic-pav.v1"' \
  "$WORK/cal1.json" > /dev/null \
  || { echo "FAIL: calibration run must carry the three versions and sample_count" >&2; exit 1; }
echo "[check:chart-parse-eval] calibration run carries versions + sample_count"
echo "[check:chart-parse-eval] PASS"
