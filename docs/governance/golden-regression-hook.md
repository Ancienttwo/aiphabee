# Golden Regression Hook

> **Status**: Verified hook; fixtures pending
> **Last Updated**: 2026-06-20 14:45 +08
> **Source Baseline**: `docs/governance/golden-quality-commercial-baseline.md`
> **Plan**: `plans/plan-golden-regression-hook.md`
> **Task Contract**: `tasks/contracts/golden-regression-hook.contract.md`

This slice installs the CI mount point for future golden sample regression. It
does not create or approve fixture data.

## Boundary

Completed:

- Added `scripts/check-golden-regression.mjs`.
- Added root `npm run test:golden`.
- Added `Golden Regression Hook` step to `.github/workflows/ci.yml`.
- Added `tests/golden/README.md` with manifest shape.
- Added the hook to root `npm run check`.

Not completed:

- No `tests/golden/manifest.json` fixture corpus exists.
- No real securities, corporate actions, restatements, identifier changes,
  multi-currency cases, or index-history fixtures are committed.
- Sprint 0.3 exit gates for executable golden samples and quality rules remain
  not green.

## Runtime Behavior

Default command:

```bash
npm run test:golden
```

If `tests/golden/manifest.json` is absent, the command prints:

```json
{
  "manifest": "tests/golden/manifest.json",
  "message": "Golden regression hook is installed; fixture manifest is not committed yet.",
  "status": "not_configured"
}
```

and exits successfully. This keeps CI honest: the hook is verified, but fixtures
are still explicitly missing.

Future strict command:

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

- Real fixture manifest and source data.
- Golden regression assertions against actual data tools.
- Quality rule engine and `DATA_QUALITY_HOLD` runtime behavior.
- Commercial cost review with real partner/LLM/cloud costs.
