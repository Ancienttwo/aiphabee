# MVP Product Boundary Copy Notes

## What Changed

- Added a local Gate 0 product-boundary copy contract and checker.
- Added governance notes tying the checked boundary to PRD §14.2.
- Added explicit public copy that AiphaBee does not collect risk tolerance
  answers to produce automated suitability conclusions.

## Verification Surface

- `npm run check:mvp-product-boundary-copy`
- `docs/public/terms.md`
- `docs/public/privacy.md`
- `apps/web/src/components/Disclaimer.tsx`
- `apps/web/src/data/ipos.ts`

## Limits

This closes only the repo-verifiable copy boundary item. Type 4 written opinion,
external compliance/legal signoff, data rights evidence, and Gate 0 signatures
remain missing.
