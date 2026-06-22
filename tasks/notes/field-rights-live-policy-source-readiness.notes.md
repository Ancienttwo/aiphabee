# Field Rights Live Policy Source Readiness Notes

## Decision

DAT-05 is closed at repo-local runtime acceptance by proving that partner rights matrix metadata and DB entitlement row snapshots can be compiled into a Gateway policy and enforced through the existing evaluator. The remaining signed-matrix and live-read work is an external activation blocker, not a missing local runtime capability.

## Boundary

- The readiness route is read-only and fixture-backed.
- `live_policy_source` remains false in `/gateway/runtime`; the new nested capability is `live_policy_source_readiness`.
- No SQL, Hyperdrive read, persistent write, or frontend UI is claimed.

## Verification

- `npm run check:field-rights-live-policy-source`
