# Golden Regression Fixtures

This directory is the CI mount point for PRD §10.7 golden samples.

Current state:

- `npm run test:golden` is wired into root `npm run check` and GitHub Actions.
- `tests/golden/manifest.json` is committed and required.
- The hook executes a synthetic v0 fixture corpus covering price OHLC,
  corporate action reconciliation, financial identity/restatement, identifier
  point-in-time behavior, dual-listing review, and index constituent
  point-in-time behavior.
- `tests/golden/tools/manifest.json` adds one tool golden sample for each
  registered Sprint 1.2 tool. The hook validates tool schema IDs, standard
  response envelope fields, provenance, usage, `toolName`, `status`, and
  `liveDataAccess=false`.
- This is an executable smoke corpus, not a partner-approved production golden
  sample set.

Fixture manifest shape:

```json
{
  "version": "quality_commercial_version=2026-06-20.phase0.v0",
  "samples": [
    {
      "sample_id": "hk_equity_delisted_001",
      "sample_type": "security",
      "methodology_version": "methodology-v0",
      "quality_expectation": "pass",
      "source_records": [],
      "expected_outputs": {}
    }
  ]
}
```

`npm run test:golden` runs in strict mode and fails when the manifest or fixture
files are absent.
