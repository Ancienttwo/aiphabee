# Licensed Advice Exploration Scaffold Contract

## Objective

Complete the Phase 4 backend-only scaffold for exploring personalized advice
capability after the licensed path is confirmed, without enabling advice
generation, order execution, live model execution, persistent writes, SQL, or
frontend work.

## Required Surfaces

- Package: `@aiphabee/licensed-advice-runtime`
- Runtime route: `GET /compliance/licensed-advice/runtime`
- Plan route: `POST /compliance/licensed-advice/exploration/plan`
- Contract: `deploy/compliance/licensed-advice-exploration.contract.json`
- Checker: `npm run check:licensed-advice-exploration`
- Migration scaffold: `deploy/database/migrations/20260622010000_licensed_advice_exploration_scaffold.sql`

## Required Guarantees

- Use standard response envelopes.
- Keep runtime default status blocked until the licensed path is confirmed.
- Require Type 4 written opinion, licensed entity or partner, responsible
  officer supervision, suitability controls, advice record retention, human
  review, kill switch, and complaint handling path.
- Preserve public SFC licensing and suitability pages as regulatory context
  references, not legal advice.
- Return blocked statuses for missing workspace/surface context, unsupported
  advice surfaces, missing licensed path, missing suitability controls, and
  missing supervision controls.
- Keep forbidden unlicensed outputs false: buy/sell/hold recommendation, target
  position size, personalized suitability conclusion, order routing, and copy
  trading instruction.
- Link to compliance release gate, answer evidence, and kill switch routes
  without executing them live.
- Store only IDs/policy handles in schema scaffolds; do not store raw risk
  profiles or personal contact payloads.
- Do not generate advice.
- Do not route orders.
- Do not execute a live model.
- Do not write DB rows.
- Do not emit SQL.
- Do not render frontend UI.

## Acceptance

- Contract checker passes.
- Database migration checker passes.
- Licensed Advice Runtime and Worker targeted tests pass.
- Licensed Advice Runtime and Worker typecheck pass.
- Sprint tracker row is checked.
