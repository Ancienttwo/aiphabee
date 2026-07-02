# Licensed Advice Exploration Scaffold

Status: local contract complete

This slice closes the Phase 4 backlog item for exploring more personalized
advice only after the licensed path is confirmed. It does not add investment
advice, model-generated personalized conclusions, order routing, or frontend UI.

## Scope

- Package: `@aiphabee/licensed-advice-runtime`
- Runtime capability: `GET /compliance/licensed-advice/runtime`
- Plan route: `POST /compliance/licensed-advice/exploration/plan`
- Contract: `deploy/compliance/licensed-advice-exploration.contract.json`
- Migration scaffold: `deploy/database/migrations/20260622010000_licensed_advice_exploration_scaffold.sql`
- Gate: `npm run check:licensed-advice-exploration`

## Regulatory Context

The scaffold references public SFC pages as regulatory context:

- `https://www.sfc.hk/en/Regulatory-functions/Intermediaries/Licensing/Do-you-need-a-licence-or-registration`
- `https://www.sfc.hk/en/Rules-and-standards/Suitability-requirement`

These sources do not make this implementation legal advice. The planner requires
an external Type 4 written opinion and legal review status before it can return
`planned_no_write`.

## Invariants

- Default runtime status is blocked until the licensed path is confirmed.
- Type 4 written opinion, licensed entity or partner, responsible officer
  supervision, suitability controls, advice record retention, human review,
  kill switch, and complaint handling are required controls.
- Forbidden unlicensed outputs stay false: buy/sell/hold recommendation, target
  position size, personalized suitability conclusion, order routing, and copy
  trading instruction.
- The planner may return `planned_no_write`, but it still does not execute a
  live model, generate advice, route orders, emit SQL, write persistent state,
  or render frontend UI.
- Suitability profile and review records are represented as IDs/policy handles;
  raw risk profiles and personal contact payloads are not stored by this
  scaffold.
- The implementation links to compliance release gate, answer evidence, and kill
  switch routes without executing those routes live.

## Verification

Run:

```sh
npm run check:licensed-advice-exploration
npx vitest run packages/licensed-advice-runtime/src/index.test.ts apps/worker/src/index.test.ts
```
