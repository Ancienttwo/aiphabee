# Golden Regression Hook

> **Status**: Superseded by executable fixtures
> **Last Updated**: 2026-06-20 15:45 +08
> **Source Baseline**: `docs/governance/golden-quality-commercial-baseline.md`
> **Plan**: `plans/plan-golden-regression-hook.md`
> **Task Contract**: `tasks/contracts/golden-regression-hook.contract.md`

This slice installed the CI mount point for golden sample regression. It has
now been extended by `docs/governance/golden-quality-rule-fixtures.md`, which
adds strict executable fixtures and deterministic quality-rule assertions.

## Boundary

Completed:

- Added `scripts/check-golden-regression.mjs`.
- Added root `npm run test:golden`.
- Added `Golden Regression Hook` step to `.github/workflows/ci.yml`.
- Added `tests/golden/README.md` with manifest shape.
- Added the hook to root `npm run check`.

Not completed in this earlier slice:

- The fixture corpus and quality-rule engine were not part of this hook-only
  slice; they are now covered by `golden-quality-rule-fixtures`.
- Partner-approved production golden samples and commercial cost review remain
  outside both slices.

## Runtime Behavior

Current strict command:

```bash
npm run test:golden
```

`npm run test:golden` now requires `tests/golden/manifest.json` and fixture
files. The old non-strict behavior was:

```json
{
  "manifest": "tests/golden/manifest.json",
  "message": "Golden regression hook is installed; fixture manifest is not committed yet.",
  "status": "not_configured"
}
```

and exits successfully. This keeps CI honest: the hook is verified, but fixtures
are still explicitly missing.

Direct strict command:

```bash
node scripts/check-golden-regression.mjs --require-fixtures
```

With `--require-fixtures`, a missing manifest fails the command.

## Verification

Passed:

- `npm run test:golden`
- `npm run check`
- `scripts/check-task-workflow.sh --strict`

## Residual Gaps

- Partner-approved production fixture corpus.
- Golden regression assertions against future actual data tools.
- Serving Store / Gateway `DATA_QUALITY_HOLD` runtime behavior.
- Commercial cost review with real partner/LLM/cloud costs.
