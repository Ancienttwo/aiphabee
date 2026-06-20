# Golden Regression Fixtures

This directory is the CI mount point for PRD §10.7 golden samples.

Current state:

- `npm run test:golden` is wired into root `npm run check` and GitHub Actions.
- The hook validates `tests/golden/manifest.json` when the manifest exists.
- Until real fixture data is committed, the hook reports `not_configured` and
  exits successfully so CI can verify the mount point without pretending golden
  samples passed.

Future fixture manifest shape:

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

Use `node scripts/check-golden-regression.mjs --require-fixtures` when fixtures
must be present.
