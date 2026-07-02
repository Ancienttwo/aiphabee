#!/usr/bin/env bash
# Acceptance gate for the chart golden set (sprint backlog row 2):
#   1. generate twice -> manifest content hashes must match, exit codes 0
#   2. jq: sample_count == 100
#   3. jq: all seven variant dimensions covered with their full value sets
#   4. jq: >= 1 regression sample with end_time + RSI(14) + MACD(12,26,9) + anchors
#   5. validate command passes against the freshly generated set
set -euo pipefail
export LC_ALL=C

cd "$(dirname "$0")/../../.."
CLI="packages/chart-golden-set/bin/chart-golden-set.mjs"
MANIFEST="tests/golden/chart-parse/manifest.json"
SECOND_MANIFEST="$(mktemp -t cgs-second-manifest-XXXXXX.json)"
trap 'rm -f "$SECOND_MANIFEST"' EXIT

echo "[check:chart-golden-set] run 1/2 (writes $MANIFEST)"
node "$CLI" generate --manifest "$MANIFEST" > /dev/null

echo "[check:chart-golden-set] run 2/2 (writes temp manifest)"
node "$CLI" generate --manifest "$SECOND_MANIFEST" > /dev/null

HASH_1="$(shasum -a 256 "$MANIFEST" | cut -d' ' -f1)"
HASH_2="$(shasum -a 256 "$SECOND_MANIFEST" | cut -d' ' -f1)"
if [ "$HASH_1" != "$HASH_2" ]; then
  echo "FAIL: manifest hashes differ across consecutive runs" >&2
  echo "  run1: $HASH_1" >&2
  echo "  run2: $HASH_2" >&2
  exit 1
fi
echo "[check:chart-golden-set] deterministic: sha256 $HASH_1"

jq -e '.sample_count == 100 and (.samples | length) == 100' "$MANIFEST" > /dev/null \
  || { echo "FAIL: sample count != 100" >&2; exit 1; }
echo "[check:chart-golden-set] sample_count == 100"

assert_dimension() {
  local dimension="$1"
  local expected="$2"
  jq -e --arg dim "$dimension" --argjson expected "$expected" \
    '([.samples[].variant_dims[$dim]] | unique) == ($expected | sort)' \
    "$MANIFEST" > /dev/null \
    || { echo "FAIL: dimension $dimension does not cover $expected" >&2; exit 1; }
}
assert_dimension theme '["light","dark"]'
assert_dimension platform_style '["tradingview_like","exchange_terminal","minimal_web"]'
assert_dimension timeframe_class '["intraday_minute","intraday_hour","daily","weekly"]'
assert_dimension degradation '["none","downscale","jpeg_artifact"]'
assert_dimension language '["zh","en"]'
assert_dimension annotations '["none","trendline","horizontal_line","rectangle"]'
assert_dimension info_missing '["none","no_symbol","no_timeframe","no_axes"]'
echo "[check:chart-golden-set] all seven variant dimensions fully covered"

jq -e '[.samples[]
        | select(.truth.end_time != null
            and ([.truth.indicators[] | select(.name == "RSI" and .params == [14])] | length > 0)
            and ([.truth.indicators[] | select(.name == "MACD" and .params == [12, 26, 9])] | length > 0)
            and ((.truth.drawn_lines | length) > 0))
       ] | length >= 1' "$MANIFEST" > /dev/null \
  || { echo "FAIL: no regression sample with end_time + RSI(14) + MACD(12,26,9) + drawn lines" >&2; exit 1; }
echo "[check:chart-golden-set] regression sample present"

node "$CLI" validate --manifest "$MANIFEST" > /dev/null \
  || { echo "FAIL: validate rejected the generated set" >&2; exit 1; }
echo "[check:chart-golden-set] validate pass"
echo "[check:chart-golden-set] PASS"
