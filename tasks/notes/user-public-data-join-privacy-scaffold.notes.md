# User Public Data Join Privacy Scaffold Notes

## P1 Map

The implementation stays in `@aiphabee/document-tools` and Worker documents routes. Data rights remain delegated to Data Access Gateway contracts, and custom layout support is represented as private metadata only.

## P2 Trace

`POST /documents/user-public-data-join/plan` reads a JSON request, normalizes ids, join keys, and requested fields, calls `createUserPublicDataJoinPrivacyPlan()`, and returns a standard success envelope. The planner has no DB, R2, queue, model, or public data provider side effect.

## P3 Decision

The smallest coherent slice is a no-write privacy planner plus contract/migration evidence. Live upload storage and live joins would cross the privacy and redistribution boundary before the default-deny rules are externally signed off.

## Verification

Run targeted checks first, then the full repository check before considering this module complete.
