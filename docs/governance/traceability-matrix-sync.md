# Traceability Matrix Sync

## Scope

This sync closes a tracker drift in `docs/AiphaBee_Sprint_Tracker_v1.0.md` §M. Several requirement rows still showed unchecked status after their local scaffold, deploy contract, task contract, and npm checker had already landed.

## Rule

- A row can be checked only when repo-local evidence exists in the active backlog, deploy/task contract, source route or package capability, and checker.
- A row remains unchecked when the missing proof is live runtime evidence, frontend rendering, external partner/signoff evidence, or an explicitly deferred product surface.
- This sync does not add product behavior and does not edit `apps/web`.

## Checked Groups

- ACC/SEC rows already covered by account runtime, entitlement schemas, subscription lifecycle, quota display, security resolution, security master, and workbench scaffolds.
- AGT rows covered by no-model agent planning, preflight resolution, budget stop policy, tool enforcement, numeric/source guard, answer contract, failure recovery, and workflow task scaffolds.
- STK/ANA/DOC/RES rows covered by workbench, analytics, document, research, private sharing, watchlist, and static/deep report contracts.
- MCP rows covered by endpoint/auth/key/schema/versioning/pagination/usage/error-code contracts plus enterprise controls.
- DAT rows covered by immutable raw snapshot, security master, financial facts/restatement, corporate action adjustment/parity, methodology, and data correction notification evidence.

## Still Unchecked

- `AGT-01`: live streaming transport and frontend progress rendering are not complete.
- `AGT-07`: evidence payload exists, but frontend evidence-card rendering is not complete.
- `STK-07`: chart-to-research context has no complete repo-local acceptance evidence.
- `MCP-09`: Developer Console is not complete.
- `DAT-05`: field-level rights matrix and live policy source remain incomplete.
- `DAT-06`: quality isolation scaffolds exist, but live data quality isolation is not fully accepted.
- `DAT-10`: partner SLA/reconciliation live evidence remains incomplete.

## Verification

- `npm run check:traceability-matrix`
